import { integer, pgTable, varchar, text } from "drizzle-orm/pg-core";
export const cardsTable = pgTable("cards", {
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
  set: varchar({ length: 50 }).notNull(),
  text: text().notNull(),
});