import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserController } from 'modules/users/presentation/http/controllers/user.controller';
import { AuthErrorCode } from 'shared/application/auth/auth-error-code';
import { UserRole } from 'shared/domain/enums/user-role.enum';
import { UserStatus } from 'shared/domain/enums/user-status.enum';
import { ActiveUserGuard } from 'shared/presentation/guards/active-user.guard';

jest.mock('@nestjs/common', () => {
  const actual = jest.requireActual('@nestjs/common');
  const decorator = () => () => undefined;
  return {
    ...actual,
    Controller: decorator,
    Body: decorator,
    Get: decorator,
    Patch: decorator,
    Put: decorator,
    HttpCode: decorator,
    HttpStatus: { OK: 200, NO_CONTENT: 204 },
    ForbiddenException: class extends Error {
      constructor(private readonly response: unknown) {
        super('Forbidden');
      }

      getResponse(): unknown {
        return this.response;
      }
    },
    createParamDecorator: () => decorator,
    applyDecorators: () => decorator(),
    SetMetadata:
      (key: string, value: unknown) =>
      (target: object, propertyKey?: string | symbol) => {
        Reflect.defineMetadata(
          key,
          value,
          propertyKey
            ? ((target as Record<string | symbol, object>)[
                propertyKey
              ] as object)
            : target,
        );
      },
  };
});

jest.mock('@nestjs/core', () => ({
  Reflector: class {
    getAllAndOverride<T>(key: string, targets: unknown[]): T | undefined {
      for (const target of targets) {
        const value = Reflect.getMetadata(key, target as object) as
          T | undefined;
        if (value !== undefined) return value;
      }
      return undefined;
    }
  },
}));

jest.mock('@nestjs/swagger', () => {
  const decorator = () => () => undefined;
  return {
    ApiBearerAuth: decorator,
    ApiOperation: decorator,
    ApiResponse: decorator,
    ApiTags: decorator,
    ApiProperty: decorator,
    ApiPropertyOptional: decorator,
    ApiExtraModels: decorator,
    getSchemaPath: (model: { name: string }) => model.name,
  };
});

describe('UserController locked account access', () => {
  const guard = new ActiveUserGuard(new Reflector());

  function context(handler: keyof UserController): ExecutionContext {
    return {
      getType: () => 'http',
      getClass: () => UserController,
      getHandler: () => UserController.prototype[handler],
      switchToHttp: () => ({
        getRequest: () => ({
          user: { role: UserRole.TENANT, status: UserStatus.LOCKED },
        }),
      }),
    } as unknown as ExecutionContext;
  }

  it('allows a locked account to read its own profile', () => {
    expect(guard.canActivate(context('getMe'))).toBe(true);
  });

  it.each(['updateMe', 'changePassword'] as const)(
    'blocks a locked account from %s',
    (handler) => {
      expect(() => guard.canActivate(context(handler))).toThrow(
        ForbiddenException,
      );
      try {
        guard.canActivate(context(handler));
      } catch (error) {
        expect((error as ForbiddenException).getResponse()).toEqual({
          code: AuthErrorCode.ACCOUNT_LOCKED,
        });
      }
    },
  );
});
