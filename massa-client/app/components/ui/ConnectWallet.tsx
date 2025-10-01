'use client';

import { Button } from '@/components/ui/button';
import { Wallet, LogOut } from 'lucide-react';
import { useMassaWallet } from '@/hooks/useMassaWallet';

export const ConnectWallet = () => {
  const { connected, account, connect, disconnect } = useMassaWallet();

  if (connected && account) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">
          {account.address.slice(0, 8)}...{account.address.slice(-6)}
        </span>
        <Button variant="ghost" onClick={disconnect}>
          <LogOut className="w-4 h-4 mr-2" />
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={connect}>
      <Wallet className="w-4 h-4 mr-2" />
      Connect Wallet
    </Button>
  );
};
