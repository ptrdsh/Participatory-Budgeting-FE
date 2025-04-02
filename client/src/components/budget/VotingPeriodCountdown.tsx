import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useBudget } from '@/contexts/BudgetContext';
import { formatCountdown } from '@/lib/countdown';

export function VotingPeriodCountdown() {
  const { budgetPeriod, isVotingEnded, votingTimeRemaining } = useBudget();
  
  if (!budgetPeriod) {
    return null;
  }
  
  return (
    <Card className="bg-gradient-to-r from-indigo-900 to-blue-900 text-white shadow-lg">
      <CardContent className="p-4 flex flex-col items-center">
        {isVotingEnded ? (
          <div className="text-center">
            <h3 className="text-xl font-bold mb-2">Voting Period Ended</h3>
            <p className="text-gray-200">
              The voting period for this budget has ended.
              Results are now being finalized on-chain.
            </p>
          </div>
        ) : (
          <div className="text-center">
            <h3 className="text-xl font-bold mb-2">Voting Period</h3>
            <div className="grid grid-cols-4 gap-2 mb-4">
              <div className="bg-blue-800 p-2 rounded-lg">
                <div className="text-2xl font-bold">{votingTimeRemaining.days}</div>
                <div className="text-xs uppercase">Days</div>
              </div>
              <div className="bg-blue-800 p-2 rounded-lg">
                <div className="text-2xl font-bold">{votingTimeRemaining.hours}</div>
                <div className="text-xs uppercase">Hours</div>
              </div>
              <div className="bg-blue-800 p-2 rounded-lg">
                <div className="text-2xl font-bold">{votingTimeRemaining.minutes}</div>
                <div className="text-xs uppercase">Minutes</div>
              </div>
              <div className="bg-blue-800 p-2 rounded-lg">
                <div className="text-2xl font-bold">{votingTimeRemaining.seconds}</div>
                <div className="text-xs uppercase">Seconds</div>
              </div>
            </div>
            <p className="text-sm text-gray-200 mt-2">
              Ends on {new Date(budgetPeriod.endDate).toLocaleDateString()} at {new Date(budgetPeriod.endDate).toLocaleTimeString()}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}