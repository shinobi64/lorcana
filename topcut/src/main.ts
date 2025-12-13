import { Logger } from "./Logger";
import { Tournament } from "./Tournament";

function runTournament() {
  const logger = new Logger("main");
  const tournamentParams = require("../dev/.params.json");
  const tournamentMeta = require("../dev/.expectedmeta.json");
  const currentTournament = new Tournament(tournamentParams, tournamentMeta);
  currentTournament.calculateTournament();
}

runTournament();
