import { decode } from 'entities';
import { type HTMLElement, parse } from 'node-html-parser';

class Card {
	id = '';
	rarity = '';
	type = '';
	name = '';
	cost = '';
	attribute = '';
	power = '';
	counter = '';
	colour = '';
	feature = '';
	set = '';
	text = '';

	toString(): string {
		return `Card { id: ${this.id}, rarity: ${this.rarity}, type: ${this.type}, name: ${this.name}, cost: ${this.cost}, attribute: ${this.attribute}, power: ${this.power}, counter: ${this.counter}, colour: ${this.colour}, feature: ${this.feature}, set: ${this.set} }`;
	}
}

async function getCardList(set: number): Promise<string> {
	if (set < 1 || set > 10) {
		throw new Error('Set number must be between 1 and 10');
	}

	// pad number with leading zero if less than 10
	const setStr = set < 10 ? `0${set}` : `${set}`;

	const url = `https://en.onepiece-cardgame.com/cardlist/?series=5691${setStr}`;
	const res = await fetch(url);
	if (!res.ok) {
		throw new Error(`HTTP error! status: ${res.status}`);
	}
	return await res.text();
}

function parseCardRoot(cardRoot: HTMLElement): Card[] {
	const ret: Card[] = [];

	const cards = cardRoot.querySelectorAll('.modalCol');

	for (const c of cards) {
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
		cardObj.cost = getText('cost');
		cardObj.attribute = getText('attribute i');
		cardObj.power = getText('power');
		cardObj.counter = getText('counter');
		cardObj.colour = getText('color');
		cardObj.feature = getText('feature');
		cardObj.set = getText('getInfo');
		cardObj.text = getText('text');

		ret.push(cardObj);
	}

	return ret;
}

async function main() {
	const allCards: Card[] = [];

	for (let i = 1; i <= 10; i++) {
		let cardHtml: string;
		try {
			cardHtml = await getCardList(i);
		} catch (error) {
			console.error('Error fetching card list:', error);
			return;
		}
		const cardRoot = parse(cardHtml);
		allCards.push(...parseCardRoot(cardRoot));
	}

	for (const card of allCards) {
		console.log(card.toString());
	}
}

main();
