import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateMemberDto } from './dto/create-member.dto.js';
import { MemberResponseDto } from './dto/member-response.dto.js';
import { MembersService } from './members.service.js';

@ApiTags('members')
@Controller('members')
export class MembersController {
  constructor(private readonly members: MembersService) {}

  @Post()
  @ApiCreatedResponse({ type: MemberResponseDto })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiConflictResponse({ description: 'Email already registered' })
  create(@Body() dto: CreateMemberDto): Promise<MemberResponseDto> {
    return this.members.create(dto);
  }

  @Get(':id')
  @ApiOkResponse({ type: MemberResponseDto })
  @ApiNotFoundResponse({ description: 'Member not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<MemberResponseDto> {
    return this.members.findOne(id);
  }
}
