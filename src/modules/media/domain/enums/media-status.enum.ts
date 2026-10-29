export enum MediaStatus {
  /** Upload ticket issued; the file may not be in storage yet. */
  PENDING_UPLOAD = 'pending_upload',
  /** The file was verified in storage and can be read. */
  UPLOADED = 'uploaded',
}
