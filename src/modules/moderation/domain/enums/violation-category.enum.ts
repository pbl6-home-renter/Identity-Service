/** The six lock-reason suggestions of P13-09, plus `other` (P13-D109). */
export enum ViolationCategory {
  FRAUD = 'fraud',
  FAKE_LISTING = 'fake_listing',
  HARASSMENT = 'harassment',
  SPAM = 'spam',
  IMPERSONATION = 'impersonation',
  INAPPROPRIATE_CONTENT = 'inappropriate_content',
  OTHER = 'other',
}
