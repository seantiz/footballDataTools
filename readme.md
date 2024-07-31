# How Far Will You Go to Settle Football Debates?

These are some quick command-line tools I built to help me not die of old age when fetching, sorting and storing Premier League football data. The two main types of data I wanted to store were:

1. Historical transfer data (from Transfermarkt)
2. Historical squad data like minutes played, appearances etc. (from worldfootball)

## 1. HTML-to-JSON Transfer Data App

`transferparse` (in the `transferm` folder) is the CLI app for converting a transfermarkt HTML file to a clean JSON object, with nested branches for transfersIn, transfersOut, and net transfer spend for every season.

You'll need a saved HTML file beforehand for this app to be of any use. That part's up to you.

### How to Run

I suggest using `ts-node` if you don't have it installed already:

```
npm install ts-node
```

then:

```
cd transferm
ts-node transferparse
```

## 2. HTML-to-CSV Team and Manager Data Apps

These are more automated tools to save even more time, but they were specifically made with the English Premier League years in mind. 

They're written in Python, because the `aiohttp` and `BeautifulSoup` libraries automatically handle HTML in a smoother way than anything I could find in Typescript/Javascript.

### How to Run

I'd suggest running any of these Python apps in a virtual environment (and you'll definitely need one if you don't have the external libraries already installed):

```
python -m venv venv
```

then

```
source venv/bin/activate
```

then you're free to install the library dependencies and run the apps. I used Python version 3

```
pip3 install aiohttp
pip3 install BeautifulSoup

# Example run commands

python3 wfmanagerdata.py
python3 worldfootballmain.py
```
All apps fetch from worldfootball dot net, no need to manually enter an HTML file from your local drive.

NOTE:  If you want to store data outside of the Premier League years, just as an example, you can change how `process_all_seasons()` iterates through the `seasons` by changing the `season_start range` to anything further back than `1992`. 

---
### Manager Data

`wfmanagerdata` (in the `worldfootball` folder) will ask you a team name, and it will
 save manager data for the all seasons of that team in a clean CSV file. That's it. 

`wfmanagerselect` goes one step further by asking you a team name and the specific seasons you want to fetch and save. Select any season by the year in which that season began (e.g. enter 1994 if you want to select the 1994-1995 season, or 2022 if you want to select the 2022-2023 season)

### Squad Data

`worldfootballauto`, `worldfootballmanual` and `worldfootballmain` are three apps for fetching and saving historical squad data into a clean CSV file. 

I suggest using `worldfootballmain` as it handles pretty much does most of the legwork you could ever need doing, including:

1. Use `help` and type the first letter of the team you want to fetch, the app will give you the url-friendly name of that team for on worldfootball.
2. The app batch-processes up to 5 seasons at a time
3. The app can processes more than one team with every run. Enter multiple team names if you like.

`worldfootballauto` works very similarly, just without the url-friendly help of `main`, no batch-processing and only one team name at a time. There's no input validation here, so if you type in anything (absolutely anything) for a team name, it will automatically create 31+ folders of empty data for that given name - so just be careful with your typos.

Like `main` it will automatically fetch, sort and save all seasons in the Premier League years (1992-2024 at time of writing) without asking you for a specific season.

`worldfootballmanual` is for when you want to process just a single season at a time. It's the least request-intensive of the three. 

In any case, there's an artificial delay (of 2 seconds) between requests in all three apps to keep the request amount reasonable.

## 3. Other Apps

In the root folder, `rawTextStandingsParser` is a Typescript app for when I was literally copying raw numbers off the world wide web and saving them into a text file. It will take that text file and give you a CSV in return. 

`matchPlayerToTeamSeason` is a half-finished use case that you can completely ignore. It makes use of the [Kaggle Data from dcaribou's transfermarkt datasets](https://www.kaggle.com/datasets/davidcariboo/player-scores)

## Happy Hunting

That's it! Have fun.

If there are any questions, anything unclear or any errors then feel free to get in touch.