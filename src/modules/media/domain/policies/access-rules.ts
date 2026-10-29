import { MediaCaptureSource } from '../enums/media-capture-source.enum';
import { MediaOwnerType } from '../enums/media-owner-type.enum';
import { MediaActor } from '../value-objects/media-actor';
import { OwnerSnapshot } from '../value-objects/owner-snapshot';

export interface AccessContext {
  readonly actor: MediaActor;
  readonly owner: OwnerSnapshot;
  /** Only known when uploading. */
  readonly captureSource?: MediaCaptureSource | null;
}

/** One small yes/no question about the caller; rules are combined with `anyOf` / `allOf`. */
export type AccessRule = (context: AccessContext) => boolean;

export const anyone: AccessRule = () => true;

export const isSelf: AccessRule = ({ actor, owner }) =>
  owner.ownerType === MediaOwnerType.USER && owner.ownerId === actor.id;

export const isOwnerLandlord: AccessRule = ({ actor, owner }) =>
  owner.landlordId === actor.id;

export const isParticipant: AccessRule = ({ actor, owner }) =>
  owner.participantUserIds.includes(actor.id);

export const capturedByCamera: AccessRule = ({ captureSource }) =>
  captureSource === MediaCaptureSource.CAMERA_DIRECT;

export const anyOf =
  (...rules: AccessRule[]): AccessRule =>
  (context) =>
    rules.some((rule) => rule(context));

export const allOf =
  (...rules: AccessRule[]): AccessRule =>
  (context) =>
    rules.every((rule) => rule(context));
