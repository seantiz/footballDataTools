import asyncio
import aiohttp
from bs4 import BeautifulSoup
import csv
import os
from datetime import datetime

base_url = "https://www.worldfootball.net"
league_name = "eng-premier-league"

# Get the current year
current_year = datetime.now().year

async def fetch(session, url):
    async with session.get(url) as response:
        return await response.text()

async def process_team_season(session, team_name, season_start, season_end):
    url = f"{base_url}/team_performance/{team_name}/{league_name}-{season_start}-{season_end}/"

    html = await fetch(session, url)
    
    soup = BeautifulSoup(html, 'html.parser')
    
    # Extract player data
    players = []
    player_rows = soup.select("table.standard_tabelle tr")
    for row in player_rows[1:]:  # Skip header row
        cells = row.select("td")
        if len(cells) == 10:  # Ensure we have all expected columns
            name = cells[0].select_a[0].text.strip()
            minutes = cells[1].text.strip()
            appearances = cells[2].text.strip()
            starting = cells[3].text.strip()
            subs_in = cells[4].text.strip()
            subs_out = cells[5].text.strip()
            goals = cells[6].text.strip()
            yellow_cards = cells[7].text.strip()
            second_yellow = cells[8].text.strip()
            red_cards = cells[9].text.strip()
            
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


async def main():
    team_name = input("Enter the team name (e.g., 'arsenal-fc'): ").strip()
    
    async with aiohttp.ClientSession() as session:
        tasks = []
        for season_start in range(1992, current_year):
            season_end = season_start + 1
            task = asyncio.ensure_future(process_team_season(session, team_name, season_start, season_end))
            tasks.append(task)
        await asyncio.gather(*tasks)

if __name__ == "__main__":
    asyncio.run(main())
