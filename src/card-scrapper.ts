import { decode } from 'entities';
import { type HTMLElement, parse } from 'node-html-parser';
import { db } from './db/connection';
import { cardsTable } from './db/schema';
import { eq } from 'drizzle-orm';


export class Card {
    id: string = '';
    rarity: string = '';
    type: string = '';
    name: string = '';
    cost: number = -1;
    attribute: string = '';
    power: number = -1;
    counter: number = -1;
    colour: string = '';
    feature:string = '';
    set:string = '';
    text:string = '';

    toString(): string {
        return `Card { id: ${this.id}, rarity: ${this.rarity}, type: ${this.type}, name: ${this.name}, cost: ${this.cost}, attribute: ${this.attribute}, power: ${this.power}, counter: ${this.counter}, colour: ${this.colour}, feature: ${this.feature}, set: ${this.set} }`;
    }
}

async function getCardSet(set: number): Promise<string> {
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
        cardObj.cost = parseInt(getText('cost'), 10) || 0;
        cardObj.attribute = getText('attribute i');
        cardObj.power = parseInt(getText('power'), 10) || 0;
        cardObj.counter = parseInt(getText('counter'), 10) || 0;
        cardObj.colour = getText('color');
        cardObj.feature = getText('feature');
        cardObj.set = getText('getInfo');
        cardObj.text = getText('text');

        ret.push(cardObj);

        console.log(`Parsed card: ${cardObj.id}`);
    }

    return ret;
}

export async function scrapCards(): Promise<Card[]> {
    const cards: Card[] = [];

    for (let i = 1; i <= 10; i++) {
        console.log(`Fetching card list for set ${i}`);
        let cardHtml: string;
        try {
            cardHtml = await getCardSet(i);
        } catch (error) {
            console.error('Error fetching card list:', error);
            return [];
        }
        const cardRoot = parse(cardHtml);
        cards.push(...parseCardRoot(cardRoot));
    }

    return cards;
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