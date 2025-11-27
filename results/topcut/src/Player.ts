import { Logger } from "./Logger";

export class Player {
  private id: number;
  private wins: number;
  private losses: number;
  private draws: number;
  private matchPoints: number;
  private roundHistory: number[];

  public static readonly PENDING_RIVAL = -1;
  public static readonly NO_RIVAL = -99;

  constructor(id) {
    this.id = id;
    this.wins = 0;
    this.losses = 0;
    this.draws = 0;
    this.matchPoints = 0;
    this.roundHistory = [];
  }

  public addPoints(points: number): void {
    this.matchPoints += points;
  }

  public addWins(wins: number): void {
    this.wins += wins;
    this.addPoints(wins * 3);
  }

  public addLosses(losses: number): void {
    this.losses += losses;
  }

  public addDraws(draws: number): void {
    this.draws += draws;
    this.addPoints(draws * 1);
  }

  public addBye(): void {
    this.addWins(1);
  }

  public setRivalId(round: number, rivalId: number): void {
    this.roundHistory[round] = rivalId;
  }

  public hasPlayedAgainst(rivalId: number): boolean {
    let result = false;

    for (let round in this.roundHistory) {
      if (this.roundHistory[round] === rivalId) {
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
      rivalIds.push(this.roundHistory[round]);
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
