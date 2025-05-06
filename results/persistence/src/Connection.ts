import { createConnection, Statement } from "@sap/hana-client";
import { Logger } from "./Logger";

export class Connection {
  private nativeConnection;
  private connectionConfig: any;
  private logger;

  constructor(config: any) {
    this.connectionConfig = config;
    this.logger = new Logger("database connection");
  }
  public async connect(): Promise<void> {
    this.logger.logInfo("attempting to connect");
    if (!this.nativeConnection) {
      this.logger.logDebug("creating new native connection");
      this.nativeConnection = createConnection();
    }
    await this.nativeConnection.connect(this.connectionConfig);
    this.logger.logInfo("connected");
  }

  public async exec(sql: string): Promise<any> {
    this.logger.logDebug(`running statement ${sql}`);
    return await this.nativeConnection.exec(sql);
  }

  public async prepare(sql: string): Promise<Statement> {
    this.logger.logDebug(`prepare statement ${sql}`);
    return this.nativeConnection.prepare(sql);
  }

  public disconnect(): void {
    this.logger.logInfo("attempting to disconnect");
    this.nativeConnection.disconnect();
    this.logger.logInfo("disconnected");
  }
}
