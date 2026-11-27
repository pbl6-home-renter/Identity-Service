export interface ModerationEmailContent {
  subject: string;
  text: string;
  html: string;
}

export interface ModerationEmailComposerPort {
  appealAccepted(input: { name: string }): ModerationEmailContent;
  appealRejected(input: {
    name: string;
    rejectReason: string;
    nextSubmitAt: Date;
  }): ModerationEmailContent;
}
