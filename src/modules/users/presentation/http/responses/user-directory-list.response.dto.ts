import { ApiProperty } from '@nestjs/swagger';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { UserDirectoryEntryModel } from '../../../application/queries/models/user-directory-entry.model';

export class UserDirectoryListResponseDto {
  @ApiProperty({
    format: 'uuid',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  })
  id: Uuid;

  @ApiProperty({ example: 'Nguyễn Văn An' })
  name: string;

  static fromModel(
    entry: UserDirectoryEntryModel,
  ): UserDirectoryListResponseDto {
    const dto = new UserDirectoryListResponseDto();
    dto.id = entry.id;
    dto.name = entry.name;
    return dto;
  }
}
