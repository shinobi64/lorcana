import * as fs from "node:fs/promises";

export default class InkdecksConverter {
  static runConversion = async function (options) {
    console.log(`Starting conversion with ${JSON.stringify(options, null, 2)}`);

    if (options.createTournamentDimension) {
      await InkdecksConverter.convertTournamentDimension(options);
    }

    if (options.createDecklistDimension) {
      await InkdecksConverter.convertDecklistDimension(options);
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
      "top1",
      "top2",
      "top4",
      "top8",
      "top16",
      "top32",
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
        const topResults = [0, 0, 0, 0, 0, 0];
        switch (decklist.rank) {
          case "1st":
            topResults[0] = 1;
            break;
          case "2nd":
            topResults[1] = 1;
            break;
          case "3rd":
            topResults[2] = 1;
            break;
          case "Top4":
            topResults[2] = 1;
            break;
          case "Top8":
            topResults[3] = 1;
            break;
          case "Top16":
            topResults[4] = 1;
            break;
          case "Top32":
            topResults[5] = 1;
            break;
        }
        decklistDimRow.push(...topResults);

        decklistDimensionData.push(decklistDimRow);
      });
    });

    await InkdecksConverter.storeResultData(
      options.decklistDimensionFileName,
      options.persistDecklistDimension,
      decklistDimensionData
    );
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
      "cardName",
      "cardMatchname",
      "cardCount",
      "cardType",
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
          cardlistFactRow.push(card.name.replaceAll(",", " "));
          cardlistFactRow.push(
            card.name
              .replaceAll(",", "")
              .replaceAll("-", "")
              .replaceAll(" ", "")
              .toUpperCase()
          );
          cardlistFactRow.push(card.count);
          cardlistFactRow.push(card.type);
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