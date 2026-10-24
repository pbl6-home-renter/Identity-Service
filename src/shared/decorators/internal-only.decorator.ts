import { SetMetadata } from '@nestjs/common';
import { INTERNAL_ONLY_METADATA_KEY } from './auth-metadata.keys';

/**
 * Service-to-service endpoint: authenticated by `X-Service-Token` instead of
 * a user access token. Mount these controllers under `internal/`, which is
 * outside the `api/v1` prefix and never routed by the API Gateway.
 */
export const InternalOnly = () => SetMetadata(INTERNAL_ONLY_METADATA_KEY, true);
