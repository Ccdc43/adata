'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { WSMessageType, WSMessage, StockQuote } from '@/types';

interface UseWebSocketOptions {
  onQuote?: (quote: StockQuote) => void;
  onError?: (error: string) => void;
  reconnectInterval?: number;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    onQuote,
    onError,
    reconnectInterval = 5000,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [subscribedCodes, setSubscribedCodes] = useState<Set<string>>(new Set());
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);

      // 重新订阅之前的股票
      if (subscribedCodes.size > 0) {
        ws.send(JSON.stringify({
          type: WSMessageType.SUBSCRIBE,
          data: { codes: Array.from(subscribedCodes) },
        }));
      }
    };

    ws.onmessage = (event) => {
      try {
        const message: WSMessage = JSON.parse(event.data);

        switch (message.type) {
          case WSMessageType.QUOTE:
            if (onQuote && message.data) {
              onQuote(message.data);
            }
            break;

          case WSMessageType.ERROR:
            if (onError && message.error) {
              onError(message.error);
            }
            break;

          case WSMessageType.PONG:
            // 心跳响应
            break;
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      if (onError) {
        onError('WebSocket connection error');
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      wsRef.current = null;

      // 自动重连
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log('Reconnecting WebSocket...');
        connect();
      }, reconnectInterval);
    };

    wsRef.current = ws;
  }, [subscribedCodes, onQuote, onError, reconnectInterval]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  const subscribe = useCallback((codes: string[]) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected');
      return;
    }

    wsRef.current.send(JSON.stringify({
      type: WSMessageType.SUBSCRIBE,
      data: { codes },
    }));

    setSubscribedCodes((prev) => {
      const newSet = new Set(prev);
      codes.forEach((code) => newSet.add(code));
      return newSet;
    });
  }, []);

  const unsubscribe = useCallback((codes: string[]) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected');
      return;
    }

    wsRef.current.send(JSON.stringify({
      type: WSMessageType.UNSUBSCRIBE,
      data: { codes },
    }));

    setSubscribedCodes((prev) => {
      const newSet = new Set(prev);
      codes.forEach((code) => newSet.delete(code));
      return newSet;
    });
  }, []);

  const ping = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    wsRef.current.send(JSON.stringify({
      type: WSMessageType.PING,
    }));
  }, []);

  return {
    isConnected,
    subscribe,
    unsubscribe,
    ping,
  };
}
