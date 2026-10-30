const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const path = require('path');

const URLS = [
  'https://ind.nl/en/public-register-recognised-sponsors/public-register-work',
  'https://ind.nl/en/public-register-recognised-sponsors/public-register-regular-labour-and-highly-skilled-migrants'
];

async function fetchData(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      timeout: 30000
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching data from ${url}:`, error.message);
    return null;
  }
}

async function scrapeWebsite() {
  let html = null;
  for (const url of URLS) {
    console.log(`Attempting to scrape: ${url}`);
    html = await fetchData(url);
    if (html) break;
  }

  if (!html) {
    throw new Error('Failed to retrieve HTML from all candidate IND URLs');
  }

  const $ = cheerio.load(html);
  const organizations = [];
  const seenKvks = new Set();

  $('table tbody tr').each((index, element) => {
    const rawName = $(element).find('th').text().trim();
    const kvk = $(element).find('td').text().trim();

    // Clean up quotes or excessive whitespace
    const name = rawName.replace(/^"+|"+$/g, '').trim();

    if (name && kvk) {
      // Keep track of primary key
      const id = organizations.length + 1;
      organizations.push({ id, name, kvk });
      seenKvks.add(kvk);
    }
  });

  return organizations;
}

async function computeDelta(scrapedOrganizations) {
  const outputFilePath = path.join(__dirname, 'output.json');
  const existingKvks = new Set();

  try {
    const raw = await fs.readFile(outputFilePath, 'utf8');
    const categories = JSON.parse(raw);
    for (const cat of categories) {
      if (cat.category && Array.isArray(cat.category.companies)) {
        for (const company of cat.category.companies) {
          if (company.kvk) {
            existingKvks.add(String(company.kvk).trim().toLowerCase());
          }
        }
      }
    }
  } catch (err) {
    console.log('No existing output.json found or failed to parse. Delta will equal all organizations.');
  }

  const unprocessed = scrapedOrganizations.filter(
    org => !existingKvks.has(String(org.kvk).trim().toLowerCase())
  );

  return { existingCount: existingKvks.size, unprocessed };
}

async function main() {
  try {
    const organizations = await scrapeWebsite();
    console.log(`Successfully scraped ${organizations.length} organizations from IND.`);

    const orgFilePath = path.join(__dirname, 'organizations.json');
    const orgTmpPath = `${orgFilePath}.tmp`;
    await fs.writeFile(orgTmpPath, JSON.stringify(organizations, null, 2), 'utf8');
    await fs.rename(orgTmpPath, orgFilePath);
    console.log(`Saved organizations to ${orgFilePath}`);

    const { existingCount, unprocessed } = await computeDelta(organizations);
    console.log(`Existing companies in output.json: ${existingCount}`);
    console.log(`Unprocessed / newly found delta companies: ${unprocessed.length}`);

    const deltaFilePath = path.join(__dirname, 'unprocessed_organizations.json');
    const deltaTmpPath = `${deltaFilePath}.tmp`;
    await fs.writeFile(deltaTmpPath, JSON.stringify(unprocessed, null, 2), 'utf8');
    await fs.rename(deltaTmpPath, deltaFilePath);
    console.log(`Saved delta list to ${deltaFilePath}`);

    return { total: organizations.length, deltaCount: unprocessed.length };
  } catch (err) {
    console.error('Scraping error:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { scrapeWebsite, computeDelta, main };
