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
  "playercategory",
  "country",
  "rank",
  "archetype",
  "color",
  "top1",
  "top2",
  "top4",
  "top8",
  "top16",
  "top32",
];

const tournament_data = [];
tournament_data.push(header);

tournament_list.forEach((tournament, index) => {
  console.log(
    `Processing tournament ${index + 1} out of ${tournament_list.length}`
  );
  tournament.decklists.forEach((decklist, index) => {
    const tournament_row = [];
    console.log(
      `Processing decklist ${index + 1} out of ${tournament.decklists.length}`
    );
    tournament_row.push(tournament.date);
    tournament_row.push(tournament.title.replace(",", ""));
    tournament_row.push(tournament.players.replace(",", ""));
    const playerCount = parseInt(tournament.players.replace(",", ""), 10);
    switch (true) {
      case playerCount <= 16:
        tournament_row.push("0 - 16");
        break;
      case playerCount < 32:
        tournament_row.push("17 - 32");
        break;
      case playerCount < 64:
        tournament_row.push("33 - 64");
        break;
      default:
        tournament_row.push("more than 64");
    }
    tournament_row.push(tournament.country);
    tournament_row.push(decklist.rank);
    tournament_row.push(decklist.archetype.replace(",", ""));
    const colors = decklist.color.split("/");
    colors.sort();
    tournament_row.push(colors.join("/"));
    switch (decklist.rank) {
      case "1st":
        tournament_row.push(1); // top1 exclusive
        tournament_row.push(0); // top2 exclusive
        tournament_row.push(0); // top4 exclusive
        tournament_row.push(0); // top8 exclusive
        tournament_row.push(0); // top16 exclusive
        tournament_row.push(0); // top32 exclusive
        break;
      case "2nd":
        tournament_row.push(0); // top1 exclusive
        tournament_row.push(1); // top2 exclusive
        tournament_row.push(0); // top4 exclusive
        tournament_row.push(0); // top8 exclusive
        tournament_row.push(0); // top16 exclusive
        tournament_row.push(0); // top32 exclusive
        break;
      case "3rd":
        tournament_row.push(0); // top1 exclusive
        tournament_row.push(0); // top2 exclusive
        tournament_row.push(1); // top4 exclusive
        tournament_row.push(0); // top8 exclusive
        tournament_row.push(0); // top16 exclusive
        tournament_row.push(0); // top32 exclusive
        break;
      case "Top4":
        tournament_row.push(0); // top1 exclusive
        tournament_row.push(0); // top2 exclusive
        tournament_row.push(1); // top4 exclusive
        tournament_row.push(0); // top8 exclusive
        tournament_row.push(0); // top16 exclusive
        tournament_row.push(0); // top32 exclusive
        break;
      case "Top8":
        tournament_row.push(0); // top1 exclusive
        tournament_row.push(0); // top2 exclusive
        tournament_row.push(0); // top4 exclusive
        tournament_row.push(1); // top8 exclusive
        tournament_row.push(0); // top16 exclusive
        tournament_row.push(0); // top32 exclusive
        break;
      case "Top16":
        tournament_row.push(0); // top1 exclusive
        tournament_row.push(0); // top2 exclusive
        tournament_row.push(0); // top4 exclusive
        tournament_row.push(0); // top8 exclusive
        tournament_row.push(1); // top16 exclusive
        tournament_row.push(0); // top32 exclusive
        break;
      case "Top32":
        tournament_row.push(0); // top1 exclusive
        tournament_row.push(0); // top2 exclusive
        tournament_row.push(0); // top4 exclusive
        tournament_row.push(0); // top8 exclusive
        tournament_row.push(0); // top16 exclusive
        tournament_row.push(1); // top32 exclusive
        break;
      default:
        tournament_row.push(0); // top1 exclusive
        tournament_row.push(0); // top2 exclusive
        tournament_row.push(0); // top4 exclusive
        tournament_row.push(0); // top8 exclusive
        tournament_row.push(0); // top16 exclusive
        tournament_row.push(0); // top32 exclusive
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
