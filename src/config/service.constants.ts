/**
 * Everything that differs between services built from this boilerplate.
 * `shared/` reads these values and must stay identical across services, so
 * edit this class (not `shared/`) when forking.
 */
export class ServiceConstants {
  /**
   * This service's path segment behind the API Gateway. Health and Swagger
   * are served under `/api/v1/<PATH>/health` and `/api/v1/<PATH>/swagger`, so
   * the gateway can route them to the right service.
   */
  static readonly PATH = 'identity';

  static readonly TITLE = 'Identity Service API';

  static readonly DESCRIPTION = 'Auth, users and landlord profiles';

  /** Used when neither `DATABASE_URL` nor `DB_DATABASE` is set. */
  static readonly DEFAULT_DATABASE_NAME = 'identity_db';

  private constructor() {}
}
