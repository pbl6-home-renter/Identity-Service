import {
  ArgumentMetadata,
  HttpException,
  HttpStatus,
  Injectable,
  ValidationPipe,
  ValidationError,
} from '@nestjs/common';

@Injectable()
export class AppValidationPipe extends ValidationPipe {
  constructor() {
    super({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      stopAtFirstError: false,
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      exceptionFactory: (errors: ValidationError[]) => {
        const flatten = (items: ValidationError[]): ValidationError[] =>
          items.flatMap((item) => [item, ...flatten(item.children ?? [])]);
        errors = flatten(errors);
        const propertyErrors = errors.filter(
          (err) =>
            err.constraints && !('whitelistValidation' in err.constraints),
        );

        if (propertyErrors.length > 0) {
          const firstError = propertyErrors[0];
          const constraints = firstError.constraints || {};

          if (constraints.isRequired) {
            return new HttpException(
              { statusCode: 422, code: constraints.isRequired },
              HttpStatus.UNPROCESSABLE_ENTITY,
            );
          }

          const otherConstraintKeys = Object.keys(constraints);
          const firstKey =
            ['isString', 'isNotEmpty', 'isObject'].find(
              (key) => key in constraints,
            ) ?? otherConstraintKeys[0];
          const code = constraints[firstKey] || 'VALIDATION_FAILED';

          return new HttpException(
            { statusCode: 422, code },
            HttpStatus.UNPROCESSABLE_ENTITY,
          );
        }

        const hasUnexpected = errors.some(
          (err) => err.constraints && 'whitelistValidation' in err.constraints,
        );
        if (hasUnexpected) {
          return new HttpException(
            { statusCode: 422, code: 'UNEXPECTED_FIELD' },
            HttpStatus.UNPROCESSABLE_ENTITY,
          );
        }

        return new HttpException(
          { statusCode: 422, code: 'VALIDATION_FAILED' },
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      },
    });
  }

  override async transform(value: any, metadata: ArgumentMetadata) {
    if (metadata.type === 'body') {
      if (
        value === undefined ||
        value === null ||
        typeof value !== 'object' ||
        Array.isArray(value)
      ) {
        throw new HttpException(
          { statusCode: 400, code: 'INVALID_REQUEST_BODY' },
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    try {
      return await super.transform(value, metadata);
    } catch (error) {
      const dto = metadata.metatype as typeof metadata.metatype & {
        unexpectedFieldCode?: string;
      };
      if (
        error instanceof HttpException &&
        error.getStatus() === 422 &&
        dto?.unexpectedFieldCode
      ) {
        const payload = error.getResponse() as { code?: string };
        if (payload.code === 'UNEXPECTED_FIELD')
          throw new HttpException(
            { statusCode: 422, code: dto.unexpectedFieldCode },
            422,
          );
      }
      throw error;
    }
  }
}
