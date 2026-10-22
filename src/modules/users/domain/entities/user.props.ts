import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { UserRole } from 'shared/domain/enums/user-role.enum';
import { UserStatus } from 'shared/domain/enums/user-status.enum';
import { Email } from '../value-objects/email.vo';
import { Phone } from '../value-objects/phone.vo';

export interface UserProps {
  id?: Uuid;
  phone: Phone;
  email: Email;
  password: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  lockReason?: string | null;
  lockedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
  isDeleted?: boolean;
}
