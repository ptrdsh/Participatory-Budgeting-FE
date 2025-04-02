import React from 'react';
import { useBudget } from '@/contexts/BudgetContext';
import { formatAdaAmount } from '@/lib/formatters';
import { 
  DollarSign, 
  CheckCircle,
  TrendingUp 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const BudgetSummaryCards: React.FC = () => {
  const { budgetPeriod, statistics, totalVoted } = useBudget();

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {/* Card 1: Total Treasury Budget */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-50 rounded-md p-3">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Treasury Budget
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900 font-mono">
                      {formatAdaAmount(budgetPeriod?.totalBudget || 0)}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Allocated by Current Votes */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Allocated by Current Votes
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900 font-mono">
                      {formatAdaAmount(statistics?.totalAllocated || 0)}
                    </div>
                    {statistics?.percentageAllocated ? (
                      <p className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                        {(statistics.percentageAllocated / 100).toFixed(0)}%
                      </p>
                    ) : null}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 3: Voting Participation Rate */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Voting Participation Rate
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {statistics?.activeDreps && statistics?.totalDreps 
                        ? ((statistics.activeDreps / statistics.totalDreps) * 100).toFixed(1)
                        : '0.0'}%
                    </div>
                    {statistics?.activeDreps && statistics?.totalDreps ? (
                      <p className="ml-2 flex items-baseline text-sm font-semibold text-blue-600">
                        <svg className="self-center flex-shrink-0 h-5 w-5 text-blue-500" 
                             xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                        </svg>
                        <span>
                          {totalVoted > 0 ? ((totalVoted / statistics.totalDreps) * 100).toFixed(1) : '0.0'}%
                        </span>
                      </p>
                    ) : null}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BudgetSummaryCards;
