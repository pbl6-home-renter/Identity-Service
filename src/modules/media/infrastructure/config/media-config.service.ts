import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  getConfigNumber,
  getConfigString,
} from 'shared/infrastructure/config/config-value';
import { MediaUploadLimits } from '../../domain/entities/media.props';

export interface R2StorageConfig {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicBucket: string;
  /** Base URL serving the public bucket, e.g. `https://pub-xxxx.r2.dev`. */
  publicBaseUrl: string;
  privateBucket: string;
}

/** Media settings live here rather than in `shared/`, which must stay identical across services. */
@Injectable()
export class MediaConfigService {
  constructor(private readonly configService: ConfigService) {}

  /** Values may be empty: the service still boots, storage calls then answer 503. */
  get storage(): R2StorageConfig {
    const read = (key: string) => getConfigString(this.configService, key, '');
    return {
      accountId: read('R2_ACCOUNT_ID'),
      accessKeyId: read('R2_ACCESS_KEY_ID'),
      secretAccessKey: read('R2_SECRET_ACCESS_KEY'),
      publicBucket: read('R2_PUBLIC_BUCKET'),
      publicBaseUrl: read('R2_PUBLIC_BASE_URL').replace(/\/+$/, ''),
      privateBucket: read('R2_PRIVATE_BUCKET'),
    };
  }

  get uploadLimits(): MediaUploadLimits {
    return {
      maxSizeBytes: getConfigNumber(
        this.configService,
        'MEDIA_MAX_SIZE_BYTES',
        10 * 1024 * 1024,
      ),
      ticketTtlSeconds: getConfigNumber(
        this.configService,
        'MEDIA_UPLOAD_TTL_SECONDS',
        900,
      ),
    };
  }
}
