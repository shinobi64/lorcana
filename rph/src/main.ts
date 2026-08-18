/** @format */

import { Logger } from "./Logger";
import { Tournament } from "./Tournament";

async function run() {
  const logger = new Logger("main");
  logger.logInfo("starting the main event loop");

  const tournamentConfig = require("../dev/.tournament.json");
  const eventInstance = new Tournament(
    tournamentConfig.eventId,
    tournamentConfig.eventName,
  );
  await eventInstance.fetchInformation();
  eventInstance.showEventRecord();
  eventInstance.showEventRankings();
  eventInstance.showEventMatches();
  eventInstance.showEventReport();
}

run();
