import * as fs from "fs/promises";

const tournament_list_data = await fs.readFile(
  "lorcana_tournaments.json",
  "utf8"
);
const tournament_list = JSON.parse(tournament_list_data);

const header = [
  "date",
  "tournamenttitle",
  "players",
  "country",
  "rank",
  "archetype",
  "color",
  "top2",
  "top4",
  "top8",
];

const tournament_data = [];
tournament_data.push(header);

tournament_list.forEach((tournament, index) => {
  console.log(
    `Processing tournament ${index} out of ${tournament_list.length}`
  );
  tournament.decklists.forEach((decklist, index) => {
    const tournament_row = [];
    console.log(
      `Processing decklist ${index} out of ${tournament.decklists.length}`
    );
    tournament_row.push(tournament.date);
    tournament_row.push(tournament.title);
    tournament_row.push(tournament.players);
    tournament_row.push(tournament.country);
    tournament_row.push(decklist.rank);
    tournament_row.push(decklist.archetype);
    tournament_row.push(decklist.color);
    switch (decklist.rank) {
      case "1st":
        tournament_row.push(1);
        tournament_row.push(1);
        tournament_row.push(1);
        break;
      case "2nd":
        tournament_row.push(1);
        tournament_row.push(1);
        tournament_row.push(1);
        break;
      case "3rd":
        tournament_row.push(0);
        tournament_row.push(1);
        tournament_row.push(1);
        break;
      case "Top4":
        tournament_row.push(0);
        tournament_row.push(1);
        tournament_row.push(1);
        break;
      case "Top8":
        tournament_row.push(0);
        tournament_row.push(0);
        tournament_row.push(1);
        break;
      default:
        tournament_row.push(0);
        tournament_row.push(0);
        tournament_row.push(0);
    }
    tournament_data.push(tournament_row);
  });
});

const tournament_one_lines = tournament_data.map((tournament_row) => {
  return tournament_row.join(",");
});

// writing to output file
await fs.writeFile("lorcana_tournaments.csv", tournament_one_lines.join("\n"));
console.log("Data written to file"); //Display "Data written to file" in the call back function.
