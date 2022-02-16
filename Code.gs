// Add our custom menu item
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Valorant Matches (Competitive)')
      .addItem('Add Latest Match Data','fetchLatestMatch')
      .addToUi();
}

// Fetches the latest competitive match and all relevant data from the Tracker.gg API
function fetchLatestMatch() {

  var riotId = getRiotId();

  if (riotId == "" || riotId == null || riotId == "YOUR-RIOT-ID") {
    throw 'No Riot ID added to the spreadsheet. Check the top left of the spreadsheet!';
    return;
  }

  Logger.log("Fetching latest Valorant match data for Riot ID: " + riotId);

  // Load matches for the user we're interested in
  var matchData = loadLatestMatchData(encodeURIComponent(riotId));

  // Add a new match to the spreadsheet
  addMatchToSpreadsheet(matchData);

}

// First element of args array must be a Riot ID
function getProfileWinrateOverall(riotId) {

  // Call the tracker.gg API to load a user's profile data
  var options = {muteHttpExceptions: true};
  var response = UrlFetchApp.fetch("https://api.tracker.gg/api/v2/valorant/standard/profile/riot/" + riotId + "?playlist=competitive", options);

  var responseCode = response.getResponseCode();

  // Handle private profiles first, then if the profile has data, parse it
  if (responseCode === 451) {
    return 0;
  } else {
    // Parse the JSON response
    var json = response.getContentText();
    var data = JSON.parse(json);

    var overallWinRate = data["data"]["segments"][0]["stats"]["matchesWinPct"]["value"];

    return overallWinRate;
  }

}

// First element of args array must be riotId
function loadLatestMatchData(riotId) {

  // Call the tracker.gg API for a particular user ID to load their most recent matches
  var response = UrlFetchApp.fetch("https://api.tracker.gg/api/v2/valorant/standard/matches/riot/" + riotId + "?type=competitive");

  // Parse the JSON
  var json = response.getContentText();
  var matchData = JSON.parse(json);

  var match = buildMatchData(matchData);

  return match;

}

// Extracts and builds the latest match data into something usable for our sheet
function buildMatchData(matchData) {

  // For building our match dictionary
  var match = {};

  // Extract our winner from the match result
  var matchOutcome = matchData["data"]["matches"][0]["metadata"]["result"];

  if (matchOutcome == "defeat") {
    match["winner"] = "Enemy";
  } else {
    match["winner"] = "Team";
  }

  var matchId = matchData["data"]["matches"][0]["attributes"]["id"];

  var matchDetail = getMatchDetail(matchId);

  match["myTeamWinRate"] = matchDetail["myTeamWinRate"];
  match["enemyTeamWinRate"] = matchDetail["enemyTeamWinRate"];

  return match;

}

// Gets details about our match to start pulling data for other players
function getMatchDetail(matchId) {

    // Call the tracker.gg API for a particular user ID to load their most recent matches
  var response = UrlFetchApp.fetch("https://api.tracker.gg/api/v2/valorant/standard/matches/" + matchId);

  // Parse the JSON
  var json = response.getContentText();
  var matchDetails = JSON.parse(json);

  var playerSummaries = fetchPlayerSummaries(matchDetails);
  var teamColor = getMyTeamColor(getRiotId(), playerSummaries);

  var myTeamWinRateAverageOverall = getMyTeamWinAveragesOverall(teamColor, playerSummaries);
  var enemyTeamWinRateAverageOverall = getEnemyTeamWinAveragesOverall(teamColor, playerSummaries);

  var matchData = {};

  matchData["myTeamWinRate"] = myTeamWinRateAverageOverall;
  matchData["enemyTeamWinRate"] = enemyTeamWinRateAverageOverall;

  return matchData;

}

// Get player summaries from the match data to start building our team arrays
function fetchPlayerSummaries(matchDetails) {

  var playerSummaries = [];

  matchDetails["data"]["segments"].forEach(function(segment) {
    if (segment["type"] == "player-summary") playerSummaries.push(segment);
  });

  return playerSummaries;

}

// Determine my team color from player summaries
function getMyTeamColor(riotId, playerSummaries) {

  riotId = decodeURIComponent(riotId);

  var teamColor;

  playerSummaries.forEach(function(playerData) {
    if (playerData["metadata"]["platformInfo"]["platformUserIdentifier"] == riotId) teamColor = playerData["metadata"]["teamId"];
  });

  return teamColor;

}

// Gets the win rate averages for all of my teammates
function getMyTeamWinAveragesOverall(myTeamColor, playerSummaries) {

  var winRatesCount = 0;
  var winRatesTotal = 0;
  var winRatesAverage = 0;

  playerSummaries.forEach(function(playerData) {
    if (playerData["metadata"]["teamId"] == myTeamColor) {
      var riotId = encodeURIComponent(playerData["metadata"]["platformInfo"]["platformUserIdentifier"]);

      var profileWinRate = getProfileWinrateOverall(riotId);

      if (profileWinRate != 0) {
        winRatesTotal += profileWinRate;
        winRatesCount += 1;
      }
    }
  });

  // Calculate our average
  winRatesAverage = (winRatesTotal / winRatesCount) / 100;

  return winRatesAverage;

}

// Gets the win rate averages for all of the enemies
function getEnemyTeamWinAveragesOverall(myTeamColor, playerSummaries) {

  var winRatesCount = 0;
  var winRatesTotal = 0;
  var winRatesAverage = 0;

  playerSummaries.forEach(function(playerData) {
    if (playerData["metadata"]["teamId"] != myTeamColor) {
      var riotId = encodeURIComponent(playerData["metadata"]["platformInfo"]["platformUserIdentifier"]);

      var profileWinRate = getProfileWinrateOverall(riotId);

      if (profileWinRate != 0) {
        winRatesTotal += profileWinRate;
        winRatesCount += 1;
      }
    }
  });

  // Calculate our average
  winRatesAverage = (winRatesTotal / winRatesCount) / 100;

  return winRatesAverage;

}

// Add the match to the spreadsheet
function addMatchToSpreadsheet(match) {

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getActiveSheet();
  var lastRow = sheet.getLastRow();
  var fromRange = sheet.getRange(lastRow, 4, 1, 3);
  var toRange = sheet.getRange(lastRow + 1, 4, 1, 3);

  sheet.appendRow(["", match["myTeamWinRate"], match["enemyTeamWinRate"], "", "", "", match["winner"]]);

  fromRange.copyTo(toRange, { contentsOnly : false });

}

// Get a Riot ID from our arguments
function getRiotId() {

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getActiveSheet();

  // Riot ID must be in this position!
  var riotId = sheet.getRange(2,1).getValue();

  return riotId;

}
