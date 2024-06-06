const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

// Define the categories
const categories = [
  { "slug": "mi", "name": "Manufacturing and Industrials" },
  { "slug": "eu", "name": "Energy and Utilities" },
  { "slug": "cgr", "name": "Consumer Goods and Retail" },
  { "slug": "fre", "name": "Finance and Real Estate" },
  { "slug": "hp", "name": "Healthcare and Pharmaceuticals" },
  { "slug": "tt", "name": "Technology and Telecommunications" },
  { "slug": "ot", "name": "Other" }
];

// Function to clean up category
function cleanCategory(rawCategory) {
  const cleaned = categories.find(cat => rawCategory.includes(cat.slug));
  return cleaned ? cleaned.slug : "ot";
}

// Function to read the input JSON file
async function readInputFile(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading input file:', error);
    return [];
  }
}

// Function to append data to the output JSON file
async function appendToOutputFile(filePath, data) {
  let fileData;
  try {
    fileData = await fs.readFile(filePath, 'utf8');
  } catch (error) {
    // If file doesn't exist, initialize with an empty array
    fileData = '[]';
  }

  let jsonArray = JSON.parse(fileData);

  // Find or create the category section
  let categorySection = jsonArray.find(section => section.category.slug === data.category);

  if (!categorySection) {
    const categoryInfo = categories.find(cat => cat.slug === data.category);
    categorySection = {
      category: {
        name: categoryInfo.name,
        slug: categoryInfo.slug,
        companies: []
      }
    };
    jsonArray.push(categorySection);
  }

  // Append the new company data
  categorySection.category.companies.push(data);

  // Write the updated array back to the file
  try {
    await fs.writeFile(filePath, JSON.stringify(jsonArray, null, 2));
  } catch (error) {
    console.error('Error writing to output file:', error);
  }
}

// Function to make API call to Ollama
async function fetchCompanyInfo(company) {
  const prompt = `
  Analyze the following company from the Netherlands and provide information based on your knowledge specific to the various sections:
  
  **Company Name:** ${company.name}
  
  **Instructions:**
  
  1. **Description:** Concisely summarize the company's primary business activities and the products or services it offers. Be specific and avoid generic terms.
  2. **Category:** Categorize the company into ONE of the following sectors, choosing the most accurate fit:
  
      * if Technology and Telecommunications, say "tt"
      * if Healthcare and Pharmaceuticals, say "hp"
      * if Finance and Real Estate, say "fre"
      * if Consumer Goods and Retail, say "cgr"
      * if Energy and Utilities, say "eu"
      * if Manufacturing and Industrials, say "mi"
      * if None of the above, say "ot"
  
  3. **Website:** Provide the company's official website URL. If no website is found, respond with "empty".
  4. **Tags:** List up to THREE relevant tags (keywords) that best describe the company's focus, industry, or target market. 
  
  **Response Format:**
  
  Please structure your response in the following JSON format (only select the text in the brackets regarding the category):
  
  {
      "description": "",
      "category": "",
      "website": "",
      "tags": [] 
  }
  `;

  const payload = {
    model: 'llama3',
    prompt: prompt,
    format: 'json',
    stream: false,
  };

  try {
    const response = await axios.post('http://localhost:11434/api/generate', payload);
    let parsedResponse = JSON.parse(response.data.response);

    // Clean up category
    parsedResponse.category = cleanCategory(parsedResponse.category);

    parsedResponse.id = company.id;
    parsedResponse.name = company.name;
    parsedResponse.kvk = company.kvk;

    console.log('Final output, ' + parsedResponse.name + ' ' + parsedResponse.id)

    return parsedResponse;
  } catch (error) {
    console.error('Error fetching data from API:', error);
    return null;
  }
}

// Main function to read input, make API calls, and write output
async function main() {
  const inputFilePath = path.resolve(__dirname, 'organizations.json');
  const outputFilePath = path.resolve(__dirname, 'output.json');

  // Read input file
  const companies = await readInputFile(inputFilePath);
  if (companies.length === 0) {
    console.log('No companies to process.');
    return;
  }

  for (const company of companies) {
    // Fetch company info from API
    const companyInfo = await fetchCompanyInfo(company);
    if (companyInfo) {
      // Append to output file
      await appendToOutputFile(outputFilePath, companyInfo);
    }
  }

  console.log('Processing complete.');
}

// Run the main function
main();
