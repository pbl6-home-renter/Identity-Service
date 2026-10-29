/** Decides the storage bucket: public files get a permanent URL, private ones are served after a permission check. */
export enum MediaVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
}
