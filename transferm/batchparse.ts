import * as fs from 'fs';
import * as path from 'path';
import { extractTransfers, filterDataFrom1992 } from './transferparse';

const inputDir = '../html'; 
const outputDir = './associationera'; 
const pleraDir = './plera'; 

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}
if (!fs.existsSync(pleraDir)) {
  fs.mkdirSync(pleraDir);
}

fs.readdirSync(inputDir).forEach((file) => {
  if (path.extname(file).toLowerCase() === '.html') {
    const inputPath = path.join(inputDir, file);
    
    let baseName = path.parse(file).name.replace('transfers', '');
    
    const outputPath = path.join(outputDir, `${baseName}.json`);
    const pleraPath = path.join(pleraDir, `${baseName}.json`);

    try {
      const html = fs.readFileSync(inputPath, 'utf-8');
      const transfers = extractTransfers(html);

      const sortedTransfers = Object.entries(transfers)
        .sort(([a], [b]) => a.localeCompare(b))
        .reduce((acc, [season, data]) => ({ ...acc, [season]: data }), {});


      fs.writeFileSync(outputPath, JSON.stringify(sortedTransfers, null, 2));
      console.log(`Saved to ${outputPath}`);

      const filteredData = filterDataFrom1992(sortedTransfers);
      fs.writeFileSync(pleraPath, JSON.stringify(filteredData, null, 2));
      console.log(`Filtered data saved to ${pleraPath}`);
    } catch (error) {
      console.error(`Error processing ${file}: ${error}`);
    }
  }
});

console.log('Batch processing complete!');
