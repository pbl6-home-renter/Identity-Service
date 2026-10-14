import { SetMetadata } from '@nestjs/common';

export const RESPONSE_CODE_METADATA_KEY = 'response_code_metadata_key';

export const ResponseCode = (code: string) =>
  SetMetadata(RESPONSE_CODE_METADATA_KEY, code);
