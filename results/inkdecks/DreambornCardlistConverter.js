import * as fs from "node:fs/promises";

export default class DreambornCardlistConverter {

    static runConversion = async function(options) {
        console.log(`Starting conversion with ${JSON.stringify(options,null,2)}`);

        if (options.createCardDimension) {
            await DreambornCardlistConverter.convertCardData(options);
        }
        
        console.log(`Finished conversion.`);

    }

    static readCardData = async function(fileName) {
        console.log(`Reading card data from ${fileName}`);
        const cardlistContent = await fs.readFile(fileName, { encoding: 'utf8' });
        const cardlistData = JSON.parse(cardlistContent);
        console.log(`Found ${cardlistData.lenght} sets`);
        return cardlistData;
    }

    static convertCardData = async function(options) {
        console.log("Creating card dimension data");        
        const cardlistData = await DreambornCardlistConverter.readCardData(options.sourceFileName);
        const cardDimensionData = [];
        const cardDimensionHeader = ["collectorID","set","color","type","inkcost","inkable","cardname","tags","strength","willpower","lore","rarity"];
        cardDimensionData.push(cardDimensionHeader);

        cardlistData.forEach((cardList) => {
            console.log(`Processing data for set ${cardList.name}`);
            Object.keys(cardList.cards).forEach((card) => {
                console.log(`Processing card data for ${cardList.cards[card]}`);
                const cardDimData = [];
                const cardData = cardList.cards[card].split("|");
                if (parseInt(card.split("-")[1],10)<205 && (card.split("-")[1].length === 3 || card.split("-")[1][3] === "a")) {
                    cardDimData.push(card);
                    cardDimData.push(cardList.id);
                    switch(cardData[1]) {
                        case "A":
                            cardDimData.push("amber");
                            break;
                        case "M":
                            cardDimData.push("amethyst");
                            break;
                        case "E":
                            cardDimData.push("emerald");
                            break;
                        case "R":
                            cardDimData.push("ruby");
                            break;
                        case "S":
                            cardDimData.push("sapphire");
                            break;
                        case "T":
                            cardDimData.push("steel");
                            break;
                    }
                    switch(cardData[2]) {
                        case "C":
                            cardDimData.push("character");
                            break;
                        case "AS":
                            cardDimData.push("song");                        
                            break;
                        case "A":
                            cardDimData.push("action");                        
                            break;
                        case "I":
                            cardDimData.push("item");                        
                            break;
                        case "L":
                            cardDimData.push("location");                        
                            break;
                    }
                    const cardCosts = cardData[0];                
                    cardDimData.push(cardCosts.substring(0, cardCosts.length-1));
                    switch (cardCosts.substring(cardCosts.length-1)) {
                        case "T":
                            cardDimData.push(1);
                            break;
                        case "F":
                            cardDimData.push(0);
                            break;
                    }
                    cardDimData.push();
                    switch(cardData[2]) {
                        case "C":
                            cardDimData.push(`${cardData[3].replaceAll(",", " ")} - ${cardData[4].replaceAll(",", " ")}`);
                            break;
                        case "L":
                            cardDimData.push(`${cardData[3].replaceAll(",", " ")} - ${cardData[4].replaceAll(",", " ")}`);
                            break;
                        default:
                            cardDimData.push(cardData[3].replaceAll(",", " "));
                            break;
                    }
                    cardDimData.push(cardData[5].replaceAll(",", "|"));
                    cardDimData.push(cardData[6]);
                    cardDimData.push(cardData[7]);
                    cardDimData.push(cardData[8]);
                    switch(cardData[9]) {
                        case "C":
                            cardDimData.push("common");
                            break;
                        case "U":
                            cardDimData.push("uncommon");
                            break;
                        case "R":
                            cardDimData.push("rare");
                            break;
                        case "S":
                            cardDimData.push("superrare");
                            break;
                        case "L":
                            cardDimData.push("legendary");
                            break;
                        case "E":
                            cardDimData.push("enchanted");
                            break;
                    }
                    cardDimensionData.push(cardDimData);
    
                }
            });
        });

        await DreambornCardlistConverter.storeResultData(options.cardDimensionFileName,options.persistCardDimension,cardDimensionData);
    }

    static storeResultData = async function(fileName, persist, dataRows) {
        const dataLines = dataRows.map((dataRow) => {
            return dataRow.join(",");
        });    
        if (persist) {
            await fs.writeFile(fileName, dataLines.join("\n"));
            console.log(`Data written to ${fileName}`);
        } else {
            console.log(dataLines.join("\n"));
        }        
    }

}