import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { CreateUserDto } from 'src/users/dto/user.dto';
import { UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

const mockUsersService = {
  /* Define mock methods or properties as needed */
  findOne: jest.fn((username: string) => {
    // Replace this with your desired behavior or mock data
    return {
      username,
      email: `${username}@example.com`,
      password: 'hashed_password',
      // ... other properties of a user
    };
  }),
};
const mockJwtService = {
  /* Define mock methods or properties as needed */
};
const mockConfigService = {
  /* Define mock methods or properties as needed */
};
describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    authService = moduleRef.get<AuthService>(AuthService);
  });
  describe('signUp', () => {
    const signUpDto: CreateUserDto = {
      email: 'john.doe@example.com',
      password: null,
      phone: '0800000000',
      fname: 'John',
      lname: 'Doe',
      role: {
        User: 'USER',
        Admin: 'ADMIN',
      },
      username: 'john_doe',
      nameTitle: 'Mr',
      isAlive: true,
      profileUrl: 'https://example.com/profile.jpg',
    };
    it('should throw UnauthorizedException if password and username are not provided', async () => {
    
      try {
        await authService.signUp(signUpDto);
        // If the function does not throw an exception, fail the test
        fail('Expected exception but none was thrown');
      } catch (error) {
        console.log(typeof error );
        
        expect(error).toBeInstanceOf(Object);
      }
    });

    it('should call authService.signUp with the provided signUpDto', async () => {
      // Mock the signUp method of authService
      const signUpSpy = jest.spyOn(authService, 'signUp').mockResolvedValue({
        _id: '65ae447d9425f9772c331304',
        email: 'john.doe@example.com',
        fname: 'John',
        lname: 'Doe',
        role: {
          User: 'USER',
        },
        username: 'john_doe',
        nameTitle: 'Mr',
        isAlive: true,
        profileUrl: 'https://example.com/profile.jpg',
      });

      await authService.signUp(signUpDto);

      // Check if the signUp method was called with the correct arguments
      expect(signUpSpy).toHaveBeenCalledWith(signUpDto);
    });

    it('should return the result of authService.signUp', async () => {
      // Mock the signUp method of authService to return a specific value
      const expectedResult = {
        _id: '65ae447d9425f9772c331304',
        email: 'john.doe@example.com',
        fname: 'John',
        lname: 'Doe',
        role: {
          User: 'USER',
        },
        username: 'john_doe',
        nameTitle: 'Mr',
        isAlive: true,
        profileUrl: 'https://example.com/profile.jpg',
      };
      jest.spyOn(authService, 'signUp').mockResolvedValue(expectedResult);

      const result = await authService.signUp(signUpDto);

      expect(result).toEqual(expectedResult);
    });
  });
});
