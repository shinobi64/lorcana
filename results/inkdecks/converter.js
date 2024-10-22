import InkdecksConverter from "./InkdecksConverter.js";

// start extractor with default options
const options = {
  createTournamentDimension: true,
  persistTournamentDimension: true,
  createDecklistDimension: true,
  persistDecklistDimension: true,
  createCardlistFact: true,
  persistCardlistFact: true,
  sourceFileName: "lorcana_tournaments.json",
  tournamentDimensionFileName: "inkdecks_tournaments.csv",
  decklistDimensionFileName: "indecks_decklists.csv",
  cardlistFactFileName: "indecks_cardlists.csv",
}

console.log(`Start processing with options ${JSON.stringify(options,null,2)}`);

await InkdecksConverter.runConversion(options)

console.log(`Finished processing.`);