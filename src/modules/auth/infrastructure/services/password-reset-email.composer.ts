import { Injectable } from '@nestjs/common';
import { ApiConfigService } from 'shared/infrastructure/config/api-config.service';
import {
  PasswordResetEmailComposerPort,
  PasswordResetEmailContent,
} from '../../application/ports/password-reset-email-composer.port';

@Injectable()
export class PasswordResetEmailComposer implements PasswordResetEmailComposerPort {
  constructor(private readonly config: ApiConfigService) {}

  compose(input: { name: string; token: string }): PasswordResetEmailContent {
    const resetUrl = new URL('/reset-password', this.config.publicAppUrl);
    resetUrl.searchParams.set('token', input.token);

    const safeName = this.escapeHtml(input.name);
    const safeUrl = this.escapeHtml(resetUrl.toString());

    return {
      subject: 'Reset your Rentify password',
      text: [
        `Hi ${input.name},`,
        '',
        'We received a request to reset your Rentify password.',
        `Open this link to choose a new password: ${resetUrl.toString()}`,
        '',
        'If you did not request this, you can ignore this email.',
      ].join('\n'),
      html: [
        `<p>Hi ${safeName},</p>`,
        '<p>We received a request to reset your Rentify password.</p>',
        `<p><a href="${safeUrl}">Choose a new password</a></p>`,
        '<p>If you did not request this, you can ignore this email.</p>',
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
