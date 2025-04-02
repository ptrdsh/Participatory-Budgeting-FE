import React, { useState, useEffect } from 'react';
import { Download, BarChart2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatAdaAmount } from '@/lib/formatters';
import { SentimentTracker, SentimentData } from '@/components/budget/SentimentTracker';

// Define types for our data
interface BudgetPeriod {
  title: string;
  description: string;
  totalBudget: number;
  startDate: Date;
  endDate: Date;
  governanceAction: string;
}

interface Category {
  id: number;
  name: string;
  description: string;
  color: string;
}

interface BudgetItem {
  id: number;
  title: string;
  description: string;
  categoryId: number;
  categoryName: string;
  suggestedAmount: number;
  currentMedianVote: number | null;
  percentageOfSuggested: number | null;
}

// Main component
const DirectCSVBudget: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<BudgetPeriod | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [userVotes, setUserVotes] = useState<Record<number, number>>({});
  const [userSentiments, setUserSentiments] = useState<Record<number, string>>({});
  
  // Function to parse CSV text
  const parseCSV = (text: string) => {
    const lines = text.split('\n');
    const headers = lines[0].split(',');
    
    return lines.slice(1).filter(line => line.trim() !== '').map(line => {
      const values = line.split(',');
      return headers.reduce((obj: any, header, i) => {
        obj[header] = values[i];
        return obj;
      }, {});
    });
  };
  
  // Function to load CSV data directly
  const loadCSVData = async () => {
    try {
      // Load period data
      const periodResponse = await fetch('/data/budget/period.csv');
      const periodCSV = await periodResponse.text();
      const [periodData] = parseCSV(periodCSV);
      
      if (periodData) {
        setPeriod({
          title: periodData.title,
          description: periodData.description,
          totalBudget: parseInt(periodData.totalBudget),
          startDate: new Date(periodData.startDate),
          endDate: new Date(periodData.endDate),
          governanceAction: periodData.governanceAction
        });
      }
      
      // Load categories
      const categoriesResponse = await fetch('/data/budget/categories.csv');
      const categoriesCSV = await categoriesResponse.text();
      const categoriesData = parseCSV(categoriesCSV);
      
      if (categoriesData.length > 0) {
        setCategories(
          categoriesData.map((cat: any, index: number) => ({
            id: index + 1,
            name: cat.name,
            description: cat.description,
            color: cat.color
          }))
        );
        
        // Load budget items
        const itemsResponse = await fetch('/data/budget/items.csv');
        const itemsCSV = await itemsResponse.text();
        const itemsData = parseCSV(itemsCSV);
        
        // Create a mapping from category name to ID
        const categoryMap = categoriesData.reduce((acc: any, cat: any, index: number) => {
          acc[cat.name] = index + 1;
          return acc;
        }, {});
        
        setItems(
          itemsData.map((item: any, index: number) => ({
            id: index + 1,
            title: item.title,
            description: item.description,
            categoryName: item.categoryName,
            categoryId: categoryMap[item.categoryName] || 0,
            suggestedAmount: parseInt(item.suggestedAmount),
            currentMedianVote: null,  // Will be filled in later 
            percentageOfSuggested: null // Will be filled in later
          }))
        );
        
        // Set the first category as active
        setActiveCategory(1);
      }
      
      // Done loading
      setLoading(false);
    } catch (error) {
      console.error('Error loading CSV data:', error);
      setLoading(false);
    }
  };
  
  // Load data when component mounts
  useEffect(() => {
    loadCSVData();
  }, []);
  
  // Show loading state
  if (loading) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-6 text-gray-600 text-lg">Loading direct CSV budget data...</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Calculate statistics
  const totalBudgetItems = items.length;
  const totalSuggestedAmount = items.reduce((sum, item) => sum + item.suggestedAmount, 0);
  
  // Budget items for the active category
  const categoryItems = activeCategory 
    ? items.filter(item => item.categoryId === activeCategory)
    : items;
    
  // Handle sentiment selection
  const handleSentimentSelected = (budgetItemId: number, sentiment: string) => {
    setUserSentiments(prev => ({
      ...prev,
      [budgetItemId]: sentiment
    }));
  };
  
  // Handle vote input
  const handleVoteChange = (budgetItemId: number, amount: string) => {
    const numAmount = parseInt(amount) || 0;
    setUserVotes(prev => ({
      ...prev,
      [budgetItemId]: numAmount
    }));
  };
  
  // Reset all allocations
  const handleResetAllocations = () => {
    setUserVotes({});
  };
  
  // Submit votes
  const handleSubmitVotes = () => {
    // In a real implementation, this would send the votes to the backend
    console.log('Submitting votes:', userVotes);
    console.log('Submitting sentiments:', userSentiments);
    
    // Here we would interact with a smart contract or backend API
    alert('Votes submitted successfully!');
  };
  
  return (
    <div className="py-6">
      {/* Page header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              {period?.title || '2025 Treasury Budget Allocation'}
            </h2>
            <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"></path>
                </svg>
                Voting Period: {period?.startDate 
                  ? period.startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
                  : 'January 15'} - {period?.endDate 
                    ? period.endDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                    : 'February 15, 2025'}
              </div>
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path>
                </svg>
                <span>0</span> of <span>843</span> DReps have voted
              </div>
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"></path>
                </svg>
                Governance Action: <span className="font-medium text-blue-600">{period?.governanceAction || 'TreasuryWithdrawal_2025_01'}</span>
              </div>
            </div>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <Button variant="outline" className="inline-flex items-center">
              <Download className="mr-2 h-4 w-4" />
              Export Results
            </Button>
            <Button className="ml-3 inline-flex items-center">
              <BarChart2 className="mr-2 h-4 w-4" />
              View Analytics
            </Button>
          </div>
        </div>
      </div>

      {/* Budget Summary Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Budget
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {period?.totalBudget ? formatAdaAmount(period.totalBudget * 1000000) : '₳0'}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Allocated So Far
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        ₳0
                      </div>
                      <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                        0%
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Time Remaining
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        30 days
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Budget Category Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-8">
        <div className="sm:hidden">
          <label htmlFor="tabs" className="sr-only">Select a category</label>
          <select
            id="tabs"
            name="tabs"
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            value={activeCategory || 0}
            onChange={(e) => setActiveCategory(parseInt(e.target.value))}
          >
            <option value={0}>All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </div>
        <div className="hidden sm:block">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button
                className={`${
                  activeCategory === null
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                onClick={() => setActiveCategory(null)}
              >
                All Categories
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  className={`${
                    activeCategory === category.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                  onClick={() => setActiveCategory(category.id)}
                >
                  {category.name}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Budget Items Table */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-6">
        <div className="bg-white shadow sm:rounded-md">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Budget Item
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Suggested Amount
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Your Allocation
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categoryItems.map((item) => {
                  const category = categories.find(c => c.id === item.categoryId);
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
                            <SentimentTracker 
                              budgetItemId={item.id}
                              userSentiment={userSentiments[item.id]}
                              onSentimentSelected={handleSentimentSelected}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-${category?.color || 'gray'}-100 text-${category?.color || 'gray'}-800`}>
                          {item.categoryName}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap text-sm text-gray-500">
                        {formatAdaAmount(item.suggestedAmount * 1000000)}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="relative rounded-md shadow-sm">
                          <input
                            type="text"
                            className="focus:ring-blue-500 focus:border-blue-500 block w-full pr-12 sm:text-sm border-gray-300 rounded-md"
                            placeholder="0"
                            value={userVotes[item.id] || ''}
                            onChange={(e) => handleVoteChange(item.id, e.target.value)}
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">₳</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end">
          <Button variant="outline" className="mr-3" onClick={handleResetAllocations}>
            Reset Allocations
          </Button>
          <Button onClick={handleSubmitVotes}>
            Submit Votes
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DirectCSVBudget;