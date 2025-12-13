// import scrapper library
import * as cheerio from "cheerio";
//import * as fs from "fs";

// result object
const tournament_results = [];

// page to extract data from
const tournament_page = "https://melee.gg/Tournament/View/147883";

// get the inkdeck page of all tournaments
console.log(`Retrieving HTML content for tournament page ${tournament_page}`);
const page_content = await fetch(tournament_page);

// instantiate dom
const $ = cheerio.load(await page_content.text());

// get the main tournament result table out
// by default on opening the page the last result is shown
const tournamentTable = $(
    ".table.dataTable.display.full-width.no-footer"
  );

// now go over all rows and extract ranking, player and statistics
const tableRows = tournamentTable.children("tbody").children("tr");

console.log(`Found ${tableRows.length} entries`);

tableRows.each((index, tableRow) => {
    console.log(`Processing entry ${index + 1} out of ${tableRows.length}`);
    const tournament_result = {};
    // iterate over the cells to get details
    $(tableRow)
      .children("td")
      .each((index, tableCell) => {
        if (index === 0) {
            tournament_result.rank = $(tableCell).text().trim();
        }
        if (index === 1) {
            tournament_result.player = $(tableCell).children("div").first().children("div").first().children("a").first().text().trim();
        }
        if (index === 2) {
            tournament_result.match_record = $(tableCell).text().trim();
        }
        if (index === 3) {
            tournament_result.game_record = $(tableCell).text().trim();
        }
        if (index === 4) {
            tournament_result.points = $(tableCell).text().trim();
        }
        if (index === 5) {
            tournament_result.tie_breaker1 = $(tableCell).text().trim();
        }
        if (index === 6) {
            tournament_result.tie_breaker2 = $(tableCell).text().trim();
        }
        if (index === 7) {
            tournament_result.tie_breaker3 = $(tableCell).text().trim();
        }
      });
    tournament_results.push(tournament_result);
});

console.log(JSON.stringify(tournament_results));
