import { spawn } from 'child_process';
import path from 'path';
import { Stock, StockQuote, StockKline } from '@/types';

// adata Python SDK 路径
const ADATA_PATH = path.resolve(__dirname, '../../..');

/**
 * 执行 Python 脚本
 */
async function executePython(code: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const python = spawn('python3', ['-c', code], {
      cwd: ADATA_PATH,
      env: { ...process.env, PYTHONPATH: ADATA_PATH },
    });

    let stdout = '';
    let stderr = '';

    python.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    python.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    python.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Python script failed: ${stderr}`));
      } else {
        try {
          const result = JSON.parse(stdout);
          resolve(result);
        } catch (error) {
          reject(new Error(`Failed to parse Python output: ${stdout}`));
        }
      }
    });

    python.on('error', (error) => {
      reject(new Error(`Failed to spawn Python process: ${error.message}`));
    });
  });
}

/**
 * 获取所有股票代码列表
 */
export async function getAllStocks(): Promise<Stock[]> {
  const code = `
import sys
import json
try:
    import adata
    df = adata.stock.info.all_code()
    result = df[['stock_code', 'short_name']].head(100).to_dict('records')
    output = [{'code': item['stock_code'], 'name': item['short_name'], 'market': 'CN'} for item in result]
    print(json.dumps(output, ensure_ascii=False))
except Exception as e:
    print(json.dumps({'error': str(e)}), file=sys.stderr)
    sys.exit(1)
  `.trim();

  try {
    const result = await executePython(code);
    return result;
  } catch (error) {
    console.error('Failed to get stock list:', error);
    // 返回模拟数据作为后备
    return getMockStocks();
  }
}

/**
 * 获取股票实时行情
 */
export async function getStockQuote(stockCode: string): Promise<StockQuote | null> {
  const code = `
import sys
import json
from datetime import datetime
try:
    import adata
    df = adata.stock.market.get_market(stock_code='${stockCode}')
    if df.empty:
        print(json.dumps({'error': 'Stock not found'}), file=sys.stderr)
        sys.exit(1)
    
    row = df.iloc[-1]
    result = {
        'code': '${stockCode}',
        'name': row.get('short_name', ''),
        'price': float(row.get('close', 0)),
        'change': float(row.get('change', 0)),
        'changePercent': float(row.get('change_pct', 0)),
        'volume': float(row.get('volume', 0)),
        'amount': float(row.get('amount', 0)),
        'high': float(row.get('high', 0)),
        'low': float(row.get('low', 0)),
        'open': float(row.get('open', 0)),
        'preClose': float(row.get('pre_close', 0)),
        'timestamp': datetime.now().isoformat()
    }
    print(json.dumps(result, ensure_ascii=False))
except Exception as e:
    print(json.dumps({'error': str(e)}), file=sys.stderr)
    sys.exit(1)
  `.trim();

  try {
    const result = await executePython(code);
    return result;
  } catch (error) {
    console.error(`Failed to get quote for ${stockCode}:`, error);
    // 返回模拟数据
    return getMockQuote(stockCode);
  }
}

/**
 * 获取股票 K 线数据
 */
export async function getStockKline(
  stockCode: string,
  period: 'daily' | 'weekly' | 'monthly' = 'daily',
  limit: number = 100
): Promise<StockKline[]> {
  const code = `
import sys
import json
try:
    import adata
    df = adata.stock.market.get_market(stock_code='${stockCode}')
    if df.empty:
        print(json.dumps([]))
        sys.exit(0)
    
    df = df.tail(${limit})
    result = []
    for _, row in df.iterrows():
        result.append({
            'date': str(row.get('trade_date', '')),
            'open': float(row.get('open', 0)),
            'high': float(row.get('high', 0)),
            'low': float(row.get('low', 0)),
            'close': float(row.get('close', 0)),
            'volume': float(row.get('volume', 0)),
            'amount': float(row.get('amount', 0))
        })
    print(json.dumps(result, ensure_ascii=False))
except Exception as e:
    print(json.dumps({'error': str(e)}), file=sys.stderr)
    sys.exit(1)
  `.trim();

  try {
    const result = await executePython(code);
    return result;
  } catch (error) {
    console.error(`Failed to get kline for ${stockCode}:`, error);
    return [];
  }
}

/**
 * 搜索股票
 */
export async function searchStocks(keyword: string): Promise<Stock[]> {
  const allStocks = await getAllStocks();
  const lowerKeyword = keyword.toLowerCase();
  
  return allStocks.filter(
    (stock) =>
      stock.code.toLowerCase().includes(lowerKeyword) ||
      stock.name.toLowerCase().includes(lowerKeyword)
  );
}

// ========== 模拟数据（用于开发和后备） ==========

function getMockStocks(): Stock[] {
  return [
    { code: '000001', name: '平安银行', market: 'CN' },
    { code: '000002', name: '万科A', market: 'CN' },
    { code: '000063', name: '中兴通讯', market: 'CN' },
    { code: '000333', name: '美的集团', market: 'CN' },
    { code: '000858', name: '五粮液', market: 'CN' },
    { code: '600000', name: '浦发银行', market: 'CN' },
    { code: '600036', name: '招商银行', market: 'CN' },
    { code: '600519', name: '贵州茅台', market: 'CN' },
    { code: '600887', name: '伊利股份', market: 'CN' },
    { code: '601318', name: '中国平安', market: 'CN' },
  ];
}

function getMockQuote(stockCode: string): StockQuote {
  const basePrice = 10 + Math.random() * 90;
  const change = (Math.random() - 0.5) * 2;
  const changePercent = (change / basePrice) * 100;

  return {
    code: stockCode,
    name: `股票${stockCode}`,
    price: parseFloat(basePrice.toFixed(2)),
    change: parseFloat(change.toFixed(2)),
    changePercent: parseFloat(changePercent.toFixed(2)),
    volume: Math.floor(Math.random() * 10000000),
    amount: Math.floor(Math.random() * 1000000000),
    high: parseFloat((basePrice + Math.random() * 2).toFixed(2)),
    low: parseFloat((basePrice - Math.random() * 2).toFixed(2)),
    open: parseFloat((basePrice + (Math.random() - 0.5)).toFixed(2)),
    preClose: parseFloat(basePrice.toFixed(2)),
    timestamp: new Date().toISOString(),
  };
}
