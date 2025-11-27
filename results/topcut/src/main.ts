import { Logger } from "./Logger";
import { Tournament } from "./Tournament";

function runTournament() {
  const logger = new Logger("main");
  const tournamentParams = require("../dev/.params.json");
  const currentTournament = new Tournament(tournamentParams);
  currentTournament.calculateTournament();
}

runTournament();
