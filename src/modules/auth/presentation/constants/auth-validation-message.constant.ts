export class AuthValidationMessageConstant {
  static readonly IDENTIFIER_REQUIRED = 'IDENTIFIER_REQUIRED';
  static readonly IDENTIFIER_MUST_BE_STRING = 'IDENTIFIER_MUST_BE_STRING';
  static readonly IDENTIFIER_NOT_EMPTY = 'IDENTIFIER_NOT_EMPTY';

  static readonly PASSWORD_REQUIRED = 'PASSWORD_REQUIRED';
  static readonly PASSWORD_MUST_BE_STRING = 'PASSWORD_MUST_BE_STRING';
  static readonly PASSWORD_NOT_EMPTY = 'PASSWORD_NOT_EMPTY';
  static readonly PASSWORD_INVALID_LENGTH = 'PASSWORD_INVALID_LENGTH';
  static readonly PASSWORD_INVALID_FORMAT = 'PASSWORD_INVALID_FORMAT';

  static readonly REMEMBER_ME_REQUIRED = 'REMEMBER_ME_REQUIRED';
  static readonly REMEMBER_ME_MUST_BE_BOOLEAN = 'REMEMBER_ME_MUST_BE_BOOLEAN';

  static readonly EMAIL_REQUIRED = 'EMAIL_REQUIRED';
  static readonly EMAIL_MUST_BE_STRING = 'EMAIL_MUST_BE_STRING';
  static readonly EMAIL_NOT_EMPTY = 'EMAIL_NOT_EMPTY';
  static readonly EMAIL_INVALID_LENGTH = 'EMAIL_INVALID_LENGTH';
  static readonly EMAIL_INVALID_FORMAT = 'EMAIL_INVALID_FORMAT';
  static readonly EMAIL_INVALID = 'INVALID_EMAIL';

  static readonly PHONE_REQUIRED = 'PHONE_REQUIRED';
  static readonly PHONE_MUST_BE_STRING = 'PHONE_MUST_BE_STRING';
  static readonly PHONE_NOT_EMPTY = 'PHONE_NOT_EMPTY';
  static readonly PHONE_INVALID_FORMAT = 'PHONE_INVALID_FORMAT';

  static readonly NAME_REQUIRED = 'NAME_REQUIRED';
  static readonly NAME_MUST_BE_STRING = 'NAME_MUST_BE_STRING';
  static readonly NAME_NOT_EMPTY = 'NAME_NOT_EMPTY';
  static readonly NAME_INVALID_LENGTH = 'NAME_INVALID_LENGTH';

  static readonly ROLE_REQUIRED = 'ROLE_REQUIRED';
  static readonly ROLE_INVALID = 'ROLE_INVALID';

  static readonly IDENTIFIER = {
    REQUIRED: AuthValidationMessageConstant.IDENTIFIER_REQUIRED,
    MUST_BE_STRING: AuthValidationMessageConstant.IDENTIFIER_MUST_BE_STRING,
    NOT_EMPTY: AuthValidationMessageConstant.IDENTIFIER_NOT_EMPTY,
  } as const;

  static readonly PASSWORD = {
    REQUIRED: AuthValidationMessageConstant.PASSWORD_REQUIRED,
    MUST_BE_STRING: AuthValidationMessageConstant.PASSWORD_MUST_BE_STRING,
    NOT_EMPTY: AuthValidationMessageConstant.PASSWORD_NOT_EMPTY,
    INVALID_LENGTH: AuthValidationMessageConstant.PASSWORD_INVALID_LENGTH,
    INVALID_FORMAT: AuthValidationMessageConstant.PASSWORD_INVALID_FORMAT,
  } as const;

  static readonly REMEMBER_ME = {
    REQUIRED: AuthValidationMessageConstant.REMEMBER_ME_REQUIRED,
    MUST_BE_BOOLEAN: AuthValidationMessageConstant.REMEMBER_ME_MUST_BE_BOOLEAN,
  } as const;

  static readonly EMAIL = {
    REQUIRED: AuthValidationMessageConstant.EMAIL_REQUIRED,
    MUST_BE_STRING: AuthValidationMessageConstant.EMAIL_MUST_BE_STRING,
    NOT_EMPTY: AuthValidationMessageConstant.EMAIL_NOT_EMPTY,
    INVALID_LENGTH: AuthValidationMessageConstant.EMAIL_INVALID_LENGTH,
    INVALID_FORMAT: AuthValidationMessageConstant.EMAIL_INVALID_FORMAT,
    INVALID: AuthValidationMessageConstant.EMAIL_INVALID,
  } as const;

  static readonly PHONE = {
    REQUIRED: AuthValidationMessageConstant.PHONE_REQUIRED,
    MUST_BE_STRING: AuthValidationMessageConstant.PHONE_MUST_BE_STRING,
    NOT_EMPTY: AuthValidationMessageConstant.PHONE_NOT_EMPTY,
    INVALID_FORMAT: AuthValidationMessageConstant.PHONE_INVALID_FORMAT,
  } as const;

  static readonly NAME = {
    REQUIRED: AuthValidationMessageConstant.NAME_REQUIRED,
    MUST_BE_STRING: AuthValidationMessageConstant.NAME_MUST_BE_STRING,
    NOT_EMPTY: AuthValidationMessageConstant.NAME_NOT_EMPTY,
    INVALID_LENGTH: AuthValidationMessageConstant.NAME_INVALID_LENGTH,
  } as const;

  static readonly ROLE = {
    REQUIRED: AuthValidationMessageConstant.ROLE_REQUIRED,
    INVALID: AuthValidationMessageConstant.ROLE_INVALID,
  } as const;
}
