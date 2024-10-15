// import scrapper library
import * as cheerio from "cheerio";
import * as fs from "fs";

// list of pages to extract
const pages = [
  "https://inkdecks.com/lorcana-tournaments",
  "https://inkdecks.com/lorcana-tournaments?page=2",
  "https://inkdecks.com/lorcana-tournaments?page=3",
  "https://inkdecks.com/lorcana-tournaments?page=4",
  "https://inkdecks.com/lorcana-tournaments?page=5",
  "https://inkdecks.com/lorcana-tournaments?page=6",
  "https://inkdecks.com/lorcana-tournaments?page=7",
  "https://inkdecks.com/lorcana-tournaments?page=8",
];

// output list of tournaments
const tournamentList = [];

for (let i = 0; i < pages.length; i++) {
  // logger
  console.log(`Processing page ${i + 1} out of ${pages.length}`);

  // get the inkdeck page of all tournaments
  const page_content = await fetch(pages[i]);

  // instantiate dom
  const $ = cheerio.load(await page_content.text());

  // extract list of tournament entries
  // main table has classes table table-vcenter table-mobile-md card-table table-clickable table-striped
  const tournamentTable = $(
    ".table.table-vcenter.table-mobile-md.card-table.table-clickable.table-striped"
  );

  // now go over all rows and extract tournament title and player count and country
  const tableRows = tournamentTable.children("tbody").children("tr");

  console.log(`Found ${tableRows.length} entries`);

  tableRows.each((index, tableRow) => {
    console.log(`Processing entry ${index + 1} out of ${tableRows.length}`);
    const tournament = {};
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
    // load the tournament subpage for decklists and results
    tournament.detailsURL =
      "https://inkdecks.com" + $(tableRow).attr("data-href");
    tournamentList.push(tournament);
  });
}

// fetch details for each registered decklist in the tournament
for (let i = 0; i < tournamentList.length; i++) {
  console.log(`Processing tournament ${i + 1} out of ${tournamentList.length}`);
  const tournament_detailspage = await fetch(tournamentList[i].detailsURL);
  const $ = cheerio.load(await tournament_detailspage.text());

  const decklist_rows = $(
    ".table.table-vcenter.table-mobile-md.card-table.table-clickable.table-striped"
  )
    .children("tbody")
    .children("tr");

  console.log(`Found ${decklist_rows.length} decklists in tournament`);

  tournamentList[i].decklists = [];
  decklist_rows.each((index, decklist_row) => {
    console.log(
      `Processing decklist ${index + 1} out of ${decklist_rows.length}`
    );
    const decklist = {};
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
    tournamentList[i].decklists.push(decklist);
  });
}

// writing to output file
fs.writeFile("lorcana_tournaments.json", JSON.stringify(tournamentList), () => {
  //Using the fs.writeFile , it's used to write data in a file
  console.log("Data written to file"); //Display "Data written to file" in the call back function.
});
