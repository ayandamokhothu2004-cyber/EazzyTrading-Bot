export interface SymbolState {
  price: number;
  ask: number;
  bid: number;
  spread: number;
  trend: string;
  h4Trend: string;
  h1Trend: string;
  sweepDetected: string;
  confirmation: string;
  entryModel: string;
}

export interface OpenTrade {
  ticket: string;
  symbol: string;
  direction: 'BUY' | 'SELL';
  lotSize: number;
  entryPrice: number;
  slPrice: number;
  tp1Price: number;
  tp2Price: number;
  currentPrice: number;
  unrealizedPL: number;
  pips: number;
  tp1Hit: boolean;
  breakeven: boolean;
  reason: string;
  openTime: string;
}

export interface BotDashboardData {
  isRunning: boolean;
  mode: string;
  accountCurrency?: string;
  currencySymbol?: string;
  accountBalance: number;
  accountEquity: number;
  todayPL: number;
  todayPLPct: number;
  dailyRiskUsedPct: number;
  weeklyRiskUsedPct: number;
  consecutiveLosses: number;
  dailyTradeCount: number;
  activeSession: string;
  symbolsState: Record<string, SymbolState>;
  openTrades: OpenTrade[];
  logs?: string[];
  mt5Connected?: boolean;
  lastCycleTime?: string;
}

export interface ModelComparisonResult {
  modelName: string;
  modelKey: 'MODEL_A' | 'MODEL_B' | 'MODEL_C';
  winRate: number;
  totalTrades: number;
  profitFactor: number;
  netProfit: number;
  returnPct: number;
  maxDrawdownPct: number;
  expectancy: number;
  averageTrade?: number;
  avgRR: number;
  longestWinStreak: number;
  longestLossStreak: number;
  monthlyReturns: { month: string; returnPct: number }[];
  equityCurve: { bar: number; equity: number }[];
}

export interface BacktestResults {
  symbol: string;
  period: string;
  modelsComparison: ModelComparisonResult[];
}

export interface JournalTrade {
  trade_id: string;
  date: string;
  time: string;
  symbol: string;
  direction: 'BUY' | 'SELL';
  entry_price: number;
  sl_price: number;
  tp_price: number;
  exit_price: number;
  lot_size: number;
  risk_pct: number;
  profit_loss: number;
  rr_achieved: number;
  reason_for_entry: string;
}
