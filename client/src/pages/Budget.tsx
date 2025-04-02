import React, { useState, useEffect } from 'react';
import { Download, BarChart2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BudgetSummaryCards from '@/components/budget/BudgetSummaryCards';
import BudgetCategoriesTabs from '@/components/budget/BudgetCategoriesTabs';
import BudgetVotingTable from '@/components/budget/BudgetVotingTable';
import BudgetAllocationSummary from '@/components/budget/BudgetAllocationSummary';
import BudgetDataVisualization from '@/components/budget/BudgetDataVisualization';
import { useBudget } from '@/contexts/BudgetContext';

const Budget: React.FC = () => {
  const { budgetPeriod, statistics } = useBudget();
  
  // Skip all loading states - using already loaded mock data

  return (
    <div className="py-6">
      {/* Page header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              {budgetPeriod?.title || '2025 Treasury Budget Allocation'}
            </h2>
            <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"></path>
                </svg>
                Voting Period: {budgetPeriod?.startDate 
                  ? new Date(budgetPeriod.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
                  : 'June 15'} - {budgetPeriod?.endDate 
                    ? new Date(budgetPeriod.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                    : 'July 15, 2024'}
              </div>
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path>
                </svg>
                <span>{statistics?.activeDreps || 0}</span> of <span>{statistics?.totalDreps || 0}</span> DReps have voted
              </div>
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"></path>
                </svg>
                Governance Action: <span className="font-medium text-blue-600">{budgetPeriod?.governanceAction || 'TreasuryWithdrawal_2025_01'}</span>
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

      {/* Progress summary cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-6">
        <BudgetSummaryCards />
      </div>

      {/* Budget categories tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-8">
        <BudgetCategoriesTabs />
      </div>

      {/* Budget voting table */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-6">
        <BudgetVotingTable />
      </div>

      {/* Budget Summary */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-8">
        <BudgetAllocationSummary />
      </div>

      {/* Data Visualization */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-8 mb-10">
        <BudgetDataVisualization />
      </div>
    </div>
  );
};

export default Budget;
