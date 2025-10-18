# Dutch

I call it Dutch, for lack of a better name. This application uses data from the [Public Register Regular Labour and Highly Skilled Migrants](https://ind.nl/en/public-register-recognised-sponsors/public-register-regular-labour-and-highly-skilled-migrants), and presents the list of companies under categories, and searchable.

Maybe should be called PRRLHSM.

The application has no backend. It's an Angular 18+ SPA.

See the live application running at [dutch.khophi.com](dutch.khophi.com)

![wide](https://github.com/seanmavley/dutch/assets/5289083/2bd7aba1-c321-4b46-8fc8-1cddc084558a)

## To-Do

- Automate the update, to only include the new organization names added

## How to run the Angular application locally

- Clone this repository and change directory to the project folder
- Run `bun install`
- Run `ng serve`

## How to contribute

Send a PR (follow the steps below if you wanna send an updated `output.json` file), or add an issue. 

## How to generate new org file

The `orgs-*.json` file that's loaded and used within the application is generated using the scripts found in the `scripts` folder.

### `ollama.js` JavaScript file

> The response below is from [Gemini Advanced](https://gemini.google.com/app/bed0e1e840e48878). Read the full response at [Company Data Enrichment](https://g.co/gemini/share/53aa701b94b3)

The JavaScript script is designed to:

1. Read: Take a JSON file (`organizations.json`) containing company data (names, IDs, etc.).
2. Analyze: Use an AI model ([Ollama](https://ollama.ai/) running locally) to enrich each company's data. The AI provides a description, categorizes the company into a specific sector, finds its website, and suggests relevant tags. Learn more about how to set up your [local Ollama](https://ollama.ai/) running service on their official website
3. Structure: Organize the enriched company information into a well-structured JSON format (`output.json`). Companies are grouped by their sector.
4. Handle Errors: Log any errors that occur during the process to a separate file (`error_log.json`).

### `scraper.js` JavaScript file

> The response below is from [Gemini Advanced](https://g.co/gemini/share/ebd7454a1332). Read the full response at [Web Scraper for Organization](https://g.co/gemini/share/ebd7454a1332)

This script is a web scraper designed to extract specific data from the website [Public Register Regular Labour and Highly Skilled Migrants](https://ind.nl/en/public-register-recognised-sponsors/public-register-regular-labour-and-highly-skilled-migrants). 

It uses the following libraries:

* axios: Fetches the HTML content of the webpage.
* cheerio: Parses the HTML to locate and extract the desired information.
* fs (File System): Saves the extracted data into a JSON file.
