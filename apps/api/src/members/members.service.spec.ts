import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { MembersService } from './members.service.js';

describe('MembersService', () => {
  let service: MembersService;
  const prisma = { member: { create: vi.fn(), findUnique: vi.fn() } };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [MembersService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(MembersService);
  });

  it('create() creates the member together with an empty wallet', async () => {
    prisma.member.create.mockResolvedValue({
      id: 'm1',
      email: 'a@b.co',
      displayName: 'Alex',
      createdAt: new Date(),
    });

    await service.create({ email: 'a@b.co', displayName: 'Alex' });

    expect(prisma.member.create).toHaveBeenCalledWith({
      data: { email: 'a@b.co', displayName: 'Alex', wallet: { create: {} } },
    });
  });

  it('create() maps a duplicate email (P2002) to 409', async () => {
    prisma.member.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('dup', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );

    await expect(
      service.create({ email: 'a@b.co', displayName: 'Alex' }),
    ).rejects.toThrow(ConflictException);
  });

  it('findOne() throws 404 for an unknown id', async () => {
    prisma.member.findUnique.mockResolvedValue(null);

    await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
  });
});
