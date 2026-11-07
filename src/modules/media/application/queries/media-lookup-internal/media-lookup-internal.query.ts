import { IQuery } from '@nestjs/cqrs';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';

export class MediaLookupInternalQuery implements IQuery {
  constructor(readonly ids: readonly Uuid[]) {}
}
