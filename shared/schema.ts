import { sql } from "drizzle-orm";
import { pgTable, text, varchar, real, timestamp, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(), // 'deposit' or 'withdrawal'
  amount: real("amount").notNull(),
  fee: real("fee").notNull().default(0),
  netAmount: real("net_amount").notNull(),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  stripePayoutId: text("stripe_payout_id"),
  paymentMethodId: text("payment_method_id"), // For storing withdrawal method ID
  paymentMethodName: text("payment_method_name"), // For storing withdrawal method name
  status: text("status").notNull().default('completed'), // 'pending', 'completed', 'failed'
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const balances = pgTable("balances", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  currentBalance: real("current_balance").notNull().default(0),
  totalAdded: real("total_added").notNull().default(0),
  totalWithdrawn: real("total_withdrawn").notNull().default(0),
  lastUpdated: timestamp("last_updated").notNull().default(sql`now()`),
});

export const userCards = pgTable("user_cards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  cardName: text("card_name").notNull(),
  cardLast4: text("card_last_4").notNull(),
  cardBrand: text("card_brand").notNull(),
  stripeCardId: text("stripe_card_id"), // For storing Stripe card/payment method ID
  isDefault: text("is_default").notNull().default('false'),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Production ledger table for real payouts
export const ledger = pgTable("ledger", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  balance: real("balance").notNull().default(0),
  pendingBalance: real("pending_balance").notNull().default(0),
  completedBalance: real("completed_balance").notNull().default(0),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

export const insertBalanceSchema = createInsertSchema(balances).omit({
  id: true,
  lastUpdated: true,
});

export const insertUserCardSchema = createInsertSchema(userCards).omit({
  id: true,
  createdAt: true,
});

export const insertLedgerSchema = createInsertSchema(ledger).omit({
  id: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Balance = typeof balances.$inferSelect;
export type InsertBalance = z.infer<typeof insertBalanceSchema>;
export type UserCard = typeof userCards.$inferSelect;
export type InsertUserCard = z.infer<typeof insertUserCardSchema>;
export type Ledger = typeof ledger.$inferSelect;
export type InsertLedger = z.infer<typeof insertLedgerSchema>;
