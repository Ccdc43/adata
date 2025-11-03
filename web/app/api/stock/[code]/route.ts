import { NextRequest, NextResponse } from 'next/server';
import { getStockQuote } from '@/lib/adata';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    if (!code) {
      return NextResponse.json(
        { error: 'Stock code is required' },
        { status: 400 }
      );
    }

    const quote = await getStockQuote(code);

    if (!quote) {
      return NextResponse.json(
        { error: 'Stock not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: quote,
    });
  } catch (error) {
    console.error('Get stock quote error:', error);
    return NextResponse.json(
      { error: 'Failed to get stock quote', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
