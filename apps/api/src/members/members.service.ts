import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateMemberDto } from './dto/create-member.dto.js';
import { MemberResponseDto } from './dto/member-response.dto.js';

@Injectable()
export class MembersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates the member and their empty wallet in one transaction (nested write).
   * */
  async create(dto: CreateMemberDto): Promise<MemberResponseDto> {
    try {
      const member = await this.prisma.member.create({
        data: {
          email: dto.email,
          displayName: dto.displayName,
          wallet: { create: {} },
        },
      });

      return this.toResponse(member);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Member already exists');
      }

      throw error;
    }
  }

  async findOne(id: string): Promise<MemberResponseDto> {
    const member = await this.prisma.member.findUnique({
      where: { id },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    return this.toResponse(member);
  }

  private toResponse(
    member: Omit<MemberResponseDto, 'createdAt'> & { createdAt: Date },
  ): MemberResponseDto {
    return {
      id: member.id,
      email: member.email,
      displayName: member.displayName,
      createdAt: member.createdAt.toISOString(),
    };
  }
}
