import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { IOffsetPaginationQueryRequestDto } from 'shared/domain/pagination/i-offset-pagination.query.request.dto';
import { IPaginationResponseDto } from 'shared/domain/pagination/i-pagination.response.dto';
import { User } from '../../../domain/entities/user';
import { GetMeUserModel } from '../models/get-me-user.model';
import { GetUsersAdminFilterModel } from '../models/get-users-admin-filter.model';

export interface IUserQueryService {
  findByUserId(userId: Uuid): Promise<GetMeUserModel | null>;
  findUsersAdmin(
    options: IOffsetPaginationQueryRequestDto<GetUsersAdminFilterModel>,
  ): Promise<IPaginationResponseDto<User>>;
}
