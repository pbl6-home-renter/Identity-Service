import type { Response } from 'express';

export class AuthCookieHelper {
  static setRefreshToken(
    response: Response,
    refreshToken: string,
    rememberMe: boolean = true,
  ): void {
    const isProduction =
      process.env.NODE_ENV === 'prod' || process.env.NODE_ENV === 'production';
    const maxAgeDays = rememberMe ? 7 : 1;
    const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;

    response.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/api/v1/auth',
      maxAge: maxAgeMs,
    });
  }
}
