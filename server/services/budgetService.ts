import { IStorage } from "../storage";
import { BudgetItem, BudgetCategory, BudgetPeriod } from "@shared/schema";

/**
 * Get all budget items from storage
 * @param storage Storage interface
 * @returns Array of budget items
 */
export async function getBudgetItems(storage: IStorage): Promise<BudgetItem[]> {
  try {
    const items = await storage.getBudgetItems();
    return items;
  } catch (error) {
    console.error("Error fetching budget items:", error);
    throw new Error("Failed to fetch budget items");
  }
}

/**
 * Get all budget categories from storage
 * @param storage Storage interface
 * @returns Array of budget categories
 */
export async function getBudgetCategories(storage: IStorage): Promise<BudgetCategory[]> {
  try {
    const categories = await storage.getBudgetCategories();
    return categories;
  } catch (error) {
    console.error("Error fetching budget categories:", error);
    throw new Error("Failed to fetch budget categories");
  }
}

/**
 * Get the currently active budget period
 * @param storage Storage interface
 * @returns The active budget period or undefined if none is active
 */
export async function getActiveBudgetPeriod(storage: IStorage): Promise<BudgetPeriod | undefined> {
  try {
    const activePeriod = await storage.getActiveBudgetPeriod();
    return activePeriod;
  } catch (error) {
    console.error("Error fetching active budget period:", error);
    throw new Error("Failed to fetch active budget period");
  }
}

/**
 * Update a budget item's median vote amount and percentage
 * This is called after new votes are submitted to recalculate the median
 * 
 * @param storage Storage interface
 * @param budgetItemId ID of the budget item to update
 * @returns Updated budget item
 */
export async function updateBudgetItemMedianVote(
  storage: IStorage,
  budgetItemId: number
): Promise<BudgetItem> {
  try {
    // Get all votes for this item
    const votes = await storage.getBudgetVotesByItem(budgetItemId);
    
    // Get the budget item to access the suggested amount
    const budgetItem = await storage.getBudgetItem(budgetItemId);
    if (!budgetItem) {
      throw new Error(`Budget item with ID ${budgetItemId} not found`);
    }
    
    // If there are no votes, set median to 0
    if (votes.length === 0) {
      return await storage.updateBudgetItemMedianVote(budgetItemId, 0, 0);
    }
    
    // Extract amounts and sort them
    const amounts = votes.map(vote => vote.amount).sort((a, b) => a - b);
    
    // Calculate median based on number of votes
    let medianVote = 0;
    
    // Implement outlier trimming - remove top and bottom 1% of votes
    if (amounts.length > 100) {
      const trimCount = Math.floor(amounts.length * 0.01);
      const trimmedAmounts = amounts.slice(trimCount, amounts.length - trimCount);
      
      // Calculate median from trimmed array
      const mid = Math.floor(trimmedAmounts.length / 2);
      medianVote = trimmedAmounts.length % 2 === 0
        ? Math.floor((trimmedAmounts[mid - 1] + trimmedAmounts[mid]) / 2)
        : trimmedAmounts[mid];
    } else {
      // For smaller datasets, simply use the median without trimming
      const mid = Math.floor(amounts.length / 2);
      medianVote = amounts.length % 2 === 0
        ? Math.floor((amounts[mid - 1] + amounts[mid]) / 2)
        : amounts[mid];
    }
    
    // Calculate percentage of suggested amount
    // Multiply by 100 and round to nearest integer (scaled by 100 for storing 2 decimal places)
    const percentageOfSuggested = budgetItem.suggestedAmount > 0
      ? Math.round((medianVote / budgetItem.suggestedAmount) * 10000)
      : 0;
    
    // Update the budget item with new median and percentage
    return await storage.updateBudgetItemMedianVote(
      budgetItemId, 
      medianVote,
      percentageOfSuggested
    );
  } catch (error) {
    console.error(`Error updating median vote for budget item ${budgetItemId}:`, error);
    throw new Error(`Failed to update median vote for budget item ${budgetItemId}`);
  }
}

/**
 * Check if an amount meets the minimum threshold for funding
 * Implementation of requirement to avoid items getting funded despite majority zeros
 * 
 * @param storage Storage interface
 * @param budgetItemId ID of the budget item
 * @param amount Proposed amount
 * @returns Boolean indicating if the amount meets the threshold
 */
export async function meetsMinimumThreshold(
  storage: IStorage,
  budgetItemId: number,
  amount: number
): Promise<boolean> {
  try {
    // Get all votes for this item
    const votes = await storage.getBudgetVotesByItem(budgetItemId);
    
    // If there are no votes yet, any positive amount is acceptable
    if (votes.length === 0) {
      return amount > 0;
    }
    
    // Count votes with zero amount
    const zeroVotes = votes.filter(vote => vote.amount === 0).length;
    
    // Calculate percentage of zero votes
    const zeroPercentage = (zeroVotes / votes.length) * 100;
    
    // If more than 50% voted zero, reject any amount
    if (zeroPercentage > 50) {
      return false;
    }
    
    // Otherwise, any amount is acceptable
    return true;
  } catch (error) {
    console.error(`Error checking minimum threshold for budget item ${budgetItemId}:`, error);
    throw new Error(`Failed to check minimum threshold for budget item ${budgetItemId}`);
  }
}
