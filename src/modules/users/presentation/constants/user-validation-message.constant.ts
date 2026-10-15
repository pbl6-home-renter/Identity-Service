export class UserValidationMessageConstant {
  static readonly NAME_REQUIRED = 'NAME_REQUIRED';
  static readonly NAME_MUST_BE_STRING = 'NAME_MUST_BE_STRING';
  static readonly NAME_NOT_EMPTY = 'NAME_NOT_EMPTY';
  static readonly NAME_INVALID_LENGTH = 'NAME_INVALID_LENGTH';

  static readonly PHONE_REQUIRED = 'PHONE_REQUIRED';
  static readonly PHONE_MUST_BE_STRING = 'PHONE_MUST_BE_STRING';
  static readonly PHONE_NOT_EMPTY = 'PHONE_NOT_EMPTY';
  static readonly PHONE_INVALID_FORMAT = 'PHONE_INVALID_FORMAT';

  static readonly EMAIL_REQUIRED = 'EMAIL_REQUIRED';
  static readonly EMAIL_MUST_BE_STRING = 'EMAIL_MUST_BE_STRING';
  static readonly EMAIL_NOT_EMPTY = 'EMAIL_NOT_EMPTY';
  static readonly EMAIL_INVALID_FORMAT = 'EMAIL_INVALID_FORMAT';
  static readonly EMAIL_INVALID_LENGTH = 'EMAIL_INVALID_LENGTH';

  static readonly LOCK_REASON_REQUIRED = 'LOCK_REASON_REQUIRED';
  static readonly LOCK_REASON_MUST_BE_STRING = 'LOCK_REASON_MUST_BE_STRING';
  static readonly LOCK_REASON_NOT_EMPTY = 'LOCK_REASON_NOT_EMPTY';
  static readonly LOCK_REASON_INVALID_LENGTH = 'LOCK_REASON_INVALID_LENGTH';

  static readonly PAYOUT_ACCOUNT_MUST_BE_OBJECT =
    'PAYOUT_ACCOUNT_MUST_BE_OBJECT';

  static readonly BANK_CODE_REQUIRED = 'BANK_CODE_REQUIRED';
  static readonly BANK_CODE_MUST_BE_STRING = 'BANK_CODE_MUST_BE_STRING';
  static readonly BANK_CODE_NOT_EMPTY = 'BANK_CODE_NOT_EMPTY';
  static readonly BANK_CODE_INVALID_LENGTH = 'BANK_CODE_INVALID_LENGTH';

  static readonly ACCOUNT_NUMBER_REQUIRED = 'ACCOUNT_NUMBER_REQUIRED';
  static readonly ACCOUNT_NUMBER_MUST_BE_STRING =
    'ACCOUNT_NUMBER_MUST_BE_STRING';
  static readonly ACCOUNT_NUMBER_NOT_EMPTY = 'ACCOUNT_NUMBER_NOT_EMPTY';
  static readonly ACCOUNT_NUMBER_INVALID_LENGTH =
    'ACCOUNT_NUMBER_INVALID_LENGTH';

  static readonly ACCOUNT_NAME_REQUIRED = 'ACCOUNT_NAME_REQUIRED';
  static readonly ACCOUNT_NAME_MUST_BE_STRING = 'ACCOUNT_NAME_MUST_BE_STRING';
  static readonly ACCOUNT_NAME_NOT_EMPTY = 'ACCOUNT_NAME_NOT_EMPTY';
  static readonly ACCOUNT_NAME_INVALID_LENGTH = 'ACCOUNT_NAME_INVALID_LENGTH';

  static readonly CURRENT_PASSWORD_REQUIRED = 'CURRENT_PASSWORD_REQUIRED';
  static readonly CURRENT_PASSWORD_MUST_BE_STRING =
    'CURRENT_PASSWORD_MUST_BE_STRING';
  static readonly CURRENT_PASSWORD_NOT_EMPTY = 'CURRENT_PASSWORD_NOT_EMPTY';

  static readonly NEW_PASSWORD_REQUIRED = 'NEW_PASSWORD_REQUIRED';
  static readonly NEW_PASSWORD_MUST_BE_STRING = 'NEW_PASSWORD_MUST_BE_STRING';
  static readonly NEW_PASSWORD_NOT_EMPTY = 'NEW_PASSWORD_NOT_EMPTY';
  static readonly NEW_PASSWORD_INVALID_LENGTH = 'NEW_PASSWORD_INVALID_LENGTH';
  static readonly NEW_PASSWORD_INVALID_FORMAT = 'NEW_PASSWORD_INVALID_FORMAT';

  static readonly CONFIRM_PASSWORD_REQUIRED = 'CONFIRM_PASSWORD_REQUIRED';
  static readonly CONFIRM_PASSWORD_MUST_BE_STRING =
    'CONFIRM_PASSWORD_MUST_BE_STRING';
  static readonly CONFIRM_PASSWORD_NOT_EMPTY = 'CONFIRM_PASSWORD_NOT_EMPTY';

  static readonly PASSWORD_MISMATCH = 'USER_CHANGE_PASSWORD_MISMATCH';

  static readonly NAME = {
    REQUIRED: UserValidationMessageConstant.NAME_REQUIRED,
    MUST_BE_STRING: UserValidationMessageConstant.NAME_MUST_BE_STRING,
    NOT_EMPTY: UserValidationMessageConstant.NAME_NOT_EMPTY,
    INVALID_LENGTH: UserValidationMessageConstant.NAME_INVALID_LENGTH,
  } as const;

  static readonly PHONE = {
    REQUIRED: UserValidationMessageConstant.PHONE_REQUIRED,
    MUST_BE_STRING: UserValidationMessageConstant.PHONE_MUST_BE_STRING,
    NOT_EMPTY: UserValidationMessageConstant.PHONE_NOT_EMPTY,
    INVALID_FORMAT: UserValidationMessageConstant.PHONE_INVALID_FORMAT,
  } as const;

  static readonly EMAIL = {
    REQUIRED: UserValidationMessageConstant.EMAIL_REQUIRED,
    MUST_BE_STRING: UserValidationMessageConstant.EMAIL_MUST_BE_STRING,
    NOT_EMPTY: UserValidationMessageConstant.EMAIL_NOT_EMPTY,
    INVALID_FORMAT: UserValidationMessageConstant.EMAIL_INVALID_FORMAT,
    INVALID_LENGTH: UserValidationMessageConstant.EMAIL_INVALID_LENGTH,
  } as const;

  static readonly LOCK_REASON = {
    REQUIRED: UserValidationMessageConstant.LOCK_REASON_REQUIRED,
    MUST_BE_STRING: UserValidationMessageConstant.LOCK_REASON_MUST_BE_STRING,
    NOT_EMPTY: UserValidationMessageConstant.LOCK_REASON_NOT_EMPTY,
    INVALID_LENGTH: UserValidationMessageConstant.LOCK_REASON_INVALID_LENGTH,
  } as const;

  static readonly PAYOUT_ACCOUNT = {
    MUST_BE_OBJECT: UserValidationMessageConstant.PAYOUT_ACCOUNT_MUST_BE_OBJECT,
  } as const;

  static readonly BANK_CODE = {
    REQUIRED: UserValidationMessageConstant.BANK_CODE_REQUIRED,
    MUST_BE_STRING: UserValidationMessageConstant.BANK_CODE_MUST_BE_STRING,
    NOT_EMPTY: UserValidationMessageConstant.BANK_CODE_NOT_EMPTY,
    INVALID_LENGTH: UserValidationMessageConstant.BANK_CODE_INVALID_LENGTH,
  } as const;

  static readonly ACCOUNT_NUMBER = {
    REQUIRED: UserValidationMessageConstant.ACCOUNT_NUMBER_REQUIRED,
    MUST_BE_STRING: UserValidationMessageConstant.ACCOUNT_NUMBER_MUST_BE_STRING,
    NOT_EMPTY: UserValidationMessageConstant.ACCOUNT_NUMBER_NOT_EMPTY,
    INVALID_LENGTH: UserValidationMessageConstant.ACCOUNT_NUMBER_INVALID_LENGTH,
  } as const;

  static readonly ACCOUNT_NAME = {
    REQUIRED: UserValidationMessageConstant.ACCOUNT_NAME_REQUIRED,
    MUST_BE_STRING: UserValidationMessageConstant.ACCOUNT_NAME_MUST_BE_STRING,
    NOT_EMPTY: UserValidationMessageConstant.ACCOUNT_NAME_NOT_EMPTY,
    INVALID_LENGTH: UserValidationMessageConstant.ACCOUNT_NAME_INVALID_LENGTH,
  } as const;

  static readonly CURRENT_PASSWORD = {
    REQUIRED: UserValidationMessageConstant.CURRENT_PASSWORD_REQUIRED,
    MUST_BE_STRING:
      UserValidationMessageConstant.CURRENT_PASSWORD_MUST_BE_STRING,
    NOT_EMPTY: UserValidationMessageConstant.CURRENT_PASSWORD_NOT_EMPTY,
  } as const;

  static readonly NEW_PASSWORD = {
    REQUIRED: UserValidationMessageConstant.NEW_PASSWORD_REQUIRED,
    MUST_BE_STRING: UserValidationMessageConstant.NEW_PASSWORD_MUST_BE_STRING,
    NOT_EMPTY: UserValidationMessageConstant.NEW_PASSWORD_NOT_EMPTY,
    INVALID_LENGTH: UserValidationMessageConstant.NEW_PASSWORD_INVALID_LENGTH,
    INVALID_FORMAT: UserValidationMessageConstant.NEW_PASSWORD_INVALID_FORMAT,
  } as const;

  static readonly CONFIRM_PASSWORD = {
    REQUIRED: UserValidationMessageConstant.CONFIRM_PASSWORD_REQUIRED,
    MUST_BE_STRING:
      UserValidationMessageConstant.CONFIRM_PASSWORD_MUST_BE_STRING,
    NOT_EMPTY: UserValidationMessageConstant.CONFIRM_PASSWORD_NOT_EMPTY,
  } as const;
}
