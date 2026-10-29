import { Readable } from 'node:stream';
import { Media } from '../../domain/entities/media';
import { StoredFile } from '../../domain/entities/media.props';

/** Object storage holding the media files; the bucket follows `media.visibility`. */
export interface IObjectStorage {
  /** Signed URL the client PUTs the file to; `Content-Type` is part of the signature. */
  createUploadUrl(media: Media, expiresInSeconds: number): Promise<string>;

  /** `null` while the client has not uploaded the file. */
  stat(media: Media): Promise<StoredFile | null>;

  read(media: Media): Promise<Readable>;

  remove(media: Media): Promise<void>;

  /** Permanent URL of a file in the public bucket. */
  publicUrl(media: Media): string;
}
