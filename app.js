const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;

const initialize = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => console.log("Success"));
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initialize();

//API-1

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

app.get("/players/", async (request, response) => {
  const getAllPlayersQuery = `SELECT * FROM player_details;`;
  const allPlayersArray = await db.all(getAllPlayersQuery);
  response.send(allPlayersArray.map((i) => convertDbObjectToResponseObject(i)));
});

//API-2

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getSpecificPlayerQuery = `SELECT * FROM player_details
                   WHERE player_id = ${playerId};`;
  const playerIdObj = await db.get(getSpecificPlayerQuery);
  response.send(convertDbObjectToResponseObject(playerIdObj));
});

//API-3

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const details = request.body;
  const { playerName } = details;
  const updatePlayerNameQuery = `UPDATE 
                    player_details
                   SET 
                      player_name = '${playerName}'
                   WHERE
                      player_id = ${playerId};`;
  await db.run(updatePlayerNameQuery);
  response.send("Player Details Updated");
});

//API-4

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getSpecificMatchQuery = `
  SELECT
   *
  FROM 
   match_details
  WHERE 
   match_id = ${matchId};`;
  const matchIdObj = await db.get(getSpecificMatchQuery);
  response.send(convertMatchDetailsObjToResponseObj(matchIdObj));
});

//API-5

const convertMatchDetailsObjToResponseObj = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerIdMatchQuery = `
  SELECT
  *
  FROM player_match_score
  NATURAL JOIN match_details
  WHERE player_id = ${playerId};`;
  const playerIdMatchObj = await db.all(getPlayerIdMatchQuery);
  response.send(
    playerIdMatchObj.map((i) => convertMatchDetailsObjToResponseObj(i))
  );
});

//API-6

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getMatchIdPlayerQuery = `
  SELECT
  *
  FROM player_match_score
  NATURAL JOIN player_details
  WHERE match_id = ${matchId};`;
  const matchIdPlayerObj = await db.all(getMatchIdPlayerQuery);
  response.send(
    matchIdPlayerObj.map((i) => convertDbObjectToResponseObject(i))
  );
});

//API-7

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerIdScoreDetailsQuery = `
  SELECT
  player_id AS playerId,
  player_name AS playerName,
  SUM(score) AS totalScore,
  SUM(fours) AS totalFours,
  SUM(sixes) AS totalSixes
  FROM player_match_score
  NATURAL JOIN player_details
  WHERE player_id = ${playerId};`;
  const playerIdScoreDetailObj = await db.get(getPlayerIdScoreDetailsQuery);
  response.send(playerIdScoreDetailObj);
});

module.exports = app;
