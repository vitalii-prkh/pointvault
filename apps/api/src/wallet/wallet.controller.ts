import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { EarnPointsDto } from './dto/earn-points.dto.js';
import { LedgerEntryResponseDto } from './dto/ledger-entry-response.dto.js';
import { RedeemPointsDto } from './dto/redeem-points.dto.js';
import { WalletBalanceResponseDto } from './dto/wallet-balance-response.dto.js';
import { WalletService } from './wallet.service.js';

const IdempotencyHeader = ApiHeader({
  name: 'Idempotency-Key',
  required: false,
  description:
    'Client-generated key. A retry with the same key returns the original entry instead of applying it twice.',
});

@ApiTags('wallet')
@Controller('wallet')
export class WalletController {
  constructor(private readonly wallet: WalletService) {}

  @Post('earn')
  @IdempotencyHeader
  @ApiCreatedResponse({ type: LedgerEntryResponseDto })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiNotFoundResponse({ description: 'Member has no wallet' })
  @ApiConflictResponse({
    description: 'Idempotency-Key reused for a different request',
  })
  earn(
    @Body() dto: EarnPointsDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ): Promise<LedgerEntryResponseDto> {
    return this.wallet.earn(dto, idempotencyKey);
  }

  @Post('redeem')
  @IdempotencyHeader
  @ApiCreatedResponse({ type: LedgerEntryResponseDto })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiNotFoundResponse({ description: 'Member has no wallet' })
  @ApiConflictResponse({
    description:
      'Insufficient balance, or Idempotency-Key reused for a different request',
  })
  redeem(
    @Body() dto: RedeemPointsDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ): Promise<LedgerEntryResponseDto> {
    return this.wallet.redeem(dto, idempotencyKey);
  }

  @Get(':memberId')
  @ApiOkResponse({ type: WalletBalanceResponseDto })
  @ApiBadRequestResponse({ description: 'memberId is not a valid UUID' })
  @ApiNotFoundResponse({ description: 'Member has no wallet' })
  getBalance(
    @Param('memberId', ParseUUIDPipe) memberId: string,
  ): Promise<WalletBalanceResponseDto> {
    return this.wallet.getBalance(memberId);
  }
}
