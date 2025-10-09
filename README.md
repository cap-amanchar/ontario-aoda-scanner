# ComplyCA - AODA Compliance Scanner 🇨🇦

> Chrome extension and web app for scanning Ontario AODA compliance

**ComplyCA** helps organizations meet Ontario's accessibility requirements by scanning websites for WCAG 2.0 Level AA violations and AODA-specific issues.

## 🚀 Quick Start

### Prerequisites
- [Bun](https://bun.sh/) v1.0+
- Chrome browser

### Installation

```bash
# Install dependencies
bun install

# Build extension
bun run build
```

### Load Extension in Chrome

1. Navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `apps/extension/dist` folder

## 📦 What's Inside

```
complyca/
├── apps/
│   ├── extension/    # Chrome extension (Manifest V3)
│   └── web/          # Next.js web app
└── packages/
    └── scanner/      # Shared AODA scanning logic
```

## ✨ Features

- ✅ **Single Page Scan** - Analyze current page for AODA violations
- 🌐 **Full Site Scan** - Scan entire website with comprehensive reports
- 📊 **Scoring System** - Get compliance scores with letter grades
- 🇨🇦 **Bilingual Detection** - Check English/French language support
- 📄 **PDF Export** - Generate detailed compliance reports
- 🌙 **Dark Mode** - Built-in dark theme support

## 🔍 What is AODA?

**Accessibility for Ontarians with Disabilities Act (AODA)** requires:
- All Ontario organizations must meet **WCAG 2.0 Level AA**
- Compliance deadline: January 1, 2021
- Penalties: Up to **$100,000/day** for non-compliance

## 🛠️ Development

### Chrome Extension
```bash
cd apps/extension
bun run build        # Production build
bun run dev          # Watch mode
```

### Web App
```bash
cd apps/web
bun run dev          # Start dev server (http://localhost:3000)
bun run build        # Production build
```

### Scanner Package
```bash
cd packages/scanner
bun run test         # Run tests
bun run test -- --ui # Run tests with UI
```

## 🧪 Tech Stack

- **Runtime:** Bun
- **Build:** Turbo (monorepo)
- **Extension:** Chrome Manifest V3
- **Frontend:** React + TypeScript
- **Web:** Next.js 14 (App Router)
- **Linting:** Biome
- **Testing:** Vitest
- **Scanner:** axe-core + AODA mappings

## 📋 Commands

```bash
bun install          # Install all dependencies
bun run build        # Build all packages
bun run dev          # Run all apps in dev mode
bun run test         # Run all tests
bun run lint         # Lint all packages
bun run format       # Format code
bun run type-check   # TypeScript type checking
bun run clean        # Clean build artifacts
```

## 📄 License

MIT

## 🤝 Contributing

Contributions welcome! This project helps make the web more accessible for everyone in Canada.

## 🙏 Credits

Developed by Nizar Amanchar for Canada ❤️
