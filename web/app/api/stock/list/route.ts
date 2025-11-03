import { NextRequest, NextResponse } from 'next/server';
import { getAllStocks, searchStocks } from '@/lib/adata';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get('keyword');

    let stocks;
    if (keyword) {
      stocks = await searchStocks(keyword);
    } else {
      stocks = await getAllStocks();
    }

    return NextResponse.json({
      success: true,
      data: stocks,
    });
  } catch (error) {
    console.error('Get stock list error:', error);
    return NextResponse.json(
      { error: 'Failed to get stock list', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
