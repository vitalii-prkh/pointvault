import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiAcceptedResponse,
  ApiBadRequestResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ActivityService } from './activity.service.js';
import { CheckInDto } from './dto/check-in.dto.js';
import { PurchaseDto } from './dto/purchase.dto.js';
import { ActivityAcceptedResponseDto } from './dto/activity-accepted-response.dto.js';

@ApiTags('activity')
@Controller('activity')
export class ActivityController {
  constructor(private readonly activity: ActivityService) {}

  @Post('check-in')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiAcceptedResponse({ type: ActivityAcceptedResponseDto })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  checkIn(@Body() dto: CheckInDto): ActivityAcceptedResponseDto {
    return this.activity.record('check-in', dto);
  }

  @Post('purchase')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiAcceptedResponse({ type: ActivityAcceptedResponseDto })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  purchase(@Body() dto: PurchaseDto): ActivityAcceptedResponseDto {
    return this.activity.record('purchase', dto);
  }
}
