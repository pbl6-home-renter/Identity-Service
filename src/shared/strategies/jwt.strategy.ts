import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { isValidUuid } from 'utils/uuid.utils';
import { ApiConfigService } from 'shared/services/api-config.service';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { UserRole } from 'modules/users/domain/enums/user-role.enum';
import { AuthenticatedUser } from 'shared/interfaces/authenticated-user.interface';
import { JwtPayload } from 'shared/interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ApiConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.jwtSecret,
    });
  }

  validate(payload: JwtPayload): AuthenticatedUser {
    if (
      !isValidUuid(payload.sub) ||
      !payload.role ||
      !Object.values(UserRole).includes(payload.role)
    ) {
      throw new UnauthorizedException();
    }

    return {
      id: payload.sub as Uuid,
      role: payload.role,
    };
  }
}
