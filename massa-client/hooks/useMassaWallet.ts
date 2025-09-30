import { useEffect, useState, useCallback } from "react";
import { getWallets, Wallet } from "@massalabs/wallet-provider";

export function useMassaWallet() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [network, setNetwork] = useState<any>(null);

  // load wallet on mount
  useEffect(() => {
    (async () => {
      const wallets = await getWallets();
      if (wallets.length > 0) {
        const w = wallets[0];
        setWallet(w);
      }
    })();
  }, []);

  const connect = useCallback(async () => {
    if (!wallet) return false;
    const ok = await wallet.connect();
    if (!ok) return false;

    setConnected(true);

    const accounts = await wallet.accounts();
    if (accounts.length > 0) {
      setAccount(accounts[0].address);
    }

    const net = await wallet.networkInfos();
    setNetwork(net);

    // listen for account changes
    wallet.listenAccountChanges((addr) => {
      setAccount(addr);
    });

    return true;
  }, [wallet]);

  const disconnect = useCallback(async () => {
    if (wallet) {
      await wallet.disconnect();
    }
    setConnected(false);
    setAccount(null);
    setNetwork(null);
  }, [wallet]);

  return { wallet, account, connected, network, connect, disconnect };
}
