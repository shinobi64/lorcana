import { Logger } from "./Logger";
import { fetchData } from "./utils";

export interface storeInformation {
  storeId: number;
  storeName: string;
  events: Array<storeEventInformation>;
  eventCount: number;
  startingPlayerCount: number;
  uniquePlayerCount: number;
  uniquePlayers: Map<string, userInformation>;
  tier: string;
}

interface userInformation {
  uniqueId: string;
  shortname: string;
  displayname: string;
}

interface storeEventInformation {
  id: string;
  name: string;
  status: string;
  date: string;
  event_type: string;
  format: string;
  registered_user_count: number;
  starting_player_count: number;
}

export class Store {
  private storeId: number;
  private logger: Logger;
  private storeData: storeInformation;

  constructor(storeId: number) {
    this.storeId = storeId;
    this.logger = new Logger("Store");
    this.storeData = {
      storeId: this.storeId,
      storeName: "",
      eventCount: 0,
      startingPlayerCount: 0,
      uniquePlayerCount: 0,
      uniquePlayers: new Map(),
      events: [],
      tier: "",
    };
  }

  public async fetchEvents(startDate: string, endDate: string): Promise<void> {
    this.logger.logInfo(
      `Start fetching events for store ${this.storeId} between ${startDate} and ${endDate}`,
    );
    const storeEvents = await fetchData(
      `events/?store_id=${this.storeId}&start_date_after=${startDate}&start_date_before=${endDate}&page_size=100&game_slug=disney-lorcana`,
    );
    if (storeEvents) {
      this.logger.logInfo(
        `Found ${storeEvents.results.length} number of events. Start processing`,
      );
      for (
        let eventIndex = 0;
        eventIndex < storeEvents.results.length;
        eventIndex++
      ) {
        this.logger.logInfo(
          `Processing event ${eventIndex + 1} out of ${storeEvents.results.length}`,
        );
        if (
          storeEvents.results[eventIndex].event_status !== "CANCELED" &&
          storeEvents.results[eventIndex].display_status !== "upcoming"
        ) {
          this.storeData.events.push({
            id: storeEvents.results[eventIndex].id,
            name: storeEvents.results[eventIndex].name,
            date: new Date(storeEvents.results[eventIndex].start_datetime)
              .toISOString()
              .slice(0, 10),
            event_type: storeEvents.results[eventIndex].event_type,
            format: storeEvents.results[eventIndex].gameplay_format.name,
            registered_user_count:
              storeEvents.results[eventIndex].registered_user_count,
            starting_player_count:
              storeEvents.results[eventIndex].starting_player_count,
            status:
              storeEvents.results[eventIndex].settings.event_lifecycle_status,
          });
          this.storeData.storeName = storeEvents.results[eventIndex].store.name;
          this.storeData.eventCount = this.storeData.eventCount + 1;
          this.storeData.startingPlayerCount =
            this.storeData.startingPlayerCount +
            storeEvents.results[eventIndex].starting_player_count;
          const eventRegistrations = await fetchData(
            `events/${storeEvents.results[eventIndex].id}/registrations?page_size=100`,
          );
          if (eventRegistrations) {
            eventRegistrations.results.forEach((entry) => {
              this.storeData.uniquePlayers.set(entry.user.id, {
                uniqueId: entry.user.id,
                shortname: entry.user.best_identifier,
                displayname: entry.best_identifier,
              });
            });
          }
        }
      }
      this.storeData.uniquePlayerCount = this.storeData.uniquePlayers.size;
    }
    try {
    } catch (error) {
      this.logger.logError(error);
    }
  }

  public showStoreRecord() {
    this.logger.logDebug("===== Store Event Data =====");
    if (this.storeData) {
      this.logger.logInfo(
        `Store ${this.storeData.storeName} (${this.storeId})with ${this.storeData.eventCount} events and a total starting player count of ${this.storeData.startingPlayerCount} and ${this.storeData.uniquePlayers} unique players`,
      );
    }
    this.logger.logDebug("===== Store Event Data =====");
  }

  public getStoreData(): storeInformation {
    if (
      this.storeData.eventCount >= 50 &&
      this.storeData.startingPlayerCount >= 500 &&
      this.storeData.uniquePlayerCount >= 50
    ) {
      this.storeData.tier = `Legendary`;
    } else if (
      this.storeData.eventCount >= 25 &&
      this.storeData.startingPlayerCount >= 250 &&
      this.storeData.uniquePlayerCount >= 25
    ) {
      this.storeData.tier = `Standard`;
    } else {
      this.storeData.tier = `Welcome`;
    }
    return this.storeData;
  }
}
