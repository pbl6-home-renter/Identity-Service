import { sanitizeAuditMetadata } from 'modules/audit/infrastructure/persistence/audit-metadata';

describe('sanitizeAuditMetadata', () => {
  const secrets = {
    phone: '0901234567',
    password: 'secret-password',
    token: 'secret-token',
  };

  it('keeps only the lock reason', () => {
    expect(
      sanitizeAuditMetadata('user.locked', { lockReason: 'Spam', ...secrets }),
    ).toEqual({ lockReason: 'Spam' });
  });

  it.each(['user.unlocked', 'user.deleted'])(
    'removes all metadata for %s',
    (action) => {
      expect(sanitizeAuditMetadata(action, secrets)).toEqual({});
      expect(sanitizeAuditMetadata(action)).toEqual({});
    },
  );

  it('normalizes changed field order, removes duplicates and drops values', () => {
    const input = { changedFields: ['phone', 'name', 'phone'], ...secrets };
    expect(sanitizeAuditMetadata('user.updated', input)).toEqual({
      changedFields: ['name', 'phone'],
    });
    expect(input.changedFields).toEqual(['phone', 'name', 'phone']);
    expect(
      sanitizeAuditMetadata('user.updated', { changedFields: [] }),
    ).toEqual({ changedFields: [] });
  });

  it.each(['building.approved', 'building.rejected'])(
    'allows only note for %s',
    (action) => {
      expect(
        sanitizeAuditMetadata(action, { note: 'Checked', ...secrets }),
      ).toEqual({ note: 'Checked' });
      expect(sanitizeAuditMetadata(action, { note: null })).toEqual({
        note: null,
      });
      expect(sanitizeAuditMetadata(action)).toEqual({ note: null });
    },
  );

  it.each([undefined, null, 123, {}, ['Spam']].map((value) => [value]))(
    'rejects invalid lockReason %p',
    (lockReason) => {
      expect(() =>
        sanitizeAuditMetadata('user.locked', { lockReason }),
      ).toThrow('string lockReason');
    },
  );

  it.each(
    [undefined, null, 'name', ['role'], ['fullName'], ['name', 123], [{}]].map(
      (value) => [value],
    ),
  )('rejects invalid changedFields %p', (changedFields) => {
    expect(() =>
      sanitizeAuditMetadata('user.updated', { changedFields }),
    ).toThrow('changedFields');
  });

  it.each([123, false, {}, []].map((value) => [value]))(
    'rejects invalid building note %p',
    (note) => {
      expect(() =>
        sanitizeAuditMetadata('building.approved', { note }),
      ).toThrow('string or null note');
    },
  );

  it('rejects unsupported actions', () => {
    expect(() =>
      sanitizeAuditMetadata('user.password.changed', secrets),
    ).toThrow('Unsupported audit action');
  });

  it.each([null, [], 'raw metadata'].map((value) => [value]))(
    'rejects non-object metadata %p',
    (metadata) => {
      expect(() =>
        sanitizeAuditMetadata(
          'user.deleted',
          metadata as unknown as Record<string, unknown>,
        ),
      ).toThrow('metadata must be an object');
    },
  );
});
