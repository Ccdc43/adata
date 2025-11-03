import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);

  // 如果是 NextResponse（错误响应），直接返回
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { user } = authResult;

  return NextResponse.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
    },
  });
}
