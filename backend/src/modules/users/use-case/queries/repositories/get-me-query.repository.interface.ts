import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { GetMeUserResult } from '../results/get-me-user.result';

export interface IGetMeQueryRepository {
  findByUserId(userId: Uuid): Promise<GetMeUserResult | null>;
}
