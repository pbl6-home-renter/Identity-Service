import { ICommand } from '@nestjs/cqrs';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';

export interface AppealSubmitInput {
  content: string;
  attachmentMediaIds?: Uuid[];
  contactEmail?: string | null;
  contactPhone?: string | null;
}

export class AppealSubmitCommand implements ICommand {
  constructor(
    readonly userId: Uuid,
    readonly content: string,
    readonly attachmentMediaIds: Uuid[],
    readonly contactEmail: string | null,
    readonly contactPhone: string | null,
  ) {}

  static create(userId: Uuid, input: AppealSubmitInput): AppealSubmitCommand {
    return new AppealSubmitCommand(
      userId,
      input.content,
      input.attachmentMediaIds ?? [],
      input.contactEmail || null,
      input.contactPhone || null,
    );
  }
}
