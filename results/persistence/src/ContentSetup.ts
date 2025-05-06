import { Connection } from "./Connection";
import { Logger } from "./Logger";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

export class ContentSetup {
  private connection: Connection;
  private schemaName: string;
  private logger;

  constructor(connection: Connection, schema: string) {
    this.connection = connection;
    this.schemaName = schema;
    this.logger = new Logger("content setup");
  }

  public async createContentTables(overwrite?: boolean) {
    this.logger.logInfo(
      `running create content tables with overwrite mode ${overwrite}`
    );
    const objectList = [
      {
        objectName: "MH_T_LORC_EXT_PLAYERS",
        createStatementPath: "../sql/MH_T_LORC_EXT_PLAYERS.sql",
      },
      {
        objectName: "MH_T_LORC_EXT_RESULTS",
        createStatementPath: "../sql/MH_T_LORC_EXT_RESULTS.sql",
      },
      {
        objectName: "MH_T_LORC_EXT_EVENTS",
        createStatementPath: "../sql/MH_T_LORC_EXT_EVENTS.sql",
      },
      {
        objectName: "MH_T_LORC_EXT_EVENTPLAYERS",
        createStatementPath: "../sql/MH_T_LORC_EXT_EVENTPLAYERS.sql",
      },
      {
        objectName: "MH_T_LORC_EXT_DECKS",
        createStatementPath: "../sql/MH_T_LORC_EXT_DECKS.sql",
      },
      {
        objectName: "MH_T_LORC_EXT_MATCHES",
        createStatementPath: "../sql/MH_T_LORC_EXT_MATCHES.sql",
      },
      {
        objectName: "MH_T_LORC_EXT_META",
        createStatementPath: "../sql/MH_T_LORC_EXT_META.sql",
      },
      {
        objectName: "MH_T_LORC_EXT_LOCATIONS",
        createStatementPath: "../sql/MH_T_LORC_EXT_LOCATIONS.sql",
      },
    ];
    for (let i = 0; i < objectList.length; i++) {
      const objectEntry = objectList[i];
      this.logger.logInfo(`processing entry ${objectEntry.objectName}`);
      const createStatement = await this.readStatementFromDisk(
        objectEntry.createStatementPath
      );
      await this.createDBObject(
        objectEntry.objectName,
        createStatement,
        overwrite
      );
    }
  }

  private async exists(objectName: string): Promise<boolean> {
    this.logger.logInfo(`running exist for object ${objectName}`);
    try {
      const columnTableStatement = `SELECT TABLE_NAME FROM SYS.M_CS_TABLES WHERE SCHEMA_NAME = '${this.schemaName}' AND TABLE_NAME = '${objectName}';`;
      const resultColumnTables = await this.connection.exec(
        columnTableStatement
      );
      if (
        Array.isArray(resultColumnTables) &&
        resultColumnTables.length === 1
      ) {
        this.logger.logInfo(`object ${objectName} found as column table`);
        return true;
      } else {
        const rowTableStatement = `SELECT TABLE_NAME FROM SYS.M_TABLES WHERE SCHEMA_NAME = '${this.schemaName}' AND TABLE_NAME = '${objectName}';`;
        const resultRowTables = await this.connection.exec(rowTableStatement);
        if (Array.isArray(resultRowTables) && resultRowTables.length === 1) {
          this.logger.logInfo(`object ${objectName} found as row table`);
          return true;
        } else {
          this.logger.logInfo(`object ${objectName} not found`);
          return false;
        }
      }
    } catch (err) {
      this.logger.logError(err);
      return false;
    }
  }

  private async createDBObject(
    objectName: string,
    createStatement: string,
    overwrite?: boolean
  ): Promise<void> {
    this.logger.logInfo(`running createDBObject for ${objectName}`);
    if (await this.exists(objectName)) {
      if (overwrite) {
        try {
          await this.connection.exec(`DROP TABLE "${objectName}";`);
          this.logger.logInfo(`dropped object ${objectName}`);
        } catch (err) {
          this.logger.logError(err);
          throw err;
        }
      } else {
        return;
      }
    }
    try {
      if (!createStatement || createStatement.length === 0) {
        throw `createStatement for object ${objectName} is not provided`;
      }
      await this.connection.exec(createStatement);
      this.logger.logInfo(`creation for object ${objectName} completed`);
    } catch (err) {
      this.logger.logError(err);
      throw err;
    }
  }

  private async readStatementFromDisk(relativePath: string) {
    return await readFile(resolve(relativePath), { encoding: "utf8" });
  }
}
