# Dutch Sponsor Data Pipeline (Gemini Edition)

Automated scraper and Gemini-powered enrichment pipeline for the Dutch IND Public Register of Recognised Sponsors.

## Architecture

1. **Scraping (`scripts/scraper.js`)**:
   - Scrapes `https://ind.nl/en/public-register-recognised-sponsors/public-register-work`.
   - Parses the table of sponsors (`name` and `kvk`).
   - Compares with existing records in `scripts/output.json` to compute delta.
   - Saves all organizations to `scripts/organizations.json` and new un-enriched records to `scripts/unprocessed_organizations.json`.

2. **Gemini Enrichment (`scripts/enrich_gemini.js`)**:
   - Batches organizations (default 25 companies per call) to Gemini (`gemini-2.5-flash`).
   - Uses **Gemini Structured Output** (`responseSchema`) to enforce strictly validated JSON schema with lowercase values and category slug mappings.
   - Categorizes companies into the 7 official sectors (`mi`, `eu`, `cgr`, `fre`, `hp`, `tt`, `ot`).
   - Atomic file writes (`.tmp` + POSIX rename) ensure files never corrupt even if interrupted.
   - Automatically synchronizes output to `src/assets/sponsors.json` and dated `src/assets/DD-MM-YYYY.json`.

---

## Setup & Configuration

Add your Gemini API key to a `.env` file in the project root:

```bash
GEMINI_API_KEY="your-gemini-api-key"
# Optional overrides:
# GEMINI_MODEL="gemini-2.5-flash"
```

---

## Usage Commands

### 1. Scrape latest data from IND:
```bash
npm run scrape
```

### 2. Enrich delta (newly found companies) with Gemini:
```bash
npm run enrich
```

### 3. Run full pipeline (scrape + enrich delta + sync):
```bash
npm run pipeline
```

### 4. Advanced CLI Options:
```bash
# Test with a small batch of 10 companies
node scripts/enrich_gemini.js --limit 10

# Adjust batch size (companies per Gemini call)
node scripts/enrich_gemini.js --batch-size 30

# Re-enrich all companies from scratch
node scripts/enrich_gemini.js --all

# Manually trigger asset sync from output.json
npm run sync:data
```

