/** @format */
import { Logger } from "./Logger";

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
    logger.logError(`Error making RPH request: ${error}`);
    return null;
  }
}
