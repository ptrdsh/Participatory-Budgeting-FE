import React from 'react';
import { Wallet } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import WalletConnectModal from './WalletConnectModal';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const WalletConnectButton: React.FC = () => {
  const { connected, walletAddress, connect, disconnect } = useWallet();
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  const handleConnect = () => {
    if (!connected) {
      toggleModal();
    }
  };

  // Get first and last characters of the wallet address for the avatar
  const getAvatarInitials = () => {
    if (!walletAddress) return '??';
    const firstChar = walletAddress.charAt(0);
    const lastChar = walletAddress.charAt(walletAddress.length - 1);
    return `${firstChar}${lastChar}`;
  };

  // Format wallet address for display
  const formatWalletAddress = () => {
    if (!walletAddress) return '';
    return `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
  };

  return (
    <>
      {!connected ? (
        <Button 
          className="inline-flex items-center" 
          onClick={handleConnect}
          variant="default"
        >
          <Wallet className="-ml-1 mr-2 h-5 w-5" />
          Connect Wallet
        </Button>
      ) : (
        <div className="ml-3 flex items-center">
          <div className="text-sm font-medium text-gray-700 truncate mr-2">
            {formatWalletAddress()}
          </div>
          <Avatar className="h-8 w-8">
            <AvatarFallback>{getAvatarInitials()}</AvatarFallback>
          </Avatar>
        </div>
      )}

      <WalletConnectModal isOpen={isModalOpen} onClose={toggleModal} />
    </>
  );
};

export default WalletConnectButton;
