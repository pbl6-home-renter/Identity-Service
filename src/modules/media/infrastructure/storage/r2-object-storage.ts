import { Readable } from 'node:stream';
import { Injectable } from '@nestjs/common';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Media } from '../../domain/entities/media';
import { StoredFile } from '../../domain/entities/media.props';
import { IObjectStorage } from '../../application/ports/object-storage.port';
import {
  MediaConfigService,
  R2StorageConfig,
} from '../config/media-config.service';
import { MediaStorageNotConfiguredException } from './media-storage-not-configured.exception';

/** Cloudflare R2 through its S3-compatible API. */
@Injectable()
export class R2ObjectStorage implements IObjectStorage {
  private readonly config: R2StorageConfig;
  private s3Client?: S3Client;

  constructor(mediaConfig: MediaConfigService) {
    this.config = mediaConfig.storage;
  }

  createUploadUrl(media: Media, expiresInSeconds: number): Promise<string> {
    const command = new PutObjectCommand({
      ...this.locationOf(media),
      ContentType: media.contentType,
    });

    return getSignedUrl(this.client, command, {
      expiresIn: expiresInSeconds,
      // R2 rejects the PUT unless the client sends the declared Content-Type.
      signableHeaders: new Set(['content-type']),
    });
  }

  async stat(media: Media): Promise<StoredFile | null> {
    try {
      const head = await this.client.send(
        new HeadObjectCommand(this.locationOf(media)),
      );
      return {
        sizeBytes: head.ContentLength ?? 0,
        contentType: head.ContentType ?? '',
      };
    } catch (error) {
      if (isNotFound(error)) {
        return null;
      }
      throw error;
    }
  }

  async read(media: Media): Promise<Readable> {
    const object = await this.client.send(
      new GetObjectCommand(this.locationOf(media)),
    );
    return object.Body as Readable;
  }

  async remove(media: Media): Promise<void> {
    await this.client.send(new DeleteObjectCommand(this.locationOf(media)));
  }

  publicUrl(media: Media): string {
    return `${this.config.publicBaseUrl}/${media.storageKey}`;
  }

  private locationOf(media: Media): { Bucket: string; Key: string } {
    return {
      Bucket: media.isPublic
        ? this.config.publicBucket
        : this.config.privateBucket,
      Key: media.storageKey,
    };
  }

  /** Created on first use so the service can boot before R2 is configured. */
  private get client(): S3Client {
    if (!this.s3Client) {
      this.assertConfigured();
      this.s3Client = new S3Client({
        region: 'auto',
        endpoint: `https://${this.config.accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: this.config.accessKeyId,
          secretAccessKey: this.config.secretAccessKey,
        },
      });
    }
    return this.s3Client;
  }

  private assertConfigured(): void {
    if (Object.values(this.config).some((value) => value === '')) {
      throw new MediaStorageNotConfiguredException();
    }
  }
}

function isNotFound(error: unknown): boolean {
  return (
    error instanceof S3ServiceException &&
    error.$metadata.httpStatusCode === 404
  );
}
