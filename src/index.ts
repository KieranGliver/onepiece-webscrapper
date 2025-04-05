import { scrapCards, uploadCards } from './card-scrapper';
import { scrapDecks, uploadDecks } from './deck-scrapper';

async function main() {
	// missing OP03-008
	//const allCards = await scrapCards();
	//await uploadCards(allCards);

	const allDecks = await scrapDecks();
	await uploadDecks(allDecks);
}
main();
