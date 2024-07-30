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
    
    managers = []
    manager_rows = soup.select("table.standard_tabelle tr")
    for row in manager_rows[1:]:
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

async def process_seasons(session, team_name, managers, start_season, end_season):
    for season_start in range(start_season, end_season + 1):
        season_end = season_start + 1
        manager = get_manager_for_season(managers, season_start, season_end)
        
        if manager:
            os.makedirs(f"data/{team_name}/season/{season_start}-{season_end}/manager", exist_ok=True)
            
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
        
        await asyncio.sleep(1)  # Reduced delay to 1 second

async def validate_team_name(session, team_name):
    url = f"{base_url}/teams/{team_name}/"
    try:
        html = await fetch(session, url)
        soup = BeautifulSoup(html, 'html.parser')
        return soup.title.string != "404 Not Found"
    except:
        return False

async def process_team(session, team_name, start_season, end_season):
    if await validate_team_name(session, team_name):
        managers = await process_team_managers(session, team_name)
        await process_seasons(session, team_name, managers, start_season, end_season)
        print(f"Completed fetching seasons from {start_season}-{start_season+1} to {end_season}-{end_season+1} for {team_name}")
    else:
        print(f"Invalid team name: {team_name}")

async def main():
    input_history = []
    
    async with aiohttp.ClientSession() as session:
        while True:
            print("\nEnter team names (comma-separated) or 'quit' to exit:")
            print("Type '!history' to view input history or '!<number>' to use a previous input.")
            
            user_input = input().strip().lower()
            
            if user_input == 'quit':
                print("Exiting the program. Goodbye!")
                break
            elif user_input == '!history':
                for i, entry in enumerate(input_history):
                    print(f"{i+1}. {entry}")
                continue
            elif user_input.startswith('!'):
                try:
                    index = int(user_input[1:]) - 1
                    user_input = input_history[index]
                except (ValueError, IndexError):
                    print("Invalid history index.")
                    continue
            
            if user_input not in input_history:
                input_history.append(user_input)
            
            team_names = [name.strip() for name in user_input.split(',')]
            
            try:
                start_season = int(input("Enter the start season year (e.g., 2002 for 2002-2003): "))
                end_season = int(input("Enter the end season year (e.g., 2023 for 2023-2024): "))
                
                if start_season > end_season:
                    raise ValueError("Start season cannot be later than end season.")
                
                tasks = [process_team(session, team_name, start_season, end_season) for team_name in team_names]
                await asyncio.gather(*tasks)
                
            except ValueError as ve:
                print(f"Invalid input: {str(ve)}")
            except Exception as e:
                print(f"An error occurred: {str(e)}")

if __name__ == "__main__":
    asyncio.run(main())
