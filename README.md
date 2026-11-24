# Dustin Clarence Costo · Portfolio

Personal portfolio of Dustin Clarence Costo, BS Information Technology student at STI College Legazpi (Class of 2027), preparing for an entry-level QA Tester role.

**Live site:** https://dustinclarence.github.io/portfolio/

## Sections

Home · About · Skills · Projects (including the AI Lab) · Experience · Education & Achievements · Display Studio · Contact

The **AI Lab** projects (AI Bug Triage, TestPal QA Chatbot, Neural Playground, Chess AI, Fleet Grid AI, Melody Machine) are labelled on the site as AI-assisted builds.

The **Display Studio** has 16 working controls: theme, brightness, sunset filter, text size, accent ink, calm motion, reading ruler, high contrast, screentone, typeface, line spacing, wind chime, ink trail, falling petals, manga mode and reset.

## Built with

- Vite + vanilla TypeScript, HTML and CSS (no UI framework)
- Fonts: Shippori Mincho and Inter (Google Fonts)
- Original artwork drawn in SVG/CSS (Mayon Volcano at dusk, screentone, hanko seal)
- Deployed to GitHub Pages with GitHub Actions

## Accessibility

- Semantic landmarks, one `h1`, skip link, visible focus styles
- Day and night themes, both checked for WCAG 2.2 AA contrast
- Native `<dialog>` case files with focus return
- Motion is reduced when the visitor prefers reduced motion

## Run locally

```bash
npm ci
npm run dev
```

`npm run build` creates the production site in `dist/`.

## Credits

Project screenshots come from my own projects. The eBook Library Management System screenshots show test accounts and sample public-domain books only; its source code is in a private repository.
