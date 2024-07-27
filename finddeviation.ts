import * as fs from 'fs';

interface TeamSeason {
    season: string;
    team: string;
    points: number;
}

function readCSV(filePath: string): TeamSeason[] {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContent.split('\n');
    const seasons: TeamSeason[] = [];
    let currentSeason = '';

    for (const line of lines) {
        if (line.match(/^\d{4}-\d{4}$/)) {
            currentSeason = line.trim();
        } else if (line.includes(',')) {
            const [position, team, , , , , , , , points] = line.split(',');
            if (position !== 'Position' && !isNaN(Number(points))) {
                seasons.push({
                    season: currentSeason,
                    team: team,
                    points: Number(points)
                });
            }
        }
    }

    return seasons;
}

function identifyConsistentTeams(seasons: TeamSeason[], requiredSeasons: number): string[] {
    const teamAppearances = new Map<string, number>();

    for (const season of seasons) {
        teamAppearances.set(season.team, (teamAppearances.get(season.team) || 0) + 1);
    }

    return Array.from(teamAppearances.entries())
        .filter(([, appearances]) => appearances >= requiredSeasons)
        .map(([team]) => team);
}

function calculatePointChanges(seasons: TeamSeason[], consistentTeams: string[]): Map<string, number[]> {
    const pointChanges = new Map<string, number[]>();

    for (const team of consistentTeams) {
        const teamSeasons = seasons
            .filter(season => season.team === team)
            .sort((a, b) => a.season.localeCompare(b.season));

        const changes: number[] = [];
        for (let i = 1; i < teamSeasons.length; i++) {
            changes.push(teamSeasons[i].points - teamSeasons[i - 1].points);
        }

        pointChanges.set(team, changes);
    }

    return pointChanges;
}

function analyzeDistribution(pointChanges: Map<string, number[]>): { mean: number; standardDeviation: number } {
    const allChanges = Array.from(pointChanges.values()).flat();
    const mean = allChanges.reduce((sum, change) => sum + change, 0) / allChanges.length;
    const squaredDifferences = allChanges.map(change => Math.pow(change - mean, 2));
    const variance = squaredDifferences.reduce((sum, sqDiff) => sum + sqDiff, 0) / allChanges.length;
    const standardDeviation = Math.sqrt(variance);

    return { mean, standardDeviation };
}

function determineStandardDeviationMultiplier(distribution: { mean: number; standardDeviation: number }): number {
    const cv = Math.abs(distribution.standardDeviation / distribution.mean) * 100;
    
    if (cv > 1000) {
        return 2.5; // Very high variability, be more conservative
    } else if (cv > 500) {
        return 2.0; // High variability
    } else if (cv > 100) {
        return 1.5; // Moderate variability
    } else {
        return 1.0; // Low variability
    }
}


// Main execution
const filePath = 'standings.csv';
const seasons = readCSV(filePath);
const consistentTeams = identifyConsistentTeams(seasons, 30); // Teams present in at least 30 seasons
const pointChanges = calculatePointChanges(seasons, consistentTeams);
const distribution = analyzeDistribution(pointChanges);
const standardDeviationMultiplier = determineStandardDeviationMultiplier(distribution);

console.log('Consistent Teams:', consistentTeams);
console.log('Point Changes:', pointChanges);
console.log('Distribution:', distribution);
console.log('Standard Deviation Multiplier:', standardDeviationMultiplier);
