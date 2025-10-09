import { describe, expect, it } from 'vitest';
import { normalizeUrl } from './route-discovery';

describe('Route Discovery', () => {
  describe('normalizeUrl', () => {
    it('should remove URL fragments', () => {
      expect(normalizeUrl('https://example.com/page#section')).toBe('https://example.com/page');
      expect(normalizeUrl('https://example.com/#hero')).toBe('https://example.com/');
    });

    it('should remove trailing slashes from non-root paths', () => {
      expect(normalizeUrl('https://example.com/about/')).toBe('https://example.com/about');
      expect(normalizeUrl('https://example.com/services/web/')).toBe(
        'https://example.com/services/web'
      );
    });

    it('should preserve trailing slash for root path', () => {
      expect(normalizeUrl('https://example.com/')).toBe('https://example.com/');
    });

    it('should handle URLs without fragments or trailing slashes', () => {
      expect(normalizeUrl('https://example.com/page')).toBe('https://example.com/page');
      expect(normalizeUrl('https://example.com/about/team')).toBe('https://example.com/about/team');
    });

    it('should preserve query parameters', () => {
      expect(normalizeUrl('https://example.com/search?q=test')).toBe(
        'https://example.com/search?q=test'
      );
      expect(normalizeUrl('https://example.com/page?id=123#section')).toBe(
        'https://example.com/page?id=123'
      );
    });

    it('should handle multiple fragments', () => {
      expect(normalizeUrl('https://example.com/page#section#subsection')).toBe(
        'https://example.com/page'
      );
    });

    it('should handle URLs with ports', () => {
      expect(normalizeUrl('https://example.com:8080/page#section')).toBe(
        'https://example.com:8080/page'
      );
      expect(normalizeUrl('http://localhost:3000/api/')).toBe('http://localhost:3000/api');
    });

    it('should handle subdomains', () => {
      expect(normalizeUrl('https://blog.example.com/post/')).toBe('https://blog.example.com/post');
      expect(normalizeUrl('https://www.example.com/#home')).toBe('https://www.example.com/');
    });

    it('should return original URL for invalid URLs', () => {
      const invalidUrl = 'not-a-valid-url';
      expect(normalizeUrl(invalidUrl)).toBe(invalidUrl);
    });

    it('should handle empty fragments', () => {
      expect(normalizeUrl('https://example.com/page#')).toBe('https://example.com/page');
    });

    it('should handle complex paths with trailing slashes and fragments', () => {
      expect(normalizeUrl('https://example.com/a/b/c/#section')).toBe('https://example.com/a/b/c');
    });

    it('should preserve protocol (http vs https)', () => {
      expect(normalizeUrl('http://example.com/page')).toBe('http://example.com/page');
      expect(normalizeUrl('https://example.com/page')).toBe('https://example.com/page');
    });

    it('should handle encoded characters in URLs', () => {
      expect(normalizeUrl('https://example.com/search?q=hello%20world#top')).toBe(
        'https://example.com/search?q=hello%20world'
      );
    });

    it('should handle Ontario government domains', () => {
      expect(normalizeUrl('https://www.ontario.ca/page/')).toBe('https://www.ontario.ca/page');
      expect(normalizeUrl('https://service.ontario.ca/#main')).toBe('https://service.ontario.ca/');
    });
  });

  describe('URL normalization edge cases', () => {
    it('should handle URLs with only fragment', () => {
      expect(normalizeUrl('https://example.com/#')).toBe('https://example.com/');
    });

    it('should handle URLs with multiple trailing slashes', () => {
      expect(normalizeUrl('https://example.com/page///')).toBe('https://example.com/page');
    });

    it('should handle URLs with hash in query parameter', () => {
      expect(normalizeUrl('https://example.com/page?tag=%23test')).toBe(
        'https://example.com/page?tag=%23test'
      );
    });

    it('should handle internationalized domain names', () => {
      const idnUrl = 'https://münchen.de/page/';
      const normalized = normalizeUrl(idnUrl);
      expect(normalized).not.toContain('#');
      // URL class converts to punycode - this is expected behavior
      expect(normalized).toContain('.de/page');
    });

    it('should handle file extensions', () => {
      expect(normalizeUrl('https://example.com/document.pdf#page=5')).toBe(
        'https://example.com/document.pdf'
      );
      expect(normalizeUrl('https://example.com/image.jpg/')).toBe('https://example.com/image.jpg');
    });
  });

  describe('Real-world URL scenarios', () => {
    it('should normalize typical government URLs', () => {
      expect(normalizeUrl('https://www.ontario.ca/page/accessibility-laws/#aoda')).toBe(
        'https://www.ontario.ca/page/accessibility-laws'
      );
      expect(normalizeUrl('https://www.canada.ca/en/services.html#employment')).toBe(
        'https://www.canada.ca/en/services.html'
      );
    });

    it('should normalize typical blog URLs', () => {
      expect(normalizeUrl('https://blog.example.com/2024/01/post/#comments')).toBe(
        'https://blog.example.com/2024/01/post'
      );
    });

    it('should normalize e-commerce URLs', () => {
      expect(normalizeUrl('https://shop.example.com/products/item-123/#reviews')).toBe(
        'https://shop.example.com/products/item-123'
      );
    });

    it('should normalize documentation URLs', () => {
      expect(normalizeUrl('https://docs.example.com/api/reference/#authentication')).toBe(
        'https://docs.example.com/api/reference'
      );
    });
  });
});
