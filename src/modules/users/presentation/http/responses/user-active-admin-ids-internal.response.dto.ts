import { Uuid } from 'shared/domain/value-objects/uuid.vo';

export class UserActiveAdminIdsInternalResponseDto {
  ids: Uuid[];

  static fromIds(ids: Uuid[]): UserActiveAdminIdsInternalResponseDto {
    const dto = new UserActiveAdminIdsInternalResponseDto();
    dto.ids = ids;
    return dto;
  }
}
