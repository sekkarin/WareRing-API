import { UserResponseDto } from 'src/auth/dto/auth.dto';

export const userStub = (): UserResponseDto => {
  return {
    id: '123',
    fname: 'John',
    lname: 'Doe',
    username: 'johndoe2',
    email: 'sekkri123@gmail.com',
    isActive: true,
    createdAt: '123',
    profileUrl: 'http://',
  };
};
