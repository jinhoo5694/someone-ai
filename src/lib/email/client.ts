import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@example.com'
const APP_NAME = 'AI 채팅'

export async function sendVerificationEmail(
  to: string,
  verificationUrl: string
): Promise<boolean> {
  try {
    const { error } = await resend.emails.send({
      from: `${APP_NAME} <${FROM_EMAIL}>`,
      to,
      subject: `[${APP_NAME}] 이메일 인증을 완료해주세요`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 480px; margin: 0 auto; padding: 40px 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { color: #ec4899; margin: 0; font-size: 24px; }
            .content { background: #f9fafb; border-radius: 12px; padding: 30px; text-align: center; }
            .button { display: inline-block; background: #ec4899; color: white !important; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-size: 18px; font-weight: bold; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #9ca3af; font-size: 14px; }
            .warning { color: #6b7280; font-size: 14px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${APP_NAME}</h1>
            </div>
            <div class="content">
              <p style="font-size: 18px; margin-bottom: 10px;">회원가입을 환영합니다!</p>
              <p>아래 버튼을 클릭하여 이메일 인증을 완료해주세요.</p>
              <a href="${verificationUrl}" class="button">이메일 인증하기</a>
              <p class="warning">
                이 링크는 24시간 동안만 유효합니다.<br>
                본인이 요청하지 않았다면 이 이메일을 무시해주세요.
              </p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    })

    if (error) {
      console.error('Failed to send email:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Email service error:', error)
    return false
  }
}

export function generateVerificationToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''
  for (let i = 0; i < 64; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return token
}
