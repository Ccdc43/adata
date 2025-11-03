import { NextRequest, NextResponse } from 'next/server';
import { verifyMagicLink } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // 验证魔法链接并创建会话
    const { user, sessionToken, expiresAt } = await verifyMagicLink(token);

    // 创建响应并设置 Cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });

    // 设置会话 Cookie（HttpOnly, Secure, SameSite）
    response.cookies.set('session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Verify error:', error);
    return NextResponse.json(
      { error: 'Verification failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 400 }
    );
  }
}
