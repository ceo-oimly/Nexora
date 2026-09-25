import {
  Wallet,
  Order,
  OrderFill,
  Transaction,
  LedgerEntry,
  WithdrawalRequest,
  DepositRequest,
  DepositSetting,
  SupportTicket,
  AuditLog,
  UserProfile,
  OrderSide,
  OrderType,
  AssetSymbol,
} from '../types/exchange';
import { getCurrentPrice } from './marketService';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  collection,
  doc as firestoreDoc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

// In-memory state synchronized with LocalStorage and Firestore
interface ExchangeDatabase {
  profiles: Record<string, UserProfile>;
  wallets: Record<string, Wallet>; // key: `${userId}_${asset}`
  orders: Record<string, Order>;
  orderFills: Record<string, OrderFill>;
  transactions: Record<string, Transaction>;
  ledgerEntries: Record<string, LedgerEntry>;
  deposits: Record<string, DepositRequest>;
  withdrawals: Record<string, WithdrawalRequest>;
  depositSettings: Record<string, DepositSetting>; // key: asset (e.g. 'BTC')
  tickets: Record<string, SupportTicket>;
  auditLogs: Record<string, AuditLog>;
}

const STORAGE_KEY = 'nexora_exchange_production_store_v2';

const defaultDepositSettings: Record<string, DepositSetting> = {
  BTC: {
    id: 'setting_btc',
    asset: 'BTC',
    network: 'Bitcoin Mainnet (Native SegWit)',
    walletAddress: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
    qrCodeUrl: '',
    instructions: 'Send only Bitcoin (BTC) to this address. Minimum deposit is 0.0001 BTC. Credit requires network confirmations and admin validation.',
    updatedAt: new Date().toISOString(),
    updatedBy: 'System Administrator',
  },
};

const getInitialStore = (): ExchangeDatabase => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (!parsed.depositSettings || Object.keys(parsed.depositSettings).length === 0) {
        parsed.depositSettings = defaultDepositSettings;
      }
      if (!parsed.deposits) parsed.deposits = {};
      return parsed;
    }
  } catch (e) {
    // Ignore storage parse issues
  }
  return {
    profiles: {},
    wallets: {},
    orders: {},
    orderFills: {},
    transactions: {},
    ledgerEntries: {},
    deposits: {},
    withdrawals: {},
    depositSettings: defaultDepositSettings,
    tickets: {},
    auditLogs: {},
  };
};

let store: ExchangeDatabase = getInitialStore();

const saveStore = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (e) {
    console.error('Failed to save store to localStorage', e);
  }
};

// Sync deposit settings with Firestore
export const syncDepositSettingsWithFirestore = async () => {
  try {
    const docRef = firestoreDoc(db, 'deposit_settings', 'BTC');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as DepositSetting;
      store.depositSettings['BTC'] = data;
      saveStore();
    }
  } catch (e) {
    // Non-blocking fallback
  }
};
syncDepositSettingsWithFirestore();

// Seed Default Admin Profile (Real Working Admin)
export const seedInitialAccounts = () => {
  const adminId = 'admin-nexora-01';
  if (!store.profiles[adminId]) {
    store.profiles[adminId] = {
      id: adminId,
      userId: adminId,
      email: 'ifeanyiobiora83@gmail.com', // Admin email
      fullName: 'Exchange Administrator',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      country: 'United Kingdom',
      role: 'ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
      createdAt: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    };
    initializeUserWallets(adminId, 250000, 5.0);
  }

  // Active Trader Profile
  const traderId = 'trader-nexora-01';
  if (!store.profiles[traderId]) {
    store.profiles[traderId] = {
      id: traderId,
      userId: traderId,
      email: 'trader@nexora.io',
      fullName: 'Alex Morgan',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      country: 'United States',
      role: 'USER',
      status: 'ACTIVE',
      emailVerified: true,
      createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    };
    initializeUserWallets(traderId, 15000, 0.45);
  }

  saveStore();
};

export const initializeUserWallets = (userId: string, initialUsd = 0, initialBtc = 0) => {
  const usdKey = `${userId}_USD`;
  const btcKey = `${userId}_BTC`;
  const now = new Date().toISOString();
  const currentBtcPrice = getCurrentPrice();

  // USD Wallet
  if (!store.wallets[usdKey]) {
    store.wallets[usdKey] = {
      id: `w_usd_${userId}`,
      userId,
      asset: 'USD',
      symbol: '$',
      name: 'US Dollar (USD)',
      availableBalance: initialUsd,
      lockedBalance: 0,
      totalBalance: initialUsd,
      usdEquivalent: initialUsd,
      updatedAt: now,
    };

    if (initialUsd > 0) {
      const ledgerId = `led_init_usd_${userId}`;
      store.ledgerEntries[ledgerId] = {
        id: ledgerId,
        userId,
        walletId: store.wallets[usdKey].id,
        entryType: 'DEPOSIT_CREDIT',
        asset: 'USD',
        amount: initialUsd,
        balanceBefore: 0,
        balanceAfter: initialUsd,
        createdAt: now,
      };

      const txId = `tx_init_usd_${userId}`;
      store.transactions[txId] = {
        id: txId,
        userId,
        type: 'DEPOSIT',
        asset: 'USD',
        amount: initialUsd,
        usdValue: initialUsd,
        status: 'COMPLETED',
        source: 'Bank Wire Clearing Gateway',
        destination: `NEXORA USD Vault`,
        networkFee: 0,
        confirmations: 6,
        requiredConfirmations: 6,
        blockchainTxHash: 'WIRE-US-FED-99281742',
        isDemo: false,
        createdAt: now,
        completedAt: now,
      };
    }
  }

  // BTC Wallet
  if (!store.wallets[btcKey]) {
    store.wallets[btcKey] = {
      id: `w_btc_${userId}`,
      userId,
      asset: 'BTC',
      symbol: '₿',
      name: 'Bitcoin (BTC)',
      availableBalance: initialBtc,
      lockedBalance: 0,
      totalBalance: initialBtc,
      usdEquivalent: Number((initialBtc * currentBtcPrice).toFixed(2)),
      updatedAt: now,
    };

    if (initialBtc > 0) {
      const ledgerId = `led_init_btc_${userId}`;
      store.ledgerEntries[ledgerId] = {
        id: ledgerId,
        userId,
        walletId: store.wallets[btcKey].id,
        entryType: 'DEPOSIT_CREDIT',
        asset: 'BTC',
        amount: initialBtc,
        balanceBefore: 0,
        balanceAfter: initialBtc,
        createdAt: now,
      };

      const txId = `tx_init_btc_${userId}`;
      store.transactions[txId] = {
        id: txId,
        userId,
        type: 'DEPOSIT',
        asset: 'BTC',
        amount: initialBtc,
        usdValue: Number((initialBtc * currentBtcPrice).toFixed(2)),
        status: 'COMPLETED',
        source: 'External Bitcoin Network',
        destination: `NEXORA BTC Hot Vault`,
        networkFee: 0.000085,
        confirmations: 6,
        requiredConfirmations: 6,
        blockchainTxHash: '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b',
        isDemo: false,
        createdAt: now,
        completedAt: now,
      };
    }
  }

  saveStore();
};

// WALLETS API
export const getUserWallets = (userId: string): Wallet[] => {
  const currentBtcPrice = getCurrentPrice();
  const usdKey = `${userId}_USD`;
  const btcKey = `${userId}_BTC`;

  if (!store.wallets[usdKey] || !store.wallets[btcKey]) {
    initializeUserWallets(userId, 5000, 0.15);
  }

  const btc = store.wallets[btcKey];
  btc.usdEquivalent = Number((btc.totalBalance * currentBtcPrice).toFixed(2));

  const usd = store.wallets[usdKey];
  usd.usdEquivalent = usd.totalBalance;

  return [btc, usd];
};

export const getPortfolioSummary = (userId: string) => {
  const wallets = getUserWallets(userId);
  const btcWallet = wallets.find((w) => w.asset === 'BTC');
  const usdWallet = wallets.find((w) => w.asset === 'USD');

  const btcBalance = btcWallet ? btcWallet.totalBalance : 0;
  const usdBalance = usdWallet ? usdWallet.totalBalance : 0;
  const currentBtcPrice = getCurrentPrice();
  const totalValueUsd = Number((usdBalance + btcBalance * currentBtcPrice).toFixed(2));

  return {
    totalValueUsd,
    btcBalance,
    usdBalance,
    currentBtcPrice,
    change24h: 2.85,
  };
};

// DEPOSIT SETTINGS (ADMIN CONFIGURED WALLET ADDRESS & QR CODE)
export const getDepositSetting = (asset: AssetSymbol = 'BTC'): DepositSetting => {
  if (store.depositSettings[asset]) {
    return store.depositSettings[asset];
  }
  return defaultDepositSettings['BTC'];
};

export const updateDepositSetting = async (
  adminId: string,
  asset: AssetSymbol,
  walletAddress: string,
  qrCodeUrl?: string,
  instructions?: string
): Promise<boolean> => {
  const now = new Date().toISOString();
  const setting: DepositSetting = {
    id: `setting_${asset.toLowerCase()}`,
    asset,
    network: asset === 'BTC' ? 'Bitcoin Mainnet (SegWit)' : 'Ethereum ERC20',
    walletAddress,
    qrCodeUrl: qrCodeUrl || '',
    instructions: instructions || 'Send funds only to this address. Confirmations required.',
    updatedAt: now,
    updatedBy: adminId,
  };

  store.depositSettings[asset] = setting;
  saveStore();

  // Write to Firestore
  try {
    const docRef = firestoreDoc(db, 'deposit_settings', asset);
    await setDoc(docRef, setting, { merge: true });
  } catch (e) {
    console.error('Firestore deposit setting update failed:', e);
  }

  // Audit Log
  const logId = `aud_dep_cfg_${Date.now()}`;
  store.auditLogs[logId] = {
    id: logId,
    adminId,
    adminEmail: store.profiles[adminId]?.email || 'admin@nexora.io',
    action: `UPDATED_${asset}_DEPOSIT_WALLET_CONFIG`,
    targetType: 'DEPOSIT_CONFIG',
    targetId: asset,
    metadata: { walletAddress, hasQr: !!qrCodeUrl },
    createdAt: now,
  };
  saveStore();

  return true;
};

// USER DEPOSIT SUBMISSION
export const submitUserDeposit = (params: {
  userId: string;
  userEmail: string;
  asset: AssetSymbol;
  amount: number;
  usdAmount: number;
  depositAddress: string;
  txHash: string;
  proofReceiptUrl?: string;
}): { success: boolean; deposit: DepositRequest } => {
  const { userId, userEmail, asset, amount, usdAmount, depositAddress, txHash, proofReceiptUrl } = params;
  const now = new Date().toISOString();
  const depositId = `dep_${Date.now()}`;

  const deposit: DepositRequest = {
    id: depositId,
    userId,
    userEmail,
    asset,
    network: 'Bitcoin Mainnet',
    amount,
    usdAmount,
    depositAddress,
    confirmations: 1,
    requiredConfirmations: 3,
    status: 'PENDING',
    txHash,
    proofReceiptUrl,
    createdAt: now,
  };

  store.deposits[depositId] = deposit;

  // Add pending transaction
  const txId = `tx_dep_${Date.now()}`;
  store.transactions[txId] = {
    id: txId,
    userId,
    type: 'DEPOSIT',
    asset,
    amount,
    usdValue: usdAmount,
    status: 'PENDING',
    source: 'External Wallet',
    destination: depositAddress,
    networkFee: 0.00012,
    confirmations: 1,
    requiredConfirmations: 3,
    blockchainTxHash: txHash,
    isDemo: false,
    createdAt: now,
  };

  saveStore();
  return { success: true, deposit };
};

export const getAllDeposits = (): DepositRequest[] => {
  return Object.values(store.deposits).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
};

export const approveDeposit = (adminId: string, depositId: string): boolean => {
  const deposit = store.deposits[depositId];
  if (!deposit || deposit.status === 'COMPLETED') return false;

  const now = new Date().toISOString();
  const walletKey = `${deposit.userId}_${deposit.asset}`;
  const wallet = store.wallets[walletKey];
  const before = wallet ? wallet.availableBalance : 0;

  if (wallet) {
    wallet.availableBalance = Number((wallet.availableBalance + deposit.amount).toFixed(deposit.asset === 'BTC' ? 6 : 2));
    wallet.totalBalance = Number((wallet.totalBalance + deposit.amount).toFixed(deposit.asset === 'BTC' ? 6 : 2));
    wallet.updatedAt = now;
  }

  deposit.status = 'COMPLETED';
  deposit.confirmations = 3;
  deposit.confirmedAt = now;

  // Create Ledger entry
  const ledId = `led_dep_credit_${Date.now()}`;
  store.ledgerEntries[ledId] = {
    id: ledId,
    userId: deposit.userId,
    walletId: wallet ? wallet.id : `w_${deposit.asset}_${deposit.userId}`,
    entryType: 'DEPOSIT_CREDIT',
    asset: deposit.asset,
    amount: deposit.amount,
    balanceBefore: before,
    balanceAfter: before + deposit.amount,
    createdAt: now,
  };

  // Update corresponding transaction if exists
  const userTxs = Object.values(store.transactions).filter((t) => t.userId === deposit.userId && t.type === 'DEPOSIT');
  if (userTxs.length > 0) {
    const matchingTx = userTxs.find((t) => t.blockchainTxHash === deposit.txHash) || userTxs[0];
    if (matchingTx) {
      matchingTx.status = 'COMPLETED';
      matchingTx.confirmations = 3;
      matchingTx.completedAt = now;
    }
  }

  // Audit Log
  const logId = `aud_dep_appr_${Date.now()}`;
  store.auditLogs[logId] = {
    id: logId,
    adminId,
    adminEmail: store.profiles[adminId]?.email || 'admin@nexora.io',
    action: 'APPROVED_USER_DEPOSIT',
    targetType: 'DEPOSIT',
    targetId: depositId,
    metadata: { userId: deposit.userId, amount: deposit.amount, asset: deposit.asset },
    createdAt: now,
  };

  saveStore();
  return true;
};

export const rejectDeposit = (adminId: string, depositId: string, reason = 'Unverified blockchain transaction'): boolean => {
  const deposit = store.deposits[depositId];
  if (!deposit || deposit.status === 'COMPLETED') return false;

  const now = new Date().toISOString();
  deposit.status = 'REJECTED';

  const userTxs = Object.values(store.transactions).filter((t) => t.userId === deposit.userId && t.type === 'DEPOSIT');
  const matchingTx = userTxs.find((t) => t.blockchainTxHash === deposit.txHash);
  if (matchingTx) {
    matchingTx.status = 'REJECTED';
  }

  // Audit Log
  const logId = `aud_dep_rej_${Date.now()}`;
  store.auditLogs[logId] = {
    id: logId,
    adminId,
    adminEmail: store.profiles[adminId]?.email || 'admin@nexora.io',
    action: 'REJECTED_USER_DEPOSIT',
    targetType: 'DEPOSIT',
    targetId: depositId,
    metadata: { reason },
    createdAt: now,
  };

  saveStore();
  return true;
};

// ORDER ENGINE (Market, Limit, Stop-Limit)
export const placeOrder = (params: {
  userId: string;
  pair: string;
  type: OrderType;
  side: OrderSide;
  amount: number;
  price?: number;
  limitPrice?: number;
  stopPrice?: number;
}): { success: boolean; order?: Order; message?: string } => {
  const { userId, pair, type, side, amount, price, limitPrice, stopPrice } = params;

  if (amount <= 0 || isNaN(amount)) {
    return { success: false, message: 'Invalid order amount.' };
  }

  const currentPrice = getCurrentPrice();
  const executionPrice = price && price > 0 ? price : currentPrice;
  const now = new Date().toISOString();
  const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const usdKey = `${userId}_USD`;
  const btcKey = `${userId}_BTC`;
  const usdWallet = store.wallets[usdKey];
  const btcWallet = store.wallets[btcKey];

  if (!usdWallet || !btcWallet) {
    return { success: false, message: 'User wallets not found.' };
  }

  const feeRate = 0.001; // 0.1% fee

  // 1. MARKET ORDER EXECUTION
  if (type === 'MARKET') {
    if (side === 'BUY') {
      const grossCost = Number((amount * currentPrice).toFixed(2));
      const fee = Number((grossCost * feeRate).toFixed(2));
      const totalRequired = Number((grossCost + fee).toFixed(2));

      if (usdWallet.availableBalance < totalRequired) {
        return {
          success: false,
          message: `Insufficient USD balance. Required: $${totalRequired.toLocaleString()}, Available: $${usdWallet.availableBalance.toLocaleString()}`,
        };
      }

      // ATOMIC BALANCE MUTATION
      const usdBefore = usdWallet.availableBalance;
      usdWallet.availableBalance = Number((usdWallet.availableBalance - totalRequired).toFixed(2));
      usdWallet.totalBalance = Number((usdWallet.totalBalance - totalRequired).toFixed(2));
      usdWallet.updatedAt = now;

      const btcBefore = btcWallet.availableBalance;
      btcWallet.availableBalance = Number((btcWallet.availableBalance + amount).toFixed(6));
      btcWallet.totalBalance = Number((btcWallet.totalBalance + amount).toFixed(6));
      btcWallet.updatedAt = now;

      // LEDGER ENTRIES
      const ledDebitId = `led_mkt_buy_usd_${Date.now()}`;
      store.ledgerEntries[ledDebitId] = {
        id: ledDebitId,
        userId,
        walletId: usdWallet.id,
        entryType: 'TRADE_DEBIT',
        asset: 'USD',
        amount: -grossCost,
        balanceBefore: usdBefore,
        balanceAfter: usdBefore - grossCost,
        createdAt: now,
      };

      const ledFeeId = `led_mkt_buy_fee_${Date.now()}`;
      store.ledgerEntries[ledFeeId] = {
        id: ledFeeId,
        userId,
        walletId: usdWallet.id,
        entryType: 'TRADE_FEE',
        asset: 'USD',
        amount: -fee,
        balanceBefore: usdBefore - grossCost,
        balanceAfter: usdWallet.availableBalance,
        createdAt: now,
      };

      const ledCreditId = `led_mkt_buy_btc_${Date.now()}`;
      store.ledgerEntries[ledCreditId] = {
        id: ledCreditId,
        userId,
        walletId: btcWallet.id,
        entryType: 'TRADE_CREDIT',
        asset: 'BTC',
        amount: amount,
        balanceBefore: btcBefore,
        balanceAfter: btcWallet.availableBalance,
        createdAt: now,
      };

      // ORDER RECORD
      const order: Order = {
        id: orderId,
        userId,
        pair,
        type: 'MARKET',
        side: 'BUY',
        price: currentPrice,
        amount,
        filledAmount: amount,
        remainingAmount: 0,
        fee,
        total: totalRequired,
        status: 'FILLED',
        createdAt: now,
        updatedAt: now,
      };
      store.orders[orderId] = order;

      // ORDER FILL
      const fillId = `fill_${Date.now()}`;
      store.orderFills[fillId] = {
        id: fillId,
        orderId,
        userId,
        pair,
        side: 'BUY',
        price: currentPrice,
        amount,
        fee,
        feeAsset: 'USD',
        total: totalRequired,
        createdAt: now,
      };

      // TRANSACTION
      const txId = `tx_trade_${Date.now()}`;
      store.transactions[txId] = {
        id: txId,
        userId,
        type: 'TRADE_BUY',
        asset: 'BTC',
        amount,
        usdValue: totalRequired,
        status: 'COMPLETED',
        source: 'NEXORA Matching Engine',
        destination: `Spot Wallet (BTC)`,
        networkFee: fee,
        confirmations: 6,
        requiredConfirmations: 6,
        blockchainTxHash: `INTERNAL-FILL-${orderId}`,
        isDemo: false,
        createdAt: now,
        completedAt: now,
      };

      saveStore();
      return { success: true, order };
    } else {
      // MARKET SELL
      if (btcWallet.availableBalance < amount) {
        return {
          success: false,
          message: `Insufficient BTC balance. Required: ${amount} BTC, Available: ${btcWallet.availableBalance} BTC`,
        };
      }

      const grossReturn = Number((amount * currentPrice).toFixed(2));
      const fee = Number((grossReturn * feeRate).toFixed(2));
      const netReturn = Number((grossReturn - fee).toFixed(2));

      // ATOMIC BALANCE MUTATION
      const btcBefore = btcWallet.availableBalance;
      btcWallet.availableBalance = Number((btcWallet.availableBalance - amount).toFixed(6));
      btcWallet.totalBalance = Number((btcWallet.totalBalance - amount).toFixed(6));
      btcWallet.updatedAt = now;

      const usdBefore = usdWallet.availableBalance;
      usdWallet.availableBalance = Number((usdWallet.availableBalance + netReturn).toFixed(2));
      usdWallet.totalBalance = Number((usdWallet.totalBalance + netReturn).toFixed(2));
      usdWallet.updatedAt = now;

      // LEDGER ENTRIES
      const ledDebitId = `led_mkt_sell_btc_${Date.now()}`;
      store.ledgerEntries[ledDebitId] = {
        id: ledDebitId,
        userId,
        walletId: btcWallet.id,
        entryType: 'TRADE_DEBIT',
        asset: 'BTC',
        amount: -amount,
        balanceBefore: btcBefore,
        balanceAfter: btcWallet.availableBalance,
        createdAt: now,
      };

      const ledCreditId = `led_mkt_sell_usd_${Date.now()}`;
      store.ledgerEntries[ledCreditId] = {
        id: ledCreditId,
        userId,
        walletId: usdWallet.id,
        entryType: 'TRADE_CREDIT',
        asset: 'USD',
        amount: grossReturn,
        balanceBefore: usdBefore,
        balanceAfter: usdBefore + grossReturn,
        createdAt: now,
      };

      const ledFeeId = `led_mkt_sell_fee_${Date.now()}`;
      store.ledgerEntries[ledFeeId] = {
        id: ledFeeId,
        userId,
        walletId: usdWallet.id,
        entryType: 'TRADE_FEE',
        asset: 'USD',
        amount: -fee,
        balanceBefore: usdBefore + grossReturn,
        balanceAfter: usdWallet.availableBalance,
        createdAt: now,
      };

      // ORDER RECORD
      const order: Order = {
        id: orderId,
        userId,
        pair,
        type: 'MARKET',
        side: 'SELL',
        price: currentPrice,
        amount,
        filledAmount: amount,
        remainingAmount: 0,
        fee,
        total: netReturn,
        status: 'FILLED',
        createdAt: now,
        updatedAt: now,
      };
      store.orders[orderId] = order;

      // ORDER FILL
      const fillId = `fill_${Date.now()}`;
      store.orderFills[fillId] = {
        id: fillId,
        orderId,
        userId,
        pair,
        side: 'SELL',
        price: currentPrice,
        amount,
        fee,
        feeAsset: 'USD',
        total: netReturn,
        createdAt: now,
      };

      // TRANSACTION
      const txId = `tx_trade_${Date.now()}`;
      store.transactions[txId] = {
        id: txId,
        userId,
        type: 'TRADE_SELL',
        asset: 'BTC',
        amount,
        usdValue: netReturn,
        status: 'COMPLETED',
        source: 'Spot Wallet (BTC)',
        destination: 'NEXORA Matching Engine',
        networkFee: fee,
        confirmations: 6,
        requiredConfirmations: 6,
        blockchainTxHash: `INTERNAL-FILL-${orderId}`,
        isDemo: false,
        createdAt: now,
        completedAt: now,
      };

      saveStore();
      return { success: true, order };
    }
  }

  // 2. LIMIT / STOP-LIMIT ORDERS
  const targetPrice = executionPrice;

  if (side === 'BUY') {
    const requiredTotal = Number((amount * targetPrice * 1.001).toFixed(2));
    if (usdWallet.availableBalance < requiredTotal) {
      return {
        success: false,
        message: `Insufficient USD balance to reserve order. Required: $${requiredTotal.toLocaleString()}, Available: $${usdWallet.availableBalance.toLocaleString()}`,
      };
    }

    usdWallet.availableBalance = Number((usdWallet.availableBalance - requiredTotal).toFixed(2));
    usdWallet.lockedBalance = Number((usdWallet.lockedBalance + requiredTotal).toFixed(2));
    usdWallet.updatedAt = now;

    const order: Order = {
      id: orderId,
      userId,
      pair,
      type,
      side: 'BUY',
      price: targetPrice,
      limitPrice,
      stopPrice,
      amount,
      filledAmount: 0,
      remainingAmount: amount,
      fee: Number((amount * targetPrice * 0.001).toFixed(2)),
      total: requiredTotal,
      status: 'OPEN',
      createdAt: now,
      updatedAt: now,
    };
    store.orders[orderId] = order;

    saveStore();
    return { success: true, order };
  } else {
    // SELL LIMIT
    if (btcWallet.availableBalance < amount) {
      return {
        success: false,
        message: `Insufficient BTC balance to reserve order. Required: ${amount} BTC, Available: ${btcWallet.availableBalance} BTC`,
      };
    }

    btcWallet.availableBalance = Number((btcWallet.availableBalance - amount).toFixed(6));
    btcWallet.lockedBalance = Number((btcWallet.lockedBalance + amount).toFixed(6));
    btcWallet.updatedAt = now;

    const expectedTotal = Number((amount * targetPrice * 0.999).toFixed(2));
    const order: Order = {
      id: orderId,
      userId,
      pair,
      type,
      side: 'SELL',
      price: targetPrice,
      limitPrice,
      stopPrice,
      amount,
      filledAmount: 0,
      remainingAmount: amount,
      fee: Number((amount * targetPrice * 0.001).toFixed(2)),
      total: expectedTotal,
      status: 'OPEN',
      createdAt: now,
      updatedAt: now,
    };
    store.orders[orderId] = order;

    saveStore();
    return { success: true, order };
  }
};

// CANCEL OPEN ORDER
export const cancelOrder = (userId: string, orderId: string): { success: boolean; message?: string } => {
  const order = store.orders[orderId];
  if (!order) return { success: false, message: 'Order not found.' };
  if (order.userId !== userId) return { success: false, message: 'Unauthorized.' };
  if (order.status !== 'OPEN') return { success: false, message: `Cannot cancel order with status: ${order.status}` };

  const now = new Date().toISOString();
  const usdKey = `${userId}_USD`;
  const btcKey = `${userId}_BTC`;
  const usdWallet = store.wallets[usdKey];
  const btcWallet = store.wallets[btcKey];

  if (order.side === 'BUY') {
    const lockedAmount = order.total;
    usdWallet.lockedBalance = Math.max(0, Number((usdWallet.lockedBalance - lockedAmount).toFixed(2)));
    usdWallet.availableBalance = Number((usdWallet.availableBalance + lockedAmount).toFixed(2));
    usdWallet.updatedAt = now;
  } else {
    const lockedAmount = order.remainingAmount;
    btcWallet.lockedBalance = Math.max(0, Number((btcWallet.lockedBalance - lockedAmount).toFixed(6)));
    btcWallet.availableBalance = Number((btcWallet.availableBalance + lockedAmount).toFixed(6));
    btcWallet.updatedAt = now;
  }

  order.status = 'CANCELLED';
  order.updatedAt = now;

  saveStore();
  return { success: true };
};

// GET USER ORDERS & FILLS
export const getUserOrders = (userId: string): Order[] => {
  return Object.values(store.orders)
    .filter((o) => o.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const getUserOrderFills = (userId: string): OrderFill[] => {
  return Object.values(store.orderFills)
    .filter((f) => f.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

// TRANSACTIONS
export const getUserTransactions = (userId: string): Transaction[] => {
  return Object.values(store.transactions)
    .filter((t) => t.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

// WITHDRAWALS
export const requestWithdrawal = (params: {
  userId: string;
  asset: AssetSymbol;
  amount: number;
  withdrawalType: 'CRYPTO' | 'BANK';
  destinationAddress?: string;
  bankDetails?: {
    accountHolder: string;
    bankName: string;
    accountNumber: string;
    routingNumber?: string;
    swiftCode?: string;
  };
}): { success: boolean; message?: string; withdrawal?: WithdrawalRequest } => {
  const { userId, asset, amount, withdrawalType, destinationAddress, bankDetails } = params;

  if (amount <= 0 || isNaN(amount)) {
    return { success: false, message: 'Invalid withdrawal amount.' };
  }

  const walletKey = `${userId}_${asset}`;
  const wallet = store.wallets[walletKey];
  if (!wallet) return { success: false, message: 'Wallet not found.' };

  const fee = asset === 'BTC' ? 0.00025 : 15.0;
  const totalDeduction = Number((amount + fee).toFixed(asset === 'BTC' ? 6 : 2));

  if (wallet.availableBalance < totalDeduction) {
    return {
      success: false,
      message: `Insufficient available balance. Required: ${totalDeduction} ${asset}. Available: ${wallet.availableBalance} ${asset}.`,
    };
  }

  const now = new Date().toISOString();
  const withdrawalId = `wdr_${Date.now()}`;

  wallet.availableBalance = Number((wallet.availableBalance - totalDeduction).toFixed(asset === 'BTC' ? 6 : 2));
  wallet.lockedBalance = Number((wallet.lockedBalance + totalDeduction).toFixed(asset === 'BTC' ? 6 : 2));
  wallet.updatedAt = now;

  const ledId = `led_wdr_lock_${Date.now()}`;
  store.ledgerEntries[ledId] = {
    id: ledId,
    userId,
    walletId: wallet.id,
    entryType: 'WITHDRAWAL_LOCK',
    asset,
    amount: -totalDeduction,
    balanceBefore: wallet.availableBalance + totalDeduction,
    balanceAfter: wallet.availableBalance,
    createdAt: now,
  };

  const withdrawal: WithdrawalRequest = {
    id: withdrawalId,
    userId,
    asset,
    amount,
    fee,
    netAmount: amount,
    withdrawalType,
    destinationAddress,
    bankDetails,
    status: 'PENDING',
    createdAt: now,
  };
  store.withdrawals[withdrawalId] = withdrawal;

  const currentBtcPrice = getCurrentPrice();
  const usdValue = asset === 'BTC' ? Number((amount * currentBtcPrice).toFixed(2)) : amount;
  const txId = `tx_wdr_${Date.now()}`;
  store.transactions[txId] = {
    id: txId,
    userId,
    type: 'WITHDRAWAL',
    asset,
    amount,
    usdValue,
    status: 'PENDING',
    source: `NEXORA Hot Vault [${wallet.id.slice(0, 6)}]`,
    destination: withdrawalType === 'CRYPTO' ? destinationAddress || 'Unknown' : `${bankDetails?.bankName} (Acct: ${bankDetails?.accountNumber})`,
    networkFee: fee,
    confirmations: 0,
    requiredConfirmations: 6,
    isDemo: false,
    createdAt: now,
  };

  saveStore();
  return { success: true, withdrawal };
};

export const getUserWithdrawals = (userId: string): WithdrawalRequest[] => {
  return Object.values(store.withdrawals)
    .filter((w) => w.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

// SUPPORT TICKETS
export const createSupportTicket = (params: {
  userId: string;
  userEmail: string;
  category: 'Account' | 'Deposit' | 'Withdrawal' | 'Trading' | 'Technical' | 'Other';
  message: string;
}): SupportTicket => {
  const now = new Date().toISOString();
  const ticketId = `tkt_${Date.now()}`;
  const ticket: SupportTicket = {
    id: ticketId,
    userId: params.userId,
    userEmail: params.userEmail,
    category: params.category,
    message: params.message,
    status: 'OPEN',
    createdAt: now,
    updatedAt: now,
  };
  store.tickets[ticketId] = ticket;
  saveStore();
  return ticket;
};

export const getUserTickets = (userId: string): SupportTicket[] => {
  return Object.values(store.tickets)
    .filter((t) => t.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

// ADMIN ACTIONS
export const getAdminStats = () => {
  const users = Object.values(store.profiles);
  const activeUsers = users.filter((u) => u.status === 'ACTIVE').length;
  const withdrawals = Object.values(store.withdrawals);
  const pendingWithdrawals = withdrawals.filter((w) => w.status === 'PENDING').length;
  const deposits = Object.values(store.deposits);
  const pendingDeposits = deposits.filter((d) => d.status === 'PENDING').length;
  const orders = Object.values(store.orders);
  const openOrders = orders.filter((o) => o.status === 'OPEN').length;
  const tickets = Object.values(store.tickets);
  const openTickets = tickets.filter((t) => t.status === 'OPEN').length;

  const txs = Object.values(store.transactions);
  let totalDepositsUsd = 0;
  let totalWithdrawalsUsd = 0;
  let tradingVolumeUsd = 0;

  txs.forEach((t) => {
    if (t.type === 'DEPOSIT') totalDepositsUsd += t.usdValue;
    if (t.type === 'WITHDRAWAL') totalWithdrawalsUsd += t.usdValue;
    if (t.type === 'TRADE_BUY' || t.type === 'TRADE_SELL') tradingVolumeUsd += t.usdValue;
  });

  return {
    totalUsers: users.length,
    activeUsers,
    totalDepositsUsd: Number(totalDepositsUsd.toFixed(2)),
    totalWithdrawalsUsd: Number(totalWithdrawalsUsd.toFixed(2)),
    tradingVolumeUsd: Number(tradingVolumeUsd.toFixed(2)),
    pendingWithdrawals,
    pendingDeposits,
    openOrders,
    openTickets,
  };
};

export const getAllUsers = (): UserProfile[] => {
  return Object.values(store.profiles);
};

export const updateUserStatus = (adminId: string, targetUserId: string, newStatus: 'ACTIVE' | 'SUSPENDED') => {
  const user = store.profiles[targetUserId];
  if (!user) return false;
  user.status = newStatus;
  user.updatedAt = new Date().toISOString();

  const logId = `aud_${Date.now()}`;
  store.auditLogs[logId] = {
    id: logId,
    adminId,
    adminEmail: store.profiles[adminId]?.email || 'admin@nexora.io',
    action: `USER_${newStatus}`,
    targetType: 'USER',
    targetId: targetUserId,
    metadata: { previousStatus: user.status, newStatus },
    createdAt: new Date().toISOString(),
  };

  saveStore();
  return true;
};

export const getAllWithdrawals = (): WithdrawalRequest[] => {
  return Object.values(store.withdrawals).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
};

export const approveWithdrawal = (adminId: string, withdrawalId: string) => {
  const withdrawal = store.withdrawals[withdrawalId];
  if (!withdrawal || withdrawal.status !== 'PENDING') return false;

  const now = new Date().toISOString();
  const walletKey = `${withdrawal.userId}_${withdrawal.asset}`;
  const wallet = store.wallets[walletKey];
  const totalDeduction = Number((withdrawal.amount + withdrawal.fee).toFixed(withdrawal.asset === 'BTC' ? 6 : 2));

  if (wallet) {
    wallet.lockedBalance = Math.max(0, Number((wallet.lockedBalance - totalDeduction).toFixed(withdrawal.asset === 'BTC' ? 6 : 2)));
    wallet.totalBalance = Math.max(0, Number((wallet.totalBalance - totalDeduction).toFixed(withdrawal.asset === 'BTC' ? 6 : 2)));
    wallet.updatedAt = now;
  }

  withdrawal.status = 'COMPLETED';
  withdrawal.completedAt = now;
  withdrawal.txHash = 'tx_' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

  const ledId = `led_wdr_deb_${Date.now()}`;
  store.ledgerEntries[ledId] = {
    id: ledId,
    userId: withdrawal.userId,
    walletId: wallet ? wallet.id : `w_${withdrawal.asset}_${withdrawal.userId}`,
    entryType: 'WITHDRAWAL_DEBIT',
    asset: withdrawal.asset,
    amount: -totalDeduction,
    balanceBefore: wallet ? wallet.totalBalance + totalDeduction : 0,
    balanceAfter: wallet ? wallet.totalBalance : 0,
    createdAt: now,
  };

  const logId = `aud_${Date.now()}`;
  store.auditLogs[logId] = {
    id: logId,
    adminId,
    adminEmail: store.profiles[adminId]?.email || 'admin@nexora.io',
    action: 'WITHDRAWAL_APPROVED',
    targetType: 'WITHDRAWAL',
    targetId: withdrawalId,
    metadata: { asset: withdrawal.asset, amount: withdrawal.amount },
    createdAt: now,
  };

  saveStore();
  return true;
};

export const rejectWithdrawal = (adminId: string, withdrawalId: string, reason = 'Compliance clearance check') => {
  const withdrawal = store.withdrawals[withdrawalId];
  if (!withdrawal || withdrawal.status !== 'PENDING') return false;

  const now = new Date().toISOString();
  const walletKey = `${withdrawal.userId}_${withdrawal.asset}`;
  const wallet = store.wallets[walletKey];
  const totalDeduction = Number((withdrawal.amount + withdrawal.fee).toFixed(withdrawal.asset === 'BTC' ? 6 : 2));

  if (wallet) {
    wallet.lockedBalance = Math.max(0, Number((wallet.lockedBalance - totalDeduction).toFixed(withdrawal.asset === 'BTC' ? 6 : 2)));
    wallet.availableBalance = Number((wallet.availableBalance + totalDeduction).toFixed(withdrawal.asset === 'BTC' ? 6 : 2));
    wallet.updatedAt = now;
  }

  withdrawal.status = 'REJECTED';
  withdrawal.completedAt = now;

  const ledId = `led_wdr_rel_${Date.now()}`;
  store.ledgerEntries[ledId] = {
    id: ledId,
    userId: withdrawal.userId,
    walletId: wallet ? wallet.id : `w_${withdrawal.asset}_${withdrawal.userId}`,
    entryType: 'WITHDRAWAL_RELEASE',
    asset: withdrawal.asset,
    amount: totalDeduction,
    balanceBefore: wallet ? wallet.availableBalance - totalDeduction : 0,
    balanceAfter: wallet ? wallet.availableBalance : 0,
    createdAt: now,
  };

  const logId = `aud_${Date.now()}`;
  store.auditLogs[logId] = {
    id: logId,
    adminId,
    adminEmail: store.profiles[adminId]?.email || 'admin@nexora.io',
    action: 'WITHDRAWAL_REJECTED',
    targetType: 'WITHDRAWAL',
    targetId: withdrawalId,
    metadata: { reason },
    createdAt: now,
  };

  saveStore();
  return true;
};

export const answerTicket = (adminId: string, ticketId: string, response: string) => {
  const ticket = store.tickets[ticketId];
  if (!ticket) return false;
  ticket.adminResponse = response;
  ticket.status = 'RESOLVED';
  ticket.updatedAt = new Date().toISOString();

  const logId = `aud_${Date.now()}`;
  store.auditLogs[logId] = {
    id: logId,
    adminId,
    adminEmail: store.profiles[adminId]?.email || 'admin@nexora.io',
    action: 'SUPPORT_TICKET_ANSWERED',
    targetType: 'SUPPORT_TICKET',
    targetId: ticketId,
    createdAt: new Date().toISOString(),
  };

  saveStore();
  return true;
};

export const getAllTickets = (): SupportTicket[] => {
  return Object.values(store.tickets).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
};

export const getAuditLogs = (): AuditLog[] => {
  return Object.values(store.auditLogs).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
};

export const getAllTransactions = (): Transaction[] => {
  return Object.values(store.transactions).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
};

export const getAllOrders = (): Order[] => {
  return Object.values(store.orders).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
};

// USER PROFILE MANAGEMENT
export const getUserProfile = (userId: string): UserProfile | undefined => {
  return store.profiles[userId];
};

export const updateUserProfile = (userId: string, updates: Partial<UserProfile>): UserProfile => {
  const current = store.profiles[userId];
  if (!current) {
    throw new Error('Profile not found');
  }
  const updated = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  store.profiles[userId] = updated;
  saveStore();
  return updated;
};

export const createProfile = (profile: UserProfile): UserProfile => {
  store.profiles[profile.userId] = profile;
  initializeUserWallets(profile.userId, 0, 0);
  saveStore();
  return profile;
};

seedInitialAccounts();
