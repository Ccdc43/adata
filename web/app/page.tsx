'use client';

import { useState, useEffect } from 'react';
import { useWebSocket } from '../lib/useWebSocket';

interface Stock {
  code: string;
  name: string;
  price?: number;
  change?: number;
  changePercent?: number;
}

export default function Home() {
  const [stocks, setStocks] = useState<Stock[]>([
    { code: '000001', name: '平安银行' },
    { code: '600000', name: '浦发银行' },
    { code: '000002', name: '万科A' },
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const { subscribe, unsubscribe, data } = useWebSocket();

  useEffect(() => {
    stocks.forEach(stock => subscribe(stock.code));
    return () => {
      stocks.forEach(stock => unsubscribe(stock.code));
    };
  }, [stocks]);

  useEffect(() => {
    if (data) {
      setStocks(prev => prev.map(stock => 
        stock.code === data.code ? { ...stock, ...data } : stock
      ));
    }
  }, [data]);

  const addStock = async () => {
    if (!searchQuery.trim()) return;
    const newStock = { code: searchQuery.trim(), name: searchQuery.trim() };
    setStocks(prev => [...prev, newStock]);
    subscribe(newStock.code);
    setSearchQuery('');
  };

  const removeStock = (code: string) => {
    setStocks(prev => prev.filter(s => s.code !== code));
    unsubscribe(code);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">A股实时监控</h1>
          <p className="text-gray-600">实时追踪股票行情变化</p>
        </header>

        <div className="mb-6 flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addStock()}
            placeholder="输入股票代码（如：000001）"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={addStock}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            添加自选股
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stocks.map(stock => (
            <div
              key={stock.code}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{stock.name}</h3>
                  <p className="text-sm text-gray-500">{stock.code}</p>
                </div>
                <button
                  onClick={() => removeStock(stock.code)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  ×
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-gray-900">
                    {stock.price ? `¥${stock.price.toFixed(2)}` : '加载中...'}
                  </span>
                  {stock.changePercent !== undefined && (
                    <span
                      className={`text-sm font-semibold ${
                        stock.changePercent >= 0 ? 'text-red-600' : 'text-green-600'
                      }`}
                    >
                      {stock.changePercent >= 0 ? '+' : ''}
                      {stock.changePercent.toFixed(2)}%
                    </span>
                  )}
                </div>

                {stock.change !== undefined && (
                  <div
                    className={`text-sm ${
                      stock.change >= 0 ? 'text-red-600' : 'text-green-600'
                    }`}
                  >
                    {stock.change >= 0 ? '+' : ''}
                    {stock.change.toFixed(2)}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400">
                  实时更新 · 数据仅供参考
                </p>
              </div>
            </div>
          ))}
        </div>

        {stocks.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">暂无自选股，请添加股票代码</p>
          </div>
        )}
      </div>
    </div>
  );
}
