# How to Fix AODA Violations - Quick Guide

This guide provides practical solutions for the top 10 most common AODA (Accessibility for Ontarians with Disabilities Act) violations detected by ModernA11y.

## Table of Contents
1. [Document Title](#1-document-title)
2. [Image Alt Text](#2-image-alt-text)
3. [Form Labels](#3-form-labels)
4. [Color Contrast](#4-color-contrast)
5. [HTML Language](#5-html-language)
6. [Button Names](#6-button-names)
7. [Link Names](#7-link-names)
8. [Skip Navigation](#8-skip-navigation)
9. [ARIA Attributes](#9-aria-attributes)
10. [Form Input Labels](#10-form-input-labels)

---

## 1. Document Title
**Rule:** `document-title`
**WCAG:** 2.4.2 Page Titled (Level A)
**Fix Time:** 5 minutes
**Penalty:** Up to $100,000/day

### Problem
Page is missing a `<title>` element or the title is empty.

### Impact
- Screen reader users can't identify the page
- Browser tabs show generic labels
- SEO is negatively affected

### Solution

❌ **Bad:**
```html
<head>
  <!-- No title tag -->
</head>
```

✅ **Good:**
```html
<head>
  <title>Contact Us - YourCompany | Ontario Services</title>
</head>
```

### Best Practices
- Keep titles under 60 characters
- Include page name, site name, and context
- Make each page title unique
- Include bilingual support for Ontario: `<title>Contact Us | Contactez-nous - YourCompany</title>`

---

## 2. Image Alt Text
**Rule:** `image-alt`
**WCAG:** 1.1.1 Non-text Content (Level A)
**Fix Time:** 15 minutes
**Penalty:** Up to $100,000/day

### Problem
Images missing alternative text for screen readers.

### Impact
- Blind users can't understand image content
- Screen readers announce "image" without context
- Critical information may be inaccessible

### Solution

❌ **Bad:**
```html
<img src="logo.png">
<img src="chart.png" alt="">
```

✅ **Good:**
```html
<img src="logo.png" alt="ModernA11y - AODA Compliance Scanner">
<img src="chart.png" alt="Bar chart showing 80% compliance rate in 2024">
```

### Decorative Images
```html
<!-- For purely decorative images, use empty alt -->
<img src="decorative-border.png" alt="">
```

### Best Practices
- Describe the purpose, not just the content
- Keep alt text concise (under 150 characters)
- Don't start with "image of" or "picture of"
- Include bilingual descriptions for Ontario government sites

---

## 3. Form Labels
**Rule:** `label`
**WCAG:** 3.3.2 Labels or Instructions (Level A)
**Fix Time:** 20 minutes
**Penalty:** Up to $100,000/day

### Problem
Form inputs missing visible labels.

### Impact
- Screen reader users don't know what to enter
- Users with cognitive disabilities struggle to complete forms
- Violates Ontario's feedback process requirements

### Solution

❌ **Bad:**
```html
<input type="text" name="email" placeholder="Email">
<select name="province">
  <option>Choose province</option>
</select>
```

✅ **Good:**
```html
<label for="email">Email Address *</label>
<input type="text" id="email" name="email" required>

<label for="province">Province *</label>
<select id="province" name="province" required>
  <option value="">Choose province</option>
  <option value="ON">Ontario</option>
</select>
```

### Using aria-label (less preferred)
```html
<input
  type="search"
  name="q"
  aria-label="Search products"
  placeholder="Search..."
>
```

---

## 4. Color Contrast
**Rule:** `color-contrast`
**WCAG:** 1.4.3 Contrast (Minimum) (Level AA)
**Fix Time:** 30 minutes
**Penalty:** Up to $100,000/day

### Problem
Text doesn't have sufficient contrast against background.

### Impact
- Low vision users can't read content
- Aging users struggle with faint text
- Color-blind users may miss information

### Solution

❌ **Bad:**
```css
/* Light gray on white - 2.1:1 ratio */
.text {
  color: #999999;
  background: #FFFFFF;
}
```

✅ **Good:**
```css
/* Dark gray on white - 7.2:1 ratio */
.text {
  color: #595959;
  background: #FFFFFF;
}

/* White on blue - 4.6:1 ratio */
.button {
  color: #FFFFFF;
  background: #0066CC;
}
```

### Minimum Ratios
- **Normal text (< 18pt):** 4.5:1
- **Large text (≥ 18pt or 14pt bold):** 3:1
- **UI components:** 3:1

### Tools
- Chrome DevTools > Lighthouse
- WebAIM Contrast Checker
- ModernA11y Scanner (automatically detects)

---

## 5. HTML Language
**Rule:** `html-has-lang`
**WCAG:** 3.1.1 Language of Page (Level A)
**Fix Time:** 5 minutes
**Penalty:** AODA + Official Languages Act violation

### Problem
Missing or invalid `lang` attribute on `<html>` element.

### Impact
- Screen readers use wrong pronunciation
- Translation tools fail
- Critical for Ontario bilingual requirements

### Solution

❌ **Bad:**
```html
<html>
  <head>...</head>
</html>
```

✅ **Good:**
```html
<!-- English -->
<html lang="en">
  <head>...</head>
</html>

<!-- French -->
<html lang="fr">
  <head>...</head>
</html>

<!-- English with French section -->
<html lang="en">
  <body>
    <p>Welcome to our site</p>
    <section lang="fr">
      <p>Bienvenue sur notre site</p>
    </section>
  </body>
</html>
```

### Ontario Bilingual Requirements
For Ontario government sites, you must:
1. Set primary language with `lang` attribute
2. Provide language toggle
3. Mark content sections in different languages
4. Ensure translation tools can detect both English and French

---

## 6. Button Names
**Rule:** `button-name`
**WCAG:** 4.1.2 Name, Role, Value (Level A)
**Fix Time:** 10 minutes
**Penalty:** Up to $100,000/day

### Problem
Buttons without accessible names.

### Impact
- Screen readers announce "button" without purpose
- Keyboard users can't identify button function
- Voice control users can't activate buttons

### Solution

❌ **Bad:**
```html
<button><i class="icon-close"></i></button>
<button><img src="search.png"></button>
```

✅ **Good:**
```html
<button aria-label="Close dialog">
  <i class="icon-close"></i>
</button>

<button>
  <img src="search.png" alt=""> Search
</button>

<!-- Or with aria-label -->
<button aria-label="Search products">
  <i class="icon-search"></i>
</button>
```

### Icon Buttons Best Practice
```html
<button
  aria-label="Delete item"
  title="Delete item"
>
  <span aria-hidden="true">🗑️</span>
</button>
```

---

## 7. Link Names
**Rule:** `link-name`
**WCAG:** 2.4.4 Link Purpose (In Context) (Level A)
**Fix Time:** 15 minutes
**Penalty:** Up to $100,000/day

### Problem
Links without descriptive text.

### Impact
- Screen reader users can't understand link purpose
- "Click here" links are ambiguous out of context

### Solution

❌ **Bad:**
```html
<a href="/report.pdf">Click here</a>
<a href="/products">Read more</a>
<a href="/download"><img src="pdf-icon.png"></a>
```

✅ **Good:**
```html
<a href="/report.pdf">Download 2024 Accessibility Report (PDF, 2MB)</a>
<a href="/products">Read more about our accessible products</a>
<a href="/download">
  <img src="pdf-icon.png" alt="Download PDF">
  Annual Report 2024
</a>
```

### Context Matters
```html
<!-- Good: link purpose is clear -->
<p>
  Our AODA compliance guide helps organizations meet Ontario requirements.
  <a href="/guide">Read the complete AODA compliance guide</a>.
</p>
```

---

## 8. Skip Navigation
**Rule:** `bypass`
**WCAG:** 2.4.1 Bypass Blocks (Level A)
**Fix Time:** 20 minutes
**Penalty:** Up to $100,000/day

### Problem
No skip link to bypass repetitive navigation.

### Impact
- Keyboard users must tab through entire nav each page
- Screen reader users hear same menu items repeatedly
- Reduced efficiency for all keyboard navigators

### Solution

✅ **Good:**
```html
<body>
  <!-- Skip link (visually hidden until focused) -->
  <a href="#main-content" class="skip-link">
    Skip to main content
  </a>

  <nav>
    <!-- Your navigation here -->
  </nav>

  <main id="main-content" tabindex="-1">
    <!-- Page content -->
  </main>
</body>
```

### CSS for Skip Link
```css
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: #000;
  color: #fff;
  padding: 8px;
  text-decoration: none;
  z-index: 100;
}

.skip-link:focus {
  top: 0;
}
```

---

## 9. ARIA Attributes
**Rules:** `aria-required-attr`, `aria-roles`, `aria-required-children`
**WCAG:** 4.1.2 Name, Role, Value (Level A)
**Fix Time:** 15-25 minutes
**Penalty:** Up to $100,000/day

### Problem
Incorrect or incomplete ARIA usage.

### Impact
- Assistive technology gets wrong information
- Screen readers misinterpret UI components
- Confusing experience for users with disabilities

### Common Issues & Fixes

#### Missing Required Attributes
❌ **Bad:**
```html
<div role="checkbox">Accept terms</div>
```

✅ **Good:**
```html
<div
  role="checkbox"
  aria-checked="false"
  aria-labelledby="terms-label"
  tabindex="0"
>
  <span id="terms-label">Accept terms and conditions</span>
</div>
```

#### Invalid ARIA Roles
❌ **Bad:**
```html
<div role="fancy-button">Click me</div>
```

✅ **Good:**
```html
<button type="button">Click me</button>
<!-- Or if div is absolutely necessary -->
<div role="button" tabindex="0">Click me</div>
```

#### Missing Required Children
❌ **Bad:**
```html
<ul role="tablist">
  <li>Tab 1</li>
  <li>Tab 2</li>
</ul>
```

✅ **Good:**
```html
<div role="tablist">
  <button role="tab" aria-selected="true">Tab 1</button>
  <button role="tab" aria-selected="false">Tab 2</button>
</div>
<div role="tabpanel">Content for Tab 1</div>
```

### ARIA Best Practices
1. **First rule of ARIA:** Don't use ARIA if HTML can do it
2. **Second rule:** Don't change native semantics
3. **Always add keyboard support** for custom widgets
4. **Test with screen readers** (NVDA, JAWS, VoiceOver)

---

## 10. Form Input Labels
**Rules:** `select-name`, `input-button-name`
**WCAG:** 4.1.2 Name, Role, Value (Level A)
**Fix Time:** 10 minutes
**Penalty:** Up to $100,000/day

### Problem
Form controls without accessible names.

### Impact
- Screen reader users can't identify form fields
- Violates Ontario feedback process requirements (IASR 11(1))

### Solution

#### Select Dropdowns
❌ **Bad:**
```html
<select name="language">
  <option>English</option>
  <option>Français</option>
</select>
```

✅ **Good:**
```html
<label for="language">Preferred Language *</label>
<select id="language" name="language" required>
  <option value="">-- Select Language --</option>
  <option value="en">English</option>
  <option value="fr">Français</option>
</select>
```

#### Input Buttons
❌ **Bad:**
```html
<input type="submit">
<input type="button" value="">
```

✅ **Good:**
```html
<input type="submit" value="Submit Application">
<input
  type="button"
  value="Clear Form"
  aria-label="Clear all form fields"
>
```

---

## Quick Testing Checklist

Before deploying, verify:

- [ ] All images have alt text (or empty alt for decorative)
- [ ] Every form field has a visible label
- [ ] Color contrast meets 4.5:1 ratio
- [ ] Page has meaningful title
- [ ] HTML has lang attribute
- [ ] Skip navigation link exists
- [ ] All buttons have text or aria-label
- [ ] Links describe their destination
- [ ] ARIA attributes are valid and complete
- [ ] Bilingual content is properly marked (Ontario sites)

## Need Help?

- **ModernA11y Scanner:** Automatically detects these issues
- **AODA Guidance:** https://www.ontario.ca/page/accessibility-rules-businesses-and-non-profits
- **WCAG Quick Reference:** https://www.w3.org/WAI/WCAG21/quickref/
- **Ontario Compliance Reports:** Required by Dec 31, 2026

---

**Remember:** Accessibility is not a checklist—it's an ongoing commitment to inclusivity. Start with critical violations, test with real users, and iterate.

💙 Built with love for an accessible Ontario
