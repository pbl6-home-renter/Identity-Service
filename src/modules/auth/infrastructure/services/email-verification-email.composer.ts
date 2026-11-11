import { Injectable } from '@nestjs/common';
import { ApiConfigService } from 'shared/infrastructure/config/api-config.service';
import { EmailVerificationEmailComposerPort } from '../../application/ports/email-verification-email-composer.port';

@Injectable()
export class EmailVerificationEmailComposer implements EmailVerificationEmailComposerPort {
  constructor(private readonly config: ApiConfigService) {}

  compose(input: { name: string; token: string }): {
    subject: string;
    text: string;
    html: string;
  } {
    const url = new URL('/verify-email', this.config.publicAppUrl);
    url.searchParams.set('token', input.token);
    const safeName = this.escapeHtml(input.name);
    const safeUrl = this.escapeHtml(url.toString());

    return {
      subject: 'Verify your Rentify email',
      text: [
        `Hi ${input.name},`,
        '',
        'Confirm your email address to activate your Rentify account:',
        url.toString(),
        '',
        'This link expires in 24 hours and can only be used once.',
      ].join('\n'),
      html: [
        `<p>Hi ${safeName},</p>`,
        '<p>Confirm your email address to activate your Rentify account:</p>',
        `<p><a href="${safeUrl}">Verify email address</a></p>`,
        '<p>This link expires in 24 hours and can only be used once.</p>',
      ].join(''),
    };
  }

  private escapeHtml(value: string): string {
    return value.replace(/[&<>"']/g, (character) => {
      const replacements: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      };
      return replacements[character];
    });
  }
}
