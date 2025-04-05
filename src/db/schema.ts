import { integer, pgTable, varchar, text } from "drizzle-orm/pg-core";
export const cardsTable = pgTable("cards", {
  id: varchar({ length: 255 }).primaryKey().notNull(),
  rarity: varchar({ length: 5 }).notNull(),
  type: varchar({ length: 25 }).notNull(),
  name: varchar({ length: 50 }).notNull(),
  cost: integer().notNull(),
  attribute: varchar({ length: 25 }).notNull(),
  power: integer().notNull(),
  counter: integer().notNull(),
  colour: varchar({ length: 50 }).notNull(),
  feature: varchar({ length: 50 }).notNull(),
  set: varchar({ length: 50 }).notNull(),
  text: text().notNull(),
});