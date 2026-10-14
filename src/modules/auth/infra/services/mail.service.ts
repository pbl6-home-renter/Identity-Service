import { Injectable, Logger } from '@nestjs/common';
import nodemailer from 'nodemailer';
import { ApiConfigService } from 'shared/services/api-config.service';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly configService: ApiConfigService) {}

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = new URL(this.configService.passwordResetUrl);
    resetUrl.searchParams.set('token', token);

    if (this.configService.isDevelopment) {
      this.logger.log(
        `Password reset link for ${email}: ${resetUrl.toString()}`,
      );
      return;
    }

    const host = this.configService.mailHost;
    if (!host) {
      throw new Error('MAIL_HOST is required outside local development.');
    }

    const from = this.configService.mailFrom;
    if (!from) {
      throw new Error('MAIL_FROM is required when SMTP is configured.');
    }

    const user = this.configService.mailUser;
    const password = this.configService.mailPassword;
    if ((user && !password) || (!user && password)) {
      throw new Error('MAIL_USER and MAIL_PASS must be configured together.');
    }

    const transport = nodemailer.createTransport({
      host,
      port: this.configService.mailPort,
      secure: this.configService.mailPort === 465,
      auth: user && password ? { user, pass: password } : undefined,
    });

    try {
      await transport.sendMail({
        from,
        to: email,
        subject: 'Yêu cầu đặt lại mật khẩu',
        text: `Dùng liên kết này trong 15 phút để đặt lại mật khẩu: ${resetUrl.toString()}`,
        html: `<p>Dùng liên kết này trong 15 phút để đặt lại mật khẩu:</p><p><a href="${resetUrl.toString()}">Đặt lại mật khẩu</a></p>`,
      });
    } finally {
      transport.close();
    }
  }
}
