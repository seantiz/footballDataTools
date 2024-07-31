import asyncio
import aiohttp
from bs4 import BeautifulSoup
import csv
import os

base_url = "https://www.worldfootball.net"
league_name = "eng-premier-league"

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


async def main():
    async with aiohttp.ClientSession() as session:
        while True:
            team_name = input("Enter the team name or 'quit': ").strip().lower()
            if team_name == 'quit':
                print("App closed. See you next time!")
                break

            try:
                season_start = int(input("Enter the season start year (e.g. 2022 for season 2022-2023): "))
                season_end = season_start + 1
                await process_team_season(session, team_name, season_start, season_end)
            except ValueError:
                print("Please enter a valid year (YYYY format).")
            except Exception as e:
                print(f"An error occurred: {str(e)}")

            print("\n")  # Add a newline for better readability between iterations

if __name__ == "__main__":
    asyncio.run(main())