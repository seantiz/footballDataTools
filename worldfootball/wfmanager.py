import asyncio
import aiohttp
from bs4 import BeautifulSoup
import csv
import os
from datetime import datetime

base_url = "https://www.worldfootball.net"

async def fetch(session, url):
    async with session.get(url) as response:
        return await response.text()

def parse_date(date_str):
    return datetime.strptime(date_str, "%d/%m/%Y")

async def process_team_managers(session, team_name):
    url = f"{base_url}/teams/{team_name}/9/"

    html = await fetch(session, url)
    
    soup = BeautifulSoup(html, 'html.parser')
    
    # Extract manager data
    managers = []
    manager_rows = soup.select("table.standard_tabelle tr")
    for row in manager_rows[1:]:  # Skip header row
        cells = row.select("td")
        if len(cells) == 4:
            period = cells[0].text.strip()
            name = cells[1].select_one("a").text.strip() if cells[1].select_one("a") else cells[1].text.strip()
            country = cells[2].select_one("img")["title"] if cells[2].select_one("img") else ""
            born = cells[3].text.strip()
            
            start_date, end_date = period.split(" - ")
            start_date = parse_date(start_date)
            end_date = parse_date(end_date) if end_date != "present" else datetime.now()
            
            managers.append({
                "Name": name,
                "Country": country,
                "Born": born,
                "StartDate": start_date,
                "EndDate": end_date
            })
    
    return managers

def get_manager_for_season(managers, season_start, season_end):
    season_start_date = datetime(season_start, 7, 1)
    season_end_date = datetime(season_end, 6, 30)
    
    for manager in managers:
        if manager["StartDate"] <= season_end_date and manager["EndDate"] >= season_start_date:
            return manager
    
    return None

async def process_all_seasons(session, team_name, managers):
    for season_start in range(1992, 2024):
        season_end = season_start + 1
        manager = get_manager_for_season(managers, season_start, season_end)
        
        if manager:
            # Ensure directory exists
            os.makedirs(f"data/{team_name}/season/{season_start}-{season_end}/manager", exist_ok=True)
            
            # Write to CSV
            fieldnames = ["Name", "Country", "Born"]
            with open(f"data/{team_name}/season/{season_start}-{season_end}/manager/info.csv", 'w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerow({
                    "Name": manager["Name"],
                    "Country": manager["Country"],
                    "Born": manager["Born"]
                })
            
            print(f"Saved manager data for {team_name} season {season_start}-{season_end}")
        else:
            print(f"No manager found for {team_name} season {season_start}-{season_end}")
        
        await asyncio.sleep(2)  # 2-second delay between each season processing

async def main():
    async with aiohttp.ClientSession() as session:
        while True:
            team_name = input("Enter the team name (e.g., 'arsenal-fc') or 'quit': ").strip().lower()
            if team_name == 'quit':
                print("App closed. See you next time!")
                break

            try:
                managers = await process_team_managers(session, team_name)
                await process_all_seasons(session, team_name, managers)
                print(f"Completed fetching all seasons for {team_name}")
            except Exception as e:
                print(f"An error occurred: {str(e)}")

            print("\n")  # Add a newline for better readability between iterations

if __name__ == "__main__":
    asyncio.run(main())
