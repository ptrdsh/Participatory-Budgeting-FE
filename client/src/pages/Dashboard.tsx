import React from 'react';
import { Link } from 'wouter';
import { useWallet } from '@/contexts/WalletContext';
import { useBudget } from '@/contexts/BudgetContext';
import { PlusCircle, ArrowRight, Calendar, UserCheck, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { formatAdaAmount } from '@/lib/formatters';

const Dashboard: React.FC = () => {
  const { connected, walletAddress } = useWallet();
  const { budgetPeriod, statistics } = useBudget();

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Cardano Governance Dashboard
            </h2>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            {connected ? (
              <Link href="/budget">
                <Button className="inline-flex items-center">
                  <PlusCircle className="-ml-1 mr-2 h-5 w-5" />
                  Cast Budget Votes
                </Button>
              </Link>
            ) : (
              <Button disabled>
                Connect Wallet to Vote
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-8">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {/* Active Budget Period Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Active Budget Period</CardTitle>
              <CardDescription>Current treasury allocation voting</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="text-sm text-gray-600">
                    {budgetPeriod?.startDate ? new Date(budgetPeriod.startDate).toLocaleDateString() : ''}
                    {' - '}
                    {budgetPeriod?.endDate ? new Date(budgetPeriod.endDate).toLocaleDateString() : ''}
                  </span>
                </div>
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="text-sm text-gray-600">
                    Governance Action: <span className="font-medium text-blue-600">{budgetPeriod?.governanceAction || 'N/A'}</span>
                  </span>
                </div>
                <div className="flex items-center">
                  <UserCheck className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="text-sm text-gray-600">
                    {statistics?.activeDreps || 0} of {statistics?.totalDreps || 0} DReps have voted
                  </span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Link href="/budget">
                <Button variant="outline" className="w-full justify-center">
                  View Details
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardFooter>
          </Card>

          {/* Budget Overview Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Budget Overview</CardTitle>
              <CardDescription>2025 Treasury allocation status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Total Treasury Budget</p>
                  <p className="text-xl font-semibold font-mono">{formatAdaAmount(budgetPeriod?.totalBudget || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Currently Allocated</p>
                  <p className="text-xl font-semibold font-mono">{formatAdaAmount(statistics?.totalAllocated || 0)}</p>
                </div>
                <div className="pt-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Allocation Progress</span>
                    <span>{statistics?.percentageAllocated 
                      ? (statistics.percentageAllocated / 100).toFixed(0) 
                      : '0'}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full" 
                      style={{ width: `${statistics?.percentageAllocated 
                        ? statistics.percentageAllocated / 100 
                        : 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Link href="/budget">
                <Button variant="outline" className="w-full justify-center">
                  View Budget Items
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardFooter>
          </Card>

          {/* DRep Status Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Your DRep Status</CardTitle>
              <CardDescription>Delegation representative information</CardDescription>
            </CardHeader>
            <CardContent>
              {connected ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Wallet Address</p>
                    <p className="text-sm font-medium truncate">{walletAddress}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">DRep Status</p>
                    <p className="text-sm font-medium">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Voting Power</p>
                    <p className="text-xl font-semibold">4.28%</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-40">
                  <p className="text-gray-500 mb-4">Connect your wallet to see your DRep status</p>
                  <Button>Connect Wallet</Button>
                </div>
              )}
            </CardContent>
            {connected && (
              <CardFooter>
                <Link href="/dreps">
                  <Button variant="outline" className="w-full justify-center">
                    Manage DRep Settings
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-8">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Welcome to the Cardano Participatory Budgeting Platform
            </h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>
                This platform enables DReps to collectively determine treasury allocations through
                blind voting on predefined budget items. The final allocations are calculated using
                statistical methods to ensure fairness and prevent manipulation.
              </p>
            </div>
            <div className="mt-5">
              <Link href="/budget">
                <Button>
                  Go to Budget Voting
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
