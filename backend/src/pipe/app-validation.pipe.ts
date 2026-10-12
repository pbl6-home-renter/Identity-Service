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
        // 1. Property validation errors (excluding unexpected extra fields)
        const propertyErrors = errors.filter(
          (err) =>
            err.constraints && !('whitelistValidation' in err.constraints),
        );

        if (propertyErrors.length > 0) {
          const firstError = propertyErrors[0];
          const constraints = firstError.constraints || {};

          // Prioritize missing/null required field code
          if (constraints.isRequired) {
            return new HttpException(
              { statusCode: 422, code: constraints.isRequired },
              HttpStatus.UNPROCESSABLE_ENTITY,
            );
          }

          // Otherwise return specific format/rule error code
          const otherConstraintKeys = Object.keys(constraints);
          const firstKey = otherConstraintKeys[0];
          const code = constraints[firstKey] || 'VALIDATION_FAILED';

          return new HttpException(
            { statusCode: 422, code },
            HttpStatus.UNPROCESSABLE_ENTITY,
          );
        }

        // 2. Extra unexpected field errors (forbidNonWhitelisted)
        const hasUnexpected = errors.some(
          (err) => err.constraints && 'whitelistValidation' in err.constraints,
        );
        if (hasUnexpected) {
          return new HttpException(
            { statusCode: 422, code: 'UNEXPECTED_FIELD' },
            HttpStatus.UNPROCESSABLE_ENTITY,
          );
        }

        // 3. Fallback
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

    return super.transform(value, metadata);
  }
}
