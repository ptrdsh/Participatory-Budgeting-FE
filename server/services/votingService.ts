import { IStorage } from "../storage";
import { BudgetVote } from "@shared/schema";
import { updateBudgetItemMedianVote, meetsMinimumThreshold } from "./budgetService";
import { calculateStatistics } from "./statisticsService";
import { generateMockTransactionHash, encodeVoteData } from "./cardanoService";

/**
 * Get all votes from a specific user
 * @param storage Storage interface
 * @param userId ID of the user
 * @returns Array of user's votes
 */
export async function getUserVotes(storage: IStorage, userId: number): Promise<BudgetVote[]> {
  try {
    return await storage.getBudgetVotesByUser(userId);
  } catch (error) {
    console.error(`Error fetching votes for user ${userId}:`, error);
    throw new Error("Failed to fetch user votes");
  }
}

/**
 * Submit a vote for a budget item
 * @param storage Storage interface
 * @param userId ID of the voting user
 * @param budgetItemId ID of the budget item
 * @param amount Amount in lovelace to allocate
 * @returns Object containing the transaction hash
 */
export async function submitVote(
  storage: IStorage,
  userId: number,
  budgetItemId: number,
  amount: number
): Promise<{ txHash: string }> {
  try {
    // Check if budget item exists
    const budgetItem = await storage.getBudgetItem(budgetItemId);
    if (!budgetItem) {
      throw new Error(`Budget item with ID ${budgetItemId} not found`);
    }
    
    // Check if user is a DRep
    const user = await storage.getUser(userId);
    if (!user || !user.isDRep) {
      throw new Error("Only DReps can vote on budget items");
    }
    
    // Check if amount meets minimum threshold requirements
    if (amount > 0) {
      const isValid = await meetsMinimumThreshold(storage, budgetItemId, amount);
      if (!isValid) {
        throw new Error("Proposed amount does not meet minimum threshold requirements");
      }
    }
    
    // Encode vote data for blockchain submission
    const voteData = encodeVoteData(budgetItemId, amount);
    
    // In a real implementation, this would call the Cardano blockchain API
    // For development, generate a mock transaction hash
    const txHash = generateMockTransactionHash();
    
    // Check if user has already voted for this item
    const existingVote = await storage.getBudgetVote(userId, budgetItemId);
    
    if (existingVote) {
      // Update existing vote
      await storage.updateBudgetVote(existingVote.id, amount, txHash);
    } else {
      // Create new vote
      await storage.createBudgetVote({
        userId,
        budgetItemId,
        amount,
        transactionHash: txHash
      });
    }
    
    // Recalculate median vote for the budget item
    await updateBudgetItemMedianVote(storage, budgetItemId);
    
    // Update statistics
    await calculateStatistics(storage);
    
    return { txHash };
  } catch (error) {
    console.error(`Error submitting vote for budget item ${budgetItemId}:`, error);
    throw new Error("Failed to submit vote");
  }
}

/**
 * Submit multiple votes in bulk
 * @param storage Storage interface
 * @param userId ID of the voting user
 * @param votes Array of votes with budget item IDs and amounts
 * @returns Object containing the transaction hash
 */
export async function submitBulkVotes(
  storage: IStorage,
  userId: number,
  votes: { budgetItemId: number, amount: number }[]
): Promise<{ txHash: string }> {
  try {
    // Check if user is a DRep
    const user = await storage.getUser(userId);
    if (!user || !user.isDRep) {
      throw new Error("Only DReps can vote on budget items");
    }
    
    // In a real implementation, this would create a single transaction
    // with metadata for all votes
    // For development, generate a mock transaction hash
    const txHash = generateMockTransactionHash();
    
    // Process each vote
    for (const vote of votes) {
      const { budgetItemId, amount } = vote;
      
      // Check if budget item exists
      const budgetItem = await storage.getBudgetItem(budgetItemId);
      if (!budgetItem) {
        throw new Error(`Budget item with ID ${budgetItemId} not found`);
      }
      
      // Check if amount meets minimum threshold requirements
      if (amount > 0) {
        const isValid = await meetsMinimumThreshold(storage, budgetItemId, amount);
        if (!isValid) {
          throw new Error(`Proposed amount for item ${budgetItemId} does not meet minimum threshold requirements`);
        }
      }
      
      // Check if user has already voted for this item
      const existingVote = await storage.getBudgetVote(userId, budgetItemId);
      
      if (existingVote) {
        // Update existing vote
        await storage.updateBudgetVote(existingVote.id, amount, txHash);
      } else {
        // Create new vote
        await storage.createBudgetVote({
          userId,
          budgetItemId,
          amount,
          transactionHash: txHash
        });
      }
      
      // Recalculate median vote for the budget item
      await updateBudgetItemMedianVote(storage, budgetItemId);
    }
    
    // Update statistics
    await calculateStatistics(storage);
    
    return { txHash };
  } catch (error) {
    console.error(`Error submitting bulk votes:`, error);
    throw new Error("Failed to submit bulk votes");
  }
}
