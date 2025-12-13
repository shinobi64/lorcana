import * as fs from "node:fs/promises";

export default class DreambornCardlistConverter {
  static runConversion = async function (options) {
    console.log(`Starting conversion with ${JSON.stringify(options, null, 2)}`);

    if (options.fetchCardData) {
      await DreambornCardlistConverter.fetchCardData(options);
    }

    if (options.createCardDimension) {
      await DreambornCardlistConverter.convertCardData(options);
    }
    console.log(`Finished conversion.`);
  };

  static fetchCardData = async function (options) {
    console.log(`Fetching card data from Lorcana API`);
    const cardDataContent = await fetch(
      "https://api.lorcana-api.com/bulk/cards"
    );
    await fs.writeFile(options.sourceFileName, await cardDataContent.text());
  };

  static readCardData = async function (fileName) {
    console.log(`Reading card data from ${fileName}`);
    const cardlistContent = await fs.readFile(fileName, { encoding: "utf8" });
    const cardlistData = JSON.parse(cardlistContent);
    console.log(`Found ${cardlistData.lenght} cards`);
    return cardlistData;
  };

  static convertCardData = async function (options) {
    console.log("Creating card dimension data");
    const cardlistData = await DreambornCardlistConverter.readCardData(
      options.sourceFileName
    );
    const cardDimensionData = [];
    const cardDimensionHeader = [
      "collectorID",
      "set",
      "color",
      "type",
      "inkcost",
      "inkable",
      "cardname",
      "tags",
      "strength",
      "willpower",
      "lore",
      "rarity",
    ];
    cardDimensionData.push(cardDimensionHeader);

    cardlistData.forEach((card) => {
      console.log(`Processing ${card.Unique_ID}`);
      const cardDimData = [];
      cardDimData.push(card.Unique_ID);
      cardDimData.push(`Set${card.Set_Num}`);
      cardDimData.push(card.Color);
      cardDimData.push(card.Type);
      cardDimData.push(card.Cost);
      cardDimData.push(card.Inkable ? 1 : 0);
      cardDimData.push(card.Name.replaceAll(",", " "));
      cardDimData.push(
        card.Classifications
          ? card.Classifications.replaceAll(",", "|")
          : card.Classifications
      );
      cardDimData.push(card.Strength);
      cardDimData.push(card.Willpower);
      cardDimData.push(card.Lore);
      cardDimData.push(card.Rarity);
      cardDimensionData.push(cardDimData);
    });

    await DreambornCardlistConverter.storeResultData(
      options.cardDimensionFileName,
      options.persistCardDimension,
      cardDimensionData
    );
  };

  static storeResultData = async function (fileName, persist, dataRows) {
    const dataLines = dataRows.map((dataRow) => {
      return dataRow.join(",");
    });
    if (persist) {
      await fs.writeFile(fileName, dataLines.join("\n"));
      console.log(`Data written to ${fileName}`);
    } else {
      console.log(dataLines.join("\n"));
    }
  };
}
