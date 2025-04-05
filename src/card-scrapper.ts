import { eq } from 'drizzle-orm';
import { decode } from 'entities';
import fetch from 'node-fetch';
import { type HTMLElement, parse } from 'node-html-parser';
import { db } from './db/connection';
import { cardsTable } from './db/schema';

export enum seriesPrefix {
	stc = '5690',
	set = '5691',
	eb = '5692',
	prb = '5693',
	pc = '5699',
}
export class Card {
	id = '';
	rarity = '';
	type = '';
	name = '';
	cost = -1;
	attribute = '';
	power = -1;
	counter = -1;
	colour = '';
	feature = '';
	set = '';
	text = '';

	toString(): string {
		return `Card { id: ${this.id}, rarity: ${this.rarity}, type: ${this.type}, name: ${this.name}, cost: ${this.cost}, attribute: ${this.attribute}, power: ${this.power}, counter: ${this.counter}, colour: ${this.colour}, feature: ${this.feature}, set: ${this.set} }`;
	}
}

export async function fetchCardData(
	seriesPrefix: seriesPrefix,
	range: number,
): Promise<string[]> {
	const results: string[] = [];

	for (let i = 1; i <= range; i++) {
		const paddedNumber = i < 10 ? `0${i}` : `${i}`;
		const url = `https://en.onepiece-cardgame.com/cardlist/?series=${seriesPrefix}${paddedNumber}`;
		console.log(`Fetching card list for ${seriesPrefix}${paddedNumber}`);

		const res = await fetch(url);
		if (!res.ok) {
			throw new Error(
				`HTTP error fetching ${seriesPrefix}${paddedNumber} status: ${res.status}`,
			);
		}
		results.push(await res.text());
	}

	return results;
}

export function parseCard(c: HTMLElement): Card {
	const cardObj = new Card();

	cardObj.id = c.getAttribute('id') || '';

	const spans = c.querySelectorAll('span');
	const spanData = [...spans]
		.slice(1, spans.length - 2)
		.map((span) => span.text.trim());
	cardObj.rarity = spanData[0];
	cardObj.type = spanData[1];

	const getText = (cls: string): string => {
		const el = c.querySelector(`div.${cls}`);
		if (!el) return '';

		// Find first child node that is a text node (type === 3)
		const textNode = el.childNodes.find((n) => n.nodeType === 3);
		return decode(textNode?.rawText.trim() || '');
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

export async function scrapCards(): Promise<Card[]> {
	const allCards: Card[] = [];

	// Fetch and parse card STCs
	const stcHtmlLists = await fetchCardData(seriesPrefix.stc, 21);
	for (const listHtml of stcHtmlLists) {
		const cardListRoot = parse(listHtml);
		const cards = cardListRoot.querySelectorAll('.modalCol');
		for (const card of cards) {
			allCards.push(parseCard(card));
		}
	}

	// Fetch and parse card sets
	const setHtmlList = await fetchCardData(seriesPrefix.set, 10);
	for (const listHtml of setHtmlList) {
		const cardListRoot = parse(listHtml);
		const cards = cardListRoot.querySelectorAll('.modalCol');
		for (const card of cards) {
			allCards.push(parseCard(card));
		}
	}

	// Fetch and parse card EB
	const ebHtmlList = await fetchCardData(seriesPrefix.eb, 1);
	for (const listHtml of ebHtmlList) {
		const cardListRoot = parse(listHtml);
		const cards = cardListRoot.querySelectorAll('.modalCol');
		for (const card of cards) {
			allCards.push(parseCard(card));
		}
	}

	// Fetch and parse card PRB
	const prbHtmlList = await fetchCardData(seriesPrefix.prb, 1);
	for (const listHtml of prbHtmlList) {
		const cardListRoot = parse(listHtml);
		const cards = cardListRoot.querySelectorAll('.modalCol');
		for (const card of cards) {
			allCards.push(parseCard(card));
		}
	}

	// Fetch and parse card PC
	const pcHtmlList = await fetchCardData(seriesPrefix.pc, 1);
	for (const listHtml of pcHtmlList) {
		const cardListRoot = parse(listHtml);
		const cards = cardListRoot.querySelectorAll('.modalCol');
		for (const card of cards) {
			allCards.push(parseCard(card));
		}
	}

	return allCards;
}

export async function uploadCards(cards: Card[]) {
	for (const c of cards) {
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