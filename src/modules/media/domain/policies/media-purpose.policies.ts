import {
  IMAGE_AND_PDF_CONTENT_TYPES,
  IMAGE_CONTENT_TYPES,
  PDF_CONTENT_TYPES,
} from '../constants/media-content-type.constant';
import { MediaContentType } from '../enums/media-content-type.enum';
import { MediaOwnerType } from '../enums/media-owner-type.enum';
import { MediaPurpose } from '../enums/media-purpose.enum';
import { MediaVisibility } from '../enums/media-visibility.enum';
import {
  AccessRule,
  allOf,
  anyOf,
  anyone,
  capturedByCamera,
  isOwnerLandlord,
  isParticipant,
  isSelf,
} from './access-rules';

export interface MediaPurposePolicy {
  /** Parent entities this purpose may be attached to. */
  readonly ownerTypes: readonly MediaOwnerType[];
  readonly visibility: MediaVisibility;
  readonly contentTypes: readonly MediaContentType[];
  readonly canUpload: AccessRule;
  /** Admins and the uploader can always read; this rule covers everyone else. */
  readonly canRead: AccessRule;
  /** Only one live file per owner: completing a new one replaces the previous. */
  readonly singlePerOwner?: boolean;
  /** Owner statuses in which the file is evidence and can no longer be deleted. */
  readonly lockedOwnerStatuses?: readonly string[];
}

const CONTRACT_IN_EFFECT_STATUSES = [
  'signed',
  'active',
  'suspended',
  'expired',
  'terminated',
];

const LISTING_PHOTO: MediaPurposePolicy = {
  ownerTypes: [MediaOwnerType.BUILDING, MediaOwnerType.ROOM],
  visibility: MediaVisibility.PUBLIC,
  contentTypes: IMAGE_CONTENT_TYPES,
  canUpload: isOwnerLandlord,
  canRead: anyone,
};

const CCCD_PHOTO: MediaPurposePolicy = {
  ownerTypes: [MediaOwnerType.USER, MediaOwnerType.CONTRACT_MEMBER],
  visibility: MediaVisibility.PRIVATE,
  contentTypes: IMAGE_CONTENT_TYPES,
  canUpload: anyOf(isSelf, isParticipant, isOwnerLandlord),
  canRead: anyOf(isSelf, isParticipant, isOwnerLandlord),
};

/**
 * Business rules per purpose (database-design §2.25). Typed as a full
 * `Record`, so adding a purpose without its policy fails to compile.
 */
export const MEDIA_PURPOSE_POLICIES: Readonly<
  Record<MediaPurpose, MediaPurposePolicy>
> = {
  [MediaPurpose.AVATAR]: {
    ownerTypes: [MediaOwnerType.USER],
    visibility: MediaVisibility.PUBLIC,
    contentTypes: IMAGE_CONTENT_TYPES,
    canUpload: isSelf,
    canRead: anyone,
    singlePerOwner: true,
  },

  [MediaPurpose.COVER_PHOTO]: { ...LISTING_PHOTO, singlePerOwner: true },

  [MediaPurpose.GALLERY_PHOTO]: LISTING_PHOTO,

  [MediaPurpose.OWNERSHIP_PROOF]: {
    ownerTypes: [MediaOwnerType.BUILDING],
    visibility: MediaVisibility.PRIVATE,
    contentTypes: IMAGE_AND_PDF_CONTENT_TYPES,
    canUpload: isOwnerLandlord,
    canRead: isOwnerLandlord,
    lockedOwnerStatuses: ['approved'],
  },

  [MediaPurpose.CCCD_FRONT]: CCCD_PHOTO,

  [MediaPurpose.CCCD_BACK]: CCCD_PHOTO,

  [MediaPurpose.CONTRACT_TEMPLATE]: {
    ownerTypes: [MediaOwnerType.CONTRACT],
    visibility: MediaVisibility.PRIVATE,
    contentTypes: PDF_CONTENT_TYPES,
    canUpload: isOwnerLandlord,
    canRead: anyOf(isOwnerLandlord, isParticipant),
  },

  [MediaPurpose.CONTRACT_SIGNED]: {
    ownerTypes: [MediaOwnerType.CONTRACT],
    visibility: MediaVisibility.PRIVATE,
    contentTypes: IMAGE_AND_PDF_CONTENT_TYPES,
    canUpload: isOwnerLandlord,
    canRead: anyOf(isOwnerLandlord, isParticipant),
    lockedOwnerStatuses: CONTRACT_IN_EFFECT_STATUSES,
  },

  [MediaPurpose.METER_READING_EVIDENCE]: {
    ownerTypes: [MediaOwnerType.METER_READING],
    visibility: MediaVisibility.PRIVATE,
    contentTypes: IMAGE_CONTENT_TYPES,
    // Tenants must shoot the meter live; only the landlord may pick a stored photo.
    canUpload: anyOf(isOwnerLandlord, allOf(isParticipant, capturedByCamera)),
    canRead: anyOf(isOwnerLandlord, isParticipant),
  },

  [MediaPurpose.ISSUE_PHOTO]: {
    ownerTypes: [MediaOwnerType.ISSUE_REPORT],
    visibility: MediaVisibility.PRIVATE,
    contentTypes: IMAGE_CONTENT_TYPES,
    canUpload: anyOf(isParticipant, isOwnerLandlord),
    canRead: anyOf(isParticipant, isOwnerLandlord),
  },

  [MediaPurpose.CHAT_ATTACHMENT]: {
    ownerTypes: [MediaOwnerType.MESSAGE],
    visibility: MediaVisibility.PRIVATE,
    contentTypes: IMAGE_AND_PDF_CONTENT_TYPES,
    canUpload: isParticipant,
    canRead: isParticipant,
  },
};

export function policyOf(purpose: MediaPurpose): MediaPurposePolicy {
  return MEDIA_PURPOSE_POLICIES[purpose];
}
