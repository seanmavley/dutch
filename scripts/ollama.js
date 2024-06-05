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
Below is a name of a company in Netherlands. You are to answer the following questions about the company, and return the answer according to the structure provided at the end. \n

Company name: ${company.name}

Questions: 
1. What does the company do? 
2. Which of these categories does the company fall under accurately? Choose *only* ONE from these options: Technology and Telecommunications, Healthcare and Pharmaceuticals, Finance and Real Estate, Consumer Goods and Retail, Energy and Utilities, or Manufacturing and Industrials
3. What is the company's website? If no website is found, return "empty"
4. What other tags would you use to describe this company? List at most 3 tags.

Respond in a structure like this and fill in the blanks with your answers: \n

{
  "description": "",
  "category": "",
  "website": "",
  "tags": ""
}`;

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

    console.log('Final output, ' + parsedResponse)

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
