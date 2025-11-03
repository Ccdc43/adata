import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { prisma } from '@/lib/db';

// 获取自选股列表
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const { user } = authResult;

  try {
    const watchlist = await prisma.watchlist.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: watchlist,
    });
  } catch (error) {
    console.error('Get watchlist error:', error);
    return NextResponse.json(
      { error: 'Failed to get watchlist' },
      { status: 500 }
    );
  }
}

// 添加自选股
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const { user } = authResult;

  try {
    const { stockCode, stockName } = await request.json();

    if (!stockCode || !stockName) {
      return NextResponse.json(
        { error: 'Stock code and name are required' },
        { status: 400 }
      );
    }

    // 检查是否已存在
    const existing = await prisma.watchlist.findUnique({
      where: {
        userId_stockCode: {
          userId: user.id,
          stockCode,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Stock already in watchlist' },
        { status: 400 }
      );
    }

    // 添加自选股
    const watchlist = await prisma.watchlist.create({
      data: {
        userId: user.id,
        stockCode,
        stockName,
      },
    });

    return NextResponse.json({
      success: true,
      data: watchlist,
    });
  } catch (error) {
    console.error('Add to watchlist error:', error);
    return NextResponse.json(
      { error: 'Failed to add to watchlist' },
      { status: 500 }
    );
  }
}

// 删除自选股
export async function DELETE(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const { user } = authResult;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Watchlist ID is required' },
        { status: 400 }
      );
    }

    // 验证所有权
    const watchlist = await prisma.watchlist.findUnique({
      where: { id },
    });

    if (!watchlist || watchlist.userId !== user.id) {
      return NextResponse.json(
        { error: 'Watchlist not found' },
        { status: 404 }
      );
    }

    // 删除
    await prisma.watchlist.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Removed from watchlist',
    });
  } catch (error) {
    console.error('Remove from watchlist error:', error);
    return NextResponse.json(
      { error: 'Failed to remove from watchlist' },
      { status: 500 }
    );
  }
}
