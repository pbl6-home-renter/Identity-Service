import { Media } from '../../domain/entities/media';

export interface MediaCompletedResult {
  media: Media;
  /** Permanent URL for public files, the API path for private ones. */
  url: string;
}
