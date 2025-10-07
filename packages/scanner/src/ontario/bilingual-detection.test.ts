import { describe, it, expect } from 'vitest';
import {
  hasFrenchKeywords,
  isOntarioGovernmentDomain,
  extractLanguages,
  determineBilingualStatus,
  checkBilingualSupport,
  type BilingualDetectionOptions,
} from './bilingual-detection';

describe('Bilingual Detection', () => {
  describe('hasFrenchKeywords', () => {
    it('should detect common French keywords', () => {
      expect(hasFrenchKeywords('Bienvenue, français')).toBe(true);
      expect(hasFrenchKeywords('Bonjour tout le monde')).toBe(true);
      expect(hasFrenchKeywords('Accueil principal')).toBe(true);
      expect(hasFrenchKeywords('Contactez-nous')).toBe(true);
      expect(hasFrenchKeywords('Recherche avancée')).toBe(true);
      expect(hasFrenchKeywords('Services publics')).toBe(true);
    });

    it('should be case insensitive', () => {
      expect(hasFrenchKeywords('FRANÇAIS')).toBe(true);
      expect(hasFrenchKeywords('BONJOUR')).toBe(true);
      expect(hasFrenchKeywords('Accueil')).toBe(true);
    });

    it('should return false for English-only content', () => {
      expect(hasFrenchKeywords('Welcome to our website')).toBe(false);
      expect(hasFrenchKeywords('Hello world')).toBe(false);
      expect(hasFrenchKeywords('Contact us for more information')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(hasFrenchKeywords('')).toBe(false);
    });

    it('should detect French keywords in mixed content', () => {
      expect(hasFrenchKeywords('Welcome | Bienvenue')).toBe(true);
      expect(
        hasFrenchKeywords('Click here for français version')
      ).toBe(true);
    });
  });

  describe('isOntarioGovernmentDomain', () => {
    it('should detect ontario.ca domains', () => {
      expect(isOntarioGovernmentDomain('www.ontario.ca')).toBe(true);
      expect(isOntarioGovernmentDomain('health.ontario.ca')).toBe(true);
      expect(isOntarioGovernmentDomain('service.ontario.ca')).toBe(true);
    });

    it('should detect .on.ca domains', () => {
      expect(isOntarioGovernmentDomain('www.example.on.ca')).toBe(true);
      expect(isOntarioGovernmentDomain('portal.gov.on.ca')).toBe(true);
    });

    it('should detect federal .gc.ca domains', () => {
      expect(isOntarioGovernmentDomain('canada.gc.ca')).toBe(true);
      expect(isOntarioGovernmentDomain('services.gc.ca')).toBe(true);
    });

    it('should detect Quebec .gouv.qc.ca domains', () => {
      expect(isOntarioGovernmentDomain('www.gouv.qc.ca')).toBe(true);
      expect(isOntarioGovernmentDomain('service.gouv.qc.ca')).toBe(true);
    });

    it('should return false for non-government domains', () => {
      expect(isOntarioGovernmentDomain('example.com')).toBe(false);
      expect(isOntarioGovernmentDomain('google.ca')).toBe(false);
      expect(isOntarioGovernmentDomain('ontario-news.com')).toBe(false);
    });

    it('should return false for empty hostname', () => {
      expect(isOntarioGovernmentDomain('')).toBe(false);
    });
  });

  describe('extractLanguages', () => {
    it('should extract unique language codes', () => {
      const elements = [{ lang: 'en' }, { lang: 'fr' }, { lang: 'en-US' }];

      const result = extractLanguages(elements);
      expect(result).toContain('en');
      expect(result).toContain('fr');
      expect(result.length).toBe(2);
    });

    it('should normalize language codes to 2 characters', () => {
      const elements = [{ lang: 'en-US' }, { lang: 'fr-CA' }];

      const result = extractLanguages(elements);
      expect(result).toContain('en');
      expect(result).toContain('fr');
    });

    it('should handle lowercase and uppercase lang codes', () => {
      const elements = [{ lang: 'EN' }, { lang: 'FR' }];

      const result = extractLanguages(elements);
      expect(result).toContain('en');
      expect(result).toContain('fr');
    });

    it('should skip null lang attributes', () => {
      const elements = [{ lang: 'en' }, { lang: null }, { lang: 'fr' }];

      const result = extractLanguages(elements);
      expect(result).toContain('en');
      expect(result).toContain('fr');
      expect(result.length).toBe(2);
    });

    it('should return empty array for no elements', () => {
      const result = extractLanguages([]);
      expect(result).toEqual([]);
    });

    it('should return empty array for all null lang attributes', () => {
      const elements = [{ lang: null }, { lang: null }];
      const result = extractLanguages(elements);
      expect(result).toEqual([]);
    });

    it('should deduplicate language codes', () => {
      const elements = [
        { lang: 'en' },
        { lang: 'en-US' },
        { lang: 'en-CA' },
        { lang: 'fr' },
      ];

      const result = extractLanguages(elements);
      expect(result.length).toBe(2);
      expect(result).toContain('en');
      expect(result).toContain('fr');
    });
  });

  describe('determineBilingualStatus', () => {
    it('should return true when both EN and FR lang attributes present', () => {
      const result = determineBilingualStatus(['en', 'fr'], false, false);
      expect(result).toBe(true);
    });

    it('should return true when language toggle and French content present', () => {
      const result = determineBilingualStatus(['en'], true, true);
      expect(result).toBe(true);
    });

    it('should return false when only English detected', () => {
      const result = determineBilingualStatus(['en'], false, false);
      expect(result).toBe(false);
    });

    it('should return false when only French detected', () => {
      const result = determineBilingualStatus(['fr'], false, false);
      expect(result).toBe(false);
    });

    it('should return false when toggle present but no French content', () => {
      const result = determineBilingualStatus(['en'], true, false);
      expect(result).toBe(false);
    });

    it('should return false when French content present but no toggle', () => {
      const result = determineBilingualStatus(['en'], false, true);
      expect(result).toBe(false);
    });

    it('should return false when no languages detected', () => {
      const result = determineBilingualStatus([], false, false);
      expect(result).toBe(false);
    });

    it('should handle multiple language codes beyond EN/FR', () => {
      const result = determineBilingualStatus(['en', 'fr', 'es'], false, false);
      expect(result).toBe(true); // Still bilingual due to EN+FR
    });
  });

  describe('checkBilingualSupport', () => {
    it('should detect fully bilingual site with lang attributes', () => {
      const options: BilingualDetectionOptions = {
        htmlLang: 'en',
        hostname: 'ontario.ca',
        bodyText: 'Welcome | Bienvenue',
        languageToggleElements: 1,
        elementsWithLang: [{ lang: 'en' }, { lang: 'fr' }],
      };

      const result = checkBilingualSupport(options);

      expect(result.hasLangAttribute).toBe(true);
      expect(result.isBilingual).toBe(true);
      expect(result.detectedLanguages).toContain('en');
      expect(result.detectedLanguages).toContain('fr');
      expect(result.hasLanguageToggle).toBe(true);
      expect(result.hasFrenchContent).toBe(true);
      expect(result.isOntarioGov).toBe(true);
      expect(result.languageToggles).toBe(1);
    });

    it('should detect bilingual site with toggle and French content', () => {
      const options: BilingualDetectionOptions = {
        htmlLang: 'en',
        hostname: 'example.com',
        bodyText: 'Contactez-nous for support',
        languageToggleElements: 2,
        elementsWithLang: [{ lang: 'en' }],
      };

      const result = checkBilingualSupport(options);

      expect(result.isBilingual).toBe(true);
      expect(result.hasLanguageToggle).toBe(true);
      expect(result.hasFrenchContent).toBe(true);
      expect(result.isOntarioGov).toBe(false);
    });

    it('should detect non-bilingual English-only site', () => {
      const options: BilingualDetectionOptions = {
        htmlLang: 'en',
        hostname: 'example.com',
        bodyText: 'Welcome to our website',
        languageToggleElements: 0,
        elementsWithLang: [{ lang: 'en' }],
      };

      const result = checkBilingualSupport(options);

      expect(result.hasLangAttribute).toBe(true);
      expect(result.isBilingual).toBe(false);
      expect(result.detectedLanguages).toEqual(['en']);
      expect(result.hasLanguageToggle).toBe(false);
      expect(result.hasFrenchContent).toBe(false);
      expect(result.isOntarioGov).toBe(false);
    });

    it('should handle site with no lang attribute', () => {
      const options: BilingualDetectionOptions = {
        htmlLang: '',
        hostname: 'example.com',
        bodyText: 'Content',
        languageToggleElements: 0,
        elementsWithLang: [],
      };

      const result = checkBilingualSupport(options);

      expect(result.hasLangAttribute).toBe(false);
      expect(result.isBilingual).toBe(false);
      expect(result.detectedLanguages).toEqual([]);
    });

    it('should handle Ontario government site without bilingual support', () => {
      const options: BilingualDetectionOptions = {
        htmlLang: 'en',
        hostname: 'service.ontario.ca',
        bodyText: 'English only content',
        languageToggleElements: 0,
        elementsWithLang: [{ lang: 'en' }],
      };

      const result = checkBilingualSupport(options);

      expect(result.isOntarioGov).toBe(true);
      expect(result.isBilingual).toBe(false); // Should flag compliance issue
    });

    it('should handle empty options with defaults', () => {
      const options: BilingualDetectionOptions = {};

      const result = checkBilingualSupport(options);

      expect(result.hasLangAttribute).toBe(false);
      expect(result.isBilingual).toBe(false);
      expect(result.detectedLanguages).toEqual([]);
      expect(result.hasLanguageToggle).toBe(false);
      expect(result.hasFrenchContent).toBe(false);
      expect(result.isOntarioGov).toBe(false);
      expect(result.languageToggles).toBe(0);
    });

    it('should detect multiple language toggles', () => {
      const options: BilingualDetectionOptions = {
        htmlLang: 'en',
        hostname: 'example.com',
        bodyText: 'Français available',
        languageToggleElements: 5,
        elementsWithLang: [{ lang: 'en' }],
      };

      const result = checkBilingualSupport(options);

      expect(result.languageToggles).toBe(5);
      expect(result.hasLanguageToggle).toBe(true);
      expect(result.isBilingual).toBe(true);
    });

    it('should handle mixed lang attributes with duplicates', () => {
      const options: BilingualDetectionOptions = {
        htmlLang: 'en-CA',
        hostname: 'example.com',
        bodyText: 'Content',
        languageToggleElements: 0,
        elementsWithLang: [
          { lang: 'en' },
          { lang: 'en-US' },
          { lang: 'fr' },
          { lang: 'fr-CA' },
        ],
      };

      const result = checkBilingualSupport(options);

      expect(result.detectedLanguages).toContain('en');
      expect(result.detectedLanguages).toContain('fr');
      expect(result.detectedLanguages.length).toBe(2);
      expect(result.isBilingual).toBe(true);
    });
  });

  describe('Edge cases and validation', () => {
    it('should handle extremely long body text', () => {
      const longText = 'English content '.repeat(10000) + ' français';

      const options: BilingualDetectionOptions = {
        bodyText: longText,
      };

      const result = checkBilingualSupport(options);
      expect(result.hasFrenchContent).toBe(true);
    });

    it('should handle special characters in lang attributes', () => {
      const options: BilingualDetectionOptions = {
        elementsWithLang: [{ lang: 'en-US' }, { lang: 'fr-CA' }],
      };

      const result = checkBilingualSupport(options);
      expect(result.detectedLanguages).toContain('en');
      expect(result.detectedLanguages).toContain('fr');
    });

    it('should handle hostname with subdirectories', () => {
      const options: BilingualDetectionOptions = {
        hostname: 'www.service.ontario.ca',
      };

      const result = checkBilingualSupport(options);
      expect(result.isOntarioGov).toBe(true);
    });
  });

  describe('Real-world scenarios', () => {
    it('should correctly assess Government of Ontario main page', () => {
      const options: BilingualDetectionOptions = {
        htmlLang: 'en',
        hostname: 'www.ontario.ca',
        bodyText:
          'Ontario government services - Services du gouvernement de l\'Ontario - Français',
        languageToggleElements: 1,
        elementsWithLang: [
          { lang: 'en' },
          { lang: 'en-CA' },
          { lang: 'fr' },
          { lang: 'fr-CA' },
        ],
      };

      const result = checkBilingualSupport(options);

      expect(result.isOntarioGov).toBe(true);
      expect(result.isBilingual).toBe(true);
      expect(result.hasLangAttribute).toBe(true);
      expect(result.hasFrenchContent).toBe(true);
      expect(result.hasLanguageToggle).toBe(true);
    });

    it('should flag non-compliant Ontario government site', () => {
      const options: BilingualDetectionOptions = {
        htmlLang: 'en',
        hostname: 'service.ontario.ca',
        bodyText: 'English only government service',
        languageToggleElements: 0,
        elementsWithLang: [{ lang: 'en' }],
      };

      const result = checkBilingualSupport(options);

      expect(result.isOntarioGov).toBe(true);
      expect(result.isBilingual).toBe(false);
      // This should trigger AODA bilingual requirement violation
    });

    it('should handle private sector bilingual site', () => {
      const options: BilingualDetectionOptions = {
        htmlLang: 'en',
        hostname: 'www.example-company.com',
        bodyText: 'Services available in English and Français',
        languageToggleElements: 2,
        elementsWithLang: [{ lang: 'en' }, { lang: 'fr' }],
      };

      const result = checkBilingualSupport(options);

      expect(result.isOntarioGov).toBe(false);
      expect(result.isBilingual).toBe(true);
    });
  });
});
