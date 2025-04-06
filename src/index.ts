import { scrapCards, uploadCards } from './card-scrapper';
import { db } from './db/connection';
import { scrapDecks, uploadDecks } from './deck-scrapper';

async function main() {
	// missing OP03-008
	//const allCards = await scrapCards();
	//await uploadCards(allCards, db);

	const allDecks = await scrapDecks();
	await uploadDecks(allDecks, db);
}
main();
