/**
 * Route Discovery System
 *
 * Discovers all pages/routes on a website using multiple strategies:
 * 1. Sitemap.xml parsing
 * 2. Robots.txt analysis
 * 3. DOM link crawling (limited depth)
 */

export interface DiscoveryOptions {
  maxPages?: number;      // Maximum pages to discover (default: 50)
  maxDepth?: number;      // Maximum crawl depth for DOM strategy (default: 2)
  timeout?: number;       // Request timeout in ms (default: 5000)
  includeExternal?: boolean; // Include external links (default: false)
}

export interface DiscoveryResult {
  urls: string[];
  strategy: 'sitemap' | 'robots' | 'dom' | 'hybrid';
  discoveredCount: number;
  limitReached: boolean;
}

const DEFAULT_OPTIONS: Required<DiscoveryOptions> = {
  maxPages: 50,
  maxDepth: 2,
  timeout: 5000,
  includeExternal: false,
};

/**
 * Discover all pages on a website
 */
export async function discoverRoutes(
  baseUrl: string,
  options: DiscoveryOptions = {}
): Promise<DiscoveryResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const origin = new URL(baseUrl).origin;

  // Strategy 1: Try sitemap.xml (fastest and most reliable)
  let urls = await discoverFromSitemap(origin, opts.timeout);

  if (urls.length > 0) {
    return {
      urls: limitUrls(urls, opts.maxPages),
      strategy: 'sitemap',
      discoveredCount: urls.length,
      limitReached: urls.length > opts.maxPages,
    };
  }

  // Strategy 2: Try robots.txt
  urls = await discoverFromRobots(origin, opts.timeout);

  if (urls.length > 0) {
    return {
      urls: limitUrls(urls, opts.maxPages),
      strategy: 'robots',
      discoveredCount: urls.length,
      limitReached: urls.length > opts.maxPages,
    };
  }

  // Strategy 3: DOM crawling (fallback, slower)
  urls = await discoverFromDOM(baseUrl, opts.maxDepth, origin, opts.includeExternal);

  return {
    urls: limitUrls(urls, opts.maxPages),
    strategy: 'dom',
    discoveredCount: urls.length,
    limitReached: urls.length > opts.maxPages,
  };
}

/**
 * Discover pages from sitemap.xml
 */
async function discoverFromSitemap(origin: string, timeout: number): Promise<string[]> {
  const sitemapUrls = [
    `${origin}/sitemap.xml`,
    `${origin}/sitemap_index.xml`,
    `${origin}/sitemap-pages.xml`,
    `${origin}/wp-sitemap.xml`, // WordPress
  ];

  for (const sitemapUrl of sitemapUrls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(sitemapUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) continue;

      const xml = await response.text();
      const urls = parseSitemapXML(xml);

      if (urls.length > 0) {
        return urls;
      }
    } catch (error) {
      // Try next sitemap
      continue;
    }
  }

  return [];
}

/**
 * Parse sitemap XML and extract URLs
 */
function parseSitemapXML(xml: string): string[] {
  const urls: string[] = [];

  // Match <loc>URL</loc> tags
  const locRegex = /<loc>\s*([^<]+)\s*<\/loc>/gi;
  let match: RegExpExecArray | null;

  while ((match = locRegex.exec(xml)) !== null) {
    const url = match[1].trim();
    if (url) {
      urls.push(url);
    }
  }

  // Also check for sitemap index (nested sitemaps)
  const sitemapRegex = /<sitemap>[\s\S]*?<loc>\s*([^<]+)\s*<\/loc>[\s\S]*?<\/sitemap>/gi;
  const nestedSitemaps: string[] = [];

  while ((match = sitemapRegex.exec(xml)) !== null) {
    const sitemapUrl = match[1].trim();
    if (sitemapUrl && !urls.includes(sitemapUrl)) {
      nestedSitemaps.push(sitemapUrl);
    }
  }

  // If we found nested sitemaps but no direct URLs, this is a sitemap index
  if (nestedSitemaps.length > 0 && urls.length === 0) {
    // Note: In browser context, we can't easily fetch nested sitemaps
    // This would need to be handled in the extension background worker
    return nestedSitemaps;
  }

  return urls;
}

/**
 * Discover pages from robots.txt
 */
async function discoverFromRobots(origin: string, timeout: number): Promise<string[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(`${origin}/robots.txt`, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) return [];

    const text = await response.text();

    // Extract sitemap URLs
    const sitemapRegex = /Sitemap:\s*(.+)/gi;
    const sitemaps: string[] = [];
    let match: RegExpExecArray | null;

    while ((match = sitemapRegex.exec(text)) !== null) {
      const sitemapUrl = match[1].trim();
      if (sitemapUrl) {
        sitemaps.push(sitemapUrl);
      }
    }

    // Fetch each sitemap
    const allUrls: string[] = [];
    for (const sitemapUrl of sitemaps) {
      try {
        const sitemapResponse = await fetch(sitemapUrl, { signal: controller.signal });
        if (sitemapResponse.ok) {
          const xml = await sitemapResponse.text();
          const urls = parseSitemapXML(xml);
          allUrls.push(...urls);
        }
      } catch (e) {
        // Skip failed sitemap
        continue;
      }
    }

    return allUrls;
  } catch (error) {
    return [];
  }
}

/**
 * Discover pages by crawling DOM links
 * Note: This is a placeholder for the extension implementation
 * In browser context, this needs to be done via background worker
 */
async function discoverFromDOM(
  startUrl: string,
  maxDepth: number,
  origin: string,
  includeExternal: boolean
): Promise<string[]> {
  // This is a simplified version - actual implementation will be in extension
  // For now, just return the start URL
  return [startUrl];
}

/**
 * Limit URLs to max count and remove duplicates
 */
function limitUrls(urls: string[], maxCount: number): string[] {
  // Remove duplicates
  const unique = Array.from(new Set(urls));

  // Sort by URL length (prefer shorter, more important pages)
  unique.sort((a, b) => a.length - b.length);

  // Limit to maxCount
  return unique.slice(0, maxCount);
}

/**
 * Normalize URL (remove fragments, trailing slashes)
 */
export function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Remove fragment
    parsed.hash = '';
    // Remove trailing slash (except for root)
    if (parsed.pathname !== '/' && parsed.pathname.endsWith('/')) {
      parsed.pathname = parsed.pathname.slice(0, -1);
    }
    return parsed.href;
  } catch (e) {
    return url;
  }
}
