/** @format */
import { Logger } from "./Logger";
import { storeInformation } from "./Store";
import { MarkdownEntry, TableEntry, tsMarkdown } from "ts-markdown";

export async function fetchData(detailURL: string) {
  const logger = new Logger("fetchData");
  const fetchURL = `https://api.ravensburgerplay.com/api/v2/${detailURL}`;
  try {
    logger.logDebug(`Fetching from URL: ${fetchURL}`);
    const response = await fetch(fetchURL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    logger.logError(`Error making RPH request: ${error} for URL ${fetchURL}`);
    return null;
  }
}

export function generateStoreReport(
  storeData: Array<storeInformation>,
  startDate: string,
  endDate: string,
): string {
  let storeOverview: Array<MarkdownEntry> = [];
  storeOverview.push({
    h1: `Store Overview between ${startDate} and ${endDate}`,
  });
  storeOverview.push({
    p: `Contains all events which are not canceled or still upcomming`,
  });
  storeOverview.push({ h2: `Store List` });
  let resultTable: TableEntry = {
    table: {
      columns: [
        { name: `Store ID` },
        { name: `Store Name` },
        { name: `Number of Events` },
        { name: `Total Starting Players` },
        { name: `Unique Players` },
        { name: `Store Tier` },
      ],
      rows: [],
    },
  };
  storeOverview.push(resultTable);
  storeData.forEach((storeRecord) => {
    resultTable.table.rows.push([
      storeRecord.storeId,
      storeRecord.storeName,
      storeRecord.eventCount,
      storeRecord.startingPlayerCount,
      storeRecord.uniquePlayerCount,
      storeRecord.tier,
    ]);
    storeOverview.push({
      h2: `Details for ${storeRecord.storeId} - ${storeRecord.storeName}`,
    });
    storeOverview.push({
      p: `There were ${storeRecord.eventCount} events with a total of ${storeRecord.startingPlayerCount} players, there of ${storeRecord.uniquePlayerCount} unique players. These numbers would allow the store to reach ${storeRecord.tier} status`,
    });
    storeOverview.push({ h3: "Events" });
    let eventTable: TableEntry = {
      table: {
        columns: [
          { name: `Event ID` },
          { name: `Name` },
          { name: `Date` },
          { name: `Status` },
          { name: `Type` },
          { name: `Format` },
          { name: `Registered` },
          { name: `Starting` },
          { name: `Excluded` },
        ],
        rows: [],
      },
    };
    storeRecord.events.forEach((event) => {
      eventTable.table.rows.push([
        event.id,
        event.name,
        event.date,
        event.status,
        event.event_type,
        event.format,
        event.registered_user_count,
        event.starting_player_count,
        event.excluded,
      ]);
    });
    storeOverview.push(eventTable);
    storeOverview.push({ h3: "Unique Players" });
    let playerTable: TableEntry = {
      table: {
        columns: [
          { name: "Unique ID" },
          { name: "Short Name" },
          { name: "Display Name" },
        ],
        rows: [],
      },
    };
    storeRecord.uniquePlayers.forEach((player, unique) => {
      playerTable.table.rows.push([
        player.uniqueId,
        player.shortname,
        player.displayname,
      ]);
    });
    storeOverview.push(playerTable);
  });
  return tsMarkdown(storeOverview);
}
