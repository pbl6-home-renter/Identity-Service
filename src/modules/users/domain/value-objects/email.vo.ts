import { InvalidEmailException } from '../exceptions/invalid-email.exception';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_MAX_LENGTH = 254;

export class Email {
  private constructor(readonly value: string) {}

  static create(raw: string): Email {
    const value = raw.trim().toLowerCase();

    if (value.length > EMAIL_MAX_LENGTH || !EMAIL_REGEX.test(value)) {
      throw new InvalidEmailException(raw);
    }

    return new Email(value);
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }
}
