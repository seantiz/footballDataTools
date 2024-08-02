import * as cheerio from 'cheerio';
import * as fs from 'fs';
import readline from 'readline';
import path from 'path';

interface Transfer {
  player: string;
  fromClub: string;
  toClub: string;
  transferSum: string;
}

interface SeasonTransfers {
  [season: string]: {
    arrivals: Transfer[];
    departures: Transfer[];
  };
}

function parseSeasonFromHeadline(headline: string): string {
  const match = headline.match(/(\d{2}\/\d{2}|\d{4}\/\d{2})$/);
  return match ? match[0] : '';
}

function parseTransfers($: cheerio.CheerioAPI, tableSelector: string): Transfer[] {
  const transfers: Transfer[] = [];

  $(tableSelector).find('tbody tr').each((_, element) => {
    const player = $(element).find('.hauptlink a').first().text().trim();
    const fromClub = $(element).find('td:nth-child(3)').text().trim();
    const toClub = $(element).find('td:nth-child(5)').text().trim(); // Changed to parse from HTML
    const transferSum = $(element).find('td:nth-child(4)').text().trim();

    transfers.push({ player, fromClub, toClub, transferSum });
  });

  return transfers;
}

function extractTransfers(html: string): SeasonTransfers {
  const $ = cheerio.load(html) as cheerio.CheerioAPI;
  const transfers: SeasonTransfers = {};

  $('.box').each((_, box) => {
    const headline = $(box).find('h2').text().trim();
    const unformattedSeason = parseSeasonFromHeadline(headline);
    const season = normalizeSeasonFormat(unformattedSeason);

    if (season === null) {
        return;
      }
  
    if (!transfers[season]) {
      transfers[season] = { arrivals: [], departures: [] };
    }

    const isArrival = headline.toLowerCase().includes('arrivals');
    const tableSelector = $(box).find('table') as unknown;
    const tableString : string = tableSelector as string

    if (isArrival) {
      transfers[season].arrivals = parseTransfers($, tableString);
    } else {
      transfers[season].departures = parseTransfers($, tableString);
    }
  });

  return transfers;
}

function normalizeSeasonFormat(season: string): string | null {

    // First check for any empty h2 headline classes in the original HTML
    season = season.trim();
    if (!season) {
    console.warn("Empty season encountered, skipping...");
    return null;
     }

    const currentYear = new Date().getFullYear();
    const currentCentury = Math.floor(currentYear / 100) * 100;
  
    // Handle YYYY-YYYY format
    if (/^\d{4}-\d{4}$/.test(season)) {
      return season;
    }
    
    // Handle YY/YY format
    else if (/^\d{2}\/\d{2}$/.test(season)) {
      let [startYear, endYear] = season.split('/').map(Number);
      
      // Determine the century for the start year
      let fullStartYear = startYear + currentCentury;
      if (fullStartYear > currentYear + 1) {
        fullStartYear -= 100;
      }
      
      // Determine the end year based on the start year
      let fullEndYear = endYear + Math.floor(fullStartYear / 100) * 100;
      if (fullEndYear < fullStartYear) {
        fullEndYear += 100;
      }
      
      return `${fullStartYear}-${fullEndYear}`;
    }
    
    // Handle YYYY/YY format
    else if (/^\d{4}\/\d{2}$/.test(season)) {
      const [startYear, endYear] = season.split('/');
      const fullEndYear = parseInt(startYear.slice(0, 2) + endYear);
      return `${startYear}-${fullEndYear}`;
    }
    
    // If the format is unrecognized, log a warning and return the original string
    else {
      console.warn(`Unrecognized season format: ${season}`);
      return season;
    }
}

function getUserInput(question: string): Promise<string> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  
    return new Promise((resolve) => {
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer);
      });
    });
  }

  function filterDataFrom1992(data: SeasonTransfers): SeasonTransfers {
    const filteredData: SeasonTransfers = {};
    let startFiltering = false;
  
    for (const [season, transfers] of Object.entries(data)) {
      if (season === '1992-1993' || startFiltering) {
        startFiltering = true;
        filteredData[season] = transfers;
      }
    }
  
    return filteredData;
  }

    
    async function main() {
      while (true) {
        const filePath = await getUserInput('What HTML file do you want to read? (type Q any time to quit): ');
        
        if (filePath.toLowerCase() === 'q') {
          console.log('Ok, see you next time!');
          break;
        }
    
        try {
          const html = fs.readFileSync(filePath, 'utf-8');
          const transfers = extractTransfers(html);
    
          // Sort 
          const sortedTransfers = Object.entries(transfers)
            .sort(([a], [b]) => a.localeCompare(b))
            .reduce((acc, [season, data]) => ({ ...acc, [season]: data }), {});
    
          const outputFile = await getUserInput('What should we save the file as? (Include .json in the filename):');

          // Write 
          fs.writeFileSync(outputFile, JSON.stringify(sortedTransfers, null, 2));
          console.log(`First parse saved to ${outputFile}!`);

          // Read the file back
      let jsonData = JSON.parse(fs.readFileSync(outputFile, 'utf-8'));

      // Remove the 2025-2026 season if it exists
      if ('2025-2026' in jsonData) {
        delete jsonData['2025-2026'];
        console.log('Removed 2025-2026 season from the data.');

        // Write the updated data back to the file
        fs.writeFileSync(outputFile, JSON.stringify(jsonData, null, 2));
        console.log(`Updated ${outputFile} with 2025-2026 season removed!`);

      } else {
        console.log('2025-2026 season not found in the data.');
      }

      // Filter data from 1992-1993 onwards and save to a new file
const filteredData = filterDataFrom1992(jsonData);
const pleraDir = path.join(process.cwd(), 'plera'); // Use current working directory
const pleraFilePath = path.join(pleraDir, path.basename(outputFile));

      fs.writeFileSync(pleraFilePath, JSON.stringify(filteredData, null, 2));
      console.log(`Filtered data from 1992-1993 onwards saved to ${pleraFilePath}`);

    } catch (error) {
      console.error('We ran into an error, the file may not have saved. Try again?');
    }

    console.log('\n');
  }}
    
    main().catch(console.error);