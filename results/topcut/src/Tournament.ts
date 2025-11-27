import { Logger, LogLevel } from "./Logger";
import { Player } from "./Player";

export type tournamentOptions = {
  numberOfPlayers: number;
  numberOfRounds: number;
  topCut: number;
  includeTies: boolean;
  tieProbability: number;
};

type highestPlayer = {
  id: number | undefined;
  points: number;
};

export class Tournament {
  private options: tournamentOptions;
  private tournamentPlayers: Player[];
  private logger: Logger;

  constructor(tournamentOptions: tournamentOptions) {
    this.logger = new Logger("tournament");
    this.logger.setLogLevel(LogLevel.Debug);

    this.options = tournamentOptions;
    if (!this.options.includeTies) {
      this.options.tieProbability = 0;
    }
    this.logger.logDebug(
      `Tournament created with following options: ${JSON.stringify(
        this.options
      )}`
    );

    this.logger.logDebug(`Creating tournament players`);
    this.tournamentPlayers = [];
    for (let x = 0; x < this.options.numberOfPlayers; x++) {
      this.tournamentPlayers.push(new Player(x));
    }
  }

  public calculateTournament(): void {
    this.logger.logInfo(`===== Start tournament calculation =====`);

    for (let x = 0; x < this.options.numberOfRounds; x++) {
      this.calculateRound(x);
    }

    this.generateStandings();

    this.logger.logInfo(`===== End tournament calculation =====`);
  }

  private generateStandings(): void {
    const ranks = {};
    for (let player = 0; player < this.options.numberOfPlayers; player++) {
      const playerPoints = this.tournamentPlayers[player].getPoints();
      if (ranks[playerPoints] === undefined) {
        ranks[playerPoints] = [];
      }
      ranks[playerPoints].push(this.tournamentPlayers[player].getId());
    }

    const rankKeys = Object.keys(ranks);
    rankKeys.reverse();

    this.logger.logInfo(`----- Final Standings -----`);
    let countedPlayers = 0;
    let topCutReached = false;
    for (let points = 0; points < rankKeys.length; points++) {
      this.logger.logInfo(
        `Points: ${rankKeys[points]}, Players: ${
          ranks[rankKeys[points]].length
        }`
      );
      countedPlayers += ranks[rankKeys[points]].length;
      if (countedPlayers >= this.options.topCut && !topCutReached) {
        topCutReached = true;
        this.logger.logInfo(
          `!!! Top Cut of ${this.options.topCut} players reached with ${countedPlayers} players !!!`
        );
      }
    }
  }

  private findHighestRankingPlayer(
    round: number,
    excludePlayers?: number[]
  ): Player | undefined {
    let highestPlayer: highestPlayer = { points: -1, id: undefined };

    for (
      let playerId = 0;
      playerId < this.tournamentPlayers.length;
      playerId++
    ) {
      let currentPlayer = this.tournamentPlayers[playerId];
      if (
        highestPlayer.points < currentPlayer.getPoints() &&
        !currentPlayer.hasPlayedRound(round)
      ) {
        let isValid = true;
        if (Array.isArray(excludePlayers)) {
          for (
            let checkPlayer = 0;
            checkPlayer < excludePlayers?.length;
            checkPlayer++
          ) {
            if (currentPlayer.getId() === excludePlayers[checkPlayer]) {
              isValid = false;
              break;
            }
          }
        }
        if (isValid) {
          highestPlayer.id = currentPlayer.getId();
          highestPlayer.points = currentPlayer.getPoints();
        }
      }
    }

    if (highestPlayer.id === undefined) {
      return undefined;
    } else {
      return this.tournamentPlayers[highestPlayer.id];
    }
  }

  private calculateRound(round: number): void {
    this.logger.logDebug(
      `===== Start round calculation for round ${round} =====`
    );
    let currentPlayer;
    let loopStart = true;

    while (loopStart || currentPlayer !== undefined) {
      loopStart = false;
      currentPlayer = this.findHighestRankingPlayer(round);

      if (currentPlayer !== undefined) {
        this.logger.logDebug(`--- New Match`);
        this.logger.logDebug(
          `-- Current player ${currentPlayer.getId()} with ${currentPlayer.getPoints()} points`
        );

        currentPlayer.setRivalId(round, Player.PENDING_RIVAL);
        let rivalPlayer = this.findHighestRankingPlayer(
          round,
          currentPlayer.getRivalIds()
        );
        if (rivalPlayer !== undefined) {
          this.logger.logDebug(
            `-- Rival player ${rivalPlayer.getId()} with ${rivalPlayer.getPoints()} points`
          );
          rivalPlayer.setRivalId(round, Player.PENDING_RIVAL);

          currentPlayer.setRivalId(round, rivalPlayer.getId());
          rivalPlayer.setRivalId(round, currentPlayer.getId());

          /** check for ties */
          let randomNumber = 100;
          if (this.options.tieProbability > 0) {
            randomNumber = Math.floor(Math.random() * 100 + 1);
          }

          if (randomNumber < this.options.tieProbability) {
            this.logger.logDebug(
              `Result: Draw between player ${currentPlayer.getId()} and player ${rivalPlayer.getId()}`
            );
            currentPlayer.addDraws(1);
            rivalPlayer.addDraws(1);
          } else {
            randomNumber = Math.floor(Math.random() * 100 + 1);
            if (randomNumber > 50) {
              this.logger.logDebug(
                `Result: Win for player ${currentPlayer.getId()} against player ${rivalPlayer.getId()}`
              );
              currentPlayer.addWins(1);
              rivalPlayer.addLosses(1);
            } else {
              this.logger.logDebug(
                `Result: Loss for player ${currentPlayer.getId()} against player ${rivalPlayer.getId()}`
              );
              currentPlayer.addLosses(1);
              rivalPlayer.addWins(1);
            }
          }
        } else {
          this.logger.logDebug(
            `Result: Bye for player ${currentPlayer.getId()}`
          );
          currentPlayer.setRivalId(round, Player.NO_RIVAL);
          currentPlayer.addBye();
        }
      }
    }
    this.logger.logDebug(
      `===== End round calculation for round ${round} =====`
    );
  }
}
