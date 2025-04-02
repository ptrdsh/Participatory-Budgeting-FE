import { 
  users, 
  budgetCategories, 
  budgetItems, 
  budgetVotes, 
  budgetPeriods,
  statistics,
  budgetSentiments,
  budgetSentimentStats,
  type User, type InsertUser,
  type BudgetCategory, type InsertBudgetCategory,
  type BudgetItem, type InsertBudgetItem,
  type BudgetVote, type InsertBudgetVote,
  type BudgetPeriod, type InsertBudgetPeriod,
  type Statistics, type InsertStatistics,
  type BudgetSentiment, type InsertBudgetSentiment,
  type BudgetSentimentStats, type InsertBudgetSentimentStats
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByWalletAddress(walletAddress: string): Promise<User | undefined>;
  getUserByStakeAddress(stakeAddress: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserDRepStatus(id: number, isDRep: boolean, votingPower: number): Promise<User>;

  // Budget category operations
  getBudgetCategories(): Promise<BudgetCategory[]>;
  getBudgetCategory(id: number): Promise<BudgetCategory | undefined>;
  createBudgetCategory(category: InsertBudgetCategory): Promise<BudgetCategory>;

  // Budget item operations
  getBudgetItems(): Promise<BudgetItem[]>;
  getBudgetItem(id: number): Promise<BudgetItem | undefined>;
  getBudgetItemsByCategory(categoryId: number): Promise<BudgetItem[]>;
  createBudgetItem(item: InsertBudgetItem): Promise<BudgetItem>;
  updateBudgetItemMedianVote(id: number, medianVote: number, percentageOfSuggested: number): Promise<BudgetItem>;

  // Budget vote operations
  getBudgetVotes(): Promise<BudgetVote[]>;
  getBudgetVotesByUser(userId: number): Promise<BudgetVote[]>;
  getBudgetVotesByItem(budgetItemId: number): Promise<BudgetVote[]>;
  getBudgetVote(userId: number, budgetItemId: number): Promise<BudgetVote | undefined>;
  createBudgetVote(vote: InsertBudgetVote): Promise<BudgetVote>;
  updateBudgetVote(id: number, amount: number, transactionHash?: string): Promise<BudgetVote>;

  // Budget period operations
  getBudgetPeriods(): Promise<BudgetPeriod[]>;
  getActiveBudgetPeriod(): Promise<BudgetPeriod | undefined>;
  getBudgetPeriod(id: number): Promise<BudgetPeriod | undefined>;
  createBudgetPeriod(period: InsertBudgetPeriod): Promise<BudgetPeriod>;
  updateBudgetPeriodStatus(id: number, active: boolean): Promise<BudgetPeriod>;

  // Statistics operations
  getStatistics(budgetPeriodId: number): Promise<Statistics | undefined>;
  createStatistics(stats: InsertStatistics): Promise<Statistics>;
  updateStatistics(
    id: number, 
    totalDreps: number, 
    activeDreps: number, 
    totalAllocated: number, 
    percentageAllocated: number,
    categoryDistribution: any
  ): Promise<Statistics>;
  
  // Budget sentiment operations
  getBudgetSentimentsByItem(budgetItemId: number): Promise<BudgetSentiment[]>;
  getBudgetSentimentByUser(userId: number, budgetItemId: number): Promise<BudgetSentiment | undefined>;
  createBudgetSentiment(sentiment: InsertBudgetSentiment): Promise<BudgetSentiment>;
  updateBudgetSentiment(id: number, sentiment: string): Promise<BudgetSentiment>;
  
  // Budget sentiment statistics operations
  getBudgetSentimentStats(budgetItemId: number): Promise<BudgetSentimentStats[]>;
  updateBudgetSentimentStats(budgetItemId: number, sentiment: string, count: number): Promise<BudgetSentimentStats>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private budgetCategories: Map<number, BudgetCategory>;
  private budgetItems: Map<number, BudgetItem>;
  private budgetVotes: Map<number, BudgetVote>;
  private budgetPeriods: Map<number, BudgetPeriod>;
  private statisticsData: Map<number, Statistics>;
  private budgetSentiments: Map<number, BudgetSentiment>;
  private budgetSentimentStatsData: Map<number, BudgetSentimentStats>;
  private currentId: Record<string, number>;

  constructor() {
    this.users = new Map();
    this.budgetCategories = new Map();
    this.budgetItems = new Map();
    this.budgetVotes = new Map();
    this.budgetPeriods = new Map();
    this.statisticsData = new Map();
    this.budgetSentiments = new Map();
    this.budgetSentimentStatsData = new Map();
    this.currentId = {
      users: 1,
      budgetCategories: 1,
      budgetItems: 1,
      budgetVotes: 1,
      budgetPeriods: 1,
      statistics: 1,
      budgetSentiments: 1,
      budgetSentimentStats: 1
    };

    // Initialize with mock data for development
    this.initializeMockData();
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async getUserByWalletAddress(walletAddress: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.walletAddress === walletAddress
    );
  }

  async getUserByStakeAddress(stakeAddress: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.stakeAddress === stakeAddress
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId.users++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async updateUserDRepStatus(id: number, isDRep: boolean, votingPower: number): Promise<User> {
    const user = await this.getUser(id);
    if (!user) {
      throw new Error(`User with ID ${id} not found`);
    }

    const updatedUser = { ...user, isDRep, votingPower };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Budget category operations
  async getBudgetCategories(): Promise<BudgetCategory[]> {
    return Array.from(this.budgetCategories.values());
  }

  async getBudgetCategory(id: number): Promise<BudgetCategory | undefined> {
    return this.budgetCategories.get(id);
  }

  async createBudgetCategory(insertCategory: InsertBudgetCategory): Promise<BudgetCategory> {
    const id = this.currentId.budgetCategories++;
    const category: BudgetCategory = { ...insertCategory, id };
    this.budgetCategories.set(id, category);
    return category;
  }

  // Budget item operations
  async getBudgetItems(): Promise<BudgetItem[]> {
    return Array.from(this.budgetItems.values());
  }

  async getBudgetItem(id: number): Promise<BudgetItem | undefined> {
    return this.budgetItems.get(id);
  }

  async getBudgetItemsByCategory(categoryId: number): Promise<BudgetItem[]> {
    return Array.from(this.budgetItems.values()).filter(
      (item) => item.categoryId === categoryId
    );
  }

  async createBudgetItem(insertItem: InsertBudgetItem): Promise<BudgetItem> {
    const id = this.currentId.budgetItems++;
    const now = new Date();
    const item: BudgetItem = { 
      ...insertItem, 
      id, 
      currentMedianVote: 0, 
      percentageOfSuggested: 0, 
      createdAt: now 
    };
    this.budgetItems.set(id, item);
    return item;
  }

  async updateBudgetItemMedianVote(id: number, medianVote: number, percentageOfSuggested: number): Promise<BudgetItem> {
    const item = await this.getBudgetItem(id);
    if (!item) {
      throw new Error(`Budget item with ID ${id} not found`);
    }

    const updatedItem = { 
      ...item, 
      currentMedianVote: medianVote, 
      percentageOfSuggested 
    };
    this.budgetItems.set(id, updatedItem);
    return updatedItem;
  }

  // Budget vote operations
  async getBudgetVotes(): Promise<BudgetVote[]> {
    return Array.from(this.budgetVotes.values());
  }

  async getBudgetVotesByUser(userId: number): Promise<BudgetVote[]> {
    return Array.from(this.budgetVotes.values()).filter(
      (vote) => vote.userId === userId
    );
  }

  async getBudgetVotesByItem(budgetItemId: number): Promise<BudgetVote[]> {
    return Array.from(this.budgetVotes.values()).filter(
      (vote) => vote.budgetItemId === budgetItemId
    );
  }

  async getBudgetVote(userId: number, budgetItemId: number): Promise<BudgetVote | undefined> {
    return Array.from(this.budgetVotes.values()).find(
      (vote) => vote.userId === userId && vote.budgetItemId === budgetItemId
    );
  }

  async createBudgetVote(insertVote: InsertBudgetVote): Promise<BudgetVote> {
    const id = this.currentId.budgetVotes++;
    const now = new Date();
    const vote: BudgetVote = { 
      ...insertVote, 
      id, 
      createdAt: now, 
      updatedAt: now 
    };
    this.budgetVotes.set(id, vote);
    return vote;
  }

  async updateBudgetVote(id: number, amount: number, transactionHash?: string): Promise<BudgetVote> {
    const vote = Array.from(this.budgetVotes.values()).find(v => v.id === id);
    if (!vote) {
      throw new Error(`Budget vote with ID ${id} not found`);
    }

    const updatedVote = { 
      ...vote, 
      amount, 
      transactionHash: transactionHash || vote.transactionHash,
      updatedAt: new Date() 
    };
    this.budgetVotes.set(id, updatedVote);
    return updatedVote;
  }

  // Budget period operations
  async getBudgetPeriods(): Promise<BudgetPeriod[]> {
    return Array.from(this.budgetPeriods.values());
  }

  async getActiveBudgetPeriod(): Promise<BudgetPeriod | undefined> {
    return Array.from(this.budgetPeriods.values()).find(
      (period) => period.active
    );
  }

  async getBudgetPeriod(id: number): Promise<BudgetPeriod | undefined> {
    return this.budgetPeriods.get(id);
  }

  async createBudgetPeriod(insertPeriod: InsertBudgetPeriod): Promise<BudgetPeriod> {
    const id = this.currentId.budgetPeriods++;
    const period: BudgetPeriod = { ...insertPeriod, id };
    this.budgetPeriods.set(id, period);
    return period;
  }

  async updateBudgetPeriodStatus(id: number, active: boolean): Promise<BudgetPeriod> {
    const period = await this.getBudgetPeriod(id);
    if (!period) {
      throw new Error(`Budget period with ID ${id} not found`);
    }

    // If activating this period, deactivate all others
    if (active) {
      for (const [periodId, existingPeriod] of this.budgetPeriods.entries()) {
        if (periodId !== id && existingPeriod.active) {
          this.budgetPeriods.set(periodId, { ...existingPeriod, active: false });
        }
      }
    }

    const updatedPeriod = { ...period, active };
    this.budgetPeriods.set(id, updatedPeriod);
    return updatedPeriod;
  }

  // Statistics operations
  async getStatistics(budgetPeriodId: number): Promise<Statistics | undefined> {
    return Array.from(this.statisticsData.values()).find(
      (stat) => stat.budgetPeriodId === budgetPeriodId
    );
  }

  async createStatistics(insertStats: InsertStatistics): Promise<Statistics> {
    const id = this.currentId.statistics++;
    const stats: Statistics = { 
      ...insertStats, 
      id, 
      updatedAt: new Date() 
    };
    this.statisticsData.set(id, stats);
    return stats;
  }

  async updateStatistics(
    id: number, 
    totalDreps: number, 
    activeDreps: number, 
    totalAllocated: number, 
    percentageAllocated: number,
    categoryDistribution: any
  ): Promise<Statistics> {
    const stats = Array.from(this.statisticsData.values()).find(s => s.id === id);
    if (!stats) {
      throw new Error(`Statistics with ID ${id} not found`);
    }

    const updatedStats = { 
      ...stats, 
      totalDreps, 
      activeDreps, 
      totalAllocated, 
      percentageAllocated,
      categoryDistribution,
      updatedAt: new Date() 
    };
    this.statisticsData.set(id, updatedStats);
    return updatedStats;
  }
  
  // Budget sentiment operations
  async getBudgetSentimentsByItem(budgetItemId: number): Promise<BudgetSentiment[]> {
    return Array.from(this.budgetSentiments.values()).filter(
      (sentiment) => sentiment.budgetItemId === budgetItemId
    );
  }
  
  async getBudgetSentimentByUser(userId: number, budgetItemId: number): Promise<BudgetSentiment | undefined> {
    return Array.from(this.budgetSentiments.values()).find(
      (sentiment) => sentiment.userId === userId && sentiment.budgetItemId === budgetItemId
    );
  }
  
  async createBudgetSentiment(insertSentiment: InsertBudgetSentiment): Promise<BudgetSentiment> {
    const id = this.currentId.budgetSentiments++;
    const now = new Date();
    const sentiment: BudgetSentiment = { 
      ...insertSentiment, 
      id, 
      createdAt: now 
    };
    this.budgetSentiments.set(id, sentiment);
    
    // Update sentiment stats
    await this.updateBudgetSentimentStats(
      insertSentiment.budgetItemId,
      insertSentiment.sentiment,
      1
    );
    
    return sentiment;
  }
  
  async updateBudgetSentiment(id: number, sentiment: string): Promise<BudgetSentiment> {
    const existingSentiment = Array.from(this.budgetSentiments.values()).find(s => s.id === id);
    if (!existingSentiment) {
      throw new Error(`Budget sentiment with ID ${id} not found`);
    }
    
    // Decrement count for old sentiment
    const oldSentimentStats = Array.from(this.budgetSentimentStatsData.values()).find(
      (stats) => stats.budgetItemId === existingSentiment.budgetItemId && 
                stats.sentiment === existingSentiment.sentiment
    );
    
    if (oldSentimentStats && oldSentimentStats.count > 0) {
      await this.updateBudgetSentimentStats(
        existingSentiment.budgetItemId,
        existingSentiment.sentiment,
        oldSentimentStats.count - 1
      );
    }
    
    // Increment count for new sentiment
    await this.updateBudgetSentimentStats(
      existingSentiment.budgetItemId,
      sentiment,
      1
    );
    
    const updatedSentiment = { 
      ...existingSentiment, 
      sentiment,
      updatedAt: new Date() 
    };
    this.budgetSentiments.set(id, updatedSentiment);
    return updatedSentiment;
  }
  
  // Budget sentiment statistics operations
  async getBudgetSentimentStats(budgetItemId: number): Promise<BudgetSentimentStats[]> {
    return Array.from(this.budgetSentimentStatsData.values()).filter(
      (stats) => stats.budgetItemId === budgetItemId
    );
  }
  
  async updateBudgetSentimentStats(budgetItemId: number, sentiment: string, count: number): Promise<BudgetSentimentStats> {
    const existingStats = Array.from(this.budgetSentimentStatsData.values()).find(
      (stats) => stats.budgetItemId === budgetItemId && stats.sentiment === sentiment
    );
    
    if (existingStats) {
      const updatedStats = { 
        ...existingStats, 
        count: count === 1 ? existingStats.count + 1 : count,
        updatedAt: new Date() 
      };
      this.budgetSentimentStatsData.set(existingStats.id, updatedStats);
      return updatedStats;
    } else {
      // Create new stats entry
      const id = this.currentId.budgetSentimentStats++;
      const now = new Date();
      const newStats: BudgetSentimentStats = {
        id,
        budgetItemId,
        sentiment,
        count,
        createdAt: now,
        updatedAt: now
      };
      this.budgetSentimentStatsData.set(id, newStats);
      return newStats;
    }
  }

  // Initialize with mock data for development
  private initializeMockData() {
    // Create budget categories
    const categories = [
      { id: 1, name: 'Infrastructure', description: 'Network infrastructure support', color: 'green-800' },
      { id: 2, name: 'Developer Ecosystem', description: 'Support for developers', color: 'blue-800' },
      { id: 3, name: 'Community & Education', description: 'Community growth and education', color: 'purple-800' },
      { id: 4, name: 'Governance', description: 'Governance infrastructure', color: 'yellow-800' },
    ];

    categories.forEach(category => {
      this.budgetCategories.set(category.id, category as BudgetCategory);
    });
    this.currentId.budgetCategories = categories.length + 1;

    // Create budget period
    const now = new Date();
    const startDate = new Date();
    startDate.setDate(now.getDate() - 15); // Started 15 days ago
    const endDate = new Date();
    endDate.setDate(now.getDate() + 21); // Ends in 21 days

    const budgetPeriod: BudgetPeriod = {
      id: 1,
      title: '2025 Treasury Budget Allocation',
      description: 'Annual budget for Cardano treasury allocations',
      totalBudget: 250000000000000, // 250M ADA in lovelace
      startDate,
      endDate,
      governanceAction: 'TreasuryWithdrawal_2025_01',
      active: true,
    };
    this.budgetPeriods.set(budgetPeriod.id, budgetPeriod);
    this.currentId.budgetPeriods = 2;

    // Create budget items
    const items = [
      {
        id: 1, 
        title: 'Node Operation Incentives', 
        description: 'Rewards for stable network infrastructure operators',
        categoryId: 1,
        suggestedAmount: 35000000000000, // 35M ADA in lovelace
        currentMedianVote: 32450000000000, // 32.45M ADA
        percentageOfSuggested: 9270, // 92.7%
        createdAt: new Date()
      },
      {
        id: 2, 
        title: 'Developer Education Programs', 
        description: 'Workshops, hackathons, and learning resources',
        categoryId: 2,
        suggestedAmount: 18500000000000, // 18.5M ADA
        currentMedianVote: 22120000000000, // 22.12M ADA
        percentageOfSuggested: 11900, // 119%
        createdAt: new Date()
      },
      {
        id: 3, 
        title: 'Open Source Library Development', 
        description: 'Support for core infrastructure libraries and tools',
        categoryId: 2,
        suggestedAmount: 15000000000000, // 15M ADA
        currentMedianVote: 17250000000000, // 17.25M ADA
        percentageOfSuggested: 11500, // 115%
        createdAt: new Date()
      },
      {
        id: 4, 
        title: 'Community Ambassador Program', 
        description: 'Global outreach and education network',
        categoryId: 3,
        suggestedAmount: 8200000000000, // 8.2M ADA
        currentMedianVote: 7585000000000, // 7.585M ADA
        percentageOfSuggested: 9250, // 92.5%
        createdAt: new Date()
      },
      {
        id: 5, 
        title: 'Governance Tool Development', 
        description: 'Software for governance participation and voting',
        categoryId: 4,
        suggestedAmount: 12700000000000, // 12.7M ADA
        currentMedianVote: 9525000000000, // 9.525M ADA
        percentageOfSuggested: 7500, // 75%
        createdAt: new Date()
      },
    ];

    items.forEach(item => {
      this.budgetItems.set(item.id, item as BudgetItem);
    });
    this.currentId.budgetItems = items.length + 1;

    // Create statistics
    const statistics: Statistics = {
      id: 1,
      budgetPeriodId: 1,
      totalDreps: 843,
      activeDreps: 167,
      totalAllocated: 162423000000000, // 162.423M ADA
      percentageAllocated: 6500, // 65%
      categoryDistribution: {
        "1": 58000000000000, // 58M ADA - Infrastructure (32%)
        "2": 67000000000000, // 67M ADA - Developer Ecosystem (41%) 
        "3": 29000000000000, // 29M ADA - Community (18%)
        "4": 15000000000000, // 15M ADA - Governance (9%)
      },
      updatedAt: new Date()
    };
    this.statisticsData.set(statistics.id, statistics);
    this.currentId.statistics = 2;

    // Create a demo user with DRep status
    const user: User = {
      id: 1,
      username: 'demo_drep',
      password: 'password',
      stakeAddress: 'stake1u8nrng7hhfn7nm0e2m96v80xhwht2j5mmv8jl07xdzh8yccvxk45m',
      walletAddress: 'addr1qywk9mngutc7whdpvpwwt832q0l5wvs95jnfc3wgn0tpqwjwq2a8kj4qrqvfwrxlxd9qp5qeq2y2ry38e73jvmwtxhdqgr9z4s',
      isDRep: true,
      votingPower: 428 // 4.28%
    };
    this.users.set(user.id, user);
    this.currentId.users = 2;
    
    // Create sample sentiment data
    const sentiments = [
      { id: 1, userId: 1, budgetItemId: 1, sentiment: 'thumbsUp', createdAt: new Date(), updatedAt: new Date() },
      { id: 2, userId: 1, budgetItemId: 2, sentiment: 'heart', createdAt: new Date(), updatedAt: new Date() },
      { id: 3, userId: 1, budgetItemId: 3, sentiment: 'rocket', createdAt: new Date(), updatedAt: new Date() },
    ];
    
    sentiments.forEach(sentiment => {
      this.budgetSentiments.set(sentiment.id, sentiment as BudgetSentiment);
    });
    this.currentId.budgetSentiments = sentiments.length + 1;
    
    // Create sample sentiment stats
    const sentimentStats = [
      { id: 1, budgetItemId: 1, sentiment: 'thumbsUp', count: 42, updatedAt: new Date() },
      { id: 2, budgetItemId: 1, sentiment: 'heart', count: 15, updatedAt: new Date() },
      { id: 3, budgetItemId: 1, sentiment: 'rocket', count: 8, updatedAt: new Date() },
      { id: 4, budgetItemId: 2, sentiment: 'thumbsUp', count: 29, updatedAt: new Date() },
      { id: 5, budgetItemId: 2, sentiment: 'heart', count: 37, updatedAt: new Date() },
      { id: 6, budgetItemId: 3, sentiment: 'thumbsUp', count: 19, updatedAt: new Date() },
      { id: 7, budgetItemId: 3, sentiment: 'rocket', count: 24, updatedAt: new Date() },
    ];
    
    sentimentStats.forEach(stats => {
      this.budgetSentimentStatsData.set(stats.id, stats as BudgetSentimentStats);
    });
    this.currentId.budgetSentimentStats = sentimentStats.length + 1;
  }
}

export const storage = new MemStorage();
