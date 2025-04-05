import { sql } from 'drizzle-orm';
import {
	check,
	foreignKey,
	integer,
	pgTable,
	text,
	unique,
	uuid,
	varchar,
} from 'drizzle-orm/pg-core';
export const cardsTable = pgTable('cards', {
	id: varchar({ length: 255 }).primaryKey().notNull(),
	rarity: varchar({ length: 32 }).notNull(),
	type: varchar({ length: 50 }).notNull(),
	name: text().notNull(),
	cost: integer().notNull(),
	attribute: varchar({ length: 50 }).notNull(),
	power: integer().notNull(),
	counter: integer().notNull(),
	colour: varchar({ length: 50 }).notNull(),
	feature: text().notNull(),
	set: text().notNull(),
	text: text().notNull(),
});

export const decksTable = pgTable(
	'decks',
	{
		id: uuid().primaryKey().notNull(),
		leaderCardId: varchar({ length: 255 })
			.notNull()
			.references(() => cardsTable.id, { onDelete: 'cascade' }),
		name: text().notNull(),
		description: text(),
	},
	(table) => [
		foreignKey({
			columns: [table.leaderCardId],
			foreignColumns: [cardsTable.id],
			name: 'deck_leader_id_card_id_fk',
		}),
	],
);

export const deckCardsTable = pgTable(
	'deck_cards',
	{
		deckId: uuid()
			.notNull()
			.references(() => decksTable.id, { onDelete: 'cascade' }),
		cardId: varchar({ length: 255 })
			.notNull()
			.references(() => cardsTable.id, { onDelete: 'cascade' }),
		quantity: integer().notNull(),
	},
	(table) => [
		foreignKey({
			columns: [table.deckId],
			foreignColumns: [decksTable.id],
			name: 'deckcard_deck_id_fk',
		}),
		foreignKey({
			columns: [table.cardId],
			foreignColumns: [cardsTable.id],
			name: 'deckcard_card_id_fk',
		}),
		unique('repeat cards').on(table.deckId, table.cardId),
		check(
			'quantity range 1-4',
			sql`${table.quantity} >= 1 AND ${table.quantity} <= 4`,
		),
	],
);
