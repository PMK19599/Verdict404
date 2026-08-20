import React, {
  useEffect,
} from 'react';

import ReactDOM from 'react-dom/client';

import {
  WalletManager,
} from '@txnlab/use-wallet';

import {
  WalletProvider,
  useWallet,
} from '@txnlab/use-wallet-react';

import {
  pera,
} from '@txnlab/use-wallet-pera';

import {
  defly,
} from '@txnlab/use-wallet-defly';

import type {
  ClientAvmSigner,
} from '@x402/avm';

import App from './App';

import './index.css';

import {
  verificationService,
} from './services/api';


// ============================================================
// Wallet configuration
// ============================================================

const walletManager =
  new WalletManager({
    wallets: [
      pera({
        chainId: 416002,
      }),

      defly({
        chainId: 416002,
      }),
    ],

    defaultNetwork:
      'testnet',
  });


// ============================================================
// x402 Wallet Bridge
// ============================================================
//
// This component lives INSIDE WalletProvider.
//
// It takes the currently connected Pera/Defly wallet and exposes
// only the signing interface required by x402.
//
// Private keys never enter the application.
//
// ============================================================

function WalletSignerBridge({
  children,
}: {
  children: React.ReactNode;
}) {

  const {
    activeAccount,
    signTransactions,
  } = useWallet();


  useEffect(() => {

    // ----------------------------------------------------------
    // No wallet connected
    // ----------------------------------------------------------

    if (!activeAccount) {

      verificationService
        .setAvmSigner(null);

      return;
    }


    // ----------------------------------------------------------
    // Build x402-compatible signer
    // ----------------------------------------------------------

    const signer:
      ClientAvmSigner = {

      address:
        activeAccount.address,

      signTransactions:
        async (
          txns,
          indexesToSign
        ) => {

          return signTransactions(
            txns,
            indexesToSign
          );
        },
    };


    // ----------------------------------------------------------
    // Give signer to verification service
    // ----------------------------------------------------------

    verificationService
      .setAvmSigner(signer);


    console.log(
      '[Verdict404] x402 signer connected:',
      activeAccount.address
    );


    // ----------------------------------------------------------
    // Cleanup when wallet changes/disconnects
    // ----------------------------------------------------------

    return () => {

      verificationService
        .setAvmSigner(null);
    };

  }, [
    activeAccount,
    signTransactions,
  ]);


  return (
    <>
      {children}
    </>
  );
}


// ============================================================
// Application
// ============================================================

ReactDOM
  .createRoot(
    document.getElementById(
      'root'
    )!
  )
  .render(

    <React.StrictMode>

      <WalletProvider
        manager={
          walletManager
        }
      >

        <WalletSignerBridge>

          <App />

        </WalletSignerBridge>

      </WalletProvider>

    </React.StrictMode>
  );