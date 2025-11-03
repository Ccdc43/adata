import { WebSocketServer, WebSocket } from 'ws';
import { getStockQuote } from '../lib/adata';
import { WSMessageType, WSMessage, StockQuote } from '../types';

interface Client {
  ws: WebSocket;
  subscribedCodes: Set<string>;
}

export class StockWebSocketServer {
  private wss: WebSocketServer;
  private clients: Map<WebSocket, Client> = new Map();
  private updateInterval: NodeJS.Timeout | null = null;
  private readonly UPDATE_INTERVAL_MS = 3000; // 3秒更新一次

  constructor(port: number) {
    this.wss = new WebSocketServer({ port });
    this.setupServer();
    console.log(`WebSocket server started on port ${port}`);
  }

  private setupServer() {
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('New WebSocket connection');

      const client: Client = {
        ws,
        subscribedCodes: new Set(),
      };

      this.clients.set(ws, client);

      // 发送欢迎消息
      this.sendMessage(ws, {
        type: WSMessageType.PONG,
        data: { message: 'Connected to stock WebSocket server' },
      });

      // 处理消息
      ws.on('message', (data: Buffer) => {
        this.handleMessage(ws, data);
      });

      // 处理关闭
      ws.on('close', () => {
        console.log('WebSocket connection closed');
        this.clients.delete(ws);
      });

      // 处理错误
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(ws);
      });
    });

    // 启动定时更新
    this.startUpdateLoop();
  }

  private handleMessage(ws: WebSocket, data: Buffer) {
    try {
      const message: WSMessage = JSON.parse(data.toString());
      const client = this.clients.get(ws);

      if (!client) return;

      switch (message.type) {
        case WSMessageType.SUBSCRIBE:
          this.handleSubscribe(client, message.data?.codes || []);
          break;

        case WSMessageType.UNSUBSCRIBE:
          this.handleUnsubscribe(client, message.data?.codes || []);
          break;

        case WSMessageType.PING:
          this.sendMessage(ws, { type: WSMessageType.PONG });
          break;

        default:
          this.sendMessage(ws, {
            type: WSMessageType.ERROR,
            error: 'Unknown message type',
          });
      }
    } catch (error) {
      console.error('Failed to handle message:', error);
      this.sendMessage(ws, {
        type: WSMessageType.ERROR,
        error: 'Invalid message format',
      });
    }
  }

  private handleSubscribe(client: Client, codes: string[]) {
    codes.forEach((code) => {
      client.subscribedCodes.add(code);
    });

    console.log(`Client subscribed to: ${codes.join(', ')}`);

    // 立即发送一次数据
    this.sendQuotesToClient(client);
  }

  private handleUnsubscribe(client: Client, codes: string[]) {
    codes.forEach((code) => {
      client.subscribedCodes.delete(code);
    });

    console.log(`Client unsubscribed from: ${codes.join(', ')}`);
  }

  private sendMessage(ws: WebSocket, message: WSMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private async sendQuotesToClient(client: Client) {
    for (const code of client.subscribedCodes) {
      try {
        const quote = await getStockQuote(code);
        if (quote) {
          this.sendMessage(client.ws, {
            type: WSMessageType.QUOTE,
            data: quote,
          });
        }
      } catch (error) {
        console.error(`Failed to get quote for ${code}:`, error);
      }
    }
  }

  private startUpdateLoop() {
    this.updateInterval = setInterval(async () => {
      // 收集所有订阅的股票代码
      const allCodes = new Set<string>();
      this.clients.forEach((client) => {
        client.subscribedCodes.forEach((code) => allCodes.add(code));
      });

      // 批量获取行情数据
      const quotes = new Map<string, StockQuote>();
      for (const code of allCodes) {
        try {
          const quote = await getStockQuote(code);
          if (quote) {
            quotes.set(code, quote);
          }
        } catch (error) {
          console.error(`Failed to get quote for ${code}:`, error);
        }
      }

      // 推送给订阅的客户端
      this.clients.forEach((client) => {
        client.subscribedCodes.forEach((code) => {
          const quote = quotes.get(code);
          if (quote) {
            this.sendMessage(client.ws, {
              type: WSMessageType.QUOTE,
              data: quote,
            });
          }
        });
      });
    }, this.UPDATE_INTERVAL_MS);
  }

  public stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    this.wss.close();
    console.log('WebSocket server stopped');
  }
}

// 启动 WebSocket 服务器
if (require.main === module) {
  const port = parseInt(process.env.WS_PORT || '3001');
  new StockWebSocketServer(port);
}
