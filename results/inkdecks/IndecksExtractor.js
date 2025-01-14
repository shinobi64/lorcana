import * as cheerio from "cheerio";
import * as fs from "node:fs/promises";

export default class IndecksExtractor {

  static tournamentList = [];

  static initializeTournamentlist = async function (options) {
    if (options.fetchTournaments && !options.delta) {
      return [];
    } else {
      console.log(`Reading tournaments from existing file ${options.fileName}`);
      try {
        const tournamentsContent = await fs.readFile(options.fileName, {
          encoding: "utf8",
        });
        return JSON.parse(tournamentsContent);  
      } catch (err) {
        console.error(`Error while reading from ${options.fileName}`);
        return [];
      }
    }
  }

  static runExtraction = async function (options) {

    /** fill in the initial list of tournaments */
    IndecksExtractor.tournamentList = await IndecksExtractor.initializeTournamentlist(options);

    if (options.fetchTournaments) {
      console.log("Fetching tournaments from InkDecks");
      await IndecksExtractor.extractTournamentsList(
        options
      );
    }

    if (options.fetchDecklists) {
      for (let i = 0; i < IndecksExtractor.tournamentList.length; i++) {
        console.log(
          `Processing tournament ${i + 1} out of ${IndecksExtractor.tournamentList.length}`
        );
        await IndecksExtractor.extractDeckListsFromTournament(
          IndecksExtractor.tournamentList[i],
          options
        );
      }
    }

    if (options.fetchCards) {
      for (let i = 0; i < IndecksExtractor.tournamentList.length; i++) {
        console.log(
          `Processing tournament ${i + 1} out of ${IndecksExtractor.tournamentList.length}`
        );
        for (let j = 0; j < IndecksExtractor.tournamentList[i].decklists.length; j++) {
          console.log(
            `Processing decklist ${j + 1} out of ${
              IndecksExtractor.tournamentList[i].decklists.length
            } with URL ${IndecksExtractor.tournamentList[i].decklists[j].detailsURL}`
          );
          // fill card list details
          await IndecksExtractor.extractCardListFromDeck(
            IndecksExtractor.tournamentList[i].decklists[j]
          );
        }
      }
    }
    if (options.persistOutput) {
      await fs.writeFile(
        options.fileName,
        JSON.stringify(tournamentList, null, 2)
      );
      console.log(`Output file ${options.fileName} written.`);
    }
  };

  /**
   * extract tournaments from indecks listings
   * 
   * either a full list can be created or delta mode will fill in 
   * missing tournaments and missing decklist entries
   * @param {object} options list of options for general processing
   * @returns 
   */
  static extractTournamentsList = async function (options) {
    // construct number of pages to be retrieved
    let pages = [];
    for (let i = 0; i < options.numberOfPages; i++) {
      if (i === 0) {
        pages.push("https://inkdecks.com/lorcana-tournaments");
      } else {
        pages.push(`https://inkdecks.com/lorcana-tournaments?page=${i + 1}`);
      }
    }

    // process all requested pages
    for (let i = 0; i < pages.length; i++) {
      console.log(`Processing page ${i + 1} out of ${pages.length}`);

      // fetch http body and instantiate dom
      const page_content = await fetch(pages[i]);
      const $ = cheerio.load(await page_content.text());

      // find the table of tournaments
      const tournamentTable = $(
        ".table.table-vcenter.table-mobile-md.card-table.table-clickable.table-striped"
      );
      const tableRows = tournamentTable.children("tbody").children("tr");
      console.log(`Found ${tableRows.length} entries`);

      // process all table rows
      tableRows.each((index, tableRow) => {
        console.log(`Processing entry ${index + 1} out of ${tableRows.length}`);

        const tournament = {};
        let tournamentIndex = undefined;

        // tournament id is equivalent to last part of details URL
        tournament.identifier = $(tableRow).attr("data-href").split("/").pop();

        // delta mode - check if we know the tournament already
        if (options.delta) {
          tournamentIndex = IndecksExtractor.tournamentList.findIndex((tournamentEntry) => {
            return tournamentEntry.identifier === tournament.identifier
          });
        }

        if (Number.isNaN(tournamentIndex) || tournamentIndex < 0) {
          $(tableRow)
          .children("td")
          .each((index, tableCell) => {
            if (index === 0) {
              tournament.date = $(tableCell).children("b").first().text();
            }
            if (index === 1) {
              tournament.title = $(tableCell)
                .children("b")
                .first()
                .children("a")
                .first()
                .text();
            }
            if (index === 2) {
              tournament.players = $(tableCell).text();
            }
            if (index === 4) {
              tournament.country = $(tableCell).children("span").last().text();
            }
          });

          tournament.detailsURL =
            "https://inkdecks.com" + $(tableRow).attr("data-href");

          IndecksExtractor.tournamentList.push(tournament);
        } else {
          console.log(`Skip tournament ${tournament.identifier} as it was already present`);
        }
      });
    }
    console.log(`Extracted ${IndecksExtractor.tournamentList.length} tournaments`);
  };

  static extractDeckListsFromTournament = async function (tournament, options) {

    if (!Array.isArray(tournament.decklists)) {
      tournament.decklists = [];
    }

    if (tournament.decklists.length > 0 && !options.force) {
      console.log(`Skip tournament ${tournament.detailsURL} as ${tournament.decklists.length} decklists exist`);
      return;
    }

    try {
      const tournament_detailspage = await fetch(tournament.detailsURL);
      const $ = cheerio.load(await tournament_detailspage.text());

      const decklist_rows = $(
        ".table.table-vcenter.table-mobile-md.card-table.table-clickable.table-striped"
      )
        .children("tbody")
        .children("tr");

      console.log(
        `Found ${decklist_rows.length} decklists in tournament ${tournament.detailsURL}`
      );

      if (tournament.decklists.length !== decklist_rows.length) {
        // decklists deviate - refresh all
        tournament.decklists = [];

        decklist_rows.each((index, decklist_row) => {
          console.log(
            `Processing decklist ${index + 1} out of ${decklist_rows.length}`
          );
          const decklist = {};
          decklist.identifier = $(decklist_row)
            .attr("data-href")
            .split("/")
            .pop();
          decklist.detailsURL = $(decklist_row).attr("data-href");
          $(decklist_row)
            .children("td")
            .each((index, decklist_cell) => {
              if (index === 0) {
                decklist.rank = $(decklist_cell)
                  .children("div")
                  .first()
                  .children("strong")
                  .first()
                  .text();
              }
              if (index === 1) {
                decklist.name = $(decklist_cell).children("a").first().text();
              }
              if (index === 2) {
                decklist.archetype = $(decklist_cell)
                  .children("div")
                  .first()
                  .text()
                  .trim();
                decklist.color =
                  $(decklist_cell).children("img").first().attr("alt") +
                  "/" +
                  $(decklist_cell).children("img").last().attr("alt");
              }
            });
          tournament.decklists.push(decklist);
        });
      } else {
        console.log(`Skipping decklists for ${tournament.detailsURL}`);
      }
    } catch (err) {
      console.error(`Error while fetching decklists for ${tournament.detailsURL}`, err);
    }
  };

  static extractCardListFromDeck = async function (decklist) {

    if (!Array.isArray(decklist.cards)) {
      decklist.cards = [];
    }

    if (decklist.cards.length < 1) {
      try {
        const decklist_detailspage = await fetch(decklist.detailsURL);

        const $ = cheerio.load(await decklist_detailspage.text());

        const cardRows = $("#decklist").children("tbody").children("tr");

        cardRows.each((index, cardRow) => {
          console.log(`Processing card ${index + 1} out of ${cardRows.length}`);
          if ($(cardRow).attr("data-card-type") !== undefined) {
            const card = {};
            card.type = $(cardRow).attr("data-card-type");

            $(cardRow)
              .children("td")
              .each((index, cardRow_cell) => {
                if (index === 1) {
                  card.count = $(cardRow_cell).text().trim();
                }
                if (index === 2) {
                  const cardName = $(cardRow_cell)
                    .children("a")
                    .first()
                    .text()
                    .trim();
                  const cardNameParts = cardName.split("-");
                  for (let i = 0; i < cardNameParts.length; i++) {
                    cardNameParts[i] = cardNameParts[i].trim();
                  }
                  card.name = cardNameParts.join(" - ");
                }
              });

            // attach the current card
            decklist.cards.push(card);
          }
        });
      } catch (err) {
        console.error(`Error while fetching card list for ${decklist.detailsURL}`, err);
      }
    } else {
      console.log(`Skipping decklist ${decklist.detailsURL} as cards are already present`);
    }
  };
}
