import { StockQuote } from '@/types';

interface StockCardProps {
  quote: StockQuote;
  onRemove?: () => void;
}

export default function StockCard({ quote, onRemove }: StockCardProps) {
  const isPositive = quote.change >= 0;
  const changeColor = isPositive ? 'text-red-600' : 'text-green-600';
  const bgColor = isPositive ? 'bg-red-50' : 'bg-green-50';

  return (
    <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{quote.name}</h3>
          <p className="text-sm text-gray-500">{quote.code}</p>
        </div>
        {onRemove && (
          <button
            onClick={onRemove}
            className="text-gray-400 hover:text-red-600 transition"
            title="移除自选"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="mb-3">
        <div className="text-3xl font-bold text-gray-900">
          ¥{quote.price.toFixed(2)}
        </div>
        <div className={`flex items-center gap-2 mt-1 ${changeColor}`}>
          <span className="text-lg font-semibold">
            {isPositive ? '+' : ''}{quote.change.toFixed(2)}
          </span>
          <span className={`px-2 py-1 rounded text-sm font-medium ${bgColor}`}>
            {isPositive ? '+' : ''}{quote.changePercent.toFixed(2)}%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-gray-500">开盘:</span>
          <span className="ml-1 text-gray-900">{quote.open.toFixed(2)}</span>
        </div>
        <div>
          <span className="text-gray-500">昨收:</span>
          <span className="ml-1 text-gray-900">{quote.preClose.toFixed(2)}</span>
        </div>
        <div>
          <span className="text-gray-500">最高:</span>
          <span className="ml-1 text-gray-900">{quote.high.toFixed(2)}</span>
        </div>
        <div>
          <span className="text-gray-500">最低:</span>
          <span className="ml-1 text-gray-900">{quote.low.toFixed(2)}</span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
        更新时间: {new Date(quote.timestamp).toLocaleTimeString('zh-CN')}
      </div>
    </div>
  );
}
