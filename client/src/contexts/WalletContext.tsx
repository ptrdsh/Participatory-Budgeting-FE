import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  WalletType, 
  connectWallet, 
  checkDRepStatus,
  CardanoAPI
} from '@/lib/cardano';
import { useToast } from '@/hooks/use-toast';

interface WalletContextType {
  connected: boolean;
  walletType: WalletType | null;
  walletAddress: string | null;
  stakeAddress: string | null;
  isDRep: boolean;
  votingPower: number;
  api: CardanoAPI | null;
  connect: (type: WalletType) => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType>({
  connected: false,
  walletType: null,
  walletAddress: null,
  stakeAddress: null,
  isDRep: false,
  votingPower: 0,
  api: null,
  connect: async () => {},
  disconnect: () => {},
});

export const useWallet = () => useContext(WalletContext);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [connected, setConnected] = useState(false);
  const [walletType, setWalletType] = useState<WalletType | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [stakeAddress, setStakeAddress] = useState<string | null>(null);
  const [isDRep, setIsDRep] = useState(false);
  const [votingPower, setVotingPower] = useState(0);
  const [api, setApi] = useState<CardanoAPI | null>(null);
  
  const { toast } = useToast();

  // Try to reconnect on initial load
  useEffect(() => {
    const savedWalletType = localStorage.getItem('walletType') as WalletType | null;
    if (savedWalletType) {
      connect(savedWalletType).catch(error => {
        console.error('Failed to reconnect wallet:', error);
        localStorage.removeItem('walletType');
      });
    }
  }, []);

  const connect = async (type: WalletType) => {
    try {
      const { api: walletApi, addresses, stakeAddress: stake } = await connectWallet(type);
      
      // Check if the user is a registered DRep
      const { isDRep: isUserDRep, votingPower: userVotingPower } = await checkDRepStatus(stake);
      
      setApi(walletApi);
      setWalletAddress(addresses[0] || null);
      setStakeAddress(stake);
      setWalletType(type);
      setConnected(true);
      setIsDRep(isUserDRep);
      setVotingPower(userVotingPower);
      
      // Store wallet type for reconnection
      localStorage.setItem('walletType', type);
      
      toast({
        title: 'Wallet Connected',
        description: `Successfully connected ${type} wallet`,
      });
      
      // For demo purposes, always set as DRep with some voting power
      if (!isUserDRep) {
        setIsDRep(true);
        setVotingPower(428); // 4.28%
      }
    } catch (error) {
      console.error('Wallet connection failed:', error);
      disconnect();
      
      toast({
        title: 'Connection Failed',
        description: error instanceof Error ? error.message : 'Failed to connect wallet',
        variant: 'destructive',
      });
    }
  };

  const disconnect = () => {
    setConnected(false);
    setWalletType(null);
    setWalletAddress(null);
    setStakeAddress(null);
    setIsDRep(false);
    setVotingPower(0);
    setApi(null);
    
    // Clear stored wallet type
    localStorage.removeItem('walletType');
  };

  return (
    <WalletContext.Provider
      value={{
        connected,
        walletType,
        walletAddress,
        stakeAddress,
        isDRep,
        votingPower,
        api,
        connect,
        disconnect,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};
