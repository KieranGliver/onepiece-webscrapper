import { eq } from 'drizzle-orm';
import { type HTMLElement, parse } from 'node-html-parser';
import { v4 as uuidv4 } from 'uuid';
import { db } from './db/connection';
import { deckCardsTable, decksTable } from './db/schema';
import { type Deck, metaUrl } from './types';
import { fetchText } from './utils';

function parseDeckList(deck: HTMLElement): Deck {
	const deckObj = {} as Deck;

	deckObj.name = deck.querySelector('td.column-4')?.innerText || '';

	deckObj.description = `created ${deck.querySelector('td.column-6')?.innerText || ''} by ${deck.querySelector('td.column-8')?.innerText || ''}`;

	const deckData = deck.querySelector('td.column-1')?.innerText || '';

	if (deckData) {
		// Deckdata is in format: 1nOP01-001a(quantity)n(cardId)a... and so on
		const cardEntries = deckData.split('a');

		const leaderCardEntry = cardEntries.shift();

		if (leaderCardEntry) {
			const leaderQuantity = Number.parseInt(leaderCardEntry[0], 10);
			const leaderCardId = leaderCardEntry.slice(-8);
			if (leaderQuantity === 1) {
				deckObj.leaderCardId = leaderCardId;
			} else {
				console.warn(`Unexpected leader card quantity: ${leaderQuantity}`);
			}
		}

		deckObj.cards = cardEntries.map((entry) => {
			const quantity = Number.parseInt(entry[0], 10);
			const cardId = entry.slice(-8);
			return { id: cardId, quantity };
		});
	}

	return deckObj;
}

export async function scrapDecks() {
	const allDecks: Deck[] = [];

	for (const url of Object.values(metaUrl)) {
		const deckListHtml = await fetchText(url);
		const deckListRoot = parse(deckListHtml);
		const deckListTable = deckListRoot.querySelector('tbody.row-hover');

		if (!deckListTable) {
			console.warn(`No deck list table found for URL: ${url}. Skipping...`);
			continue;
		}

		const deckList = deckListTable.querySelectorAll('tr');

		for (const deck of deckList) {
			const deckObj = parseDeckList(deck);
			allDecks.push(deckObj);
		}
	}

	return allDecks;
}

export async function uploadDecks(decks: Deck[]) {
	for (const deck of decks) {
		const deckId = uuidv4();

		try {
			// Insert deck details into the decks table
			await db.insert(decksTable).values({
				id: deckId,
				leaderCardId: deck.leaderCardId,
				name: deck.name,
				description: deck.description || null,
			});

			// Insert cards into the deckCards table
			for (const card of deck.cards) {
				await db.insert(deckCardsTable).values({
					deckId: deckId,
					cardId: card.id,
					quantity: card.quantity,
				});
			}

			console.log(`Inserted deck: ${deck.name}`);
		} catch (error) {
			console.error(
				`Error uploading deck: ${deck.name} ${deck.description}`,
				error,
			);

			try {
				await db.delete(decksTable).where(eq(decksTable.id, deckId));
				console.log(`Deleted deck: ${deck.name}`);
			} catch (error) {
				console.error(`Error deleting deck: ${deck.name}`, error);
			}
		}
	}

	console.log('All decks uploaded successfully!');
	return true;
}
