import asyncio
import aiohttp
from bs4 import BeautifulSoup
import csv
import os

base_url = "https://www.worldfootball.net"
league_name = "eng-premier-league"

# Predefined list of common teams and their URL-friendly names
TEAM_SUGGESTIONS = {
    "arsenal": "arsenal-fc",
    "aston villa" : "aston-villa",
    "barnsley": "barnsley-fc",
    "birmingham city" : "birmingham-city",
    "blackburn" : "blackburn-rovers",
    "bolton" : "bolton-wanderers",
    "bournemouth": "afc-bournemouth",
    "bradford" : "bradford-city",
    "brentford" : "brentford-fc",
    "brighton" : "brighton-hove-albion",
    "burnley" : "burnley-fc",
    "cardiff" : "cardiff-city",
    "charlton" : "charlton-athletic",
    "chelsea" : "chelsea-fc",
    "coventry" : "coventry-city",
    "crystal palace" : "crystal-palace",
    "derby" : "derby-county",
    "everton" : "everton-fc",
    "fulham" : "fulham-fc",
    "huddersfield" : "huddersfield-town",
    "hull city" : "hull-city",
    "ipswich town" : "ipswich-town",
    "leeds" : "leeds-united",
    "leicester city" : "leicester-city",
    "liverpool" : "liverpool-fc",
    "luton town" : "luton-town",
    "manchester city" : "manchester-city",
    "manchester united": "manchester-united",
    "middlesbrough" : "middlesbrough-fc",
    "newcastle" : "newcastle-united",
    "norwich city" : "norwich-city",
    "nottingham forest" : "nottingham-forest",
    "oldham" : "oldham-athletic",
    "portsmouth" : "portsmouth-fc",
    "qpr" : "queens-park-rangers",
    "reading" : "reading-fc",
    "sheffield united" : "sheffield-united",
    "sheffield-wednesday" : "sheffield-wednesday",
    "southampton" : "southampton-fc",
    "stoke city" : "stoke-city",
    "sunderland" : "sunderland-afc",
    "swansea city" : "swansea-city",
    "swindon town" : "swindon-town",
    "tottenham" : "tottenham-hotspur",
    "watford" : "watford-fc",
    "west brom" : "west-bromwich-albion",
    "west ham" : "west-ham-united",
    "wigan" : "wigan-athletic",
    "wimbledon" : "wimbledon-fc",
    "wolves" : "wolverhampton-wanderers",
}

async def fetch(session, url):
    async with session.get(url) as response:
        return await response.text()

async def process_team_season(session, team_name, season_start, season_end):
    url = f"{base_url}/team_performance/{team_name}/{league_name}-{season_start}-{season_end}/"

    html = await fetch(session, url)
    
    soup = BeautifulSoup(html, 'html.parser')
    
    def convert_dash_to_zero(value):
        return "0" if value.strip() == "-" else value.strip()
    
    # Extract player data
    players = []
    player_rows = soup.select("table.standard_tabelle tr")
    for row in player_rows[1:]:  # Skip header row
        cells = row.select("td")
        if len(cells) == 10:  # Ensure we have all expected columns
            name = cells[0].select_one("a").text.strip() if cells[0].select_one("a") else cells[0].text.strip()
            minutes = convert_dash_to_zero(cells[1].text)
            appearances = convert_dash_to_zero(cells[2].text)
            starting = convert_dash_to_zero(cells[3].text)
            subs_in = convert_dash_to_zero(cells[4].text)
            subs_out = convert_dash_to_zero(cells[5].text)
            goals = convert_dash_to_zero(cells[6].text)
            yellow_cards = convert_dash_to_zero(cells[7].text)
            second_yellow = convert_dash_to_zero(cells[8].text)
            red_cards = convert_dash_to_zero(cells[9].text)
            
            players.append({
                "Name": name,
                "Minutes": minutes,
                "Appearances": appearances,
                "Starting": starting,
                "Substitutions In": subs_in,
                "Substitutions Out": subs_out,
                "Goals": goals,
                "Yellow Cards": yellow_cards,
                "Second Yellow Cards": second_yellow,
                "Red Cards": red_cards
            })
    
    # Ensure directory exists
    os.makedirs(f"data/{team_name}/season/{season_start}-{season_end}", exist_ok=True)
    
    # Write to CSV
    fieldnames = ["Name", "Minutes", "Appearances", "Starting", "Substitutions In", 
                  "Substitutions Out", "Goals", "Yellow Cards", "Second Yellow Cards", "Red Cards"]
    with open(f"data/{team_name}/season/{season_start}-{season_end}/squad.csv", 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(players)

    print(f"Saved data for {team_name} season {season_start}-{season_end}")

def get_team_suggestions(letter):
    return {k: v for k, v in TEAM_SUGGESTIONS.items() if k.startswith(letter)}

async def process_team(session, team_name):
    tasks = []
    for season_start in range(1992, 2024):
        season_end = season_start + 1
        task = asyncio.create_task(process_team_season(session, team_name, season_start, season_end))
        tasks.append(task)
        if len(tasks) >= 5: # Concurrency setting
            await asyncio.gather(*tasks)
            tasks = []
            await asyncio.sleep(3)
    
    if tasks:
        await asyncio.gather(*tasks)

async def main():
    async with aiohttp.ClientSession() as session:
        while True:
            print("Enter team name(s) (separated by comma, if multiple team names), 'help' for teamname help or 'quit': ")
            user_input = input().strip().lower()
            
            if user_input == 'quit':
                print("App closed. See you next time!")
                break
            
            if user_input == 'help':
                print("Enter the first letter of the team you want to find:")
                letter = input().strip().lower()
                if len(letter) == 1 and letter.isalpha():
                    suggestions = get_team_suggestions(letter)
                    if suggestions:
                        print("Team suggestions (URL-friendly names):")
                        for url_friendly_name in suggestions.values():
                            print(f"{url_friendly_name}")
                    else:
                        print(f"No team suggestions for '{letter}'")
                else:
                    print("Please enter a single letter.")
                continue

            team_names = [name.strip() for name in user_input.split(',')]
            for team in team_names:
                try:
                    team_name = TEAM_SUGGESTIONS.get(team, team)
                    await process_team(session, team_name)
                    print(f"Completed fetching all seasons for {team_name}")
                except Exception as e:
                    print(f"An error occurred for {team}: {str(e)}")

            print("\n")  # Add a newline for better readability between iterations

if __name__ == "__main__":
    asyncio.run(main())