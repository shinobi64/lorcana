import * as fs from "node:fs/promises";

export default class InkdecksConverter {
  static cardReferenceData = {};

  static runConversion = async function (options) {
    console.log(`Starting conversion with ${JSON.stringify(options, null, 2)}`);

    if (options.createTournamentDimension) {
      await InkdecksConverter.convertTournamentDimension(options);
    }

    if (options.createDecklistDimension) {
      await InkdecksConverter.convertDecklistDimension(options);
    }

    if (options.cardsFileName) {
      console.log(`Reading card reference data from ${options.cardsFileName}`);
      const cardData = await fs.readFile(options.cardsFileName, {
        encoding: "utf8",
      });
      InkdecksConverter.cardReferenceData = JSON.parse(cardData);
    }

    if (options.createCardlistFact) {
      await InkdecksConverter.convertCardlistFact(options);
    }

    console.log(`Finished conversion.`);
  };

  static readTournamentData = async function (fileName) {
    console.log(`Reading tournament data from ${fileName}`);
    const tournamentsContent = await fs.readFile(fileName, {
      encoding: "utf8",
    });
    const tournamentList = JSON.parse(tournamentsContent);
    console.log(`Found ${tournamentList.lenght} entries`);
    return tournamentList;
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

  static convertTournamentDimension = async function (options) {
    console.log("Creating tournament dimension data");
    const tournamentList = await InkdecksConverter.readTournamentData(
      options.sourceFileName
    );
    const tournamentDimensionData = [];
    const tournamentDimHeader = [
      "tournamentID",
      "tounamentDate",
      "tournamentTitle",
      "playerCount",
      "playerCountCategory",
      "country",
    ];

    tournamentDimensionData.push(tournamentDimHeader);

    tournamentList.forEach((tournament, index) => {
      console.log(
        `Processing tournament ${index + 1} out of ${tournamentList.length}`
      );
      const tournamentDimRow = [];
      tournamentDimRow.push(tournament.identifier);
      tournamentDimRow.push(tournament.date);
      tournamentDimRow.push(tournament.title.replace(",", ""));
      tournamentDimRow.push(tournament.players.replace(",", ""));
      const playerCount = parseInt(tournament.players.replace(",", ""), 10);
      switch (true) {
        case playerCount <= 16:
          tournamentDimRow.push("0 - 16");
          break;
        case playerCount < 32:
          tournamentDimRow.push("17 - 32");
          break;
        case playerCount < 64:
          tournamentDimRow.push("33 - 64");
          break;
        default:
          tournamentDimRow.push("more than 64");
      }
      tournamentDimRow.push(tournament.country);
      tournamentDimensionData.push(tournamentDimRow);
    });

    await InkdecksConverter.storeResultData(
      options.tournamentDimensionFileName,
      options.persistTournamentDimension,
      tournamentDimensionData
    );
  };

  static convertDecklistDimension = async function (options) {
    console.log("Creating decklist dimension data");
    const tournamentList = await InkdecksConverter.readTournamentData(
      options.sourceFileName
    );
    const decklistDimensionData = [];
    const decklistDimHeader = [
      "tournamentID",
      "decklistID",
      "colorCombination",
      "archeType",
      "rank",
    ];

    decklistDimensionData.push(decklistDimHeader);

    tournamentList.forEach((tournament, index) => {
      console.log(
        `Processing tournament ${index + 1} out of ${tournamentList.length}`
      );
      console.log(`Found ${tournament.decklists.length} decklists`);
      tournament.decklists.forEach((decklist, index) => {
        console.log(
          `Processing decklist ${index + 1} out of ${
            tournament.decklists.length
          }`
        );
        const decklistDimRow = [];
        decklistDimRow.push(tournament.identifier);
        decklistDimRow.push(decklist.identifier);
        const colors = decklist.color.split("/");
        colors.sort();
        decklistDimRow.push(colors.join("/"));
        decklistDimRow.push(decklist.archetype);
        decklistDimRow.push(decklist.rank);
        decklistDimensionData.push(decklistDimRow);
      });
    });

    await InkdecksConverter.storeResultData(
      options.decklistDimensionFileName,
      options.persistDecklistDimension,
      decklistDimensionData
    );
  };

  static lookupCard = function (cardName) {
    if (InkdecksConverter.cardReferenceData) {
      const cardData = InkdecksConverter.cardReferenceData.find(
        (cardReferenceData) => {
          const matchName = cardReferenceData.Name.replaceAll(
            " ",
            ""
          ).toUpperCase();
          const inboundMatch = cardName
            .replaceAll(" ", "")
            .replaceAll("’", "'")
            .replaceAll("é", "e")
            .replaceAll("ā", "a")
            .replaceAll(" ", "")
            .toUpperCase();
          return matchName === inboundMatch;
        }
      );
      if (cardData) {
        return cardData.Unique_ID;
      } else {
        let uniqueId;
        // known exceptions where card data is not matching
        switch (cardName) {
          case "Arthur - King Victorious":
            uniqueId = "SSK-194";
            break;
          case "Kristoff - Official Ice Master":
            uniqueId = "TFC-182";
            break;
          case "Merlin's Cottage - The Wizard's Home":
            uniqueId = "SSK-170";
            break;
          case "Seven Dwarfs' Mine - Secure Fortress":
            uniqueId = "SSK-204";
            break;
          case "Snow White - Fair - Hearted":
            uniqueId = "SSK-183";
            break;
          case "Snowanna Rainbeau - Cool Competitor":
            uniqueId = "SSK-110";
            break;
          case "Benja - Bold Uniter":
            uniqueId = "URS-104";
            break;
        }
        return uniqueId;
      }
    }
  };

  static convertCardlistFact = async function (options) {
    console.log("Creating cardlist data");
    const tournamentList = await InkdecksConverter.readTournamentData(
      options.sourceFileName
    );
    const cardlistFactData = [];
    const cardlistFactHeader = [
      "tournamentID",
      "decklistID",
      "cardUniqueID",
      "cardCount",
    ];
    cardlistFactData.push(cardlistFactHeader);
    tournamentList.forEach((tournament, index) => {
      console.log(
        `Processing tournament ${index + 1} out of ${tournamentList.length}`
      );
      console.log(`Found ${tournament.decklists.length} decklists`);
      tournament.decklists.forEach((decklist, index) => {
        console.log(
          `Processing decklist ${index + 1} out of ${
            tournament.decklists.length
          }`
        );
        decklist.cards.forEach((card, index) => {
          console.log(
            `Processing card ${index + 1} out of ${decklist.cards.length}`
          );
          const cardlistFactRow = [];
          cardlistFactRow.push(tournament.identifier);
          cardlistFactRow.push(decklist.identifier);
          cardlistFactRow.push(InkdecksConverter.lookupCard(card.name));
          cardlistFactRow.push(card.count);
          cardlistFactData.push(cardlistFactRow);
        });
      });
    });
    await InkdecksConverter.storeResultData(
      options.cardlistFactFileName,
      options.persistCardlistFact,
      cardlistFactData
    );
  };
}
