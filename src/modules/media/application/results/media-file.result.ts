import { Readable } from 'node:stream';
import { Media } from '../../domain/entities/media';

export interface MediaFileResult {
  media: Media;
  content: Readable;
}
