/** @format */

import { Logger } from "./Logger";
import { Store, storeInformation } from "./Store";
import { Tournament } from "./Tournament";
import { generateStoreReport } from "./utils";
import { writeFile } from "fs/promises";

async function run() {
  const logger = new Logger("main");
  logger.logDebug("starting the main event loop");

  if (process.env.SINGLE_EVENT === "true") {
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
  } else {
    const storeData: Array<storeInformation> = [];
    const storeConfig = require("../dev/.store.json");
    logger.logInfo(
      `Showing events between ${storeConfig.startDate} & ${storeConfig.endDate}`,
    );
    for (
      let storeIndex = 0;
      storeIndex < storeConfig.storeIds.length;
      storeIndex++
    ) {
      const storeInstance = new Store(storeConfig.storeIds[storeIndex]);
      await storeInstance.fetchEvents(
        storeConfig.startDate,
        storeConfig.endDate,
        storeConfig.excludedEvents,
      );
      storeData.push(storeInstance.getStoreData());
    }
    logger.logInfo(`Preparing output report`);
    const storeReport = generateStoreReport(
      storeData,
      storeConfig.startDate,
      storeConfig.endDate,
    );
    logger.logInfo(`Trying to write output file`);
    await writeFile("storeReport.md", storeReport);
  }
}

run();
