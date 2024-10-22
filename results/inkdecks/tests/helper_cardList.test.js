import IndecksExtractor from "../IndecksExtractor.js";

const cardListTest = await IndecksExtractor.extractCardListFromDeck("https://inkdecks.com/lorcana-metagame/deck-steelsong-305614");

console.log(JSON.stringify(cardListTest, null, 2));