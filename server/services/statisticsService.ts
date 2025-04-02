import { IStorage } from "../storage";
import { Statistics } from "@shared/schema";

/**
 * Calculate and update statistics for the active budget period
 * @param storage Storage interface
 * @returns Updated statistics object
 */
export async function calculateStatistics(storage: IStorage): Promise<Statistics> {
  try {
    // Get active budget period
    const activePeriod = await storage.getActiveBudgetPeriod();
    if (!activePeriod) {
      throw new Error("No active budget period found");
    }

    // Get existing statistics or create new ones
    let statistics = await storage.getStatistics(activePeriod.id);
    
    // Count total DReps
    const users = await getAllUsers(storage);
    const totalDreps = users.filter(user => user.isDRep).length;
    
    // Count active DReps (those who have voted at least once)
    const allVotes = await storage.getBudgetVotes();
    const uniqueVoterIds = new Set(allVotes.map(vote => vote.userId));
    const activeDreps = uniqueVoterIds.size;
    
    // Calculate total allocated amount based on median votes
    const budgetItems = await storage.getBudgetItems();
    const totalAllocated = budgetItems.reduce(
      (sum, item) => sum + item.currentMedianVote, 
      0
    );
    
    // Calculate percentage of total budget allocated
    const percentageAllocated = activePeriod.totalBudget > 0
      ? Math.round((totalAllocated / activePeriod.totalBudget) * 10000)
      : 0;
    
    // Get category distribution
    const categoryDistribution = await getCategoryDistribution(storage);
    
    if (statistics) {
      // Update existing statistics
      return await storage.updateStatistics(
        statistics.id,
        totalDreps,
        activeDreps,
        totalAllocated,
        percentageAllocated,
        categoryDistribution
      );
    } else {
      // Create new statistics
      return await storage.createStatistics({
        budgetPeriodId: activePeriod.id,
        totalDreps,
        activeDreps,
        totalAllocated,
        percentageAllocated,
        categoryDistribution,
      });
    }
  } catch (error) {
    console.error("Error calculating statistics:", error);
    throw new Error("Failed to calculate statistics");
  }
}

/**
 * Calculate the distribution of funds across categories
 * @param storage Storage interface
 * @returns Object mapping category IDs to allocated amounts
 */
export async function getCategoryDistribution(storage: IStorage): Promise<Record<string, number>> {
  try {
    const budgetItems = await storage.getBudgetItems();
    const categories = await storage.getBudgetCategories();
    
    // Initialize distribution with zero for each category
    const distribution: Record<string, number> = {};
    categories.forEach(category => {
      distribution[category.id.toString()] = 0;
    });
    
    // Sum up median votes by category
    budgetItems.forEach(item => {
      const categoryId = item.categoryId.toString();
      distribution[categoryId] = (distribution[categoryId] || 0) + item.currentMedianVote;
    });
    
    return distribution;
  } catch (error) {
    console.error("Error calculating category distribution:", error);
    throw new Error("Failed to calculate category distribution");
  }
}

/**
 * Helper function to get all users
 * @param storage Storage interface
 * @returns Array of all users
 */
async function getAllUsers(storage: IStorage) {
  // For memory storage, we need to loop through all possible IDs
  // In a real database implementation, we would use a proper query
  const users = [];
  for (let i = 1; i <= 10000; i++) {
    const user = await storage.getUser(i);
    if (user) users.push(user);
    else if (i > 10) break; // Stop after 10 consecutive missing IDs
  }
  return users;
}
