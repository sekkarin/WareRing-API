import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersModule } from 'src/users/users.module';
import { JwtModule, JwtService, TokenExpiredError } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import { UsersService } from 'src/users/users.service';
import { BullModule } from '@nestjs/bull';
import { AuthConsumer } from './auth.process';
import * as bcrypt from 'bcrypt';
import { AuthGuard } from './guards/auth.guard';
import { userProviders } from 'src/users/provider/user.providers';
import {
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from 'src/users/dto/user.dto';
import { User } from 'src/users/interfaces/user.interface';
import { FORM_VERIFY_EMAIL } from 'src/utils/emailVerification';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;
  let mailerService: MailerService;
  let configService: ConfigService;

  const mockUsersService = {
    findOne: jest.fn(),
    save: jest.fn(),
    findByEmail: jest.fn(),
    createUser: jest.fn(),
    findOneToken: jest.fn(),
  };
  const mockJwtService = {
    signAsync: jest.fn(),
    verify: jest.fn(),
  };
  const mockMailerService = {
    sendMail: jest.fn(),
    // verify: jest.fn(),
  };
  const mockUser = {
    _id: 'mockUserId', // Assuming _id is of type ObjectId or similar
    username: 'mockUsername',
    roles: ['user'],
    verifired: false,
    password: 'hashPassword',
  };
  const mockConfigService = {
    get: jest.fn(),
    getOrThrow: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        AuthConsumer,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: MailerService, useValue: mockMailerService },
      ],
    }).compile();
    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
    mailerService = module.get<MailerService>(MailerService);
    configService = module.get<ConfigService>(ConfigService);
  });
  it('should be defined', () => {
    expect(authService).toBeDefined();
  });
  describe('signIn', () => {
    it('should throw NotFoundException if user is not found', async () => {
      jest.spyOn(usersService, 'findOne').mockResolvedValueOnce(null);
      await expect(
        authService.signIn('username', 'password'),
      ).rejects.toThrowError(NotFoundException);
    });
    it('should throw UnauthorizedException if user is not verify email', async () => {
      jest
        .spyOn(usersService, 'findOne')
        .mockResolvedValueOnce(mockUser as any);
      await expect(
        authService.signIn('username', 'password'),
      ).rejects.toThrowError(UnauthorizedException);
    });
    it('should throw UnauthorizedException if password is incorrect', async () => {
      mockUser;
      jest
        .spyOn(usersService, 'findOne')
        .mockResolvedValueOnce(mockUser as any);
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.reject(false));

      await expect(
        authService.signIn('username', 'password'),
      ).rejects.toThrowError(UnauthorizedException);
    });
    it('should return access token and refresh token if user is found and password is correct', async () => {
      const User = {
        _id: 'mockUserId', // Assuming _id is of type ObjectId or similar
        username: 'mockUsername',
        roles: ['user'],
        verifired: true,
        password: 'hashPassword',
        save: jest.fn(),
      };
      jest.spyOn(usersService, 'findOne').mockResolvedValueOnce(User as any);
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(true));
      jest
        .spyOn(jwtService, 'signAsync')
        .mockResolvedValueOnce('refreshToken')
        .mockResolvedValueOnce('accessToken');

      const result = await authService.signIn('username', 'password');

      expect(result).toEqual({
        access_token: 'accessToken',
        refresh_token: 'refreshToken',
      });
    });
  });
  describe('signUp', () => {
    it('should create a new user if username and email are not used', async () => {
      // Arrange
      const createUserDto: CreateUserDto = {
        username: 'testUser',
        email: 'test@example.com',
        password: 'password123',
      };

      jest.spyOn(usersService, 'findOne').mockResolvedValueOnce(null); // Mock no existing user with the same username
      jest.spyOn(usersService, 'findByEmail').mockResolvedValueOnce(null); // Mock no existing user with the same email
      jest
        .spyOn(usersService, 'createUser')
        .mockResolvedValueOnce(createUserDto as any); // Mock createUser method to return createUserDto

      const result = await authService.signUp(createUserDto);

      expect(result).toEqual(createUserDto);
    });
    it('should throw UnauthorizedException if username is already used', async () => {
      // Arrange
      const createUserDto: CreateUserDto = {
        username: 'existingUser',
        email: 'test@example.com',
        password: 'password123',
      };

      jest
        .spyOn(usersService, 'findOne')
        .mockResolvedValueOnce(createUserDto as any); // Mock existing user with the same username

      // Act & Assert
      await expect(authService.signUp(createUserDto)).rejects.toThrowError(
        UnauthorizedException,
      );
    });
    it('should throw UnauthorizedException if email is already used', async () => {
      // Arrange
      const createUserDto: CreateUserDto = {
        username: 'testUser',
        email: 'existing@example.com',
        password: 'password123',
      };

      jest.spyOn(usersService, 'findOne').mockResolvedValueOnce(null); // Mock no existing user with the same username
      jest
        .spyOn(usersService, 'findByEmail')
        .mockResolvedValueOnce(createUserDto as any); // Mock existing user with the same email

      // Act & Assert
      await expect(authService.signUp(createUserDto)).rejects.toThrowError(
        UnauthorizedException,
      );
    });
  });
  describe('logOut', () => {
    it('should remove refresh token and return the user if user is found', async () => {
      // Arrange
      const username = 'testUser';
      const User = {
        _id: 'mockUserId', // Assuming _id is of type ObjectId or similar
        username: 'mockUsername',
        roles: ['user'],
        verifired: true,
        password: 'hashPassword',
        refreshToken: 'refreshToken',
        save: jest.fn(),
      };
      jest.spyOn(usersService, 'findOne').mockResolvedValueOnce(User as any); // Mock existing user
      await authService.logOut(username);

      expect(User.refreshToken).toBe('');
      expect(User.save).toHaveBeenCalled();
    });

    it('should throwNotFoundException if user is not found', async () => {
      // Arrange
      const username = 'nonexistentUser';
      jest.spyOn(usersService, 'findOne').mockResolvedValueOnce(undefined); // Mock no existing user

      // Act & Assert
      await expect(authService.logOut(username)).rejects.toThrowError(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if there is a TokenExpiredError', async () => {
      // Arrange
      const username = 'testUser';
      jest.spyOn(usersService, 'findOne').mockImplementation(() => {
        throw new TokenExpiredError('Token expired', new Date());
      }); // Mock TokenExpiredError
      await expect(authService.logOut(username)).rejects.toThrowError(
        ForbiddenException,
      );
    });
  });

  describe('refresh', () => {
    it('should return access token if user is found with valid refreshToken', async () => {
      // Arrange
      const refreshToken = 'validRefreshToken';
      const foundUser = {
        id: 'userId',
        username: 'testUser',
        roles: ['user'],
        // refreshToken: 'validRefreshToken',
      };
      const payload = {
        sub: 'userId',
        username: 'testUser',
        roles: ['user'],
        refreshToken: 'validRefreshToken',
      };
      jest
        .spyOn(jwtService, 'verify')
        .mockImplementation(() => Promise.resolve(payload));
      jest
        .spyOn(usersService, 'findOneToken')
        .mockResolvedValueOnce(foundUser as any); // Mock existing user
      jest.spyOn(jwtService, 'signAsync').mockResolvedValueOnce('accessToken'); // Mock existing user

      // Act
      const result = await authService.refresh(refreshToken);

      // Assert
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if user is not found with refreshToken', async () => {
      // Arrange
      const refreshToken = 'nonexistentRefreshToken';
      jest.spyOn(usersService, 'findOneToken').mockResolvedValueOnce(undefined); // Mock no existing user

      // Act & Assert
      await expect(authService.refresh(refreshToken)).rejects.toThrowError(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if verifyToken fails', async () => {
      // Arrange
      const refreshToken = 'invalidRefreshToken';
      const foundUser = { id: 'userId', username: 'testUser', roles: ['user'] };
      jest
        .spyOn(usersService, 'findOneToken')
        .mockResolvedValueOnce(foundUser as any); // Mock existing user
      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error();
      }); // Mock verifyToken failure

      // Act & Assert
      await expect(authService.refresh(refreshToken)).rejects.toThrowError(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException if refreshToken is expired', async () => {
      // Arrange
      const refreshToken = 'expiredRefreshToken';
      const foundUser = { id: 'userId', username: 'testUser', roles: ['user'] };
      jest
        .spyOn(usersService, 'findOneToken')
        .mockResolvedValueOnce(foundUser as any); // Mock existing user
      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new TokenExpiredError('token expired', new Date());
      }); // Mock TokenExpiredError

      // Act & Assert
      await expect(authService.refresh(refreshToken)).rejects.toThrowError(
        ForbiddenException,
      );
    });

    it('should throw unexpected error if any other error occurs', async () => {
      // Arrange
      const refreshToken = 'unexpectedErrorRefreshToken';
      jest
        .spyOn(usersService, 'findOneToken')
        .mockRejectedValueOnce(new Error('Unexpected error')); // Mock other error

      // Act & Assert
      await expect(authService.refresh(refreshToken)).rejects.toThrowError(
        Error,
      );
    });
  });

  describe('sendEmailVerification', () => {
    it('should send verification email successfully', async () => {
      const email = 'test@example.com';

      jest
        .spyOn(configService, 'get')
        .mockReturnValueOnce('mockToken')
        .mockReturnValueOnce('2')
        .mockReturnValueOnce('2')
        .mockReturnValueOnce('http://example.com')
        .mockReturnValueOnce('test@example.com');
      jest.spyOn(jwtService, 'signAsync').mockResolvedValueOnce('token');

      jest
        .spyOn(mailerService, 'sendMail')
        .mockImplementation(() => Promise.resolve());
      // Call the method
      const result = await authService.sendEmailVerification(email);

      // Expectations
      expect(result).toBe(true); // Expects the method to return true
      // expect(jwtService.signAsync).toHaveBeenCalledWith(
      //   { email },
      //   { expiresIn, secret },
      // ); // Expects jwtService.signAsync to be called with the correct arguments
      // expect(mailerService.sendMail).toHaveBeenCalledWith({
      //   // Expects mailerService.sendMail to be called with the correct arguments
      //   from: 'mockEmailAuth',
      //   to: email,
      //   subject: 'Verify Your Email',
      //   html: expect.any(String), // You may need to refine this expectation based on the actual FORM_VERIFY_EMAIL function
      // });
    });

    // it('should throw an error if sending verification email fails', async () => {
    //   const email = 'test@example.com';
    //   const token = 'mockToken';

    //   // Mock jwtService.signAsync to return a mock token
    //   (jwtService.signAsync as jest.Mock).mockResolvedValueOnce(token);

    //   // Mock mailerService.sendMail to fail
    //   (mailerService.sendMail as jest.Mock).mockRejectedValueOnce(new Error('Failed to send email'));

    //   // Assume ConfigService.get returns the expected values
    //   const expiresIn = '3600'; // expiration time
    //   const secret = 'mockSecret'; // secret key
    //   (authService['configService'].get as jest.Mock).mockReturnValueOnce(expiresIn);
    //   (authService['configService'].get as jest.Mock).mockReturnValueOnce(secret);

    //   // Call the method and expect it to throw an error
    //   await expect(authService.sendEmailVerification(email)).rejects.toThrowError(HttpException);
    // });
  });
});
