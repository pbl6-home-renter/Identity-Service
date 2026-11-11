export interface EmailVerificationEmailComposerPort {
  compose(input: { name: string; token: string }): {
    subject: string;
    text: string;
    html: string;
  };
}
