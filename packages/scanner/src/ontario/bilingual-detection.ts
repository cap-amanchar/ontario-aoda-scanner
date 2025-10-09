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

// Common French UI/navigation words (must find multiple for confidence)
const FRENCH_UI_KEYWORDS = [
  'accueil', // home
  'à propos', // about
  'contactez', // contact
  'recherche', // search
  'services', // services
  'politique', // policy
  'confidentialité', // privacy
];

// Strong French indicators (structural words)
const FRENCH_STRUCTURAL_WORDS = [
  'bienvenue', // welcome
  'français', // french
  'langue', // language
];

const ONTARIO_GOV_DOMAINS = ['ontario.ca', '.on.ca', '.gc.ca', '.gouv.qc.ca'];

/**
 * Checks if text content contains substantial French content
 * Requires multiple French keywords for confidence
 */
export function hasFrenchKeywords(text: string, minKeywords = 3): boolean {
  const lowerText = text.toLowerCase();

  // Count UI keywords found
  const uiKeywordsFound = FRENCH_UI_KEYWORDS.filter((word) => lowerText.includes(word)).length;

  // Count structural words found
  const structuralWordsFound = FRENCH_STRUCTURAL_WORDS.filter((word) =>
    lowerText.includes(word)
  ).length;

  // Need at least minKeywords UI words OR 2+ structural words
  return uiKeywordsFound >= minKeywords || structuralWordsFound >= 2;
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
export function extractLanguages(elements: Array<{ lang: string | null }>): string[] {
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
 * Uses strict criteria to avoid false positives
 */
export function determineBilingualStatus(
  detectedLanguages: string[],
  hasLanguageToggle: boolean,
  hasFrenchContent: boolean,
  isOntarioGov: boolean
): boolean {
  const hasEnglish = detectedLanguages.includes('en');
  const hasFrench = detectedLanguages.includes('fr');

  // PRIMARY: Both English and French lang attributes explicitly present
  if (hasEnglish && hasFrench) {
    return true;
  }

  // SECONDARY: For government sites, require toggle AND substantial French content
  if (isOntarioGov && hasLanguageToggle && hasFrenchContent) {
    return true;
  }

  // All other cases: not bilingual (avoid false positives)
  return false;
}

/**
 * Performs comprehensive bilingual support detection
 */
export function checkBilingualSupport(options: BilingualDetectionOptions): BilingualCheck {
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
    hasFrenchContent,
    isOntarioGov
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
