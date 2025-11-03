// 用户相关类型
export interface User {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// 会话相关类型
export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

// API 响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 股票相关类型
export interface Stock {
  code: string;
  name: string;
  market: string;
}

export interface StockQuote {
  code: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  amount: number;
  high: number;
  low: number;
  open: number;
  preClose: number;
  timestamp: string;
}

export interface StockKline {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  amount: number;
}

// 自选股类型
export interface Watchlist {
  id: string;
  userId: string;
  stockCode: string;
  stockName: string;
  createdAt: Date;
}

// WebSocket 消息类型
export enum WSMessageType {
  SUBSCRIBE = 'subscribe',
  UNSUBSCRIBE = 'unsubscribe',
  QUOTE = 'quote',
  PING = 'ping',
  PONG = 'pong',
  ERROR = 'error',
}

export interface WSMessage {
  type: WSMessageType;
  data?: any;
  error?: string;
}

export interface WSSubscribeMessage extends WSMessage {
  type: WSMessageType.SUBSCRIBE;
  data: {
    codes: string[];
  };
}

export interface WSUnsubscribeMessage extends WSMessage {
  type: WSMessageType.UNSUBSCRIBE;
  data: {
    codes: string[];
  };
}

export interface WSQuoteMessage extends WSMessage {
  type: WSMessageType.QUOTE;
  data: StockQuote;
}
