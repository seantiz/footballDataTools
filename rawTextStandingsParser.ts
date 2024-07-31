import * as fs from 'fs';

function formatStandings(filePath: string): string {
    const rawStandings = fs.readFileSync(filePath, 'utf8');
    const lines = rawStandings.split('\n');
    let csvStandings = '';
    let currentPosition = 1;
    let teamData: string[] = [];
    let currentSeason = '';

    for (let line of lines) {
        line = line.trim();
        if (line === '') continue;

        if (line.match(/^\d{4}-\d{4}$/)) {
          
            // Find the season header to divide season standings

            currentSeason = line;
            currentPosition = 1;
            csvStandings += currentSeason + '\n';
            continue;
        }

        if (line.match(/^\d+$/)) {
            
            // Skip each line with a table position number
            continue;
        }

        if (teamData.length === 0) {
            // This is a team name
            teamData.push(currentPosition.toString());
            teamData.push(line);
        } else {
            // This is the team's statistics
            teamData = teamData.concat(line.split('\t'));
            csvStandings += teamData.join(',') + '\n';
            teamData = [];
            currentPosition++;
        }
    }

    return csvStandings.trim();
}

const formattedCsv = formatStandings('./static/raw_standings.txt');
fs.writeFileSync('standings.csv', formattedCsv);

console.log('Formatting complete. Check standings.csv');
