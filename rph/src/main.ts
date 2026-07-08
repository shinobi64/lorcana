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
  // eventInstance.showInformation();
  eventInstance.showEventRecord();
  eventInstance.showEventRankings();
  eventInstance.showEventMatches();

  /**
  logger.logInfo("======= TOURNAMENT MAIN DATA =======");
  const tournamentData = await fetchData(`events/${tournamentConfig.eventid}/`);
  logger.logInfo(JSON.stringify(tournamentData, null, 2));
  logger.logInfo("======= REGISTRATIONS =======");
  const tournamentRegistrations = await fetchData(
    `events/${tournamentConfig.eventid}/registrations`,
  );
  logger.logInfo(JSON.stringify(tournamentRegistrations, null, 2));
  tournamentData.tournament_phases.forEach(async (phase) => {
    phase.rounds.forEach(async (round) => {
      logger.logInfo(
        `======= PHASE ${phase.phase_name} - ROUND ${round.round_number} PAIRINGS =======`,
      );
      const roundPairings = await fetchData(
        `tournament-rounds/${round.id}/matches/paginated/?page=1&page_size=20`,
      );
      logger.logInfo(JSON.stringify(roundPairings, null, 2));
      logger.logInfo(
        `======= PHASE ${phase.phase_name} - ROUND ${round.round_number} STANDINGS =======`,
      );
      const roundStandings = await fetchData(
        `tournament-rounds/${round.id}/standings/paginated/?page=1&page_size=20`,
      );
      logger.logInfo(JSON.stringify(roundStandings, null, 2));
    });
  });
   */
}

run();
