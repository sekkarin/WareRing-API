import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService, TokenExpiredError } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import { UsersService } from 'src/users/users.service';
import { AuthConsumer } from './auth.process';
import * as bcrypt from 'bcrypt';
import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from 'src/users/dto/user.dto';

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
    verifiredUserEmail: jest.fn(),
    setNewPassword: jest.fn(),
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
    it('should returnUnauthorizedException if password not math', async () => {
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
        .mockImplementation(() => Promise.resolve(false));

      await expect(
        authService.signIn('username', 'password_invalid'),
      ).rejects.toThrowError(UnauthorizedException);
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
        throw new Error('error verifying');
      }); // Mock verifyToken failure

      // Act & Assert
      await expect(authService.refresh(refreshToken)).rejects.toThrowError(
        Error,
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
    it('should throw  ForbiddenException if username not match', async () => {
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
        username: 'testUser_invalid',
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

      await expect(authService.refresh(refreshToken)).rejects.toThrowError(
        ForbiddenException,
      );
    });
    it('should throw  ForbiddenException if other error', async () => {
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
        username: 'testUser_invalid',
        roles: ['user'],
        refreshToken: 'validRefreshToken',
      };
      jest
        .spyOn(jwtService, 'verify')
        .mockImplementation(() =>
          Promise.reject(new TokenExpiredError('error something', new Date())),
        );
      jest
        .spyOn(usersService, 'findOneToken')
        .mockResolvedValueOnce(foundUser as any); // Mock existing user
      jest.spyOn(jwtService, 'signAsync').mockResolvedValueOnce('accessToken'); // Mock existing user

      await expect(authService.refresh(refreshToken)).rejects.toThrowError(
        ForbiddenException,
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
    });

    it('should throw an error if sending verification email fails', async () => {
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
        .mockRejectedValueOnce(new Error('failed to send mail'));

      await expect(
        authService.sendEmailVerification(email),
      ).rejects.toThrowError(Error);
    });
  });

  describe('verifyEmail', () => {
    it('should verify email and call verifiredUserEmail', async () => {
      const uniqueString = 'mockedUniqueString';
      const payload = {
        email: 'test@example.com',
      };

      jest
        .spyOn(jwtService, 'verify')
        .mockImplementation(() => Promise.resolve(payload));
      jest
        .spyOn(usersService, 'verifiredUserEmail')
        .mockResolvedValueOnce(payload as any);

      const result = await authService.verifyEmail(uniqueString);

      expect(jwtService.verify).toHaveBeenCalledWith(uniqueString, {
        secret: expect.any(String), // Adjust as per your configuration
      });
      expect(usersService.verifiredUserEmail).toHaveBeenCalledWith(
        payload.email,
      );
      expect(result).toBeTruthy();
    });

    it('should throw HttpException if token is not valid', async () => {
      const uniqueString = 'invalidToken';

      jest
        .spyOn(jwtService, 'verify')
        .mockImplementation(() => Promise.reject(new Error('Invalid token')));

      await expect(authService.verifyEmail(uniqueString)).rejects.toThrowError(
        new HttpException(
          'Unauthorized - token is not valid',
          HttpStatus.FORBIDDEN,
        ),
      );
    });
  });

  describe('sendEmailForgetPassword', () => {
    it('should send reset password email when user found', async () => {
      const email = 'test@example.com';
      const expiresIn = '1h';
      const resetPassToken = 'mockedResetPassToken';

      jest
        .spyOn(usersService, 'findByEmail')
        .mockResolvedValueOnce({ email } as any);

      jest.spyOn(jwtService, 'signAsync').mockResolvedValueOnce(resetPassToken);

      jest.spyOn(configService, 'get').mockReturnValueOnce(expiresIn);

      const mailOptions = {
        from: expect.any(String),
        to: email,
        subject: 'Reset your password',
        html: expect.any(String),
      };

      jest.spyOn(mailerService, 'sendMail').mockResolvedValueOnce(true);

      const result = await authService.sendEmailForgetPassword(email);

      expect(usersService.findByEmail).toHaveBeenCalledWith(email);
      expect(jwtService.signAsync).toHaveBeenCalled();
      expect(configService.get).toHaveBeenCalledWith(
        'EXPIRES_IN_RESET_PASS_TOKEN',
      );
      expect(result).toBe(true);
    });

    it('should throw HttpException when user not found', async () => {
      const email = 'notfound@example.com';

      jest.spyOn(usersService, 'findByEmail').mockResolvedValueOnce(null);

      await expect(
        authService.sendEmailForgetPassword(email),
      ).rejects.toThrowError(
        new HttpException('LOGIN_USER_NOT_FOUND', HttpStatus.NOT_FOUND),
      );
    });

    it('should throw error when sending email fails', async () => {
      const email = 'test@example.com';
      const expiresIn = '1h';
      const resetPassToken = 'mockedResetPassToken';

      jest
        .spyOn(usersService, 'findByEmail')
        .mockResolvedValueOnce({ email } as any);

      jest.spyOn(jwtService, 'signAsync').mockResolvedValueOnce(resetPassToken);

      jest.spyOn(configService, 'get').mockReturnValueOnce(expiresIn);

      jest
        .spyOn(mailerService, 'sendMail')
        .mockRejectedValueOnce(new Error('Failed to send email'));

      await expect(
        authService.sendEmailForgetPassword(email),
      ).rejects.toThrowError(new Error('Failed to send email'));
    });
  });

  describe('resetPassword', () => {
    it('should reset password and return true', async () => {
      const token = 'mockedToken';
      const newPassword = 'newPassword';
      const email = 'test@example.com';
      const hashedPassword = 'hashedPassword';

      jest.spyOn(jwtService, 'verify').mockReturnValueOnce({ email });
      jest
        .spyOn(bcrypt, 'hash')
        .mockImplementation(() => Promise.resolve(hashedPassword));
      jest
        .spyOn(usersService, 'setNewPassword')
        .mockResolvedValueOnce(true as any);

      const result = await authService.resetPassword(token, newPassword);

      expect(bcrypt.hash).toHaveBeenCalledWith(newPassword, 10);
      expect(usersService.setNewPassword).toHaveBeenCalledWith(
        email,
        hashedPassword,
      );
      expect(result).toBe(true);
    });

    it('should throw HttpException if token is not valid', async () => {
      const token = 'invalidToken';

      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(
        authService.resetPassword(token, 'newPassword'),
      ).rejects.toThrowError(
        new HttpException(
          'Unauthorized - token is not valid',
          HttpStatus.FORBIDDEN,
        ),
      );
    });

    it('should throw HttpException if password hashing fails', async () => {
      const token = 'mockedToken';
      const newPassword = 'newPassword';
      const email = 'test@example.com';

      jest.spyOn(jwtService, 'verify').mockReturnValueOnce({ email });
      jest
        .spyOn(bcrypt, 'hash')
        .mockImplementation(() => Promise.reject(new Error('Hashing error')));

      await expect(
        authService.resetPassword(token, newPassword),
      ).rejects.toThrowError(
        new HttpException(
          'Unauthorized - token is not valid',
          HttpStatus.FORBIDDEN,
        ),
      );
    });

    it('should throw HttpException if setNewPassword fails', async () => {
      const token = 'mockedToken';
      const newPassword = 'newPassword';
      const email = 'test@example.com';
      const hashedPassword = 'hashedPassword';

      jest.spyOn(jwtService, 'verify').mockReturnValueOnce({ email });
      jest
        .spyOn(bcrypt, 'hash')
        .mockImplementation(() => Promise.resolve(hashedPassword));
      jest
        .spyOn(usersService, 'setNewPassword')
        .mockRejectedValueOnce(new Error('Set password error'));

      await expect(
        authService.resetPassword(token, newPassword),
      ).rejects.toThrowError(
        new HttpException(
          'Unauthorized - token is not valid',
          HttpStatus.FORBIDDEN,
        ),
      );
    });
  });
  describe('checkIsActive', () => {
    it('should return true if user is active', async () => {
      const username = 'test_user';
      const user = { username, isActive: true };

      jest.spyOn(usersService, 'findOne').mockResolvedValueOnce(user as any);

      const result = await authService.checkIsActive(username);

      expect(usersService.findOne).toHaveBeenCalledWith(username);
      expect(result).toBe(true);
    });

    it('should return false if user is not active', async () => {
      const username = 'test_user';
      const user = { username, isActive: false };

      jest.spyOn(usersService, 'findOne').mockResolvedValueOnce(user as any);

      const result = await authService.checkIsActive(username);

      expect(usersService.findOne).toHaveBeenCalledWith(username);
      expect(result).toBe(false);
    });

    it('should throw NotFoundException if user not found', async () => {
      const username = 'nonexistent_user';

      jest.spyOn(usersService, 'findOne').mockResolvedValueOnce(null);

      await expect(authService.checkIsActive(username)).rejects.toThrowError(
        new NotFoundException('not found user'),
      );
    });
  });
});
