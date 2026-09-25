export type UserRole = 'USER' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'SUSPENDED';

export interface UserProfile {
  id: string;
  userId: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  country?: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  twoFactorEnabled?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AssetSymbol = 'BTC' | 'USD';

export interface Wallet {
  id: string;
  userId: string;
  asset: AssetSymbol;
  symbol: string;
  name: string;
  availableBalance: number;
  lockedBalance: number;
  totalBalance: number;
  usdEquivalent: number;
  updatedAt: string;
}

export type OrderType = 'MARKET' | 'LIMIT' | 'STOP_LIMIT';
export type OrderSide = 'BUY' | 'SELL';
export type OrderStatus = 'PENDING' | 'OPEN' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELLED' | 'REJECTED';

export interface Order {
  id: string;
  userId: string;
  pair: string;
  type: OrderType;
  side: OrderSide;
  price: number;
  limitPrice?: number;
  stopPrice?: number;
  amount: number;
  filledAmount: number;
  remainingAmount: number;
  fee: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface OrderFill {
  id: string;
  orderId: string;
  userId: string;
  pair: string;
  side: OrderSide;
  price: number;
  amount: number;
  fee: number;
  feeAsset: AssetSymbol;
  total: number;
  createdAt: string;
}

export type TransactionType = 'DEPOSIT' | 'WITHDRAWAL' | 'TRADE_BUY' | 'TRADE_SELL';
export type TransactionStatus = 'PENDING' | 'PROCESSING' | 'CONFIRMING' | 'COMPLETED' | 'FAILED' | 'REJECTED' | 'CANCELLED';

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  asset: AssetSymbol;
  amount: number;
  usdValue: number;
  status: TransactionStatus;
  source: string;
  destination: string;
  networkFee: number;
  confirmations: number;
  requiredConfirmations: number;
  blockchainTxHash?: string;
  isDemo: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
  completedAt?: string;
}

export type LedgerEntryType =
  | 'DEPOSIT_CREDIT'
  | 'WITHDRAWAL_LOCK'
  | 'WITHDRAWAL_DEBIT'
  | 'WITHDRAWAL_RELEASE'
  | 'TRADE_DEBIT'
  | 'TRADE_CREDIT'
  | 'TRADE_FEE';

export interface LedgerEntry {
  id: string;
  userId: string;
  walletId: string;
  transactionId?: string;
  entryType: LedgerEntryType;
  asset: AssetSymbol;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: string;
}

export interface DepositSetting {
  id: string;
  asset: AssetSymbol;
  network: string;
  walletAddress: string;
  qrCodeUrl?: string;
  instructions?: string;
  updatedAt: string;
  updatedBy: string;
}

export interface DepositRequest {
  id: string;
  userId: string;
  userEmail: string;
  asset: AssetSymbol;
  network: string;
  amount: number;
  usdAmount: number;
  depositAddress: string;
  confirmations: number;
  requiredConfirmations: number;
  status: TransactionStatus;
  txHash: string;
  proofReceiptUrl?: string;
  createdAt: string;
  confirmedAt?: string;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  asset: AssetSymbol;
  amount: number;
  fee: number;
  netAmount: number;
  withdrawalType: 'CRYPTO' | 'BANK';
  destinationAddress?: string;
  bankDetails?: {
    accountHolder: string;
    bankName: string;
    accountNumber: string;
    routingNumber?: string;
    swiftCode?: string;
  };
  status: 'PENDING' | 'PROCESSING' | 'CONFIRMING' | 'COMPLETED' | 'REJECTED';
  txHash?: string;
  createdAt: string;
  completedAt?: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userEmail: string;
  category: 'Account' | 'Deposit' | 'Withdrawal' | 'Trading' | 'Technical' | 'Other';
  message: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  adminResponse?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  adminId: string;
  adminEmail: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface OrderBookLevel {
  price: number;
  size: number;
  total: number;
}

export interface RecentTrade {
  id: string;
  price: number;
  amount: number;
  side: 'BUY' | 'SELL';
  time: string;
}

export interface TickerData {
  pair: string;
  lastPrice: number;
  indexPrice: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  liquidity: number;
  spread: number;
}
