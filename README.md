# Dutch

A web application that visualizes data from the Netherlands Immigration and Naturalisation Service ([IND Public Register of Recognised Sponsors](https://ind.nl/en/public-register-recognised-sponsors/public-register-work)). The application organizes recognised sponsors into browsable and searchable industry categories.

The application has no runtime backend; it is an Angular 22 Single Page Application (SPA).

See the live application at [dutch.khophi.com](https://dutch.khophi.com).

![wide](https://github.com/seanmavley/dutch/assets/5289083/2bd7aba1-c321-4b46-8fc8-1cddc084558a)

---

## Features

- **Search & Categorization**: Instant search across 13,000+ recognised sponsors with filtering by sector (Technology, Healthcare, Finance, Energy, Manufacturing, Consumer Goods, Other).
- **Delta-Based Scraping**: Automated scraping from IND with delta calculation so only newly added or modified sponsors are identified.
- **Gemini AI Enrichment**: Batch-processes sponsors with Google Gemini (`gemini-2.5-flash`) to generate concise company summaries, website URLs, and industry tags with schema enforcement.
- **PWA & Offline Support**: Fast local loading with service worker caching.

---

## Local Development

### Prerequisites
- Node.js (v20+ or v24+) or Bun
- npm or bun

### Setup
1. Clone this repository:
   ```bash
   git clone https://github.com/seanmavley/dutch.git
   cd dutch
   ```
2. Install dependencies:
   ```bash
   npm install
   # or
   bun install
   ```
3. Run the development server:
   ```bash
   npm start
   # or
   ng serve
   ```
4. Navigate to `http://localhost:4200/`.

---

## Data Enrichment Pipeline (Gemini)

The company datasets in `src/assets/` are generated via the automated scraping and enrichment pipeline in `scripts/`.

### Configuration & Security Best Practices
1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
2. Add your Gemini API key to `.env`:
   ```bash
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

> [!IMPORTANT]
> **API Key Security Guidelines**:
> - `.env` is ignored by `.gitignore` and must **never** be committed to version control.
> - **API Restriction**: In [Google AI Studio](https://aistudio.google.com/) or Google Cloud Console, restrict your API key specifically to the **Generative Language API**.
> - **Permissions**: Ensure `.env` has restrictive file permissions on your local machine (`chmod 600 .env`).
> - **CI/CD**: When running pipeline automation in CI/CD (e.g. GitHub Actions), inject `GEMINI_API_KEY` via encrypted repository secrets.

### Pipeline Commands

| Command | Description |
| :--- | :--- |
| `npm run scrape` | Scrapes the official IND register and extracts newly added sponsor deltas. |
| `npm run enrich` | Sends delta sponsors to Gemini in batches to generate descriptions, categories, and tags. |
| `npm run pipeline` | Runs both scraping and enrichment sequentially, then syncs assets. |
| `npm run sync:data` | Flushes `scripts/output.json` directly into `src/assets/sponsors.json`. |

#### CLI Options for `enrich_gemini.js`
```bash
# Dry run with a small batch of 10 companies
node scripts/enrich_gemini.js --limit 10

# Customize batch size (companies per Gemini call, default 25)
node scripts/enrich_gemini.js --batch-size 30

# Full re-enrichment of all sponsors
node scripts/enrich_gemini.js --all
```

---

## Contributing

Pull requests are welcome! If you are updating the sponsors list, run `npm run pipeline` and submit a PR with the updated asset files.
