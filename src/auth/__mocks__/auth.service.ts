import { userStub } from '../test/stubs/user.stub';

export const AuthService = jest.fn().mockReturnValue({
  signIn: jest.fn().mockResolvedValue(userStub()),
});
