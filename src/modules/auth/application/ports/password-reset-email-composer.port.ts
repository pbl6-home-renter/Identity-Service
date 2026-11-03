export interface PasswordResetEmailContent {
  subject: string;
  text: string;
  html: string;
}

export interface PasswordResetEmailComposerPort {
  compose(input: { name: string; token: string }): PasswordResetEmailContent;
}
