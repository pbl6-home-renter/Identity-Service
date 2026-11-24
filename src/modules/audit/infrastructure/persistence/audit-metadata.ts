export function sanitizeAuditMetadata(
  action: string,
  metadata?: Record<string, unknown>,
): Record<string, unknown> {
  if (
    metadata !== undefined &&
    (metadata === null ||
      typeof metadata !== 'object' ||
      Array.isArray(metadata))
  ) {
    throw new Error('Audit metadata must be an object');
  }

  switch (action) {
    case 'user.locked': {
      if (typeof metadata?.lockReason !== 'string') {
        throw new Error(
          'Audit user.locked metadata requires a string lockReason',
        );
      }
      return { lockReason: metadata.lockReason };
    }
    case 'user.unlocked':
    case 'user.deleted':
      return {};
    case 'user.updated': {
      const fields = metadata?.changedFields;
      if (
        !Array.isArray(fields) ||
        fields.some((field) => field !== 'name' && field !== 'phone')
      ) {
        throw new Error(
          'Audit user.updated metadata requires changedFields containing only name or phone',
        );
      }
      return {
        changedFields: ['name', 'phone'].filter((field) =>
          fields.includes(field),
        ),
      };
    }
    case 'building.approved':
    case 'building.rejected': {
      const note = metadata?.note ?? null;
      if (note !== null && typeof note !== 'string') {
        throw new Error(
          'Audit building review metadata requires a string or null note',
        );
      }
      return { note };
    }
    default:
      throw new Error(`Unsupported audit action: ${action}`);
  }
}
