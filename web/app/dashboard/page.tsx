'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import StockCard from '@/components/stock/StockCard';
import { useWebSocket } from '@/lib/useWebSocket';
import { StockQuote, Watchlist, Stock } from '@/types';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [watchlist, setWatchlist] = useState<Watchlist[]>([]);
  const [quotes, setQuotes] = useState<Map<string, StockQuote>>(new Map());
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<Stock[]>([]);
  const [searching, setSearching] = useState(false);

  // WebSocket 连接
  const { isConnected, subscribe, unsubscribe } = useWebSocket({
    onQuote: (quote) => {
      setQuotes((prev) => {
        const newMap = new Map(prev);
        newMap.set(quote.code, quote);
        return newMap;
      });
    },
    onError: (error) => {
      console.error('WebSocket error:', error);
    },
  });

  // 获取当前用户
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
        router.push('/login');
      }
    };

    fetchUser();
  }, [router]);

  // 获取自选股列表
  useEffect(() => {
    const fetchWatchlist = async () => {
      try {
        const response = await fetch('/api/watchlist');
        if (response.ok) {
          const data = await response.json();
          setWatchlist(data.data);

          // 订阅自选股实时数据
          const codes = data.data.map((item: Watchlist) => item.stockCode);
          if (codes.length > 0) {
            subscribe(codes);
          }
        }
      } catch (error) {
        console.error('Failed to fetch watchlist:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchWatchlist();
    }
  }, [user, subscribe]);

  // 搜索股票
  const handleSearch = async () => {
    if (!searchKeyword.trim()) return;

    setSearching(true);
    try {
      const response = await fetch(`/api/stock/list?keyword=${encodeURIComponent(searchKeyword)}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.data);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setSearching(false);
    }
  };

  // 添加自选股
  const handleAddToWatchlist = async (stock: Stock) => {
    try {
      const response = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stockCode: stock.code,
          stockName: stock.name,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setWatchlist((prev) => [data.data, ...prev]);
        subscribe([stock.code]);
        setSearchResults([]);
        setSearchKeyword('');
      }
    } catch (error) {
      console.error('Failed to add to watchlist:', error);
    }
  };

  // 移除自选股
  const handleRemoveFromWatchlist = async (item: Watchlist) => {
    try {
      const response = await fetch(`/api/watchlist?id=${item.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setWatchlist((prev) => prev.filter((w) => w.id !== item.id));
        unsubscribe([item.stockCode]);
        setQuotes((prev) => {
          const newMap = new Map(prev);
          newMap.delete(item.stockCode);
          return newMap;
        });
      }
    } catch (error) {
      console.error('Failed to remove from watchlist:', error);
    }
  };

  // 登出
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">A股实时监控</h1>
              <p className="text-sm text-gray-600 mt-1">
                {user?.email} | WebSocket: {isConnected ? '已连接' : '未连接'}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
            >
              退出登录
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">添加自选股</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="输入股票代码或名称搜索..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            <button
              onClick={handleSearch}
              disabled={searching}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {searching ? '搜索中...' : '搜索'}
            </button>
          </div>

          {searchResults.length > 0 && (
            <div className="mt-4 border border-gray-200 rounded-lg divide-y">
              {searchResults.map((stock) => (
                <div key={stock.code} className="flex justify-between items-center p-3 hover:bg-gray-50">
                  <div>
                    <span className="font-medium text-gray-900">{stock.name}</span>
                    <span className="ml-2 text-sm text-gray-500">{stock.code}</span>
                  </div>
                  <button
                    onClick={() => handleAddToWatchlist(stock)}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                  >
                    添加
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Watchlist */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            我的自选股 ({watchlist.length})
          </h2>

          {watchlist.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-gray-500">暂无自选股，使用上方搜索添加</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {watchlist.map((item) => {
                const quote = quotes.get(item.stockCode);
                return quote ? (
                  <StockCard
                    key={item.id}
                    quote={quote}
                    onRemove={() => handleRemoveFromWatchlist(item)}
                  />
                ) : (
                  <div key={item.id} className="bg-white rounded-lg shadow-md p-4">
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
