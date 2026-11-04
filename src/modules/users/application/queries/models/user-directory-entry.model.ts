import { Uuid } from 'shared/domain/value-objects/uuid.vo';

export interface UserDirectoryEntryModel {
  readonly id: Uuid;
  readonly name: string;
}
