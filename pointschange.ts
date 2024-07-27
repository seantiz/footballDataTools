import * as fs from 'fs';
import * as readline from 'readline';

interface TeamStanding {
    position: number;
    name: string;
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDifference: number;
    points: number;
}

interface SeasonStandings {
    season: string;
    standings: TeamStanding[];
}

function readStandingsFromCSV(filePath: string): SeasonStandings[] {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContent.split('\n');

    const seasonStandings: { [key: string]: TeamStanding[] } = {};
    let currentSeason: string | null = null;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (line.match(/^\d{4}-\d{4}$/)) {
            // This is a season header
            currentSeason = line;
            i++; // Skip the next line (column headers)
            continue;
        }

        if (currentSeason && line) {
            const values = line.split(',');
            if (values.length === 10) {
                const teamStanding: TeamStanding = {
                    position: parseInt(values[0]),
                    name: values[1],
                    played: parseInt(values[2]),
                    won: parseInt(values[3]),
                    drawn: parseInt(values[4]),
                    lost: parseInt(values[5]),
                    goalsFor: parseInt(values[6]),
                    goalsAgainst: parseInt(values[7]),
                    goalDifference: parseInt(values[8]),
                    points: parseInt(values[9])
                };

                if (!seasonStandings[currentSeason]) {
                    seasonStandings[currentSeason] = [];
                }
                seasonStandings[currentSeason].push(teamStanding);
            }
        }
    }

    return Object.entries(seasonStandings).map(([season, standings]) => ({
        season,
        standings
    }));
}

interface PointChange {
    season: string;
    pointChange: number;
}


function findAllPointChanges(
    seasons: SeasonStandings[],
    teamName: string
): { season: string; points: number }[] | string {
    const pointsPerSeason: { season: string; points: number }[] = [];
    let teamFoundInAnySeason = false;

    for (const season of seasons) {
        const teamStanding = season.standings.find(s => s.name.toLowerCase() === teamName.toLowerCase());
        if (teamStanding) {
            teamFoundInAnySeason = true;
            pointsPerSeason.push({
                season: season.season,
                points: teamStanding.points
            });
        }
    }

    if (!teamFoundInAnySeason) {
        return `The team "${teamName}" doesn't exist in any of the provided seasons.`;
    }

    return pointsPerSeason;
}

function calculatePointChanges(pointsPerSeason: { season: string; points: number }[]): PointChange[] {
    const changes: PointChange[] = [];
    for (let i = 0; i < pointsPerSeason.length - 1; i++) {
        const currentSeason = pointsPerSeason[i];
        const nextSeason = pointsPerSeason[i + 1];
        const pointChange = currentSeason.points - nextSeason.points;
        changes.push({
            season: currentSeason.season,
            pointChange: pointChange
        });
    }
    return changes;
}


function calculateAverageAndStdDev(changes: number[]): { avg: number; stdDev: number } {
    const avg = changes.reduce((sum, change) => sum + change, 0) / changes.length;
    const variance = changes.reduce((sum, change) => sum + Math.pow(change - avg, 2), 0) / changes.length;
    const stdDev = Math.sqrt(variance);
    return { avg, stdDev };
}

function identifyNotableChanges(changes: PointChange[], threshold: number): PointChange[] {
    const allChanges = changes.map(c => c.pointChange);
    const { avg, stdDev } = calculateAverageAndStdDev(allChanges);
    
    return changes.filter(change => 
        Math.abs(change.pointChange - avg) > threshold * stdDev
    );
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
    });
      
    async function promptUser(question: string): Promise<string> {
        return new Promise((resolve) => {
          rl.question(question, (answer) => {
            resolve(answer.trim());
          });
        });
      }
    
    async function main() {
        const filePath = 'standings.csv';
        const seasons = readStandingsFromCSV(filePath);
    
        while (true) {
            console.log('\n--- Premier League Team Analysis ---');
            const teamName = await promptUser('Enter the team name (or type "quit" to exit): ');
    
            if (teamName.toLowerCase() === 'quit') {
                console.log('Thank you for using the application. Goodbye!');
                break;
            }
    
            const teamPoints = findAllPointChanges(seasons, teamName);
    
            if (typeof teamPoints === 'string') {
                console.log(teamPoints);
            } else {
                if (teamPoints.length === 0) {
                    console.log(`No data found for ${teamName} in any season.`);
                } else {
                    const pointChanges = calculatePointChanges(teamPoints);
                    const notableTeamChanges = identifyNotableChanges(pointChanges, 2.5);
    
                    console.log(`Point totals for ${teamName}:`, teamPoints);
                    console.log(`All point changes for ${teamName}:`, pointChanges);
                    console.log(`Notable ${teamName}-specific changes:`, notableTeamChanges);
                }
            }
    
            console.log('\n');
        }

  // Close the readline interface
  rl.close();
}

// Run the main function
main().catch(console.error);