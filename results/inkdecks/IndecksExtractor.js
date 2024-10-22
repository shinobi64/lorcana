import * as cheerio from "cheerio";
import * as fs from "node:fs/promises";

export default class IndecksExtractor {

  static runExtraction = async function(options) {
    let tournamentList = [];
    if (options.fetchTournaments) {
      console.log("Fetching tournaments from InkDecks");
      tournamentList = await IndecksExtractor.extractTournamentsList(options.numberOfPages);
    } else {
      console.log("Reading tournaments from existing file");
      const tournamentsContent = await fs.readFile('lorcana_tournaments.json', { encoding: 'utf8' });
      tournamentList = JSON.parse(tournamentsContent);
    }

    if (options.fetchDecklists) {
      for (let i = 0; i < tournamentList.length; i++) {
        console.log(`Processing tournament ${i + 1} out of ${tournamentList.length}`);  
        tournamentList[i].decklists = await IndecksExtractor.extractDeckListsFromTournament(tournamentList[i].detailsURL);
      }      
    }

    if (options.fetchCards) {
      for (let i = 0; i < tournamentList.length; i++) {
        console.log(`Processing tournament ${i + 1} out of ${tournamentList.length}`);
        for (let j = 0; j < tournamentList[i].decklists.length; j++) {
          console.log(
            `Processing decklist ${j + 1} out of ${
              tournamentList[i].decklists.length
            } with URL ${tournamentList[i].decklists[j].detailsURL}`
          );
          // fill card list details
          tournamentList[i].decklists[j].cards = await IndecksExtractor.extractCardListFromDeck(tournamentList[i].decklists[j].detailsURL);
        }
      }      
    }
    
    await fs.writeFile("lorcana_tournaments.json", JSON.stringify(tournamentList,null,2));
    console.log("Output file written.");
  }

  static extractTournamentsList = async function(numberOfPages) {
    
    // construct number of pages to be retrieved
    let pages = [];
    for (let i = 0; i<numberOfPages;i++) {
      if (i===0) {
        pages.push("https://inkdecks.com/lorcana-tournaments")
      } else {
        pages.push(`https://inkdecks.com/lorcana-tournaments?page=${i+1}`);
      }
    }

    const tournamentList = [];

    // process all requested pages
    for (let i = 0; i<pages.length; i++) {
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

        // tournament id is equivalent to last part of details URL
        tournament.identifier = $(tableRow).attr("data-href").split("/").pop();
        
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
        tournamentList.push(tournament);
      });
    }

    console.log(`Extracted ${tournamentList.length} tournaments`);
    return tournamentList;
  }

  static extractDeckListsFromTournament = async function(tournamentURL) {
    const decklists = [];
    try {
      const tournament_detailspage = await fetch(tournamentURL);
      const $ = cheerio.load(await tournament_detailspage.text());

  const decklist_rows = $(
    ".table.table-vcenter.table-mobile-md.card-table.table-clickable.table-striped"
  )
    .children("tbody")
    .children("tr");

  console.log(`Found ${decklist_rows.length} decklists in tournament ${tournamentURL}`);

  decklist_rows.each((index, decklist_row) => {
    console.log(
      `Processing decklist ${index + 1} out of ${decklist_rows.length}`
    );
    const decklist = {};
    decklist.identifier = $(decklist_row).attr("data-href").split("/").pop();
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
    decklists.push(decklist);
  });
    } catch (err) {
      console.error(`Error while fetching decklists for ${decklistURL}`, err);
    }
    return decklists;
  }

  static extractCardListFromDeck = async function(decklistURL) {
    const cards = [];
    try {
        const decklist_detailspage = await fetch(
            decklistURL
          );
    
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
                    const cardName = $(cardRow_cell).children("a").first().text().trim();
                    const cardNameParts = cardName.split("-");
                    for (let i = 0; i<cardNameParts.length; i++) {
                        cardNameParts[i] = cardNameParts[i].trim();
                    }
                    card.name = cardNameParts.join(" - ");
                  }
                });
      
              // attach the current card
              cards.push(card);
            }
          }); 
    } catch (err) {
        console.error(`Error while fetching card list for ${decklistURL}`, err);
    } 
    return cards;
  }
}
