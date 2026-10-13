import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { GetMeUserModel } from '../models/get-me-user.model';

export interface IGetMeQueryRepository {
  findByUserId(userId: Uuid): Promise<GetMeUserModel | null>;
}
