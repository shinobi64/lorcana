import { Logger, LogLevel } from "./Logger";
import { Player, PlayResults } from "./Player";

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
  private expectedMeta: any;
  private tournamentPlayers: Player[];
  private logger: Logger;

  constructor(tournamentOptions: tournamentOptions, tournamentMeta: any) {
    this.logger = new Logger("tournament");
    this.logger.setLogLevel(LogLevel.Debug);

    this.options = tournamentOptions;
    this.expectedMeta = tournamentMeta;
    if (!this.options.includeTies) {
      this.options.tieProbability = 0;
    }

    this.logger.logDebug(
      `Tournament created with following options: ${JSON.stringify(
        this.options,
        null,
        2
      )}`
    );
    this.logger.logDebug(
      `Tournament expected meta: ${JSON.stringify(this.expectedMeta, null, 2)}`
    );

    this.logger.logDebug(`Creating tournament players`);
    this.tournamentPlayers = [];
    for (let x = 0; x < this.options.numberOfPlayers; x++) {
      this.tournamentPlayers.push(new Player(x));
    }
  }

  private distributeDecks(): void {
    type metaShares = {
      deck: string;
      cummulativeShare: number;
      realNumber?: number;
    };

    let plainMeta: metaShares[] = [];
    let cummulatedMeta: metaShares[] = [];
    const expectedDecks = Object.keys(this.expectedMeta.decks);
    for (
      let expectedDeck = 0;
      expectedDeck < expectedDecks.length;
      expectedDeck++
    ) {
      if (this.expectedMeta.decks[expectedDecks[expectedDeck]].metaShare > 0) {
        plainMeta.push({
          deck: expectedDecks[expectedDeck],
          cummulativeShare:
            this.expectedMeta.decks[expectedDecks[expectedDeck]].metaShare,
        });
      }
    }

    plainMeta.sort((a, b) => a.cummulativeShare - b.cummulativeShare);
    plainMeta.reverse();

    let cummulativeShare = 0;
    for (let deck = 0; deck < plainMeta.length; deck++) {
      cummulatedMeta.push({
        deck: plainMeta[deck].deck,
        cummulativeShare: (cummulativeShare +=
          plainMeta[deck].cummulativeShare),
      });
    }

    let distributedNumber = 0;
    for (let player = 0; player < this.tournamentPlayers.length; player++) {
      distributedNumber = Math.floor(
        (100 / this.tournamentPlayers.length) * (player + 1)
      );
      for (let deck = 0; deck < cummulatedMeta.length; deck++) {
        if (distributedNumber <= cummulatedMeta[deck].cummulativeShare) {
          this.tournamentPlayers[player].setDeck(cummulatedMeta[deck].deck);
          cummulatedMeta[deck].realNumber =
            cummulatedMeta[deck].realNumber === undefined
              ? 1
              : (cummulatedMeta[deck].realNumber! += 1);
          break;
        }
      }
    }

    this.logger.logDebug(
      `Tournament aggregated meta shares: ${JSON.stringify(
        cummulatedMeta,
        null,
        2
      )}`
    );
  }

  public calculateTournament(): void {
    this.logger.logInfo(`===== Start tournament calculation =====`);

    this.logger.logInfo(`===== distribute meta =====`);
    this.distributeDecks();

    this.logger.logInfo(`===== shuffle player base =====`);
    this.shufflePlayers();

    for (let round = 0; round < this.options.numberOfRounds; round++) {
      this.calculateRound(round);
      this.generateStandings(round);
      this.detailedResults(round);
    }

    this.logger.logInfo(`===== End tournament calculation =====`);
  }

  private generateStandings(round: number): void {
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

    let topCutReached = false;
    let countedPlayers = 0;
    if (round === this.options.numberOfRounds - 1) {
      this.logger.logInfo(`----- Final Standings -----`);
    } else {
      this.logger.logInfo(`----- Round ${round} Standings -----`);
      topCutReached = true;
    }

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

  private shufflePlayers(): void {
    let currentIndex = this.tournamentPlayers.length;

    // While there remain elements to shuffle...
    while (currentIndex != 0) {
      // Pick a remaining element...
      let randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;

      // And swap it with the current element.
      [
        this.tournamentPlayers[currentIndex],
        this.tournamentPlayers[randomIndex],
      ] = [
        this.tournamentPlayers[randomIndex],
        this.tournamentPlayers[currentIndex],
      ];
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
      return this.tournamentPlayers.find(
        (player) => player.getId() === highestPlayer.id
      );
    }
  }

  private calculateRound(round: number): void {
    this.logger.logDebug(
      `===== Start round calculation for round ${round} =====`
    );
    let currentPlayer: Player | undefined;
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
            currentPlayer.setRoundResult(round, PlayResults.Draw);
            rivalPlayer.setRoundResult(round, PlayResults.Draw);
          } else {
            randomNumber = Math.floor(Math.random() * 100 + 1);
            let winNumber = 50;
            winNumber =
              this.expectedMeta.decks[currentPlayer.getDeck()].winRatio[
                rivalPlayer.getDeck()
              ];
            if (randomNumber <= winNumber) {
              this.logger.logDebug(
                `Result: Win for player ${currentPlayer.getId()} against player ${rivalPlayer.getId()}`
              );
              currentPlayer.setRoundResult(round, PlayResults.Win);
              rivalPlayer.setRoundResult(round, PlayResults.Loss);
            } else {
              this.logger.logDebug(
                `Result: Loss for player ${currentPlayer.getId()} against player ${rivalPlayer.getId()}`
              );
              currentPlayer.setRoundResult(round, PlayResults.Loss);
              rivalPlayer.setRoundResult(round, PlayResults.Win);
            }
          }
        } else {
          this.logger.logDebug(
            `Result: Bye for player ${currentPlayer.getId()}`
          );
          currentPlayer.setRivalId(round, Player.NO_RIVAL);
          currentPlayer.setRoundResult(round, PlayResults.Bye);
        }
      }
    }
    this.logger.logDebug(
      `===== End round calculation for round ${round} =====`
    );
  }

  private detailedResults(round: number): void {
    if (round === this.options.numberOfRounds - 1) {
      this.logger.logInfo(
        `===== End of round ${round} detailed standings =====`
      );

      this.tournamentPlayers.sort(
        (a: Player, b: Player) => a.getPoints() - b.getPoints()
      );
      this.tournamentPlayers.reverse();

      let decks = Object.keys(this.expectedMeta.decks);
      let deckShare: {
        deck: string;
        allPlayer: number;
        topCutPlayers: number;
      }[] = [];

      this.logger.logInfo(`Position \t Player \t Points \t Record \t Deck`);
      for (let player = 0; player < this.tournamentPlayers.length; player++) {
        let currentPlayer = this.tournamentPlayers[player];
        this.logger.logInfo(
          `${player} \t ${currentPlayer.getId()} \t ${currentPlayer.getPoints()} \t ${currentPlayer.getRecord()} \t ${currentPlayer.getDeck()}`
        );

        let deckData = deckShare.find(
          (deckData) => deckData.deck === currentPlayer.getDeck()
        );
        if (deckData === undefined) {
          deckShare.push({
            deck: currentPlayer.getDeck(),
            allPlayer: 1,
            topCutPlayers: player < this.options.topCut ? 1 : 0,
          });
        } else {
          deckData.allPlayer += 1;
          deckData.topCutPlayers += player < this.options.topCut ? 1 : 0;
        }
      }

      this.logger.logInfo(`===== End of tournament meta shares =====`);
      deckShare.sort((a, b) => a.topCutPlayers - b.topCutPlayers);
      deckShare.reverse();
      this.logger.logInfo(`Deck \t Total Number of Players \t TopCut Players`);
      for (let deckId = 0; deckId < deckShare.length; deckId++) {
        this.logger.logInfo(
          `${deckShare[deckId].deck} \t ${deckShare[deckId].allPlayer} \t ${deckShare[deckId].topCutPlayers}`
        );
      }
    }
  }
}
