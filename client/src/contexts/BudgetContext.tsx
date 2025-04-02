import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from './WalletContext';
import { submitVoteTransaction, submitBulkVoteTransaction } from '@/lib/cardano';
import { 
  BudgetCategory, 
  BudgetItem, 
  BudgetPeriod, 
  Statistics 
} from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useCountdown } from '@/lib/countdown';

// Define the context shape
interface BudgetContextType {
  budgetPeriod: BudgetPeriod | null;
  categories: BudgetCategory[];
  budgetItems: BudgetItem[];
  statistics: Statistics | null;
  userVotingPower: number;
  totalVoted: number; // Number of DReps who have voted at least once
  activeCategory: number | null;
  votes: Record<number, number>; // Item ID -> Amount (in lovelace)
  isVotingEnded: boolean; // Whether the voting period has ended
  votingTimeRemaining: { days: number; hours: number; minutes: number; seconds: number; isExpired: boolean }; // Countdown data
  loading: boolean; // Whether data is currently being loaded
  isInitialized: boolean; // Whether all data has been loaded at least once
  setActiveCategory: (categoryId: number | null) => void;
  setVote: (itemId: number, amount: number) => void;
  submitVote: (itemId: number, amount: number) => Promise<void>;
  submitAllVotes: () => Promise<void>;
}

// Create the context with default values
const BudgetContext = createContext<BudgetContextType>({
  budgetPeriod: null,
  categories: [],
  budgetItems: [],
  statistics: null,
  userVotingPower: 0,
  totalVoted: 0,
  activeCategory: null,
  votes: {},
  isVotingEnded: false,
  votingTimeRemaining: { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false },
  loading: true,
  isInitialized: false,
  setActiveCategory: () => {},
  setVote: () => {},
  submitVote: async () => {},
  submitAllVotes: async () => {},
});

// Hook to use the budget context
export const useBudget = () => useContext(BudgetContext);

// Provider component
export const BudgetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { api, isDRep, votingPower } = useWallet();
  const { toast } = useToast();
  
  const [budgetPeriod, setBudgetPeriod] = useState<BudgetPeriod | null>(null);
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [votes, setVotes] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [totalVoted, setTotalVoted] = useState(0);
  
  // We need to initialize this with a dummy date first and update it when budgetPeriod loads
  const [endDate, setEndDate] = useState<Date>(new Date(Date.now() + 24 * 60 * 60 * 1000)); // Default to tomorrow
  const votingTimeRemaining = useCountdown(endDate);
  
  // Update end date whenever budgetPeriod changes
  useEffect(() => {
    if (budgetPeriod) {
      setEndDate(new Date(budgetPeriod.endDate));
    }
  }, [budgetPeriod]);
  
  // Check if voting period has ended
  const isVotingEnded = useMemo(() => {
    if (!budgetPeriod) return false;
    const now = new Date();
    return now > new Date(budgetPeriod.endDate);
  }, [budgetPeriod]);

  // Load budget data - directly using mock data immediately
  useEffect(() => {
    setLoading(true);
    console.log("Using mock data directly");
    
    // Set mock data immediately
    setMockData();
    
    // Explicitly set initialized to true
    setIsInitialized(true);
    
    // Set loading to false immediately
    setLoading(false);
    
    console.log("Mock data loaded immediately");
  }, []);

  // Load user's existing votes if connected
  useEffect(() => {
    if (api && isDRep) {
      const fetchUserVotes = async () => {
        try {
          const response = await fetch('/api/votes/user');
          if (!response.ok) throw new Error('Failed to fetch user votes');
          
          const userVotes = await response.json();
          const votesMap: Record<number, number> = {};
          
          userVotes.forEach((vote: { budgetItemId: number, amount: number }) => {
            votesMap[vote.budgetItemId] = vote.amount;
          });
          
          setVotes(votesMap);
        } catch (error) {
          console.error('Failed to fetch user votes:', error);
        }
      };
      
      fetchUserVotes();
    }
  }, [api, isDRep]);

  // Set vote for an item
  const setVote = (itemId: number, amount: number) => {
    setVotes(prev => ({
      ...prev,
      [itemId]: amount
    }));
  };

  // Submit vote for a single item
  const submitVote = async (itemId: number, amount: number) => {
    if (!api || !isDRep) {
      toast({
        title: 'Not Authorized',
        description: 'You must connect a DRep wallet to vote.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      // Submit vote to blockchain
      const txHash = await submitVoteTransaction(api, itemId, amount);
      
      toast({
        title: 'Vote Submitted',
        description: `Your vote has been submitted with transaction: ${txHash.slice(0, 10)}...`,
      });
      
      // Update the UI with new data
      await refreshBudgetItems();
    } catch (error) {
      console.error('Failed to submit vote:', error);
      
      toast({
        title: 'Vote Failed',
        description: error instanceof Error ? error.message : 'Failed to submit vote',
        variant: 'destructive',
      });
    }
  };

  // Submit all votes at once
  const submitAllVotes = async () => {
    if (!api || !isDRep) {
      toast({
        title: 'Not Authorized',
        description: 'You must connect a DRep wallet to vote.',
        variant: 'destructive',
      });
      return;
    }
    
    if (Object.keys(votes).length === 0) {
      toast({
        title: 'No Votes',
        description: 'You have not cast any votes yet.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      // Format votes for bulk submission
      const votesList = Object.entries(votes).map(([itemId, amount]) => ({
        budgetItemId: parseInt(itemId),
        amount
      }));
      
      // Submit votes to blockchain
      const txHash = await submitBulkVoteTransaction(api, votesList);
      
      toast({
        title: 'Votes Submitted',
        description: `Your votes have been submitted with transaction: ${txHash.slice(0, 10)}...`,
      });
      
      // Update the UI with new data
      await refreshBudgetItems();
    } catch (error) {
      console.error('Failed to submit votes:', error);
      
      toast({
        title: 'Votes Failed',
        description: error instanceof Error ? error.message : 'Failed to submit votes',
        variant: 'destructive',
      });
    }
  };

  // Refresh budget items after voting
  const refreshBudgetItems = async () => {
    try {
      const response = await fetch('/api/budget/items');
      if (!response.ok) throw new Error('Failed to fetch budget items');
      
      const itemsData = await response.json();
      setBudgetItems(itemsData);
      
      // Also refresh statistics
      const statsResponse = await fetch('/api/budget/statistics');
      if (!statsResponse.ok) throw new Error('Failed to fetch statistics');
      
      const statsData = await statsResponse.json();
      setStatistics(statsData);
    } catch (error) {
      console.error('Failed to refresh budget items:', error);
    }
  };

  // Set mock data for development
  const setMockData = () => {
    // Mock budget period
    setBudgetPeriod({
      id: 1,
      title: '2025 Treasury Budget Allocation',
      description: 'Annual budget for Cardano treasury allocations',
      totalBudget: 250000000000000, // 250M ADA in lovelace
      startDate: new Date('2024-06-15T00:00:00Z'),
      endDate: new Date('2024-07-15T00:00:00Z'),
      governanceAction: 'TreasuryWithdrawal_2025_01',
      active: true,
    });
    
    // Mock categories
    setCategories([
      { id: 1, name: 'Infrastructure', description: 'Network infrastructure support', color: 'green-800' },
      { id: 2, name: 'Developer Ecosystem', description: 'Support for developers', color: 'blue-800' },
      { id: 3, name: 'Community & Education', description: 'Community growth and education', color: 'purple-800' },
      { id: 4, name: 'Governance', description: 'Governance infrastructure', color: 'yellow-800' },
    ]);
    
    // Mock budget items
    setBudgetItems([
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
    ]);
    
    // Mock statistics
    setStatistics({
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
    });
    
    // Set total voted DReps
    setTotalVoted(167);
  };

  // Add debugging for rendered components vs. state
  console.log("BudgetContext - Current State: ", {
    budgetPeriodExists: !!budgetPeriod,
    categoriesCount: categories.length,
    budgetItemsCount: budgetItems.length,
    statisticsExists: !!statistics,
    loading,
    isInitialized
  });

  // Add a useEffect to set isInitialized when we have all the necessary data
  useEffect(() => {
    if (budgetPeriod && categories.length > 0 && budgetItems.length > 0 && statistics) {
      console.log("Data is initialized now: ", {
        budgetPeriod,
        categories,
        budgetItems: budgetItems.map(item => item.title).slice(0, 3),
        statistics
      });
      setIsInitialized(true);
    }
  }, [budgetPeriod, categories, budgetItems, statistics]);

  return (
    <BudgetContext.Provider
      value={{
        budgetPeriod,
        categories,
        budgetItems,
        statistics,
        userVotingPower: votingPower,
        totalVoted,
        activeCategory,
        votes,
        isVotingEnded,
        votingTimeRemaining,
        loading,
        isInitialized,
        setActiveCategory,
        setVote,
        submitVote,
        submitAllVotes,
      }}
    >
      {children}
    </BudgetContext.Provider>
  );
};
