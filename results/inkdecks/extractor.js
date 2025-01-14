import IndecksExtractor from "./IndecksExtractor.js";

// start extractor with default options
const options = {
  fetchTournaments: true,
  numberOfPages: 70,
  fetchDecklists: true,
  fetchCards: true,
  persistOutput: true,
  delta: true,
  force: false,
  fileName: "lorcana_tournaments.json",
};

console.log(
  `Start processing with options ${JSON.stringify(options, null, 2)}`
);

await IndecksExtractor.runExtraction(options);

console.log(`Finished processing.`);
