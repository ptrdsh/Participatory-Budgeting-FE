import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table - storing DRep information
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  stakeAddress: text("stake_address"),
  walletAddress: text("wallet_address"),
  isDRep: boolean("is_drep").default(false),
  votingPower: integer("voting_power").default(0), // Represents DRep's voting power percentage * 100
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  stakeAddress: true,
  walletAddress: true,
  isDRep: true,
  votingPower: true,
});

// Budget item categories
export const budgetCategories = pgTable("budget_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color").notNull().default("#4570EA"), // Default color for category
});

export const insertBudgetCategorySchema = createInsertSchema(budgetCategories).pick({
  name: true,
  description: true,
  color: true,
});

// Budget items
export const budgetItems = pgTable("budget_items", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  categoryId: integer("category_id").notNull(),
  suggestedAmount: integer("suggested_amount").notNull(), // In lovelace (smallest ADA unit)
  currentMedianVote: integer("current_median_vote").default(0), // In lovelace
  percentageOfSuggested: integer("percentage_of_suggested").default(0), // Percentage * 100
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBudgetItemSchema = createInsertSchema(budgetItems).pick({
  title: true,
  description: true,
  categoryId: true,
  suggestedAmount: true,
});

// Budget item votes by DReps
export const budgetVotes = pgTable("budget_votes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  budgetItemId: integer("budget_item_id").notNull(),
  amount: integer("amount").notNull(), // In lovelace
  transactionHash: text("transaction_hash"), // Cardano transaction hash when submitted to blockchain
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertBudgetVoteSchema = createInsertSchema(budgetVotes).pick({
  userId: true,
  budgetItemId: true,
  amount: true,
  transactionHash: true,
});

// Budget voting period
export const budgetPeriods = pgTable("budget_periods", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  totalBudget: integer("total_budget").notNull(), // In lovelace
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  governanceAction: text("governance_action"),
  active: boolean("active").default(false),
});

export const insertBudgetPeriodSchema = createInsertSchema(budgetPeriods).pick({
  title: true,
  description: true,
  totalBudget: true,
  startDate: true,
  endDate: true,
  governanceAction: true,
  active: true,
});

// Statistics
export const statistics = pgTable("statistics", {
  id: serial("id").primaryKey(),
  budgetPeriodId: integer("budget_period_id").notNull(),
  totalDreps: integer("total_dreps").default(0),
  activeDreps: integer("active_dreps").default(0),
  totalAllocated: integer("total_allocated").default(0), // In lovelace
  percentageAllocated: integer("percentage_allocated").default(0), // Percentage * 100
  categoryDistribution: jsonb("category_distribution"), // JSON object with category allocations
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertStatisticsSchema = createInsertSchema(statistics).pick({
  budgetPeriodId: true,
  totalDreps: true,
  activeDreps: true,
  totalAllocated: true,
  percentageAllocated: true,
  categoryDistribution: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type BudgetCategory = typeof budgetCategories.$inferSelect;
export type InsertBudgetCategory = z.infer<typeof insertBudgetCategorySchema>;

export type BudgetItem = typeof budgetItems.$inferSelect;
export type InsertBudgetItem = z.infer<typeof insertBudgetItemSchema>;

export type BudgetVote = typeof budgetVotes.$inferSelect;
export type InsertBudgetVote = z.infer<typeof insertBudgetVoteSchema>;

export type BudgetPeriod = typeof budgetPeriods.$inferSelect;
export type InsertBudgetPeriod = z.infer<typeof insertBudgetPeriodSchema>;

// Budget item sentiments
export const budgetSentiments = pgTable("budget_sentiments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  budgetItemId: integer("budget_item_id").notNull(),
  sentiment: text("sentiment").notNull(), // Name of the sentiment emoji
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertBudgetSentimentSchema = createInsertSchema(budgetSentiments).pick({
  userId: true,
  budgetItemId: true,
  sentiment: true,
});

// Budget sentiment aggregation
export const budgetSentimentStats = pgTable("budget_sentiment_stats", {
  id: serial("id").primaryKey(),
  budgetItemId: integer("budget_item_id").notNull(),
  sentiment: text("sentiment").notNull(), // Name of the sentiment emoji
  count: integer("count").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertBudgetSentimentStatsSchema = createInsertSchema(budgetSentimentStats).pick({
  budgetItemId: true,
  sentiment: true,
  count: true,
});

export type Statistics = typeof statistics.$inferSelect;
export type InsertStatistics = z.infer<typeof insertStatisticsSchema>;

export type BudgetSentiment = typeof budgetSentiments.$inferSelect;
export type InsertBudgetSentiment = z.infer<typeof insertBudgetSentimentSchema>;

export type BudgetSentimentStats = typeof budgetSentimentStats.$inferSelect;
export type InsertBudgetSentimentStats = z.infer<typeof insertBudgetSentimentStatsSchema>;
