import { MediaContentType } from '../enums/media-content-type.enum';
import { MediaFileType } from '../enums/media-file-type.enum';

export const IMAGE_CONTENT_TYPES: readonly MediaContentType[] = [
  MediaContentType.JPEG,
  MediaContentType.PNG,
  MediaContentType.WEBP,
];

export const PDF_CONTENT_TYPES: readonly MediaContentType[] = [
  MediaContentType.PDF,
];

export const IMAGE_AND_PDF_CONTENT_TYPES: readonly MediaContentType[] = [
  ...IMAGE_CONTENT_TYPES,
  ...PDF_CONTENT_TYPES,
];

/** File name extensions accepted for each MIME type; the first one is used for the storage key. */
export const CONTENT_TYPE_EXTENSIONS: Readonly<
  Record<MediaContentType, readonly string[]>
> = {
  [MediaContentType.JPEG]: ['jpg', 'jpeg'],
  [MediaContentType.PNG]: ['png'],
  [MediaContentType.WEBP]: ['webp'],
  [MediaContentType.PDF]: ['pdf'],
};

export const CONTENT_TYPE_FILE_TYPES: Readonly<
  Record<MediaContentType, MediaFileType>
> = {
  [MediaContentType.JPEG]: MediaFileType.IMAGE,
  [MediaContentType.PNG]: MediaFileType.IMAGE,
  [MediaContentType.WEBP]: MediaFileType.IMAGE,
  [MediaContentType.PDF]: MediaFileType.DOCUMENT,
};
