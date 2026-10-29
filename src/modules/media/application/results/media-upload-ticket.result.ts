import { Media } from '../../domain/entities/media';

export interface MediaUploadTicketResult {
  media: Media;
  uploadUrl: string;
  expiresIn: number;
}
