import { Readable } from 'node:stream';
import { Media } from '../../domain/entities/media';

export type MediaFileResult =
  { media: Media; content: Readable } | { media: Media; redirectUrl: string };
