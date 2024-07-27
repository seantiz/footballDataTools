import * as fs from 'fs';
import * as path from 'path';

interface TeamStanding {
    season: string;
    position: number;
    team: string;
    points: number;
}

function readCSV(filePath: string): TeamStanding[] {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContent.split('\n');
    
    const standings: TeamStanding[] = [];
    let currentSeason = '';

    for (const line of lines) {
        if (line.match(/^\d{4}-\d{4}$/)) {
            currentSeason = line.trim();
        } else if (line.startsWith('Position,Team,')) {
            continue; // Skip header
        } else {
            const [position, team, , , , , , , , points] = line.split(',');
            if (position && team && points) {
                standings.push({
                    season: currentSeason,
                    position: parseInt(position),
                    team: team,
                    points: parseInt(points)
                });
            }
        }
    }

    return standings;
}

function identifyTopFourChanges(standings: TeamStanding[]): void {
    const seasons = [...new Set(standings.map(s => s.season))].sort().reverse();
    const teamData: { [key: string]: { [key: string]: TeamStanding } } = {};

    for (const standing of standings) {
        if (!teamData[standing.team]) {
            teamData[standing.team] = {};
        }
        teamData[standing.team][standing.season] = standing;
    }

    for (let i = 1; i < seasons.length; i++) {
        const currentSeason = seasons[i-1];
        const previousSeason = seasons[i];

        for (const team in teamData) {
            const currentStanding = teamData[team][currentSeason];
            const previousStanding = teamData[team][previousSeason];

            if (currentStanding && previousStanding) {
                if ((previousStanding.position <= 4 && currentStanding.position > 4) || 
                    (previousStanding.position > 4 && currentStanding.position <= 4)) {
                    const pointsChange = currentStanding.points - previousStanding.points;
                    const direction = previousStanding.position <= 4 ? 'out of' : 'into';
                    
                    console.log(`${team} moved ${direction} the top 4 from ${previousSeason} to ${currentSeason}`);
                    console.log(`  Previous season: Position ${previousStanding.position}, Points ${previousStanding.points}`);
                    console.log(`  Current season: Position ${currentStanding.position}, Points ${currentStanding.points}`);
                    console.log(`  Points change: ${pointsChange > 0 ? '+' : ''}${pointsChange}`);
                    console.log('');
                }
            }
        }
    }
}

function topFourList(standings: TeamStanding[]): void {
    const seasons = [...new Set(standings.map(s => s.season))].sort().reverse();
    const teamData: { [key: string]: { [key: string]: TeamStanding } } = {};

    for (const standing of standings) {
        if (!teamData[standing.team]) {
            teamData[standing.team] = {};
        }
        teamData[standing.team][standing.season] = standing;
    }

    const teamsMovedIntoTopFour: string[] = [];

    for (let i = 1; i < seasons.length; i++) {
        const currentSeason = seasons[i-1];
        const previousSeason = seasons[i];

        for (const team in teamData) {
            const currentStanding = teamData[team][currentSeason];
            const previousStanding = teamData[team][previousSeason];

            if (currentStanding && previousStanding) {
                if (previousStanding.position > 4 && currentStanding.position <= 4) {
                    teamsMovedIntoTopFour.push(team);
                }
            }
        }
    }

    console.log("Teams that moved into the top 4:");
    console.log(teamsMovedIntoTopFour.join(', '));
}



const filePath = path.join(__dirname, 'standings.csv');
const standings = readCSV(filePath);
identifyTopFourChanges(standings);
topFourList(standings);
