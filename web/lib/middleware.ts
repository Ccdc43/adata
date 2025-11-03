import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from './auth';

/**
 * 从请求中获取会话 token
 */
export function getSessionToken(request: NextRequest): string | null {
  // 优先从 Cookie 获取
  const cookieToken = request.cookies.get('session_token')?.value;
  if (cookieToken) return cookieToken;

  // 其次从 Authorization header 获取
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
}

/**
 * 认证中间件 - 验证用户会话
 */
export async function requireAuth(request: NextRequest) {
  const token = getSessionToken(request);

  if (!token) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'No session token provided' },
      { status: 401 }
    );
  }

  try {
    const session = await validateSession(token);
    return { session, user: session.user };
  } catch (error) {
    return NextResponse.json(
      { error: 'Unauthorized', message: error instanceof Error ? error.message : 'Invalid session' },
      { status: 401 }
    );
  }
}

/**
 * 可选认证 - 如果有 token 则验证，没有则返回 null
 */
export async function optionalAuth(request: NextRequest) {
  const token = getSessionToken(request);

  if (!token) {
    return null;
  }

  try {
    const session = await validateSession(token);
    return { session, user: session.user };
  } catch (error) {
    return null;
  }
}
