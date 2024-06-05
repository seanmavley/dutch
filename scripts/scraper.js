const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

// Function to fetch data from the website
async function fetchData(url) {
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching data:', error);
    return null;
  }
}

// Function to scrape the website and extract organization names and KvK numbers
async function scrapeWebsite() {
  const url = 'https://ind.nl/en/public-register-recognised-sponsors/public-register-regular-labour-and-highly-skilled-migrants';
  const html = await fetchData(url);

  if (!html) {
    console.error('No HTML data fetched');
    return [];
  }

  const $ = cheerio.load(html);
  const organizations = [];

  // Find elements containing organization names and KvK numbers
  $('table tbody tr').each((index, element) => {
    const name = $(element).find('th[scope="row"]').text().trim();
    const kvk = $(element).find('td').text().trim();
    let primary_key = index + 1;

    // Debugging: Log extracted values
    console.log('Extracted name:', name);
    console.log('Extracted kvk:', kvk);

    // If both name and KvK are present, add them to the organizations array
    if (name && kvk) {
      organizations.push({ id: primary_key, name, kvk });
    }
  });

  return organizations;
}

// Call the scrapeWebsite function and save the result to a JSON file
scrapeWebsite().then((organizations) => {
  const jsonContent = JSON.stringify(organizations, null, 2);

  fs.writeFile('organizations.json', jsonContent, 'utf8', (err) => {
    if (err) {
      console.error('Error writing JSON file:', err);
    } else {
      console.log('JSON file has been saved.');
    }
  });
}).catch((error) => {
  console.error('Error scraping website:', error);
});
