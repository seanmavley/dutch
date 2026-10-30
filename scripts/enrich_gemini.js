const axios = require('axios');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

// 1. Categories taxonomy definition
const CATEGORIES = [
  {
    slug: 'mi',
    name: 'Manufacturing and Industrials',
    description: 'Automotive and aerospace, Construction and engineering, Machinery and industrial equipment, Chemicals and materials',
  },
  {
    slug: 'eu',
    name: 'Energy and Utilities',
    description: 'Oil and gas, Renewable energy, Electricity and power generation, Water and waste management',
  },
  {
    slug: 'cgr',
    name: 'Consumer Goods and Retail',
    description: 'Food and beverages, Apparel and footwear, Household goods, Retail stores and e-commerce',
  },
  {
    slug: 'fre',
    name: 'Finance and Real Estate',
    description: 'Banking and financial services, Insurance companies, Investment firms and asset management, Real estate and property development',
  },
  {
    slug: 'hp',
    name: 'Healthcare and Pharmaceuticals',
    description: 'Hospitals and healthcare services, Pharmaceutical companies, Medical devices and equipment, Biotechnology firms',
  },
  {
    slug: 'tt',
    name: 'Technology and Telecommunications',
    description: 'Software and IT services, Hardware and electronics, Telecommunications, Internet services and e-commerce',
  },
  {
    slug: 'ot',
    name: 'Other',
    description: "Organizations that couldn't fit exactly under the other broad categories",
  }
];

const VALID_SLUGS = new Set(CATEGORIES.map(c => c.slug));

// Load .env if present
function loadEnv() {
  const envPaths = [
    path.resolve(__dirname, '..', '.env'),
    path.resolve(__dirname, '.env')
  ];
  for (const envPath of envPaths) {
    if (fsSync.existsSync(envPath)) {
      const content = fsSync.readFileSync(envPath, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const idx = trimmed.indexOf('=');
          const key = trimmed.slice(0, idx).trim();
          const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
  }
}

loadEnv();

// Gemini Structured Output Schema
const GEMINI_SCHEMA = {
  type: 'ARRAY',
  description: 'List of analyzed and classified Dutch companies',
  items: {
    type: 'OBJECT',
    properties: {
      id: { type: 'INTEGER', description: 'Original company ID' },
      name: { type: 'STRING', description: 'Official company name in lowercase' },
      kvk: { type: 'STRING', description: 'KvK registration number' },
      category: {
        type: 'STRING',
        description: 'Assigned category slug (must be one of: mi, eu, cgr, fre, hp, tt, ot)',
        enum: ['mi', 'eu', 'cgr', 'fre', 'hp', 'tt', 'ot']
      },
      description: {
        type: 'STRING',
        description: 'Concise summary of the company primary business activities and offerings in lowercase'
      },
      website: {
        type: 'STRING',
        description: 'Official company website URL only or "empty" if not found'
      },
      tags: {
        type: 'ARRAY',
        description: 'Up to three relevant keyword tags in lowercase',
        items: { type: 'STRING' }
      }
    },
    required: ['id', 'name', 'kvk', 'category', 'description', 'website', 'tags']
  }
};

/**
 * Call Gemini API with structured JSON output
 */
async function callGeminiBatch(companies, apiKey, model = 'gemini-3.8-flash', retries = 3) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const prompt = `
Analyze the following list of companies registered as recognised sponsors in the Netherlands.
For each company, identify:
1. "description": A concise, factual summary of its primary business activities, products, or services.
2. "category": Choose the MOST accurate category slug from:
   - "tt" (Technology and Telecommunications)
   - "hp" (Healthcare and Pharmaceuticals)
   - "fre" (Finance and Real Estate)
   - "cgr" (Consumer Goods and Retail)
   - "eu" (Energy and Utilities)
   - "mi" (Manufacturing and Industrials)
   - "ot" (Other)
3. "website": Official company website URL, or "empty" if unknown.
4. "tags": Exactly 2 to 3 concise relevant tags (keywords).

CRITICAL: Every string value in the output MUST be lowercase. Maintain the exact company id and kvk.

Companies to analyze:
${JSON.stringify(companies.map(c => ({ id: c.id, name: c.name, kvk: c.kvk })), null, 2)}
`;

  const payload = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: GEMINI_SCHEMA,
      temperature: 0.1
    }
  };

  let attempt = 0;
  while (attempt < retries) {
    attempt++;
    try {
      const response = await axios.post(url, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 60000
      });

      const candidate = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!candidate) {
        throw new Error('Gemini returned empty candidate part');
      }

      const parsed = JSON.parse(candidate);
      if (!Array.isArray(parsed)) {
        throw new Error('Gemini did not return an array');
      }

      // Sanitize and normalize items
      return parsed.map(item => ({
        id: item.id,
        name: String(item.name || '').toLowerCase().trim(),
        kvk: String(item.kvk || '').toLowerCase().trim(),
        category: VALID_SLUGS.has(item.category) ? item.category : 'ot',
        description: String(item.description || '').toLowerCase().trim(),
        website: String(item.website || 'empty').toLowerCase().trim(),
        tags: Array.isArray(item.tags)
          ? item.tags.slice(0, 3).map(t => String(t).toLowerCase().trim())
          : []
      }));
    } catch (err) {
      const status = err.response?.status;
      const errorMsg = err.response?.data?.error?.message || err.message;
      console.warn(`[Batch Warning] Attempt ${attempt}/${retries} failed (${errorMsg})`);

      if (attempt >= retries) {
        throw new Error(`Gemini API call failed after ${retries} attempts: ${errorMsg}`);
      }

      // Exponential backoff with jitter
      const delayMs = Math.pow(2, attempt) * 1500 + Math.random() * 1000;
      console.log(`Backing off for ${(delayMs / 1000).toFixed(1)}s before retry...`);
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
}

/**
 * Atomic file writer (prevents race conditions and corrupt files)
 */
async function atomicWriteJson(filePath, data) {
  const dir = path.dirname(filePath);
  const tmpPath = path.join(dir, `.${path.basename(filePath)}.tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  await fs.writeFile(tmpPath, JSON.stringify(data, null, 2), 'utf8');
  await fs.rename(tmpPath, filePath);
}

/**
 * Load existing output.json or initialize default category structures
 */
async function loadMasterOutput(outputFilePath) {
  try {
    const raw = await fs.readFile(outputFilePath, 'utf8');
    const existing = JSON.parse(raw);
    if (Array.isArray(existing) && existing.length > 0) {
      return existing;
    }
  } catch (err) {
    // initialize new structure
  }

  return CATEGORIES.map(cat => ({
    category: {
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      companies: []
    }
  }));
}

/**
 * Merge newly enriched companies into master categories
 */
function mergeIntoCategories(masterCategories, newCompanies) {
  const categoryMap = new Map();
  for (const group of masterCategories) {
    categoryMap.set(group.category.slug, group.category);
  }

  for (const company of newCompanies) {
    let cat = categoryMap.get(company.category);
    if (!cat) {
      cat = categoryMap.get('ot');
    }

    // Replace if existing kvk or append
    const existingIdx = cat.companies.findIndex(
      c => String(c.kvk).trim().toLowerCase() === String(company.kvk).trim().toLowerCase()
    );

    if (existingIdx >= 0) {
      cat.companies[existingIdx] = company;
    } else {
      cat.companies.push(company);
    }
  }

  return masterCategories;
}

/**
 * Main enrichment pipeline runner
 */
async function runPipeline(options = {}) {
  const apiKey = options.apiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('ERROR: GEMINI_API_KEY is not set.');
    console.error('Please export GEMINI_API_KEY=your_key or specify it in a .env file.');
    process.exit(1);
  }

  const batchSize = options.batchSize || 25;
  const model = options.model || process.env.GEMINI_MODEL || 'gemini-3.8-flash';
  const mode = options.all ? 'all' : 'delta';

  const outputFilePath = path.resolve(__dirname, 'output.json');
  const progressFilePath = path.resolve(__dirname, 'progress.json');
  const errorLogPath = path.resolve(__dirname, 'error_log.json');
  const inputFilePath = mode === 'all'
    ? path.resolve(__dirname, 'organizations.json')
    : path.resolve(__dirname, 'unprocessed_organizations.json');

  if (!fsSync.existsSync(inputFilePath)) {
    console.log(`Input file not found: ${inputFilePath}. Running scraper first...`);
    const { main: runScraper } = require('./scraper');
    await runScraper();
  }

  const rawInput = await fs.readFile(inputFilePath, 'utf8');
  let companies = JSON.parse(rawInput);

  if (options.limit && options.limit > 0) {
    companies = companies.slice(0, options.limit);
    console.log(`Running with limit: processing first ${companies.length} companies.`);
  }

  if (companies.length === 0) {
    console.log('No companies to enrich. output.json is completely up-to-date!');
    return;
  }

  console.log(`\n======================================================`);
  console.log(` Starting Gemini Data Enrichment`);
  console.log(` Target companies: ${companies.length}`);
  console.log(` Batch size: ${batchSize}`);
  console.log(` Model: ${model}`);
  console.log(` Output: ${outputFilePath}`);
  console.log(`======================================================\n`);

  const masterCategories = await loadMasterOutput(outputFilePath);

  // Chunk companies into batches
  const batches = [];
  for (let i = 0; i < companies.length; i += batchSize) {
    batches.push(companies.slice(i, i + batchSize));
  }

  let processedCount = 0;
  const errors = [];

  for (let b = 0; b < batches.length; b++) {
    const currentBatch = batches[b];
    const batchNum = b + 1;
    console.log(`Processing batch ${batchNum}/${batches.length} (${currentBatch.length} companies)...`);

    try {
      const enrichedBatch = await callGeminiBatch(currentBatch, apiKey, model);
      mergeIntoCategories(masterCategories, enrichedBatch);
      processedCount += enrichedBatch.length;

      // Atomic commit to disk after each batch
      await atomicWriteJson(outputFilePath, masterCategories);
      await atomicWriteJson(progressFilePath, {
        lastProcessedId: currentBatch[currentBatch.length - 1].id,
        processedCount,
        totalRemaining: companies.length - processedCount,
        updatedAt: new Date().toISOString()
      });

      console.log(`✔ Batch ${batchNum} saved. Total processed so far: ${processedCount}/${companies.length}`);
    } catch (err) {
      console.error(`✘ Batch ${batchNum} failed: ${err.message}`);
      errors.push({
        batch: batchNum,
        companies: currentBatch.map(c => ({ id: c.id, name: c.name, kvk: c.kvk })),
        error: err.message,
        timestamp: new Date().toISOString()
      });
      await atomicWriteJson(errorLogPath, errors);
    }

    // Brief inter-batch pause to respect API rate limits
    if (b < batches.length - 1) {
      await new Promise(r => setTimeout(r, 600));
    }
  }

  // Frontend sync if requested or default
  if (options.syncAssets !== false) {
    await syncToAssets(outputFilePath);
  }

  console.log(`\n======================================================`);
  console.log(` Enrichment complete! Successfully processed: ${processedCount}`);
  if (errors.length > 0) {
    console.log(` Warnings/Errors logged: ${errors.length} batches failed. See error_log.json`);
  }
  console.log(`======================================================\n`);
}

/**
 * Sync output.json to frontend assets folder
 */
async function syncToAssets(outputFilePath) {
  const assetsDir = path.resolve(__dirname, '..', 'src', 'assets');
  const sponsorsJsonPath = path.join(assetsDir, 'sponsors.json');

  // Also format today's date DD-MM-YYYY
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  const datedFilename = `${dd}-${mm}-${yyyy}.json`;
  const datedPath = path.join(assetsDir, datedFilename);

  const raw = await fs.readFile(outputFilePath, 'utf8');
  await atomicWriteJson(sponsorsJsonPath, JSON.parse(raw));
  await atomicWriteJson(datedPath, JSON.parse(raw));

  console.log(`Synced data to frontend assets:`);
  console.log(`  - ${sponsorsJsonPath}`);
  console.log(`  - ${datedPath}`);
}

// CLI Argument Parsing
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--key' && args[i + 1]) {
      options.apiKey = args[++i];
    } else if (args[i] === '--all') {
      options.all = true;
    } else if (args[i] === '--delta') {
      options.all = false;
    } else if (args[i] === '--limit' && args[i + 1]) {
      options.limit = parseInt(args[++i], 10);
    } else if (args[i] === '--batch-size' && args[i + 1]) {
      options.batchSize = parseInt(args[++i], 10);
    } else if (args[i] === '--model' && args[i + 1]) {
      options.model = args[++i];
    } else if (args[i] === '--no-sync') {
      options.syncAssets = false;
    }
  }

  return options;
}

if (require.main === module) {
  runPipeline(parseArgs()).catch(err => {
    console.error('Fatal pipeline error:', err);
    process.exit(1);
  });
}

module.exports = { runPipeline, callGeminiBatch, syncToAssets, loadMasterOutput, mergeIntoCategories };

