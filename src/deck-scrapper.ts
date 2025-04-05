import { eq } from 'drizzle-orm';
import fetch from 'node-fetch';
import { type HTMLElement, parse } from 'node-html-parser';
import { v4 as uuidv4 } from 'uuid';
import { db } from './db/connection';
import { deckCardsTable, decksTable } from './db/schema';

enum metaUrl {
	OP01 = 'https://onepiecetopdecks.com/deck-list/english-format-op1-and-st1to4-meta-decks/',
	OP02 = 'https://onepiecetopdecks.com/deck-list/en-format-op02-paramount-war-decklist/',
	OP03 = 'https://onepiecetopdecks.com/deck-list/en-format-op03-mighty-enemy-decklist/',
	OP04 = 'https://onepiecetopdecks.com/deck-list/en-format-op04-kingdom-of-intrigue-decklist/',
	OP05 = 'https://onepiecetopdecks.com/deck-list/en-format-op05-awakening-of-the-new-era/',
	OP06 = 'https://onepiecetopdecks.com/deck-list/en-format-op-06-wings-of-the-captain-decks/',
	OP07 = 'https://onepiecetopdecks.com/deck-list/english-op-07-500-years-into-the-future-decks/',
	OP08 = 'https://onepiecetopdecks.com/deck-list/english-op-08-two-legends-decks/',
	OP09 = 'https://onepiecetopdecks.com/deck-list/english-op-09-the-new-emperor-decks/',
	OP10 = 'https://onepiecetopdecks.com/deck-list/english-op-10-the-royal-bloodline-decks/',
}

interface cardQuantity {
	id: string;
	quantity: number;
}

export class Deck {
	leaderCardId = '';
	name = '';
	description = '';
	cards: cardQuantity[] = [];

	toString(): string {
		return `Deck { leaderCardId: ${this.leaderCardId}, name: ${this.name}, description: ${this.description} }`;
	}
}

async function fetchDeckData(url: metaUrl): Promise<string> {
	const res = await fetch(url);
	if (!res.ok) {
		throw new Error(`HTTP error fetching deck data: ${res.status}`);
	}
	return await res.text();
}

function parseDeckList(deckList: HTMLElement): Deck {
	const deckObj = new Deck();

	deckObj.name = deckList.querySelector('td.column-4')?.innerText || '';

	deckObj.description = `created ${deckList.querySelector('td.column-6')?.innerText || ''} by ${deckList.querySelector('td.column-8')?.innerText || ''}`;

	const deckData = deckList.querySelector('td.column-1')?.innerText || '';

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
		const deckListHtml = await fetchDeckData(url);
		const deckListRoot = parse(deckListHtml);
		const deckListTable = deckListRoot.querySelector(
			'tbody.row-hover',
		);

		if (!deckListTable) {
			throw new Error('Deck list table not found for ' + url);
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
			await db.insert(decksTable).values({
				id: deckId,
				leaderCardId: deck.leaderCardId,
				name: deck.name,
				description: deck.description || null,
			});

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
