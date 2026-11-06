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

  extendMessage(message, skipComponent?: boolean) {
    if (skipComponent) {
      return `${message}`;
    } else {
      return `[${this.componentName}] ${message}`;
    }
  }

  getLogLevel() {
    return this.logLevel;
  }

  logMessage(logLevel, message, skipComponent?: boolean) {
    switch (logLevel) {
      case LogLevel.Debug:
        this.logDebug(message, skipComponent);
      case LogLevel.Info:
        this.logInfo(message, skipComponent);
      case LogLevel.Warning:
        this.logWarning(message, skipComponent);
      case LogLevel.Error:
        this.logError(message, skipComponent);
      default:
        break;
    }
  }

  logDebug(message, skipComponent?: boolean) {
    if (this.mustBeLogged(LogLevel.Debug)) {
      console.debug(this.extendMessage(message, skipComponent));
    }
  }

  logInfo(message, skipComponent?: boolean) {
    if (this.mustBeLogged(LogLevel.Info)) {
      console.info(this.extendMessage(message, skipComponent));
    }
  }

  logWarning(message, skipComponent?: boolean) {
    if (this.mustBeLogged(LogLevel.Warning)) {
      console.warn(this.extendMessage(message, skipComponent));
    }
  }

  logError(message, skipComponent?: boolean) {
    if (this.mustBeLogged(LogLevel.Error)) {
      console.error(this.extendMessage(message, skipComponent));
    }
  }
}
