import React from 'react';
import { useBudget } from '@/contexts/BudgetContext';
import { formatAdaAmount } from '@/lib/formatters';
import { Button } from '@/components/ui/button';
import { Database, BarChart2 } from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend 
} from 'recharts';

const BudgetDataVisualization: React.FC = () => {
  const { categories, budgetItems, statistics } = useBudget();
  const [viewType, setViewType] = React.useState<'chart' | 'analytics'>('chart');

  // Prepare pie chart data for category distribution
  const pieChartData = React.useMemo(() => {
    if (!statistics?.categoryDistribution) return [];
    
    return Object.entries(statistics.categoryDistribution).map(([categoryId, amount]) => {
      const category = categories.find(c => c.id === parseInt(categoryId));
      return {
        name: category?.name || 'Unknown',
        value: amount,
        color: category?.color || '#4570EA',
      };
    });
  }, [statistics, categories]);

  // Prepare bar chart data for top budget items
  const barChartData = React.useMemo(() => {
    return budgetItems
      .sort((a, b) => b.currentMedianVote - a.currentMedianVote)
      .slice(0, 5)
      .map(item => {
        const category = categories.find(c => c.id === item.categoryId);
        return {
          name: item.title,
          value: item.currentMedianVote,
          color: category?.color || '#4570EA',
        };
      });
  }, [budgetItems, categories]);

  // Format to millions for display
  const formatToMillions = (value: number) => {
    return `${(value / 1000000).toFixed(1)}M ₳`;
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-gray-200 shadow-sm rounded-md">
          <p className="text-sm font-medium">{payload[0].name}</p>
          <p className="text-sm">{formatAdaAmount(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white shadow sm:rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <div>
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Current Budget Distribution
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Based on median votes from all participating DReps.
          </p>
        </div>
        <div className="flex">
          <Button
            variant={viewType === 'chart' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewType('chart')}
            className="flex items-center"
          >
            <BarChart2 className="-ml-0.5 mr-2 h-4 w-4" />
            View as Chart
          </Button>
          <Button
            variant={viewType === 'analytics' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewType('analytics')}
            className="ml-3 flex items-center"
          >
            <Database className="-ml-0.5 mr-2 h-4 w-4" />
            View Analytics
          </Button>
        </div>
      </div>
      <div className="px-4 py-5 sm:p-6">
        <div className="h-80 flex items-center justify-center">
          {viewType === 'chart' ? (
            <div className="w-full h-full flex space-x-4">
              {/* Pie Chart for Category Distribution */}
              <div className="w-1/2 h-full">
                <p className="text-gray-500 text-sm text-center mb-4">Category Distribution</p>
                <ResponsiveContainer width="100%" height="85%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              {/* Bar Chart for Top Items */}
              <div className="w-1/2 h-full">
                <p className="text-gray-500 text-sm text-center mb-4">Top Budget Items</p>
                <ResponsiveContainer width="100%" height="85%">
                  <BarChart data={barChartData} layout="vertical">
                    <XAxis type="number" tickFormatter={formatToMillions} />
                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value">
                      {barChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="w-full h-full p-4 flex flex-col space-y-6">
              <h4 className="text-lg font-medium text-gray-900">Advanced Budget Analytics</h4>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h5 className="font-medium text-gray-700">Voting Participation</h5>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>DReps who have voted</span>
                      <span className="font-medium">{statistics?.activeDreps || 0} / {statistics?.totalDreps || 0}</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>Participation rate</span>
                        <span>{statistics?.activeDreps && statistics?.totalDreps 
                          ? ((statistics.activeDreps / statistics.totalDreps) * 100).toFixed(1)
                          : '0.0'}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="bg-blue-500 h-1.5 rounded-full" 
                          style={{ 
                            width: `${statistics?.activeDreps && statistics?.totalDreps 
                              ? (statistics.activeDreps / statistics.totalDreps) * 100
                              : 0}%` 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h5 className="font-medium text-gray-700">Budget Allocation</h5>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Total allocated</span>
                      <span className="font-medium">{formatAdaAmount(statistics?.totalAllocated || 0)}</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>Percentage of total budget</span>
                        <span>{statistics?.percentageAllocated 
                          ? (statistics.percentageAllocated / 100).toFixed(1)
                          : '0.0'}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="bg-green-500 h-1.5 rounded-full" 
                          style={{ 
                            width: `${statistics?.percentageAllocated 
                              ? statistics.percentageAllocated / 100
                              : 0}%` 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h5 className="font-medium text-gray-700">Voting Trends</h5>
                  <p className="text-sm text-gray-600">
                    Based on current voting patterns, infrastructure and developer ecosystem 
                    categories are receiving the highest allocations, with governance receiving 
                    the lowest proportion of votes.
                  </p>
                </div>
                
                <div className="space-y-3">
                  <h5 className="font-medium text-gray-700">Statistical Measures</h5>
                  <p className="text-sm text-gray-600">
                    The system uses median values to calculate final allocations, with trimming 
                    of extreme votes (top and bottom 1%) to prevent manipulation by outliers.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="bg-gray-50 px-4 py-4 sm:px-6">
        <div className="text-sm">
          <a href="/analytics" className="font-medium text-blue-600 hover:text-blue-800">
            View detailed statistics and analytics <span aria-hidden="true">&rarr;</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default BudgetDataVisualization;
