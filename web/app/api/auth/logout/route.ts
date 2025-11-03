import { NextRequest, NextResponse } from 'next/server';
import { deleteSession } from '@/lib/auth';
import { getSessionToken } from '@/lib/middleware';

export async function POST(request: NextRequest) {
  try {
    const token = getSessionToken(request);

    if (token) {
      // 删除数据库中的会话
      await deleteSession(token);
    }

    // 创建响应并清除 Cookie
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });

    response.cookies.delete('session_token');

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    // 即使删除失败也清除 Cookie
    const response = NextResponse.json({
      success: true,
      message: 'Logged out',
    });
    response.cookies.delete('session_token');
    return response;
  }
}
