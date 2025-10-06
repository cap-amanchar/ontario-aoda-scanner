# ModernA11y - Ontario AODA Scanner

> Scan websites for Ontario AODA (Accessibility for Ontarians with Disabilities Act) compliance

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh/) v1.0+ installed
- Chrome browser for extension development

### Installation

```bash
# Install all dependencies
bun install

# Build all packages
bun run build
```

## 📦 Project Structure

- `apps/extension` - Chrome extension (Manifest V3)
- `apps/web` - Next.js web application
- `packages/scanner` - Shared scanning logic

## 🧪 Development

### Chrome Extension

```bash
cd apps/extension
bun run dev

# Load extension in Chrome:
# 1. Go to chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select apps/extension/dist folder
```

### Web App

```bash
cd apps/web
bun run dev

# Open http://localhost:3000
```

## 🔍 What is AODA?

The Accessibility for Ontarians with Disabilities Act (AODA) requires:
- All Ontario websites must meet WCAG 2.0 Level AA
- Deadline: January 1, 2021 (already passed!)
- Penalties: Up to $100,000/day for organizations

## 📝 License

MIT

## 🤝 Contributing

This is an alpha version. Contributions welcome!
