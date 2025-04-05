import { scrapCards, uploadCards } from './card-scrapper';

async function main() {
	const allCards = await scrapCards();
	await uploadCards(allCards);
}
main();
