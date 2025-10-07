export interface BilingualCheck {
  hasLangAttribute: boolean;
  isBilingual: boolean;
  detectedLanguages: string[];
  hasLanguageToggle: boolean;
  hasFrenchContent: boolean;
  isOntarioGov: boolean;
  languageToggles: number;
}

export interface BilingualDetectionOptions {
  htmlLang?: string;
  hostname?: string;
  bodyText?: string;
  languageToggleElements?: number;
  elementsWithLang?: Array<{ lang: string | null }>;
}

const FRENCH_KEYWORDS = [
  'français',
  'bienvenue',
  'bonjour',
  'accueil',
  'contactez',
  'recherche',
  'services',
];

const ONTARIO_GOV_DOMAINS = ['ontario.ca', '.on.ca', '.gc.ca', '.gouv.qc.ca'];

/**
 * Checks if text content contains French keywords
 */
export function hasFrenchKeywords(text: string): boolean {
  const lowerText = text.toLowerCase();
  return FRENCH_KEYWORDS.some((word) => lowerText.includes(word));
}

/**
 * Checks if hostname is an Ontario government domain
 */
export function isOntarioGovernmentDomain(hostname: string): boolean {
  return ONTARIO_GOV_DOMAINS.some((domain) => hostname.includes(domain));
}

/**
 * Extracts unique language codes from elements with lang attributes
 */
export function extractLanguages(
  elements: Array<{ lang: string | null }>
): string[] {
  const languages = new Set<string>();

  for (const el of elements) {
    if (el.lang) {
      const langCode = el.lang.substring(0, 2).toLowerCase();
      languages.add(langCode);
    }
  }

  return Array.from(languages);
}

/**
 * Determines if a site is bilingual based on language detection
 */
export function determineBilingualStatus(
  detectedLanguages: string[],
  hasLanguageToggle: boolean,
  hasFrenchContent: boolean
): boolean {
  const hasEnglish = detectedLanguages.includes('en');
  const hasFrench = detectedLanguages.includes('fr');

  // Site is bilingual if:
  // 1. Both English and French lang attributes are present, OR
  // 2. There's a language toggle AND French content is detected
  return (hasEnglish && hasFrench) || (hasLanguageToggle && hasFrenchContent);
}

/**
 * Performs comprehensive bilingual support detection
 */
export function checkBilingualSupport(
  options: BilingualDetectionOptions
): BilingualCheck {
  const {
    htmlLang = '',
    hostname = '',
    bodyText = '',
    languageToggleElements = 0,
    elementsWithLang = [],
  } = options;

  const hasLangAttribute = !!htmlLang;
  const hasFrenchContent = hasFrenchKeywords(bodyText);
  const isOntarioGov = isOntarioGovernmentDomain(hostname);
  const detectedLanguages = extractLanguages(elementsWithLang);
  const hasLanguageToggle = languageToggleElements > 0;

  const isBilingual = determineBilingualStatus(
    detectedLanguages,
    hasLanguageToggle,
    hasFrenchContent
  );

  return {
    hasLangAttribute,
    isBilingual,
    detectedLanguages,
    hasLanguageToggle,
    hasFrenchContent,
    isOntarioGov,
    languageToggles: languageToggleElements,
  };
}
