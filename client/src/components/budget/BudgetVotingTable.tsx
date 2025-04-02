import React, { useState, useEffect } from 'react';
import { useBudget } from '@/contexts/BudgetContext';
import { useWallet } from '@/contexts/WalletContext';
import { Search, Filter, ChevronUp, ChevronDown, CheckIcon, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatAdaAmount } from '@/lib/formatters';

const BudgetVotingTable: React.FC = () => {
  const { connected } = useWallet();
  const { 
    budgetItems, 
    categories, 
    activeCategory, 
    votes, 
    setVote, 
    submitVote,
    budgetPeriod,
    isVotingEnded,
    votingTimeRemaining,
    loading,
    isInitialized
  } = useBudget();
  
  // Log items and categories whenever they change
  useEffect(() => {
    console.log("BudgetVotingTable - Updated Budget Items:", budgetItems);
    console.log("BudgetVotingTable - Updated Categories:", categories);
  }, [budgetItems, categories]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Filter budget items based on search term and active category
  const filteredItems = React.useMemo(() => {
    return budgetItems.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = activeCategory === null || item.categoryId === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [budgetItems, searchTerm, activeCategory]);

  // Paginate the filtered items
  const paginatedItems = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredItems, currentPage, itemsPerPage]);

  // Get category by id
  const getCategoryById = (id: number) => {
    return categories.find(cat => cat.id === id);
  };

  // Calculate percentage of suggested
  const calculatePercentage = (currentMedian: number | null, suggested: number) => {
    if (!suggested || !currentMedian) return 0;
    return Math.round((currentMedian / suggested) * 100);
  };

  // Handle vote input change
  const handleVoteChange = (itemId: number, value: string) => {
    // Remove all non-numeric characters
    const cleanValue = value.replace(/[^0-9]/g, '');
    const numericValue = cleanValue ? parseInt(cleanValue, 10) : 0;
    setVote(itemId, numericValue);
  };

  // Handle increment/decrement
  const handleVoteAdjustment = (itemId: number, increment: boolean) => {
    const currentVote = votes[itemId] || 0;
    const step = 1000000; // 1 ADA
    const newValue = increment 
      ? currentVote + step 
      : Math.max(0, currentVote - step);
    setVote(itemId, newValue);
  };

  // Handle submit vote
  const handleSubmitVote = (itemId: number) => {
    if (connected && votes[itemId] !== undefined) {
      submitVote(itemId, votes[itemId]);
    }
  };

  // Get color class for percentage bar
  const getPercentageColorClass = (percentage: number) => {
    if (percentage > 110) return 'bg-green-500';
    if (percentage >= 90) return 'bg-blue-600';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  // Use the countdown from context

  // For debugging - log the state
  console.log("BudgetVotingTable - State Check:", {
    loading, 
    isInitialized, 
    categoriesLength: categories.length, 
    budgetItemsLength: budgetItems.length,
    context: "BudgetVotingTable"
  });

  // Show a loading state
  if (loading) {
    console.log("Showing loading state...");
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600">Loading budget data...</p>
      </div>
    );
  }

  // Show a message if no data is available yet
  if (!isInitialized || categories.length === 0 || budgetItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="text-amber-500 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Waiting for Budget Data</h3>
        <p className="text-gray-600 max-w-md">
          Budget data is being initialized. This may take a moment as we connect to the Cardano blockchain.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
          <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
            <div className="bg-white px-4 py-3 border-b border-gray-200 sm:px-6">
              <div className="flex items-center justify-between flex-wrap sm:flex-nowrap">
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Budget Items
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Vote on each item by entering your suggested ₳ allocation. Enter 0 to indicate the item should not be funded.
                  </p>
                </div>
                <div className="ml-4 flex-shrink-0 flex space-x-4">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <Input
                      type="text"
                      placeholder="Search budget items..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button variant="outline" size="sm" className="flex items-center">
                    <Filter className="-ml-0.5 mr-2 h-4 w-4" />
                    Filter
                  </Button>
                </div>
              </div>
              
              {/* Countdown Timer */}
              {budgetPeriod && !isVotingEnded && (
                <div className="mt-4 px-4 py-3 bg-blue-50 border border-blue-100 rounded-md">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-blue-500 mr-2" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-700">Voting Period In Progress</h4>
                      <p className="text-xs text-blue-600">
                        Current vote results are hidden until the voting period ends. Time remaining:
                      </p>
                      <div className="mt-2 flex space-x-3">
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-800">{votingTimeRemaining.days}</div>
                          <div className="text-xs text-blue-600">Days</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-800">{votingTimeRemaining.hours}</div>
                          <div className="text-xs text-blue-600">Hours</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-800">{votingTimeRemaining.minutes}</div>
                          <div className="text-xs text-blue-600">Minutes</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-800">{votingTimeRemaining.seconds}</div>
                          <div className="text-xs text-blue-600">Seconds</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Voting Results Banner */}
              {budgetPeriod && isVotingEnded && (
                <div className="mt-4 px-4 py-3 bg-green-50 border border-green-100 rounded-md">
                  <div className="flex items-center">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-2" />
                    <div>
                      <h4 className="text-sm font-medium text-green-700">Voting Period Ended</h4>
                      <p className="text-xs text-green-600">
                        The voting period has ended on {new Date(budgetPeriod.endDate).toLocaleDateString()}. 
                        Final allocations are now visible.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Budget Item
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Suggested Allocation
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {isVotingEnded ? "Final Allocation" : "Current Allocation"}
                    {!isVotingEnded && budgetPeriod && (
                      <div className="text-xs normal-case font-normal text-gray-400">
                        Results visible after {new Date(budgetPeriod.endDate).toLocaleDateString()}
                      </div>
                    )}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Your Vote
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedItems.map((item) => {
                  const category = getCategoryById(item.categoryId);
                  const percentage = calculatePercentage(item.currentMedianVote, item.suggestedAmount);
                  const percentageColorClass = getPercentageColorClass(percentage);
                  
                  return (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {item.title}
                            </div>
                            <div className="text-sm text-gray-500">
                              {item.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-${category?.color || 'gray'}-100 text-${category?.color || 'gray'}-800`}>
                          {category?.name || 'Uncategorized'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                        {formatAdaAmount(item.suggestedAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {isVotingEnded ? (
                          <>
                            <div className="text-blue-600 font-mono">{formatAdaAmount(item.currentMedianVote)}</div>
                            <div className="mt-1 flex items-center text-xs text-gray-500">
                              <span className="inline-block w-16 bg-gray-200 rounded-full h-1.5">
                                <span 
                                  className={`${percentageColorClass} h-1.5 rounded-full block`} 
                                  style={{ width: `${Math.min(percentage, 100)}%` }}
                                ></span>
                              </span>
                              <span className="ml-2">{percentage}% of suggested</span>
                            </div>
                          </>
                        ) : (
                          <div className="text-gray-500 italic">
                            <div>Results hidden</div>
                            <div className="text-xs">Visible after voting period ends</div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <div className="relative rounded-md shadow-sm flex-1">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <span className="text-gray-500 sm:text-sm">₳</span>
                            </div>
                            <Input
                              type="text"
                              value={votes[item.id] !== undefined ? formatAdaAmount(votes[item.id], false) : ''}
                              onChange={(e) => handleVoteChange(item.id, e.target.value)}
                              placeholder="Enter amount"
                              className="pl-7 pr-12"
                              disabled={!connected}
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center">
                              <div className="flex flex-col px-2">
                                <button 
                                  onClick={() => handleVoteAdjustment(item.id, true)}
                                  className="text-gray-500 hover:text-gray-700 focus:outline-none"
                                  disabled={!connected}
                                >
                                  <ChevronUp className="h-3 w-3" />
                                </button>
                                <button 
                                  onClick={() => handleVoteAdjustment(item.id, false)}
                                  className="text-gray-500 hover:text-gray-700 focus:outline-none"
                                  disabled={!connected}
                                >
                                  <ChevronDown className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                          <button 
                            onClick={() => handleSubmitVote(item.id)}
                            disabled={!connected || votes[item.id] === undefined}
                            className="ml-2 p-1 rounded-full text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600"
                          >
                            <CheckIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
              <div className="flex flex-1 justify-between sm:hidden">
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentPage(
                    Math.min(Math.ceil(filteredItems.length / itemsPerPage), currentPage + 1)
                  )}
                  disabled={currentPage >= Math.ceil(filteredItems.length / itemsPerPage)}
                >
                  Next
                </Button>
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing
                    <span className="font-medium"> {(currentPage - 1) * itemsPerPage + 1} </span>
                    to
                    <span className="font-medium"> {Math.min(currentPage * itemsPerPage, filteredItems.length)} </span>
                    of
                    <span className="font-medium"> {filteredItems.length} </span>
                    budget items
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <Button 
                      variant="outline"
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border text-sm font-medium"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      <span className="sr-only">Previous</span>
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    
                    {/* Generate page numbers */}
                    {Array.from({ length: Math.min(5, Math.ceil(filteredItems.length / itemsPerPage)) }, (_, i) => (
                      <Button
                        key={i + 1}
                        variant={currentPage === i + 1 ? "default" : "outline"}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === i + 1 
                            ? 'z-10 bg-blue-600 border-blue-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {i + 1}
                      </Button>
                    ))}
                    
                    {Math.ceil(filteredItems.length / itemsPerPage) > 5 && (
                      <>
                        <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                          ...
                        </span>
                        <Button
                          variant="outline"
                          onClick={() => setCurrentPage(Math.ceil(filteredItems.length / itemsPerPage))}
                          className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                        >
                          {Math.ceil(filteredItems.length / itemsPerPage)}
                        </Button>
                      </>
                    )}
                    
                    <Button 
                      variant="outline"
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border text-sm font-medium"
                      onClick={() => setCurrentPage(
                        Math.min(Math.ceil(filteredItems.length / itemsPerPage), currentPage + 1)
                      )}
                      disabled={currentPage >= Math.ceil(filteredItems.length / itemsPerPage)}
                    >
                      <span className="sr-only">Next</span>
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Import the missing icons
const ChevronLeft = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
);

const ChevronRight = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
  </svg>
);

export default BudgetVotingTable;
