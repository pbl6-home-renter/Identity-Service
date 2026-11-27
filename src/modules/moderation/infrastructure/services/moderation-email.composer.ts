import { Injectable } from '@nestjs/common';
import { ApiConfigService } from 'shared/infrastructure/config/api-config.service';
import {
  ModerationEmailComposerPort,
  ModerationEmailContent,
} from '../../application/ports/moderation-email-composer.port';

const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ESCAPES[character]);
}

function formatDate(value: Date): string {
  return value.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
}

/** Result emails of an account appeal (P13-D109). Users are Vietnamese, so is the copy. */
@Injectable()
export class ModerationEmailComposer implements ModerationEmailComposerPort {
  constructor(private readonly config: ApiConfigService) {}

  appealAccepted(input: { name: string }): ModerationEmailContent {
    const loginUrl = new URL('/login', this.config.publicAppUrl).toString();
    return {
      subject: 'Rentify: Khiếu nại của bạn đã được chấp nhận',
      text: [
        `Xin chào ${input.name},`,
        '',
        'Khiếu nại của bạn đã được chấp nhận và tài khoản Rentify đã được mở khóa.',
        `Bạn có thể đăng nhập lại tại: ${loginUrl}`,
      ].join('\n'),
      html: [
        `<p>Xin chào ${escapeHtml(input.name)},</p>`,
        '<p>Khiếu nại của bạn đã được chấp nhận và tài khoản Rentify đã được mở khóa.</p>',
        `<p><a href="${escapeHtml(loginUrl)}">Đăng nhập lại</a></p>`,
      ].join(''),
    };
  }

  appealRejected(input: {
    name: string;
    rejectReason: string;
    nextSubmitAt: Date;
  }): ModerationEmailContent {
    const pageUrl = new URL(
      '/account-locked',
      this.config.publicAppUrl,
    ).toString();
    const nextDate = formatDate(input.nextSubmitAt);
    return {
      subject: 'Rentify: Khiếu nại của bạn chưa được chấp nhận',
      text: [
        `Xin chào ${input.name},`,
        '',
        'Khiếu nại về việc khóa tài khoản của bạn chưa được chấp nhận.',
        `Lý do: ${input.rejectReason}`,
        `Bạn có thể gửi khiếu nại mới từ ngày ${nextDate}.`,
        `Xem chi tiết: ${pageUrl}`,
      ].join('\n'),
      html: [
        `<p>Xin chào ${escapeHtml(input.name)},</p>`,
        '<p>Khiếu nại về việc khóa tài khoản của bạn chưa được chấp nhận.</p>',
        `<p><strong>Lý do:</strong> ${escapeHtml(input.rejectReason)}</p>`,
        `<p>Bạn có thể gửi khiếu nại mới từ ngày ${escapeHtml(nextDate)}.</p>`,
        `<p><a href="${escapeHtml(pageUrl)}">Xem chi tiết</a></p>`,
      ].join(''),
    };
  }
}
