/** MIME types accepted for upload. SVG/HTML are left out on purpose: they can carry scripts. */
export enum MediaContentType {
  JPEG = 'image/jpeg',
  PNG = 'image/png',
  WEBP = 'image/webp',
  PDF = 'application/pdf',
  MP4 = 'video/mp4',
  WEBM = 'video/webm',
}
