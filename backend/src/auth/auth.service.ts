import { randomBytes } from 'crypto';
import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthDto, SignInDto, TwoFaDto } from './dto';
import * as bcrypt from 'bcrypt';
import { Tokens } from './types';
import { JwtService } from '@nestjs/jwt';
import { SendEmailService } from './2fa/2fa.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private sendEmailService: SendEmailService,
  ) {}

  async signupLocal(dto: SignInDto): Promise<Tokens> {
    // Check if user with email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    // Check if user with username already exists
    const existingUsername = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });
    if (existingUsername) {
      console.log(`Username ${dto.username} already exists in database`);
      throw new ConflictException('Username already in use');
    }

    console.log(
      `Creating user with username: ${dto.username} and email: ${dto.email}`,
    );
    const hash = await this.hashData(dto.password);

    try {
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          hash,
          username: dto.username,
        },
      });

      await this.prisma.user.update({
        where: { id: user.id },
        data: { isOnline: true },
      });

      const tokens = await this.getTokens(user.id, user.email);
      await this.updateRtHash(user.id, tokens.refreshToken);
      return tokens;
    } catch (error) {
      console.error('Error creating user:', error);
      // Handle Prisma unique constraint errors
      if (error.code === 'P2002') {
        const target = error.meta?.target;
        if (target?.includes('username')) {
          throw new ConflictException('Username already in use');
        }
        if (target?.includes('email')) {
          throw new ConflictException('Email already in use');
        }
      }
      throw error;
    }
  }

  async signinLocal(dto: AuthDto): Promise<any> {
    let user;

    if (dto.email) {
      user = await this.prisma.user.findFirst({
        where: { email: dto.email },
      });
    } else if (dto.username) {
      user = await this.prisma.user.findFirst({
        where: { username: dto.username },
      });
    }
    if (!user || !(await bcrypt.compare(dto.password, user.hash))) {
      throw new Error('Invalid credentials');
    }
    if (user.is2faEnabled === true) {
      const verificationCode = this.generateVerificationCode();

      await this.prisma.user.update({
        where: { id: user.id },
        data: { emailVerificationCode: verificationCode },
      });

      const emailSent = await this.sendEmailService.sendVerificationCode(
        user.email,
        verificationCode,
      );

      // If email sending is successful or email verification is disabled, proceed with 2FA
      if (emailSent) {
        return {
          is2faEnabled: true,
        };
      } else {
        // If email fails and we're in development, skip 2FA
        console.warn(
          `Email service failed for user ${user.email}. Proceeding with 2FA disabled for this session.`,
        );
        const tokens = await this.getTokens(user.id, user.email);
        await this.updateRtHash(user.id, tokens.refreshToken);
        return { tokens, is2faEnabled: false };
      }
    }
    await this.prisma.user.update({
      where: { id: user.id },
      data: { isOnline: true },
    });
    const tokens = await this.getTokens(user.id, user.email);
    await this.updateRtHash(user.id, tokens.refreshToken);
    return { tokens, is2faEnabled: false };
  }

  async verify2fa(dto: TwoFaDto): Promise<Tokens> {
    let user;
    if (dto.email) {
      user = await this.prisma.user.findFirst({
        where: { email: dto.email },
      });
    } else if (dto.username) {
      user = await this.prisma.user.findFirst({
        where: { username: dto.username },
      });
    }

    if (!user) {
      throw new Error('User not found');
    }

    if (!user.emailVerificationCode) {
      throw new Error('No verification code found. Please request a new one.');
    }

    // Compare the verification codes (plain text comparison since we store plain text)
    if (user.emailVerificationCode === dto.verificationCode) {
      // Code is correct - clear it and update user status
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerificationCode: null,
          isOnline: true, // Set user online after successful 2FA
        },
      });

      const tokens = await this.getTokens(user.id, user.email);
      await this.updateRtHash(user.id, tokens.refreshToken);
      return tokens;
    }

    throw new Error('Invalid verification code');
  }

  async signin42(profile: any): Promise<any> {
    let user = await this.prisma.user.findUnique({
      where: { email: profile.email },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: profile.email,
          hash: this.generateRandomPassword(),
          username: profile.username,
          profilePicture: profile.avatar,
        },
      });
    }
    await this.prisma.user.update({
      where: { id: user.id },
      data: { isOnline: true },
    });
    if (user.is2faEnabled === true) {
      const verificationCode = this.generateVerificationCode();

      await this.prisma.user.update({
        where: { id: user.id },
        data: { emailVerificationCode: verificationCode },
      });

      const emailSent = await this.sendEmailService.sendVerificationCode(
        user.email,
        verificationCode,
      );

      // If email sending is successful or email verification is disabled, proceed with 2FA
      if (emailSent) {
        return {
          is2faEnabled: true,
          email: user.email,
        };
      } else {
        // If email fails and we're in development, skip 2FA
        console.warn(
          `Email service failed for user ${user.email}. Proceeding with 2FA disabled for this session.`,
        );
        const tokens = await this.getTokens(user.id, user.email);
        await this.updateRtHash(user.id, tokens.refreshToken);
        return { tokens, is2faEnabled: false };
      }
    }
    const tokens = await this.getTokens(user.id, user.email);
    await this.updateRtHash(user.id, tokens.refreshToken);
    return { tokens, is2faEnabled: false };
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        hashedRt: null,
        isOnline: false,
      },
    });
  }

  async refreshTokens(userId: string, rt: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user || !user.hashedRt) {
      throw new Error('Access Denied');
    }
    const isRtValid = await bcrypt.compare(rt, user.hashedRt);
    if (!isRtValid) {
      throw new Error('Access Denied');
    }
    const tokens = await this.getTokens(user.id, user.email);
    await this.updateRtHash(user.id, tokens.refreshToken);
    return tokens;
  }

  async sendVerificationCodeByEmail(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    const verificationCode = this.generateVerificationCode();

    await this.prisma.user.update({
      where: { id: userId },
      data: { emailVerificationCode: verificationCode },
    });

    await this.sendEmailService.sendVerificationCode(
      user.email,
      verificationCode,
    );
  }
  hashData(data: string) {
    return bcrypt.hash(data, 10);
  }
  async updateRtHash(userId: string, rt: string) {
    const hash = await this.hashData(rt);
    await this.prisma.user.update({
      where: { id: userId },
      data: { hashedRt: hash },
    });
  }

  async getTokens(userId: string, email: string) {
    const atSecret = process.env.AT_SECRET;
    const rtSecret = process.env.RT_SECRET;
    const accessToken = await this.jwtService.signAsync(
      { id: userId, email },
      { secret: atSecret, expiresIn: '15m' },
    );
    const refreshToken = await this.jwtService.signAsync(
      { id: userId, email },
      { secret: rtSecret, expiresIn: '7d' },
    );
    return { accessToken, refreshToken };
  }

  generateRandomPassword(length = 16): string {
    return randomBytes(length).toString('hex');
  }

  generateVerificationCode(length = 6): string {
    const characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const code = Array.from({ length }, () =>
      characters.charAt(Math.floor(Math.random() * characters.length)),
    ).join('');

    return code;
  }

  async verifyEmailCode(
    userId: string,
    verificationCode: string,
  ): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.emailVerificationCode) {
      throw new Error('User not found or verification code not set');
    }

    // Compare the entered verification code with the stored code
    const isCodeValid = await bcrypt.compare(
      verificationCode,
      user.emailVerificationCode,
    );

    if (!isCodeValid) {
      throw new Error('Invalid verification code');
    }

    // Clear the verification code after successful verification
    await this.prisma.user.update({
      where: { id: userId },
      data: { emailVerificationCode: null },
    });

    return true;
  }
}
