import { Uuid } from 'shared/domain/value-objects/uuid.vo';

/** Public API path of one media file, used as `Location` and as the URL of private files. */
export function mediaResourcePath(mediaId: Uuid): string {
  return `/api/v1/media/${mediaId}`;
}
