import { Uuid } from 'shared/domain/value-objects/uuid.vo';

/** Avatar URLs of many users in one read; users without an avatar are left out. */
export class MediaUserAvatarLookupQuery {
  private constructor(readonly userIds: Uuid[]) {}

  static create(userIds: readonly Uuid[]): MediaUserAvatarLookupQuery {
    return new MediaUserAvatarLookupQuery([...new Set(userIds)]);
  }
}
