import { registerDecorator, ValidationOptions } from 'class-validator';
import { Phone } from '../../../domain/value-objects/phone.vo';

export function IsPhoneNumber(
  message: string = 'PHONE_INVALID_FORMAT',
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isPhoneNumber',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (value === undefined || value === null) {
            return true;
          }

          return typeof value === 'string' && Phone.isValid(value);
        },
        defaultMessage() {
          return message;
        },
      },
    });
  };
}
