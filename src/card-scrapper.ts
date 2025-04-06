import { eq } from 'drizzle-orm';
import type { drizzle } from 'drizzle-orm/neon-http';
import { type HTMLElement, parse } from 'node-html-parser';
import { cardsTable } from './db/schema';
import { type Card, seriesPrefix } from './types';
import { fetchText } from './utils';

export async function fetchCardData(
	prefix: seriesPrefix,
	range: number,
	fetchFunc: (url: string) => Promise<string> = fetchText,
): Promise<string[]> {
	const results: string[] = [];

	// Validate the params
	if (!prefix) {
		console.warn('Prefix is required');
		return results;
	}
	if (range === undefined || Number.isNaN(range)) {
		console.warn('Range is required');
		return results;
	}
	// Validate the range based on prefix
	if (range < 1) {
		console.warn('Range must be greater than 0');
		return results;
	}
	if (prefix === seriesPrefix.stc) {
		if (range > 21) {
			console.warn('Range must be less than 21 for stc');
			return results;
		}
	} else if (prefix === seriesPrefix.set) {
		if (range > 10) {
			console.warn('Range must be less than 10 for set');
			return results;
		}
	} else if (range > 1) {
		console.warn('Range must be 1 for eb, prb and pc');
		return results;
	}

	for (let i = 1; i <= range; i++) {
		// Number must be 2 digits
		const paddedNumber = i < 10 ? `0${i}` : `${i}`;
		const url = `https://en.onepiece-cardgame.com/cardlist/?series=${prefix}${paddedNumber}`;

		console.log(`Fetching card list for ${prefix}${paddedNumber}`);

		try {
			const cardListHtml = await fetchFunc(url);
			if (cardListHtml) {
				results.push(cardListHtml);
			} else if (cardListHtml === '') {
				console.warn(`No data found for ${prefix}${paddedNumber}`);
			} else {
				console.warn(`Unexpected data format for ${prefix}${paddedNumber}`);
			}
		} catch (error) {
			console.error(
				`Error fetching card list for ${prefix}${paddedNumber}:`,
				error,
			);
		}
	}

	return results;
}

export function parseCard(c: HTMLElement): Card {
	const cardObj: Card = {} as Card;

	cardObj.id = c.getAttribute('id') || '';

	// Parse the card rarity and type from the spans
	const spans = c.querySelectorAll('span');
	const spanData = [...spans]
		.slice(1, spans.length - 2)
		.map((span) => span.text.trim());

	cardObj.rarity = spanData[0];
	cardObj.type = spanData[1];

	// Helper function to get text from a specific class
	const getText = (cls: string): string => {
		const el = c.querySelector(`div.${cls}`);

		if (!el) return '';

		// Find first child node that is a text node (type === 3)
		const textNode = el.childNodes.find((n) => n.nodeType === 3);
		return textNode?.rawText.trim() || '';
	};

	cardObj.name = getText('cardName');
	cardObj.cost = Number.parseInt(getText('cost'), 10) || 0;
	cardObj.attribute = getText('attribute i');
	cardObj.power = Number.parseInt(getText('power'), 10) || 0;
	cardObj.counter = Number.parseInt(getText('counter'), 10) || 0;
	cardObj.colour = getText('color');
	cardObj.feature = getText('feature');
	cardObj.set = getText('getInfo');
	cardObj.text = getText('text');

	console.log(`Parsed card: ${cardObj.id}`);

	return cardObj;
}

export function parseCardList(cardListHtml: string): Card[] {
	const ret: Card[] = [];

	const htmlRoot = parse(cardListHtml);
	const cardListRoot = htmlRoot.querySelectorAll('.modalCol');
	for (const cardRoot of cardListRoot) {
		const card = parseCard(cardRoot);
		ret.push(card);
	}

	return ret;
}

export async function scrapCards(): Promise<Card[]> {
	const allCards: Card[] = [];

	// Fetch and parse card STCs
	const stcHtmlLists = await fetchCardData(seriesPrefix.stc, 21);
	for (const cardListHtml of stcHtmlLists) {
		allCards.push(...parseCardList(cardListHtml));
	}

	// Fetch and parse card sets
	const setHtmlList = await fetchCardData(seriesPrefix.set, 10);
	for (const cardListHtml of setHtmlList) {
		allCards.push(...parseCardList(cardListHtml));
	}

	// Fetch and parse card EB
	const ebHtmlList = await fetchCardData(seriesPrefix.eb, 1);
	for (const cardListHtml of ebHtmlList) {
		allCards.push(...parseCardList(cardListHtml));
	}

	// Fetch and parse card PRB
	const prbHtmlList = await fetchCardData(seriesPrefix.prb, 1);
	for (const cardListHtml of prbHtmlList) {
		allCards.push(...parseCardList(cardListHtml));
	}

	// Fetch and parse card PC
	const pcHtmlList = await fetchCardData(seriesPrefix.pc, 1);
	for (const cardListHtml of pcHtmlList) {
		allCards.push(...parseCardList(cardListHtml));
	}

	return allCards;
}

export async function uploadCards(
	cards: Card[],
	db: ReturnType<typeof drizzle>,
) {
	for (const c of cards) {
		// Check if the card already exists in the database
		// If it does, skip the insertion
		try {
			const existingCard = await db
				.select()
				.from(cardsTable)
				.where(eq(cardsTable.id, c.id))
				.limit(1);

			if (existingCard.length > 0) {
				console.log(`Card with ID ${c.id} already exists, skipping...`);
				continue;
			}
		} catch (error) {
			console.error(`Error checking for existing card: ${c.id}`, error);
			continue;
		}

		// Insert cards into the database
		try {
			await db.insert(cardsTable).values(c);
			console.log(`Inserted card: ${c.id}`);
		} catch (error) {
			console.error(`Error inserting card: ${c.name}`, error);
			return false;
		}
	}

	console.log('All cards inserted successfully');
	return true;
}
