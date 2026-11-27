import { PostgresErrorCode } from 'shared/infrastructure/database/postgres-error-code';

export function isUniqueViolation(error: unknown, constraint: string): boolean {
  const driverError = (
    error as { driverError?: { code?: string; constraint?: string } }
  )?.driverError;
  return (
    driverError?.code === PostgresErrorCode.UNIQUE_VIOLATION &&
    driverError.constraint === constraint
  );
}
