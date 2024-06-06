const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

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
  try {
    const fileData = await fs.readFile(filePath, 'utf8');
    const jsonArray = JSON.parse(fileData);
    jsonArray.push(data);
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
