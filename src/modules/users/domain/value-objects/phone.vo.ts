import { InvalidPhoneException } from '../exceptions/invalid-phone.exception';

const VIETNAM_PHONE_REGEX = /^(0[0-9]{9}|\+84[0-9]{9})$/;

export class Phone {
  private constructor(readonly value: string) {}

  static isValid(raw: string): boolean {
    return VIETNAM_PHONE_REGEX.test(raw.trim());
  }

  static create(raw: string): Phone {
    const trimmed = raw.trim();

    if (!VIETNAM_PHONE_REGEX.test(trimmed)) {
      throw new InvalidPhoneException(raw);
    }

    return new Phone(trimmed.replace(/^\+84/, '0'));
  }

  equals(other: Phone): boolean {
    return this.value === other.value;
  }
}
