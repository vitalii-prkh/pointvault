import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiHeader,
  ApiTags,
  ApiOkResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { WalletService } from './wallet.service.js';
import { EarnPointsDto } from './dto/earn-points.dto.js';
import { RedeemPointsDto } from './dto/redeem-points.dto.js';
import { LedgerEntryResponseDto } from './dto/ledger-entry-response.dto.js';
import { WalletBalanceResponseDto } from './dto/wallet-balance-response.dto.js';

const IdempotencyHeader = ApiHeader({
  name: 'Idempotency-Key',
  required: false,
  description:
    'Client-generated key; retries with the same key are applied once (Phase 2).',
});

@ApiTags('wallet')
@Controller('wallet')
export class WalletController {
  constructor(private readonly wallet: WalletService) {}

  @Post('earn')
  @IdempotencyHeader
  @ApiCreatedResponse({ type: LedgerEntryResponseDto })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  earn(@Body() dto: EarnPointsDto): LedgerEntryResponseDto {
    return this.wallet.earn(dto);
  }

  @Post('redeem')
  @IdempotencyHeader
  @ApiCreatedResponse({ type: LedgerEntryResponseDto })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiConflictResponse({ description: 'Insufficient balance' })
  redeem(@Body() dto: RedeemPointsDto): LedgerEntryResponseDto {
    return this.wallet.redeem(dto);
  }

  @Get(':memberId')
  @ApiOkResponse({ type: WalletBalanceResponseDto })
  @ApiBadRequestResponse({ description: 'memberId is not a valid UUID' })
  @ApiNotFoundResponse({ description: 'Member has no wallet (Phase 2)' })
  getBalance(
    @Param('memberId', ParseUUIDPipe) memberId: string,
  ): WalletBalanceResponseDto {
    return this.wallet.getBalance(memberId);
  }
}
