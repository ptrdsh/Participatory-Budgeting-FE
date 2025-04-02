// This file handles interactions with Cardano wallets and blockchain

export enum WalletType {
  ETERNL = 'eternl',
  YOROI = 'yoroi',
  NUFI = 'nufi',
  FLINT = 'flint'
}

export interface CardanoWallet {
  enable: () => Promise<CardanoAPI>;
  isEnabled: () => Promise<boolean>;
  name: string;
  icon: string;
  apiVersion: string;
}

export interface CardanoAPI {
  getNetworkId: () => Promise<number>;
  getBalance: () => Promise<string>;
  getUsedAddresses: () => Promise<string[]>;
  getUnusedAddresses: () => Promise<string[]>;
  getChangeAddress: () => Promise<string>;
  getRewardAddresses: () => Promise<string[]>;
  signTx: (tx: string, partialSign: boolean) => Promise<string>;
  signData: (address: string, payload: string) => Promise<string>;
  submitTx: (tx: string) => Promise<string>;
}

// Function to check if wallet extensions are available
export function checkWalletExtensions(): Record<WalletType, boolean> {
  const walletStatus: Record<WalletType, boolean> = {
    [WalletType.ETERNL]: false,
    [WalletType.YOROI]: false,
    [WalletType.NUFI]: false,
    [WalletType.FLINT]: false
  };

  if (typeof window !== 'undefined') {
    walletStatus[WalletType.ETERNL] = window.cardano?.eternl !== undefined;
    walletStatus[WalletType.YOROI] = window.cardano?.yoroi !== undefined;
    walletStatus[WalletType.NUFI] = window.cardano?.nufi !== undefined;
    walletStatus[WalletType.FLINT] = window.cardano?.flint !== undefined;
  }

  return walletStatus;
}

// Detect wallet extensions
export function getWalletExtension(walletType: WalletType): CardanoWallet | null {
  if (typeof window === 'undefined') return null;

  const cardano = window.cardano;
  if (!cardano) return null;

  switch (walletType) {
    case WalletType.ETERNL:
      return cardano.eternl;
    case WalletType.YOROI:
      return cardano.yoroi;
    case WalletType.NUFI:
      return cardano.nufi;
    case WalletType.FLINT:
      return cardano.flint;
    default:
      return null;
  }
}

// Enable wallet connection
export async function connectWallet(walletType: WalletType): Promise<{api: CardanoAPI, addresses: string[], stakeAddress: string}> {
  const wallet = getWalletExtension(walletType);
  
  if (!wallet) {
    throw new Error(`${walletType} wallet extension not found`);
  }
  
  try {
    const api = await wallet.enable();
    const networkId = await api.getNetworkId();
    
    // Check if we're on the right network (mainnet=1, testnet=0)
    if (networkId !== 1) {
      throw new Error('Please connect to Cardano Mainnet');
    }
    
    const addresses = await api.getUsedAddresses();
    const rewardAddresses = await api.getRewardAddresses();
    
    return {
      api,
      addresses,
      stakeAddress: rewardAddresses[0] || ''
    };
  } catch (error) {
    console.error('Failed to connect wallet:', error);
    throw error;
  }
}

// Check if wallet is a registered DRep
export async function checkDRepStatus(stakeAddress: string): Promise<{isDRep: boolean, votingPower: number}> {
  try {
    // In a real implementation, this would call Blockfrost API or similar
    // to check if the stake address is registered as a DRep
    const response = await fetch(`/api/drep/status?stakeAddress=${stakeAddress}`);
    if (!response.ok) {
      throw new Error('Failed to check DRep status');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to check DRep status:', error);
    return { isDRep: false, votingPower: 0 };
  }
}

// Submit vote transaction to the blockchain
export async function submitVoteTransaction(
  api: CardanoAPI,
  budgetItemId: number, 
  amount: number
): Promise<string> {
  try {
    // In a real implementation, this would:
    // 1. Get the current UTXOs from the wallet
    // 2. Build a transaction that includes metadata with the vote information
    // 3. Sign the transaction with the wallet
    // 4. Submit the transaction to the blockchain
    
    // For now, we'll simulate this with a request to our backend
    const response = await fetch('/api/votes/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        budgetItemId,
        amount,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to submit vote transaction');
    }
    
    const { txHash } = await response.json();
    return txHash;
  } catch (error) {
    console.error('Failed to submit vote transaction:', error);
    throw error;
  }
}

// Submit multiple votes in a single transaction
export async function submitBulkVoteTransaction(
  api: CardanoAPI,
  votes: {budgetItemId: number, amount: number}[]
): Promise<string> {
  try {
    // Similar to above, but with multiple votes in one transaction
    const response = await fetch('/api/votes/submit-bulk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ votes }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to submit bulk vote transaction');
    }
    
    const { txHash } = await response.json();
    return txHash;
  } catch (error) {
    console.error('Failed to submit bulk vote transaction:', error);
    throw error;
  }
}

// Declare global window type with cardano property
declare global {
  interface Window {
    cardano?: {
      eternl?: CardanoWallet;
      yoroi?: CardanoWallet;
      nufi?: CardanoWallet;
      flint?: CardanoWallet;
    };
  }
}
