import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiAcceptedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
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
  checkIn(@Body() dto: CheckInDto): Promise<ActivityAcceptedResponseDto> {
    return this.activity.checkIn(dto);
  }

  @Post('purchase')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiAcceptedResponse({ type: ActivityAcceptedResponseDto })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiNotFoundResponse({ description: 'Member has no wallet' })
  purchase(@Body() dto: PurchaseDto): Promise<ActivityAcceptedResponseDto> {
    return this.activity.purchase(dto);
  }
}
