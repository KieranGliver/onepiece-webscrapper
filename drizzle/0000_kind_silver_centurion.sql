CREATE TABLE "cards" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"rarity" varchar(32) NOT NULL,
	"type" varchar(50) NOT NULL,
	"name" text NOT NULL,
	"cost" integer NOT NULL,
	"attribute" varchar(50) NOT NULL,
	"power" integer NOT NULL,
	"counter" integer NOT NULL,
	"colour" varchar(50) NOT NULL,
	"feature" text NOT NULL,
	"set" text NOT NULL,
	"text" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deck_cards" (
	"deckId" uuid NOT NULL,
	"cardId" varchar(255) NOT NULL,
	"quantity" integer NOT NULL,
	CONSTRAINT "repeat cards" UNIQUE("deckId","cardId"),
	CONSTRAINT "quantity range 1-4" CHECK ("deck_cards"."quantity" >= 1 AND "deck_cards"."quantity" <= 4)
);
--> statement-breakpoint
CREATE TABLE "decks" (
	"id" uuid PRIMARY KEY NOT NULL,
	"leaderCardId" varchar(255) NOT NULL,
	"name" text NOT NULL,
	"description" text
);
--> statement-breakpoint
ALTER TABLE "deck_cards" ADD CONSTRAINT "deck_cards_deckId_decks_id_fk" FOREIGN KEY ("deckId") REFERENCES "public"."decks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deck_cards" ADD CONSTRAINT "deck_cards_cardId_cards_id_fk" FOREIGN KEY ("cardId") REFERENCES "public"."cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deck_cards" ADD CONSTRAINT "deckcard_deck_id_fk" FOREIGN KEY ("deckId") REFERENCES "public"."decks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deck_cards" ADD CONSTRAINT "deckcard_card_id_fk" FOREIGN KEY ("cardId") REFERENCES "public"."cards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decks" ADD CONSTRAINT "decks_leaderCardId_cards_id_fk" FOREIGN KEY ("leaderCardId") REFERENCES "public"."cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decks" ADD CONSTRAINT "deck_leader_id_card_id_fk" FOREIGN KEY ("leaderCardId") REFERENCES "public"."cards"("id") ON DELETE no action ON UPDATE no action;