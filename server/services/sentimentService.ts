import { IStorage } from "../storage";
import { 
  type BudgetSentiment, 
  type InsertBudgetSentiment,
  type BudgetSentimentStats
} from "@shared/schema";

/**
 * Get all sentiment reactions for a budget item
 * 
 * @param storage Storage interface
 * @param budgetItemId ID of the budget item
 * @returns Array of sentiment statistics (emoji and count)
 */
export async function getBudgetItemSentiments(
  storage: IStorage, 
  budgetItemId: number
): Promise<BudgetSentimentStats[]> {
  return await storage.getBudgetSentimentStats(budgetItemId);
}

/**
 * Get a user's sentiment reaction for a specific budget item
 * 
 * @param storage Storage interface
 * @param userId User ID
 * @param budgetItemId Budget item ID
 * @returns The user's sentiment reaction or undefined if none exists
 */
export async function getUserSentiment(
  storage: IStorage, 
  userId: number, 
  budgetItemId: number
): Promise<BudgetSentiment | undefined> {
  return await storage.getBudgetSentimentByUser(userId, budgetItemId);
}

/**
 * Submit or update a sentiment reaction for a budget item
 * 
 * @param storage Storage interface
 * @param userId User ID
 * @param budgetItemId Budget item ID
 * @param sentiment Sentiment emoji name (e.g., 'thumbsUp', 'heart', 'rocket')
 * @returns The created or updated sentiment
 */
export async function submitSentiment(
  storage: IStorage, 
  userId: number, 
  budgetItemId: number, 
  sentiment: string
): Promise<BudgetSentiment> {
  // Check if user already has a sentiment for this item
  const existingSentiment = await storage.getBudgetSentimentByUser(userId, budgetItemId);
  
  if (existingSentiment) {
    // If the sentiment is the same as the existing one, just return it
    if (existingSentiment.sentiment === sentiment) {
      return existingSentiment;
    }
    
    // Otherwise update the sentiment
    return await storage.updateBudgetSentiment(existingSentiment.id, sentiment);
  } else {
    // Create a new sentiment
    const newSentiment: InsertBudgetSentiment = {
      userId,
      budgetItemId,
      sentiment
    };
    
    return await storage.createBudgetSentiment(newSentiment);
  }
}