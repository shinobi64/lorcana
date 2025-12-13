import { Logger } from "./Logger";

export enum PlayResults {
  Win = "win",
  Loss = "loss",
  Draw = "draw",
  Bye = "bye",
}

export type RoundResult = {
  round: number;
  rivalId: number;
  result?: PlayResults;
  wins?: number;
  losses?: number;
  draws?: number;
  points?: number;
};

export class Player {
  private id: number;
  private wins: number;
  private losses: number;
  private draws: number;
  private matchPoints: number;
  private roundHistory: RoundResult[];
  private deck: string;

  public static readonly PENDING_RIVAL = -1;
  public static readonly NO_RIVAL = -99;

  constructor(id) {
    this.id = id;
    this.wins = 0;
    this.losses = 0;
    this.draws = 0;
    this.matchPoints = 0;
    this.roundHistory = [];
    this.deck = "";
  }

  public setDeck(deck: string): void {
    this.deck = deck;
  }

  public getDeck(): string {
    return this.deck;
  }

  public setRoundResult(round: number, result: PlayResults): void {
    if (this.roundHistory[round] === undefined) {
      this.roundHistory[round] = { round: round, rivalId: Player.NO_RIVAL };
    }
    switch (result) {
      case PlayResults.Win:
        this.addWins(1);
        break;
      case PlayResults.Loss:
        this.addLosses(1);
        break;
      case PlayResults.Draw:
        this.addDraws(1);
        break;
      case PlayResults.Bye:
        this.addBye();
        break;
      default:
        break;
    }
    this.roundHistory[round].result = result;
    this.roundHistory[round].draws = this.getDraws();
    this.roundHistory[round].wins = this.getWins();
    this.roundHistory[round].losses = this.getLosses();
    this.roundHistory[round].points = this.getPoints();
  }

  private addPoints(points: number): void {
    this.matchPoints += points;
  }

  private addWins(wins: number): void {
    this.wins += wins;
    this.addPoints(wins * 3);
  }

  private addLosses(losses: number): void {
    this.losses += losses;
  }

  private addDraws(draws: number): void {
    this.draws += draws;
    this.addPoints(draws * 1);
  }

  private addBye(): void {
    this.addWins(1);
  }

  public setRivalId(round: number, rivalId: number): void {
    if (this.roundHistory[round] === undefined) {
      this.roundHistory[round] = { round: round, rivalId: rivalId };
    } else {
      this.roundHistory[round].rivalId = rivalId;
    }
  }

  public hasPlayedAgainst(rivalId: number): boolean {
    let result = false;

    for (let round in this.roundHistory) {
      if (this.roundHistory[round].rivalId === rivalId) {
        result = true;
        break;
      }
    }
    return result;
  }

  public hasPlayedRound(round: number): boolean {
    if (this.roundHistory[round] === undefined) {
      return false;
    }
    return true;
  }

  public getWins(): number {
    return this.wins;
  }

  public getLosses(): number {
    return this.losses;
  }

  public getDraws(): number {
    return this.draws;
  }

  public getPoints(): number {
    return this.matchPoints;
  }

  public getId(): number {
    return this.id;
  }

  public getRivalIds(): number[] {
    let rivalIds: number[] = [];
    for (let round in this.roundHistory) {
      rivalIds.push(this.roundHistory[round].rivalId);
    }
    return rivalIds;
  }

  public getRecord(): string {
    return `${this.getWins()} - ${this.getLosses()} - ${this.getDraws()}`;
  }

  public getAltRecord(): string {
    let wins = this.getWins();
    let draws = this.getDraws();
    let result = wins + (wins > 1 ? " wins" : " win");

    if (draws > 0) {
      result += " & " + draws + (draws > 1 ? " draws" : " draw");
    }

    return result;
  }
}
