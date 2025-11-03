import { randomBytes } from 'crypto';
import jwt from 'jsonwebtoken';
import { prisma } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
const MAGIC_LINK_EXPIRY_MINUTES = 15;
const SESSION_EXPIRY_DAYS = 30;

export interface SessionPayload {
  userId: string;
  email: string;
}

/**
 * 生成魔法链接 token
 */
export function generateMagicLinkToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * 创建魔法链接记录
 */
export async function createMagicLink(email: string) {
  const token = generateMagicLinkToken();
  const expiresAt = new Date(Date.now() + MAGIC_LINK_EXPIRY_MINUTES * 60 * 1000);

  await prisma.magicLink.create({
    data: {
      email,
      token,
      expiresAt,
    },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const magicLink = `${appUrl}/verify?token=${token}`;

  return {
    token,
    magicLink,
    expiresAt,
    expiresInMinutes: MAGIC_LINK_EXPIRY_MINUTES,
  };
}

/**
 * 验证魔法链接并创建用户会话
 */
export async function verifyMagicLink(token: string) {
  // 查找魔法链接
  const magicLink = await prisma.magicLink.findUnique({
    where: { token },
  });

  if (!magicLink) {
    throw new Error('Invalid magic link');
  }

  if (magicLink.used) {
    throw new Error('Magic link already used');
  }

  if (magicLink.expiresAt < new Date()) {
    throw new Error('Magic link expired');
  }

  // 标记魔法链接为已使用
  await prisma.magicLink.update({
    where: { token },
    data: { used: true },
  });

  // 查找或创建用户
  let user = await prisma.user.findUnique({
    where: { email: magicLink.email },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: magicLink.email,
      },
    });
  }

  // 创建会话
  const sessionToken = generateSessionToken(user.id, user.email);
  const expiresAt = new Date(Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      userId: user.id,
      token: sessionToken,
      expiresAt,
    },
  });

  return {
    user,
    sessionToken,
    expiresAt,
  };
}

/**
 * 生成 JWT 会话 token
 */
export function generateSessionToken(userId: string, email: string): string {
  const payload: SessionPayload = { userId, email };
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: `${SESSION_EXPIRY_DAYS}d`,
  });
}

/**
 * 验证 JWT 会话 token
 */
export function verifySessionToken(token: string): SessionPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionPayload;
  } catch (error) {
    throw new Error('Invalid session token');
  }
}

/**
 * 从数据库验证会话
 */
export async function validateSession(token: string) {
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session) {
    throw new Error('Session not found');
  }

  if (session.expiresAt < new Date()) {
    // 删除过期会话
    await prisma.session.delete({
      where: { id: session.id },
    });
    throw new Error('Session expired');
  }

  return session;
}

/**
 * 删除会话（登出）
 */
export async function deleteSession(token: string) {
  await prisma.session.delete({
    where: { token },
  });
}

/**
 * 清理过期的魔法链接和会话
 */
export async function cleanupExpired() {
  const now = new Date();

  // 删除过期的魔法链接
  await prisma.magicLink.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: now } },
        { used: true, createdAt: { lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) } },
      ],
    },
  });

  // 删除过期的会话
  await prisma.session.deleteMany({
    where: {
      expiresAt: { lt: now },
    },
  });
}
