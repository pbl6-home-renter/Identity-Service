export enum UserReportStatus {
  PENDING = 'pending',
  DISMISSED = 'dismissed',
  /** The reported account was locked while this report was pending. */
  ACTIONED = 'actioned',
}
