import { parse } from 'csv-parse';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

interface Club {
  club_id: string;
  name: string;
}

interface Game {
  game_id: string;
  competition_id: string;
  season: string;
  round: string;
  date: string;
  home_club_id: string;
  away_club_id: string;
  home_club_goals: string;
  away_club_goals: string;
  home_club_name: string;
  away_club_name: string;
}

const PREMIER_LEAGUE_ID = 'GB1';

function readCsv(filePath: string): Promise<string[][]> {
  return new Promise((resolve, reject) => {
    const results: string[][] = [];
    fs.createReadStream(filePath)
      .pipe(parse())
      .on('data', (data: string[]) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
}

async function loadData(): Promise<{ clubs: Club[], games: Game[] }> {
    const baseDir = './kagglefoot/';
    const clubsFilePath = path.join(baseDir, 'clubs.csv');
    const gamesFilePath = path.join(baseDir, 'games.csv');
  
    const clubsData = await readCsv(clubsFilePath);
    const gamesData = await readCsv(gamesFilePath);
  
    const clubs = parseClubs(clubsData);
    const games = parseGames(gamesData);
  
    return { clubs, games };
  }

  function parseClubs(csvData: string[][]): Club[] {
    const [headers, ...rows] = csvData;
    return rows.map(row => {
      const club: Club = {
        club_id: row[headers.indexOf('club_id')],
        name: row[headers.indexOf('name')]
      };
      return club;
    });
  }

  function parseGames(csvData: string[][]): Game[] {
    const [headers, ...rows] = csvData;
    return rows.map(row => {
      const game: Game = {
        game_id: row[headers.indexOf('game_id')],
        competition_id: row[headers.indexOf('competition_id')],
        season: row[headers.indexOf('season')],
        round: row[headers.indexOf('round')],
        date: row[headers.indexOf('date')],
        home_club_id: row[headers.indexOf('home_club_id')],
        away_club_id: row[headers.indexOf('away_club_id')],
        home_club_goals: row[headers.indexOf('home_club_goals')],
        away_club_goals: row[headers.indexOf('away_club_goals')],
        home_club_name: row[headers.indexOf('home_club_name')],
        away_club_name: row[headers.indexOf('away_club_name')]
      };
      return game;
    });
  }
  

function findClubByName(clubs: Club[], name: string): Club | undefined {
  return clubs.find(club => club.name.toLowerCase() === name.toLowerCase());
}

function getClubGames(club: Club, games: Game[]): Game[] {
    return games
      .filter(game => 
        (game.home_club_id === club.club_id || game.away_club_id === club.club_id) &&
        game.competition_id === PREMIER_LEAGUE_ID
      )
      .sort((a, b) => {
        // First, sort by season
        if (a.season !== b.season) {
          return parseInt(a.season) - parseInt(b.season);
        }
        // If seasons are the same, sort by date
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });
  }
  
  function printClubGames(club: Club, games: Game[]) {
    console.log(`Premier League games for ${club.name}:`);
    let currentSeason = '';
    games.forEach(game => {
      // Print season header if it's a new season
      if (game.season !== currentSeason) {
        console.log(`\nSeason ${game.season}:`);
        currentSeason = game.season;
      }
  
      const isHome = game.home_club_id === club.club_id;
      const opponent = isHome ? game.away_club_name : game.home_club_name;
      const score = `${game.home_club_goals}-${game.away_club_goals}`;
      const result = isHome 
        ? (game.home_club_goals > game.away_club_goals ? 'W' : (game.home_club_goals < game.away_club_goals ? 'L' : 'D'))
        : (game.away_club_goals > game.home_club_goals ? 'W' : (game.away_club_goals < game.home_club_goals ? 'L' : 'D'));
      
      // Format the date as YYYY-MM-DD
      const formattedDate = new Date(game.date).toISOString().split('T')[0];
      
      console.log(`${formattedDate}: ${isHome ? 'vs' : '@'} ${opponent} (${score}) - ${result}`);
    });
  }
  

async function main() {
  const data = await loadData();
  console.log('Data loaded successfully');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('Enter club name: ', (clubName) => {
    const club = findClubByName(data.clubs, clubName);
    
    if (!club) {
      console.log('Club not found');
      rl.close();
      return;
    }

    const clubGames = getClubGames(club, data.games);
    
    if (clubGames.length === 0) {
      console.log('No Premier League games found for this club');
    } else {
      printClubGames(club, clubGames);
    }

    rl.close();
  });
}

main().catch(error => console.error('Error:', error));
