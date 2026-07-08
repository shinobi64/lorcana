export const LogLevel = {
  Error: 4,
  Warning: 3,
  Info: 2,
  Verbose: 1,
  Debug: 0,
};

export class Logger {
  componentName;
  logLevel;

  constructor(componenName) {
    this.componentName = componenName;
    this.logLevel = LogLevel.Info;
  }

  setLogLevel(logLevel) {
    this.logLevel = logLevel;
  }

  mustBeLogged(targetLevel) {
    return this.logLevel <= targetLevel;
  }

  extendMessage(message) {
    return `[${this.componentName}] ${message}`;
  }

  getLogLevel() {
    return this.logLevel;
  }

  logMessage(logLevel, message) {
    switch (logLevel) {
      case LogLevel.Debug:
        this.logDebug(message);
      case LogLevel.Info:
        this.logInfo(message);
      case LogLevel.Warning:
        this.logWarning(message);
      case LogLevel.Error:
        this.logError(message);
      default:
        break;
    }
  }

  logDebug(message) {
    if (this.mustBeLogged(LogLevel.Debug)) {
      console.debug(this.extendMessage(message));
    }
  }

  logInfo(message) {
    if (this.mustBeLogged(LogLevel.Info)) {
      console.info(this.extendMessage(message));
    }
  }

  logWarning(message) {
    if (this.mustBeLogged(LogLevel.Warning)) {
      console.warn(this.extendMessage(message));
    }
  }

  logError(message) {
    if (this.mustBeLogged(LogLevel.Error)) {
      console.error(this.extendMessage(message));
    }
  }
}
