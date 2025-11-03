import { NextRequest, NextResponse } from 'next/server';
import { getStockKline } from '@/lib/adata';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const { searchParams } = new URL(request.url);
    const period = (searchParams.get('period') || 'daily') as 'daily' | 'weekly' | 'monthly';
    const limit = parseInt(searchParams.get('limit') || '100');

    if (!code) {
      return NextResponse.json(
        { error: 'Stock code is required' },
        { status: 400 }
      );
    }

    const kline = await getStockKline(code, period, limit);

    return NextResponse.json({
      success: true,
      data: kline,
    });
  } catch (error) {
    console.error('Get stock kline error:', error);
    return NextResponse.json(
      { error: 'Failed to get stock kline', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
