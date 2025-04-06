export enum seriesPrefix {
	stc = '5690',
	set = '5691',
	eb = '5692',
	prb = '5693',
	pc = '5699',
}

export enum metaUrl {
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

export type Card = {
	id: string;
	rarity: string;
	type: string;
	name: string;
	cost: number;
	attribute: string;
	power: number;
	counter: number;
	colour: string;
	feature: string;
	set: string;
	text: string;
};

export interface cardQuantity {
	id: string;
	quantity: number;
}

export type Deck = {
	leaderCardId: string;
	name: string;
	description: string;
	cards: cardQuantity[];
};
