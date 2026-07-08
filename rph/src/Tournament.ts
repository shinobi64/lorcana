import { Logger } from "./Logger";
import { fetchData } from "./utils";

interface eventRegistration {
  id: number;
  uniqueUserId: number;
  shortname: string;
  displayname: string;
}

interface matchInformation {
  id: number;
  table_number: number;
  player1: number;
  player1_displayname: string;
  player2: number;
  player2_displayname: string;
  winning_player: number;
  result: string;
}

interface resultInformation {
  id: number;
  rank: number;
  playerId: number;
  player_displayname: string;
  record: string;
  points: number;
}

interface roundInformation {
  id: number;
  round: number;
  matches?: matchInformation[];
  standings?: resultInformation[];
}

interface eventInformation {
  id: string;
  name: string;
  status: string;
  event_type: string;
  format: string;
  registered_user_count: number;
  starting_player_count: number;
  store_name: string;
  registrations?: eventRegistration[];
  rounds?: roundInformation[];
}

export class Tournament {
  private eventId: number;
  private internalName: string;
  private logger: Logger;
  private eventData?: eventInformation;

  constructor(eventId: number, internalName: string) {
    this.eventId = eventId;
    this.internalName = internalName;
    this.logger = new Logger("Tournament");
  }

  public async fetchInformation(): Promise<void> {
    this.logger.logInfo(`Starting fetch of event data for id ${this.eventId}`);
    try {
      this.logger.logInfo(`Fetching main event data`);
      const mainData: any = await fetchData(`events/${this.eventId}/`);
      if (mainData) {
        this.eventData = {
          id: mainData.id,
          status: mainData.settings.event_lifecycle_status,
          registered_user_count: mainData.registered_user_count,
          starting_player_count: mainData.starting_player_count,
          event_type: mainData.event_type,
          format: mainData.gameplay_format.name,
          name: mainData.name,
          store_name: mainData.store.name,
          rounds: [],
        };
        // pre processing the tournament phases and rounds as the identifiers are needed for later fetches
        mainData.tournament_phases.forEach((phase) => {
          phase.rounds.forEach((round) => {
            this.eventData?.rounds?.push({
              id: round.id,
              round: round.round_number,
              matches: [],
              standings: [],
            });
          });
        });
      }

      this.logger.logInfo(`Fetching event registrations`);
      const tournamentRegistrations: any = await fetchData(
        `events/${this.eventId}/registrations`,
      );
      if (tournamentRegistrations) {
        this.eventData!.registrations = [];
        tournamentRegistrations.results.forEach((entry) => {
          this.eventData!.registrations?.push({
            id: entry.id,
            uniqueUserId: entry.user.id,
            shortname: entry.user.best_identifier,
            displayname: entry.best_identifier,
          });
        });
      }

      this.logger.logInfo(`Fetching round pairings and results`);
      // process rounds in regular for loop to not break async/ await processing
      for (
        let roundIndex = 0;
        roundIndex < this.eventData!.rounds!.length;
        roundIndex++
      ) {
        const round = this.eventData!.rounds![roundIndex];
        const roundPairings = await fetchData(
          `tournament-rounds/${round.id}/matches/paginated/?page=1&page_size=20`,
        );
        if (roundPairings) {
          roundPairings.results.forEach((result) => {
            const matchRecord: matchInformation = {
              id: result.id,
              player1: result.player_match_relationships[0].player.id,
              player1_displayname:
                result.player_match_relationships[0].user_event_status
                  .best_identifier,
              player2:
                result.player_match_relationships.length > 1
                  ? result.player_match_relationships[1].player.id
                  : null,
              player2_displayname:
                result.player_match_relationships.length > 1
                  ? result.player_match_relationships[1].user_event_status
                      .best_identifier
                  : null,
              winning_player: result.winning_player,
              result:
                result.winning_player ===
                result.player_match_relationships[0].player.id
                  ? "Player"
                  : result.winning_player === null
                    ? "Draw"
                    : "Opponent",
              table_number: result.table_number,
            };
            round.matches?.push(matchRecord);
          });
        }

        const roundResults = await fetchData(
          `tournament-rounds/${round.id}/standings/paginated/?page=1&page_size=20`,
        );
        if (roundResults) {
          roundResults.results.forEach((result) => {
            const resultRecord: resultInformation = {
              id: result.user_event_status.id,
              playerId: result.player.id,
              player_displayname: result.user_event_status.best_identifier,
              record: result.match_record,
              points: result.match_points,
              rank: result.rank,
            };
            round.standings?.push(resultRecord);
          });
        }
      }
    } catch (error) {
      this.logger.logError(error);
      this.eventData = undefined;
    }
  }

  public showInformation() {
    this.logger.logInfo("===== Event Information =====");
    this.logger.logInfo(JSON.stringify(this.eventData, null, 2));
  }

  public showEventRecord() {
    this.logger.logInfo("===== Event Master Data =====");
    this.logger.logInfo(
      `${this.internalName},,${this.eventData?.store_name},Set12,${this.eventData?.format},BestOfThree,https://tcg.ravensburgerplay.com/events/${this.eventId}`,
    );
    this.logger.logInfo("===== Event Master Data =====");
  }

  public showEventMatches() {
    this.logger.logInfo("===== Event Matches =====");
    this.eventData?.rounds?.forEach((round) => {
      round.matches?.forEach((match) => {
        this.logger.logInfo(
          `${this.internalName},${round.round},${match.table_number},${match.player1_displayname},${match.player2_displayname},${match.result}`,
        );
      });
    });
    this.logger.logInfo("===== Event Matches =====");
  }

  public showEventRankings() {
    this.logger.logInfo("===== Event Rankings =====");
    if (!this.eventData?.rounds) {
      return;
    } else {
      this.eventData?.rounds![
        this.eventData.rounds!.length - 1
      ].standings?.forEach((standing) => {
        let eventRank = "";
        switch (true) {
          case standing.rank === 1:
            eventRank = "1st";
            break;
          case standing.rank === 2:
            eventRank = "2nd";
            break;
          case standing.rank === 3:
            eventRank = "3rd";
            break;
          case standing.rank === 4:
            eventRank = "Top4";
            break;
          case standing.rank <= 8:
            eventRank = "Top8";
            break;
          case standing.rank <= 16:
            eventRank = "Top16";
            break;
          case standing.rank <= 32:
            eventRank = "Top32";
            break;
          default:
            eventRank = "Top64";
        }
        this.logger.logInfo(
          `${this.internalName},${standing.player_displayname},<<deck>>,${eventRank}`,
        );
      });
    }
    this.logger.logInfo("===== Event Rankings =====");
  }
}
