'use client';

import { useEffect, useState, useCallback } from 'react';
import { getWallets, Wallet } from '@massalabs/wallet-provider';

type MassaAccount = {
  address: string;
};

export const useMassaWallet = () => {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [account, setAccount] = useState<MassaAccount | null>(null);
  const [connected, setConnected] = useState(false);

  const connect = useCallback(async () => {
    const wallets = await getWallets();
    if (wallets.length === 0) {
      console.error('No Massa wallets found');
      return;
    }

    const selectedWallet = wallets[0];
    const isConnected = await selectedWallet.connect();

    if (isConnected) {
      setWallet(selectedWallet);

      const accounts = await selectedWallet.accounts();
      if (accounts.length > 0) {
        setAccount({ address: accounts[0].address });
        setConnected(true);
      }

      // Listen for account changes
      selectedWallet.listenAccountChanges((addr: string) => {
        setAccount({ address: addr });
      });
    }
  }, []);

  const disconnect = useCallback(async () => {
    if (wallet) {
      await wallet.disconnect();
    }
    setWallet(null);
    setAccount(null);
    setConnected(false);
  }, [wallet]);

  // Auto-connect if possible
  useEffect(() => {
    connect();
  }, [connect]);

  return {
    connected,
    account,
    connect,
    disconnect,
  };
};
