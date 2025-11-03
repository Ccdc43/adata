import nodemailer from 'nodemailer';

// 创建邮件传输器
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export interface SendMagicLinkEmailParams {
  to: string;
  magicLink: string;
  expiresInMinutes?: number;
}

/**
 * 发送魔法链接邮件
 */
export async function sendMagicLinkEmail({
  to,
  magicLink,
  expiresInMinutes = 15,
}: SendMagicLinkEmailParams): Promise<void> {
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'A股实时监控';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const htmlContent = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>登录验证</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; border-bottom: 1px solid #e5e5e5;">
              <h1 style="margin: 0; color: #1a1a1a; font-size: 24px; font-weight: 600;">${appName}</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #1a1a1a; font-size: 20px; font-weight: 600;">登录验证</h2>
              <p style="margin: 0 0 20px; color: #666; font-size: 16px; line-height: 1.6;">
                您好！您正在尝试登录 ${appName}。请点击下方按钮完成登录验证。
              </p>
              <p style="margin: 0 0 30px; color: #666; font-size: 14px; line-height: 1.6;">
                此链接将在 <strong>${expiresInMinutes} 分钟</strong>后失效，请尽快完成验证。
              </p>
              
              <!-- Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${magicLink}" 
                       style="display: inline-block; padding: 14px 40px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 500;">
                      点击登录
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 0; color: #999; font-size: 14px; line-height: 1.6;">
                如果按钮无法点击，请复制以下链接到浏览器地址栏：
              </p>
              <p style="margin: 10px 0 0; padding: 12px; background-color: #f5f5f5; border-radius: 4px; word-break: break-all; font-size: 12px; color: #666;">
                ${magicLink}
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; border-top: 1px solid #e5e5e5; text-align: center;">
              <p style="margin: 0; color: #999; font-size: 12px; line-height: 1.6;">
                如果您没有请求此邮件，请忽略。此链接仅可使用一次。
              </p>
              <p style="margin: 10px 0 0; color: #999; font-size: 12px;">
                © ${new Date().getFullYear()} ${appName}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const textContent = `
${appName} - 登录验证

您好！

您正在尝试登录 ${appName}。请点击以下链接完成登录验证：

${magicLink}

此链接将在 ${expiresInMinutes} 分钟后失效，请尽快完成验证。

如果您没有请求此邮件，请忽略。此链接仅可使用一次。

© ${new Date().getFullYear()} ${appName}
  `.trim();

  await transporter.sendMail({
    from: process.env.SMTP_FROM || `${appName} <noreply@example.com>`,
    to,
    subject: `登录验证 - ${appName}`,
    text: textContent,
    html: htmlContent,
  });
}

/**
 * 验证邮件配置是否正确
 */
export async function verifyEmailConfig(): Promise<boolean> {
  try {
    await transporter.verify();
    return true;
  } catch (error) {
    console.error('Email configuration error:', error);
    return false;
  }
}
