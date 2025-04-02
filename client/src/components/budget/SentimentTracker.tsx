import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ThumbsUp, Heart, Rocket, DollarSign, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { apiRequest } from '@/lib/queryClient';

/**
 * Interface for sentiment data (emoji reaction counts)
 */
export interface SentimentData {
  budgetItemId: number;
  sentiment: string; // emoji name
  count: number;
}

/**
 * Map of emoji types to their corresponding icons
 */
const emojiMap = {
  thumbsUp: {
    icon: ThumbsUp,
    label: 'Good investment',
    color: 'text-blue-500',
    activeColor: 'bg-blue-100'
  },
  heart: {
    icon: Heart,
    label: 'Love this project',
    color: 'text-red-500',
    activeColor: 'bg-red-100'
  },
  rocket: {
    icon: Rocket,
    label: 'High potential',
    color: 'text-purple-500',
    activeColor: 'bg-purple-100'
  },
  dollarSign: {
    icon: DollarSign,
    label: 'Good value',
    color: 'text-green-500',
    activeColor: 'bg-green-100'
  },
  alertCircle: {
    icon: AlertCircle,
    label: 'Needs review',
    color: 'text-yellow-500',
    activeColor: 'bg-yellow-100'
  }
};

/**
 * Component props
 */
interface SentimentTrackerProps {
  budgetItemId: number;
  sentiments?: SentimentData[];
  onSentimentSelected?: (budgetItemId: number, sentiment: string) => void;
  userSentiment?: string; // Currently selected sentiment by the user
  readOnly?: boolean; // Whether the user can select sentiments
}

/**
 * SentimentTracker component
 * Displays emoji reactions for a budget item and allows users to react
 */
export function SentimentTracker({ 
  budgetItemId, 
  sentiments = [], 
  onSentimentSelected,
  userSentiment,
  readOnly = false
}: SentimentTrackerProps) {
  const queryClient = useQueryClient();
  
  // Fetch sentiment data for this budget item
  const { data: sentimentData, isLoading } = useQuery({
    queryKey: ['/api/sentiments/item', budgetItemId],
    queryFn: () => apiRequest(`/api/sentiments/item/${budgetItemId}`),
    enabled: !sentiments || sentiments.length === 0,
  });
  
  // Fetch the user's sentiment for this budget item
  const { data: userSentimentData } = useQuery({
    queryKey: ['/api/sentiments/user', budgetItemId],
    queryFn: () => apiRequest(`/api/sentiments/user/${budgetItemId}`),
    enabled: !readOnly && userSentiment === undefined
  });
  
  // Create mutation for submitting a sentiment
  const submitSentimentMutation = useMutation({
    mutationFn: (sentiment: string) => 
      apiRequest('/api/sentiments/submit', {
        method: 'POST',
        body: JSON.stringify({ budgetItemId, sentiment }),
      }),
    onSuccess: () => {
      // Invalidate sentiment queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['/api/sentiments/item', budgetItemId] });
      queryClient.invalidateQueries({ queryKey: ['/api/sentiments/user', budgetItemId] });
    }
  });
  
  const allSentiments = sentiments.length > 0 ? sentiments : sentimentData || [];
  const currentUserSentiment = userSentiment !== undefined 
    ? userSentiment 
    : userSentimentData?.sentiment;
  
  // Handle sentiment selection
  const handleSentimentClick = (sentiment: string) => {
    if (readOnly) return;
    
    if (onSentimentSelected) {
      onSentimentSelected(budgetItemId, sentiment);
    } else {
      submitSentimentMutation.mutate(sentiment);
    }
  };
  
  // Get count for a specific sentiment
  const getSentimentCount = (sentimentName: string): number => {
    const found = allSentiments.find((s: SentimentData) => s.sentiment === sentimentName);
    return found ? found.count : 0;
  };
  
  return (
    <div className="flex items-center space-x-1 my-2">
      <TooltipProvider>
        {Object.entries(emojiMap).map(([name, data]) => {
          const isSelected = currentUserSentiment === name;
          const count = getSentimentCount(name);
          const Icon = data.icon;
          
          return (
            <Tooltip key={name}>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "flex items-center justify-center p-1 h-8 text-sm rounded-full transition-colors",
                    isSelected ? data.activeColor : "hover:bg-gray-100",
                    readOnly ? "cursor-default" : "cursor-pointer"
                  )}
                  onClick={() => handleSentimentClick(name)}
                  disabled={readOnly || submitSentimentMutation.isPending}
                >
                  <Icon className={cn("mr-1 h-4 w-4", data.color)} />
                  <span className="text-xs">{count > 0 ? count : ''}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{data.label}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </TooltipProvider>
    </div>
  );
}