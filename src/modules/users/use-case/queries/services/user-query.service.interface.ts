import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { GetMeUserModel } from '../models/get-me-user.model';

export interface IUserQueryService {
  findByUserId(userId: Uuid): Promise<GetMeUserModel | null>;
}
