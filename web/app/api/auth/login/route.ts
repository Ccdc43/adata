import { NextRequest, NextResponse } from 'next/server';
import { createMagicLink } from '@/lib/auth';
import { sendMagicLinkEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    // 验证邮箱格式
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // 创建魔法链接
    const { magicLink, expiresInMinutes } = await createMagicLink(email);

    // 发送邮件
    await sendMagicLinkEmail({
      to: email,
      magicLink,
      expiresInMinutes,
    });

    return NextResponse.json({
      success: true,
      message: 'Magic link sent to your email',
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Failed to send magic link', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
