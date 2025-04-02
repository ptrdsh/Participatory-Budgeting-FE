import React from 'react';
import { useBudget } from '@/contexts/BudgetContext';
import { useWallet } from '@/contexts/WalletContext';
import { formatAdaAmount } from '@/lib/formatters';
import { Button } from '@/components/ui/button';

const BudgetAllocationSummary: React.FC = () => {
  const { connected } = useWallet();
  const { 
    votes, 
    budgetItems, 
    userVotingPower,
    submitAllVotes 
  } = useBudget();

  // Calculate total funds allocated by the user
  const totalAllocated = React.useMemo(() => {
    return Object.values(votes).reduce((sum, amount) => sum + (amount || 0), 0);
  }, [votes]);

  // Calculate how many items the user has voted on
  const votedItemsCount = React.useMemo(() => {
    return Object.keys(votes).length;
  }, [votes]);

  // Calculate the voting progress percentage
  const votingProgress = React.useMemo(() => {
    return budgetItems.length > 0 
      ? (votedItemsCount / budgetItems.length) * 100 
      : 0;
  }, [votedItemsCount, budgetItems.length]);

  const handleSubmitAllVotes = () => {
    if (connected && votedItemsCount > 0) {
      submitAllVotes();
    }
  };

  const handleSaveDraft = () => {
    // In a real implementation, this would save the draft to localStorage or similar
    alert('Draft saved successfully');
  };

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Your Budget Allocation Summary
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Review your votes before final submission to the blockchain.
        </p>
      </div>
      <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
          <div className="sm:col-span-3">
            <h4 className="block text-sm font-medium text-gray-700">Total Funds Allocated</h4>
            <div className="mt-1 text-2xl font-semibold text-gray-900 font-mono">
              {formatAdaAmount(totalAllocated)}
            </div>
          </div>
          <div className="sm:col-span-3">
            <h4 className="block text-sm font-medium text-gray-700">Your Voting Power</h4>
            <div className="mt-1 text-2xl font-semibold text-gray-900">
              {userVotingPower ? (userVotingPower / 100).toFixed(2) : '0.00'}%
            </div>
          </div>
          <div className="sm:col-span-6">
            <div className="flex flex-col space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-700">Items You've Voted On</span>
                <span className="text-gray-500">{votedItemsCount} of {budgetItems.length}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${votingProgress}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6">
          <Button
            onClick={handleSubmitAllVotes}
            disabled={!connected || votedItemsCount === 0}
            className="inline-flex items-center"
          >
            Submit All Votes to Blockchain
          </Button>
          <Button
            variant="outline" 
            onClick={handleSaveDraft}
            className="ml-3"
          >
            Save Draft
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BudgetAllocationSummary;
