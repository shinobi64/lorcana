import DreambornCardlistConverter from "./DreambornCardlistConverter.js";

// start extractor with default options
const options = {
  createCardDimension: true,
  persistCardDimension: true,
  fetchCardData: false,
  sourceFileName: "cardDetails.json",
  cardDimensionFileName: "dreamborn_cards.csv",
};

console.log(
  `Start processing with options ${JSON.stringify(options, null, 2)}`
);

await DreambornCardlistConverter.runConversion(options);

console.log(`Finished processing.`);
