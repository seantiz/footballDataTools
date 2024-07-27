import * as fs from 'fs';

function formatStandings(filePath: string): string {
    const rawStandings = fs.readFileSync(filePath, 'utf8');
    const lines = rawStandings.split('\n');
    let formattedStandings = '';
    let currentPosition = 1;
    let teamData: string[] = [];
    let currentSeason = '';

    for (let line of lines) {
        line = line.trim();
        if (line === '') continue;

        if (line.match(/^\d{4}-\d{4}$/)) {
            // This is a season header
            currentSeason = line;
            currentPosition = 1;
            formattedStandings += currentSeason + '\n';
            continue;
        }

        if (line.match(/^\d+$/)) {
            // This is a position number, skip it
            continue;
        }

        if (teamData.length === 0) {
            // This is a team name
            teamData.push(currentPosition.toString());
            teamData.push(line);
        } else {
            // This is the team's statistics
            teamData = teamData.concat(line.split('\t'));
            formattedStandings += teamData.join(',') + '\n';
            teamData = [];
            currentPosition++;
        }
    }

    return formattedStandings.trim();
}

// Usage
const formattedData = formatStandings('raw_standings.txt');
fs.writeFileSync('standings.csv', formattedData);

console.log('Formatting complete. Check formatted_standings.csv');
