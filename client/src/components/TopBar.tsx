import React from 'react';
import { Menu } from 'lucide-react';
import WalletConnectButton from '@/components/wallet/WalletConnectButton';
import { useCountdown } from '@/lib/countdown';

interface TopBarProps {
  toggleSidebar: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ toggleSidebar }) => {
  // For demonstration, set a voting end date 21 days from now
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 21);
  futureDate.setHours(futureDate.getHours() + 8);
  futureDate.setMinutes(futureDate.getMinutes() + 42);
  futureDate.setSeconds(futureDate.getSeconds() + 15);
  
  const { days, hours, minutes, seconds } = useCountdown(futureDate);
  
  return (
    <div className="relative z-10 flex-shrink-0 flex h-16 bg-white border-b border-gray-200">
      <button 
        type="button" 
        className="px-4 border-r border-gray-200 text-gray-500 md:hidden"
        onClick={toggleSidebar}
      >
        <Menu className="h-6 w-6" />
      </button>
      
      <div className="flex-1 px-4 flex justify-between">
        <div className="flex-1 flex items-center">
          <h1 className="text-lg md:text-xl font-semibold text-gray-900">Participatory Budgeting Platform</h1>
        </div>
        
        <div className="ml-4 flex items-center md:ml-6">
          <div className="mr-4 flex items-center">
            <span className="text-sm font-medium text-gray-700">Budget Voting closes in</span>
            <div className="ml-2 px-3 py-1 rounded-full bg-cardano-light text-blue-600 font-mono text-sm font-medium">
              {days}d {hours}h {minutes}m {seconds}s
            </div>
          </div>
          
          <WalletConnectButton />
        </div>
      </div>
    </div>
  );
};

export default TopBar;
