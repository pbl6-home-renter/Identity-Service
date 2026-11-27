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
      // Locked from a violation report (P13-D109).
      return typeof metadata.reportId === 'string'
        ? { lockReason: metadata.lockReason, reportId: metadata.reportId }
        : { lockReason: metadata.lockReason };
    }
    case 'user.unlocked':
      // Unlocked by accepting an appeal (P13-D109).
      return typeof metadata?.appealId === 'string'
        ? { appealId: metadata.appealId }
        : {};
    case 'user.deleted':
      return {};
    case 'appeal.rejected': {
      if (
        typeof metadata?.appealId !== 'string' ||
        typeof metadata.rejectReason !== 'string'
      ) {
        throw new Error(
          'Audit appeal.rejected metadata requires appealId and rejectReason',
        );
      }
      return {
        appealId: metadata.appealId,
        rejectReason: metadata.rejectReason,
      };
    }
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
