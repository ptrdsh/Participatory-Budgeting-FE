import React from 'react';
import { Wallet } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { WalletType } from '@/lib/cardano';

interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WalletConnectModal: React.FC<WalletConnectModalProps> = ({ isOpen, onClose }) => {
  const { connect } = useWallet();

  const wallets = [
    { 
      id: WalletType.ETERNL, 
      name: 'Eternl', 
      logo: (
        <svg viewBox="0 0 32 32" className="h-6 w-6">
          <circle cx="16" cy="16" r="16" fill="#1A44B7"/>
          <path d="M22 10H10v12h12V10zm-2 10h-8v-8h8v8z" fill="white"/>
        </svg>
      )
    },
    { 
      id: WalletType.YOROI, 
      name: 'Yoroi', 
      logo: (
        <svg viewBox="0 0 32 32" className="h-6 w-6">
          <circle cx="16" cy="16" r="16" fill="#FF8000"/>
          <path d="M8 16l8-8 8 8-8 8-8-8z" fill="white"/>
        </svg>
      )
    },
    { 
      id: WalletType.NUFI, 
      name: 'Nufi', 
      logo: (
        <svg viewBox="0 0 32 32" className="h-6 w-6">
          <circle cx="16" cy="16" r="16" fill="#52CB8B"/>
          <path d="M16 8v16M8 16h16" stroke="white" strokeWidth="2"/>
        </svg>
      )
    },
    { 
      id: WalletType.FLINT, 
      name: 'Flint', 
      logo: (
        <svg viewBox="0 0 32 32" className="h-6 w-6">
          <circle cx="16" cy="16" r="16" fill="#E83333"/>
          <path d="M12 10v12l10-6-10-6z" fill="white"/>
        </svg>
      )
    },
  ];

  const handleWalletSelect = async (walletType: WalletType) => {
    try {
      await connect(walletType);
      onClose();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
            <Wallet className="h-6 w-6 text-blue-600" />
          </div>
          <DialogTitle className="text-center">Connect to a Cardano Wallet</DialogTitle>
          <DialogDescription className="text-center">
            Select a wallet to connect to the Cardano blockchain. Only DReps are able to vote on budget allocations.
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-5 space-y-4">
          {wallets.map((wallet) => (
            <Button
              key={wallet.id}
              variant="outline"
              className="w-full justify-between items-center py-3"
              onClick={() => handleWalletSelect(wallet.id)}
            >
              <span className="flex items-center">
                {wallet.logo}
                <span className="ml-2">{wallet.name}</span>
              </span>
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </Button>
          ))}
          
          <Button 
            variant="outline" 
            className="w-full mt-4" 
            onClick={onClose}
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WalletConnectModal;
