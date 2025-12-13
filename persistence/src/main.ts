/** @format */

import { Connection } from "./Connection";
import { ContentSetup } from "./ContentSetup";
import { ContentUpdate } from "./ContentUpdate";
import { Logger } from "./Logger";

async function run() {
  const logger = new Logger("main");
  const connectionConfig = require("../dev/.system.json");
  const dbConnection = new Connection({
    serverNode: `${connectionConfig.hostname}:${connectionConfig.port}`,
    uid: connectionConfig.username,
    pwd: connectionConfig.password,
  });

  await dbConnection.connect();
  try {
    const contentSetup = new ContentSetup(
      dbConnection,
      connectionConfig.schema
    );
    const metadataOverwrite =
      process.env.FORCE_DEFINITION === "true" ? true : false;
    await contentSetup.createContentTables(metadataOverwrite);

    const contentUpdate = new ContentUpdate(
      dbConnection,
      connectionConfig.schema
    );
    const dataTruncate = process.env.TRUNCATE_DATA === "true" ? true : false;
    await contentUpdate.updateContent(dataTruncate);
  } catch (err) {
    logger.logError(err);
  } finally {
    dbConnection.disconnect();
  }
}

run();
