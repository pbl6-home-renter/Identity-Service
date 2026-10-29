import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiProduces,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import { AuthenticatedUser } from 'shared/application/auth/authenticated-user';
import { UserRole } from 'shared/domain/enums/user-role.enum';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import {
  Public,
  Roles,
} from 'shared/presentation/decorators/auth/access-control.decorators';
import { CurrentUser } from 'shared/presentation/decorators/auth/current-user.decorator';
import { ApiSuccessResponse } from 'shared/presentation/decorators/api-success-response.decorator';
import { ResponseCode } from 'shared/presentation/decorators/response-code.decorator';
import { MediaCompleteUploadCommand } from '../../../application/commands/media-complete-upload/media-complete-upload.command';
import { MediaDeleteCommand } from '../../../application/commands/media-delete/media-delete.command';
import { MediaPresignUploadCommand } from '../../../application/commands/media-presign-upload/media-presign-upload.command';
import { mediaResourcePath } from '../../../application/media-resource-path';
import { MediaGetQuery } from '../../../application/queries/media-get/media-get.query';
import { MediaCompletedResult } from '../../../application/results/media-completed.result';
import { MediaFileResult } from '../../../application/results/media-file.result';
import { MediaUploadTicketResult } from '../../../application/results/media-upload-ticket.result';
import { MediaResponseCodeConstant } from '../constants/media-response-code.constant';
import { MediaPresignUploadRequestDto } from '../requests/media-presign-upload.request.dto';
import { MediaCompleteUploadResponseDto } from '../responses/media-complete-upload.response.dto';
import { MediaPresignUploadResponseDto } from '../responses/media-presign-upload.response.dto';

const ALL_ROLES = [UserRole.LANDLORD, UserRole.TENANT, UserRole.ADMIN];

/** Two-step upload: presign → client PUTs to storage → complete. */
@ApiTags('Media')
@ApiBearerAuth()
@Controller('media')
export class MediaController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('presign-upload')
  @Roles(...ALL_ROLES)
  @HttpCode(HttpStatus.CREATED)
  @ResponseCode(MediaResponseCodeConstant.MEDIA_UPLOAD_TICKET_ISSUED)
  @ApiOperation({
    operationId: 'postMediaPresignUpload',
    summary: 'Request a signed upload URL',
  })
  @ApiSuccessResponse({
    status: 201,
    code: MediaResponseCodeConstant.MEDIA_UPLOAD_TICKET_ISSUED,
    dataDto: MediaPresignUploadResponseDto,
  })
  @ApiResponse({ status: 403, description: 'FORBIDDEN' })
  @ApiResponse({
    status: 422,
    description: 'MEDIA_TYPE_NOT_ALLOWED, INVALID_PURPOSE or VALIDATION_FAILED',
  })
  async presignUpload(
    @CurrentUser() user: AuthenticatedUser,
    @Body() request: MediaPresignUploadRequestDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<MediaPresignUploadResponseDto> {
    const ticket: MediaUploadTicketResult = await this.commandBus.execute(
      MediaPresignUploadCommand.create(user, request),
    );
    response.setHeader('Location', mediaResourcePath(ticket.media.id));
    return MediaPresignUploadResponseDto.fromResult(ticket);
  }

  @Post(':mediaId/complete-upload')
  @Roles(...ALL_ROLES)
  @HttpCode(HttpStatus.OK)
  @ResponseCode(MediaResponseCodeConstant.MEDIA_UPLOAD_COMPLETED)
  @ApiOperation({
    operationId: 'postMediaMediaidCompleteUpload',
    summary: 'Complete media upload',
  })
  @ApiSuccessResponse({
    status: 200,
    code: MediaResponseCodeConstant.MEDIA_UPLOAD_COMPLETED,
    dataDto: MediaCompleteUploadResponseDto,
  })
  @ApiResponse({ status: 403, description: 'FORBIDDEN' })
  @ApiResponse({ status: 404, description: 'RESOURCE_NOT_FOUND' })
  @ApiResponse({ status: 409, description: 'UPLOAD_NOT_COMPLETED' })
  @ApiResponse({ status: 410, description: 'TICKET_EXPIRED or MEDIA_DELETED' })
  async completeUpload(
    @CurrentUser() user: AuthenticatedUser,
    @Param('mediaId', ParseUUIDPipe) mediaId: Uuid,
  ): Promise<MediaCompleteUploadResponseDto> {
    const completed: MediaCompletedResult = await this.commandBus.execute(
      MediaCompleteUploadCommand.create(user, mediaId),
    );
    return MediaCompleteUploadResponseDto.fromResult(completed);
  }

  /** Public so anonymous visitors can load listing photos; private files still need a token. */
  @Get(':mediaId')
  @Public()
  @ApiOperation({
    operationId: 'getMediaMediaid',
    summary: 'Get or stream media',
  })
  @ApiProduces('application/octet-stream')
  @ApiResponse({ status: 200, description: 'The file content' })
  @ApiResponse({ status: 403, description: 'FORBIDDEN' })
  @ApiResponse({ status: 404, description: 'RESOURCE_NOT_FOUND' })
  @ApiResponse({ status: 410, description: 'MEDIA_DELETED' })
  async getFile(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Param('mediaId', ParseUUIDPipe) mediaId: Uuid,
  ): Promise<StreamableFile> {
    const { media, content }: MediaFileResult = await this.queryBus.execute(
      MediaGetQuery.create(user ?? null, mediaId),
    );
    return new StreamableFile(content, {
      type: media.contentType,
      length: media.sizeBytes,
      disposition: `inline; filename*=UTF-8''${encodeURIComponent(media.fileName)}`,
    });
  }

  @Delete(':mediaId')
  @Roles(...ALL_ROLES)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ operationId: 'deleteMediaMediaid', summary: 'Delete media' })
  @ApiResponse({ status: 204, description: 'Media deleted' })
  @ApiResponse({ status: 403, description: 'FORBIDDEN' })
  @ApiResponse({ status: 404, description: 'RESOURCE_NOT_FOUND' })
  @ApiResponse({ status: 409, description: 'CANNOT_DELETE' })
  async deleteFile(
    @CurrentUser() user: AuthenticatedUser,
    @Param('mediaId', ParseUUIDPipe) mediaId: Uuid,
  ): Promise<void> {
    await this.commandBus.execute(MediaDeleteCommand.create(user, mediaId));
  }
}
