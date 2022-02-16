# Valorant Match Analyzer Sheets

This is a lightweight valorant match data analyzer.

The intended purpose is to understand whether or not your queue was stacked against you based on one metric: your average team winrate across all players versus the enemy average team winrate across all players. It currently only supports overall winrate, and not act winrate since the data from Tracker.gg is not lending itself to understand current act data through the API.

The way to use this is:

- Play a competitive valorant match
- Go to the Google sheet and pull the data for that match right away (this script only pulls data for your last match)

The data needs to be pulled right away to ensure that you aren't getting skewed average win rate data. You want the win rates of all teammates and enemies immediately after your game has concluded.

# Usage

- In order to use this, you'll need to clone the following Google sheet into your personal drive:

https://docs.google.com/spreadsheets/d/1Qi7JTkGv01WvvGa_dr-zYwMWd2pv8o8vxrD9uFpTF9I/edit?usp=sharing

- Once you've made your own copy, take the code in this repository from `Code.gs` and copy it to your clipboard.

- Go to your Google sheet from above and enter your Riot ID into the top left cell where it says YOUR-RIOT-ID (for example person#NA1)

- Now in the sheet, click on "Extensions" -> "Apps Script" in the top menu bar

- When the new window/editor comes up, delete all code currently in there and paste the code you copied to your clipboard above and save it

- Change the selected function at the top with the dropdown to "fetchLatestMatch"

- Click on the "Run" button at the top of the code editor

- Go through the various steps to give the app the permissions it asks for and it should run

- Wait about 5-15 seconds for data from your last match to populate

If all is working as expected, it should populate a new row of data.

--- 

Once you've completed these steps, a new menu item should show up in your sheet. Whenever you want to pull new match data after a match, just do the following:

- In the top menu bar of Google Sheets, Click "Valorant Matches (Competitive)" -> "Add Latest Match Data"
