import {
  AUDITED_METADATA_KEY,
  AuditedOptions,
} from 'modules/audit/application/audited.decorator';
import { UserLockCommandHandler } from 'modules/users/application/commands/user-lock/user-lock.command.handler';
import { UserUnlockCommandHandler } from 'modules/users/application/commands/user-unlock/user-unlock.command.handler';
import { UserUpdateAdminCommandHandler } from 'modules/users/application/commands/user-update-admin/user-update-admin.command.handler';
import { UserDeleteCommandHandler } from 'modules/users/application/commands/user-delete/user-delete.command.handler';
import { generateUuid } from 'shared/domain/value-objects/uuid.vo';

describe('Admin user handler audit declarations', () => {
  const command = {
    adminId: generateUuid(),
    userId: generateUuid(),
    lockReason: 'Spam',
  };
  const result = { changedFields: ['name', 'phone'] };

  it.each([
    {
      handler: UserLockCommandHandler,
      action: 'user.locked',
      metadata: { lockReason: 'Spam' },
    },
    {
      handler: UserUnlockCommandHandler,
      action: 'user.unlocked',
      metadata: {},
    },
    {
      handler: UserUpdateAdminCommandHandler,
      action: 'user.updated',
      metadata: { changedFields: ['name', 'phone'] },
    },
    { handler: UserDeleteCommandHandler, action: 'user.deleted', metadata: {} },
  ])(
    '$action resolves only the documented actor, entity and metadata',
    ({ handler, action, metadata }) => {
      const options = Reflect.getMetadata(
        AUDITED_METADATA_KEY,
        handler.prototype.execute,
      ) as AuditedOptions<typeof command, typeof result>;
      expect(options.action).toBe(action);
      expect(options.entityType).toBe('user');
      expect(options.actorId(command, result)).toBe(command.adminId);
      expect(options.entityId(command, result)).toBe(command.userId);
      expect(options.metadata?.(command, result)).toEqual(metadata);
      expect(options.onError ?? 'log').toBe('log');
    },
  );

  it('skips updates with no real changes', () => {
    const options = Reflect.getMetadata(
      AUDITED_METADATA_KEY,
      UserUpdateAdminCommandHandler.prototype.execute,
    ) as AuditedOptions<typeof command, typeof result>;
    expect(options.skipIf?.(command, { changedFields: [] })).toBe(true);
    expect(options.skipIf?.(command, result)).toBe(false);
  });
});
