import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { API_BASE } from '../../services/api';

interface WalletConnectProps {
  onConnected?: (walletAddress: string) => void;
  onError?: (error: string) => void;
}

export const WalletConnect: React.FC<WalletConnectProps> = ({ onConnected, onError }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    checkWalletStatus();
  }, []);

  const checkWalletStatus = async () => {
    try {
      const response = await fetch(`${API_BASE}/wallet/status`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success && data.connected) {
        setIsConnected(true);
        setWalletAddress(data.walletAddress);
      }
    } catch (error) {
      console.error('Error checking wallet status:', error);
    }
  };

  const getSignatureMessage = async () => {
    try {
      const response = await fetch(`${API_BASE}/wallet/message`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        return data.message;
      }
    } catch (error) {
      console.error('Error getting message:', error);
    }
    return null;
  };

  const connectWallet = async () => {
    setIsConnecting(true);
    try {
      // Check if MetaMask is installed
      if (!window.ethereum) {
        throw new Error('MetaMask or compatible wallet not found. Please install it.');
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      const userAddress = accounts[0];

      // Get message to sign
      const signMessage = await getSignatureMessage();
      if (!signMessage) {
        throw new Error('Failed to get verification message');
      }

      // Sign the message
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [signMessage, userAddress]
      });

      // Send to backend for verification
      const response = await fetch(`${API_BASE}/wallet/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          walletAddress: userAddress,
          signature,
          message: signMessage
        })
      });

      const data = await response.json();

      if (data.success) {
        setIsConnected(true);
        setWalletAddress(userAddress);
        if (onConnected) {
          onConnected(userAddress);
        }
      } else {
        throw new Error(data.message || 'Failed to connect wallet');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error connecting wallet';
      if (onError) {
        onError(errorMessage);
      }
      console.error('Wallet connection error:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = async () => {
    try {
      const response = await fetch(`${API_BASE}/wallet/disconnect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setIsConnected(false);
        setWalletAddress(null);
      }
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <h3 className="text-lg font-semibold mb-4">Connect Wallet</h3>

      {isConnected && walletAddress ? (
        <div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-600 mb-2">Connected Wallet</p>
            <p className="font-mono text-sm break-all text-green-700">
              {walletAddress}
            </p>
          </div>
          <Button
            onClick={disconnectWallet}
            variant="secondary"
            className="w-full"
          >
            Disconnect Wallet
          </Button>
        </div>
      ) : (
        <div>
          <p className="text-sm text-gray-600 mb-4">
            Connect your Ethereum wallet to participate in wallet-based tasks and earn rewards.
          </p>
          <Button
            onClick={connectWallet}
            disabled={isConnecting}
            className="w-full"
          >
            {isConnecting ? 'Connecting...' : 'Connect with MetaMask'}
          </Button>
          <p className="text-xs text-gray-500 mt-3">
            💡 Make sure you have MetaMask or another Ethereum wallet installed
          </p>
        </div>
      )}
    </div>
  );
};

// Extend Window interface for ethereum provider
declare global {
  interface Window {
    ethereum?: any;
  }
}
