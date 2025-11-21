import { Connection } from "./Connection";
import { Logger } from "./Logger";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import * as PAPA_PARSE from "papaparse";
import { escapeDoubleQuotes } from "./util";

export class ContentUpdate {
  private connection: Connection;
  private schemaName: string;
  private logger;

  constructor(connection: Connection, schema: string) {
    this.connection = connection;
    this.schemaName = schema;
    this.logger = new Logger("content update");
  }

  async updateContent(overwrite?: boolean): Promise<void> {
    this.logger.logInfo(
      `running content update with overwrite mode ${overwrite}`
    );

    const objectList = [
      {
        objectName: "MH_T_LORC_EXT_META",
        dataPath: "../../meta.csv",
      },
      {
        objectName: "MH_T_LORC_EXT_EVENTS",
        dataPath: "../../events.csv",
      },
      {
        objectName: "MH_T_LORC_EXT_EVENTPLAYERS",
        dataPath: "../../eventdetails.csv",
      },
      {
        objectName: "MH_T_LORC_EXT_LOCATIONS",
        dataPath: "../../locations.csv",
      },
      {
        objectName: "MH_T_LORC_EXT_PLAYERS",
        dataPath: "../../players.csv",
      },
      {
        objectName: "MH_T_LORC_EXT_DECKS",
        dataPath: "../../decks.csv",
      },
      {
        objectName: "MH_T_LORC_EXT_MATCHES",
        dataPath: "../../matches.csv",
      },
      {
        objectName: "MH_T_LORC_EXT_RESULTS",
        dataPath: "../../results.csv",
      },
      {
        objectName: "MH_T_LORC_EXT_LTD",
        dataPath: "../../ltd.csv",
      },
      {
        objectName: "MH_T_LORC_EXT_LTD_ANALYSE",
        dataPath: "../../ltd_analyse.csv",
      },
    ];
    for (let i = 0; i < objectList.length; i++) {
      const objectEntry = objectList[i];
      this.logger.logInfo(`processing entry ${objectEntry.objectName}`);
      await this.updateObjectContent(
        objectEntry.objectName,
        objectEntry.dataPath,
        overwrite
      );
    }
  }

  private async updateObjectContent(
    objectName: string,
    dataPath: string,
    overwrite?: boolean
  ): Promise<void> {
    let sqlStatement: string;
    this.logger.logInfo(`running updateObjectContent for ${objectName}`);

    const dataContent = await this.readFileData(dataPath);

    const escapedFields: string[] = [];
    dataContent.meta.fields.forEach((field) => {
      escapedFields.push(`"${escapeDoubleQuotes(field)}"`);
    });
    const fieldNameList = escapedFields.join(",");
    let fieldNamePlaceholders = "?,".repeat(escapedFields.length);
    if (fieldNamePlaceholders.length > 0) {
      fieldNamePlaceholders = fieldNamePlaceholders.substring(
        0,
        fieldNamePlaceholders.length - 1
      );
    }

    const preparedInsertValues: any[] = [];

    dataContent.data.forEach((dataRow) => {
      const rowValues: any[] = [];
      dataContent.meta.fields.forEach((field) => {
        if (dataRow[field] === "") {
          rowValues.push(undefined);
        } else {
          rowValues.push(dataRow[field]);
        }
      });
      preparedInsertValues.push(rowValues);
    });

    if (overwrite) {
      sqlStatement = `TRUNCATE TABLE "${escapeDoubleQuotes(
        this.schemaName
      )}"."${escapeDoubleQuotes(objectName)}"`;
      await this.connection.exec(sqlStatement);
      this.logger.logInfo(`truncate table run succesfully for ${objectName}`);
    }

    sqlStatement = `INSERT INTO "${escapeDoubleQuotes(
      this.schemaName
    )}"."${escapeDoubleQuotes(
      objectName
    )}" (${fieldNameList}) VALUES (${fieldNamePlaceholders})`;
    const preparedStatement = await this.connection.prepare(sqlStatement);
    const updatedRows = await preparedStatement.exec(preparedInsertValues);
    this.logger.logInfo(`${updatedRows} added for object ${objectName}`);
  }

  private async readFileData(dataPath: string): Promise<any> {
    const dataContent = await readFile(resolve(dataPath), { encoding: "utf8" });
    const self = this;
    return new Promise<void | PAPA_PARSE.ParseResult<unknown>>(
      (resolve, reject) => {
        PAPA_PARSE.parse(dataContent, {
          header: true,
          skipEmptyLines: true,
          delimiter: "",
          delimitersToGuess: [",", ";", " ", "\t", ":", ".", "-"],
          complete: function (results) {
            self.logger.logInfo(`finished parsing for ${dataPath}`);
            resolve(results);
          },
          error: (err: any) => {
            self.logger.logError(err);
            reject(err);
          },
        });
      }
    );
  }
}
