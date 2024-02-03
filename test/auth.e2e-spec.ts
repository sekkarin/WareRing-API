import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import * as mongoose from 'mongoose';
import * as cookieParser from 'cookie-parser';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
describe('Auth (e2e)', () => {
  const mongooseConnection = mongoose.connection;
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    await app.init();
  });
  afterEach(async () => {
    await app.close();
  });
  describe('Authentication', () => {
    describe('Register', () => {
      it('should throw validation array', () => {
        return request(app.getHttpServer()).post('/auth/register').expect(400);
      });
      it('should throw email duplicate', async () => {
        await request(app.getHttpServer()).post('/auth/register').send({
          email: 'john.doe@example.com',
          password: '1234567Test',
          firstName: 'John',
          lastName: 'Doe',
          username: 'johndoe',
        });
        const response = await request(app.getHttpServer())
          .post('/auth/register')
          .send({
            email: 'john.doe@example.com',
            password: '1234567Test',
            firstName: 'John',
            lastName: 'Doe',
            username: 'johndoe',
          })
          .expect(401);
        expect(response.body).toEqual({
          statusCode: 401,
          message: 'username or email has been used',
          error: 'Unauthorized',
        });
        await mongooseConnection.db.dropCollection('users');
      });
      it('should return status code 201 when registered', async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/register')
          .send({
            email: 'john.doe@example.com',
            password: '1234567Test',
            firstName: 'John',
            lastName: 'Doe',
            username: 'johndoe',
          })
          .expect(HttpStatus.CREATED);
        expect(response.body).toHaveProperty('_id');
        expect(response.body.username).toBe('johndoe');
        await mongooseConnection.db.dropCollection('users');
      });
      it('should throw error when password is weak', async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/register')
          .send({
            email: 'john.doe@example.com',
            password: '123123pass',
            firstName: 'John',
            lastName: 'Doe',
            username: 'johndoe',
          })
          .expect(HttpStatus.BAD_REQUEST);
        expect(response.body.message).toEqual(['password too weak']);
      });
    });
    describe('Login', () => {
      it('should sign in and return access token status 200', async () => {
        // Register a user or use an existing one for testing
        await request(app.getHttpServer())
          .post('/auth/register')
          .send({
            email: 'john.doe@example.com',
            password: '1234567Test',
            firstName: 'John',
            lastName: 'Doe',
            username: 'johndoe',
          })
          .expect(HttpStatus.CREATED);

        const signInResponse = await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            username: 'johndoe',
            password: '1234567Test',
          })
          .expect(HttpStatus.OK);

        expect(signInResponse.body.access_token).toBeDefined();
        await mongooseConnection.db.dropCollection('users');
      });

      it('should sign in without body status 400', async () => {
        // Register a user or use an existing one for testing
        await request(app.getHttpServer())
          .post('/auth/register')
          .send({
            email: 'john.doe@example.com',
            password: '1234567Test',
            firstName: 'John',
            lastName: 'Doe',
            username: 'johndoe',
          })
          .expect(HttpStatus.CREATED);

        const signInResponse = await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            username: '',
            password: '',
          })
          .expect(HttpStatus.BAD_REQUEST);

        expect(signInResponse.body.message).toEqual([
          'username must match ^[a-zA-Z0-9\\s]+$ regular expression',
          'username must be longer than or equal to 3 characters',
          'username should not be empty',
          'password too weak',
          'password must be longer than or equal to 8 characters',
          'password should not be empty',
        ]);

        await mongooseConnection.db.dropCollection('users');
      });

      it('should throw error without username status 403', async () => {
        await request(app.getHttpServer())
          .post('/auth/register')
          .send({
            email: 'john.doe@example.com',
            password: '1234567Test',
            firstName: 'John',
            lastName: 'Doe',
            username: 'johndoe',
          })
          .expect(HttpStatus.CREATED);

        const signInResponse = await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            username: '',
            password: '1234567Test',
          })
          .expect(HttpStatus.BAD_REQUEST);

        expect(signInResponse.body.message).toEqual([
          'username must match ^[a-zA-Z0-9\\s]+$ regular expression',
          'username must be longer than or equal to 3 characters',
          'username should not be empty',
        ]);
        await mongooseConnection.db.dropCollection('users');
      });
      it('should sign in without body status 400', async () => {
        await request(app.getHttpServer())
          .post('/auth/register')
          .send({
            email: 'john.doe@example.com',
            password: '1234567Test',
            firstName: 'John',
            lastName: 'Doe',
            username: 'johndoe',
          })
          .expect(HttpStatus.CREATED);

        const signInResponse = await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            username: 'johndoe',
            password: '1234567Testpass',
          })
          .expect(HttpStatus.FORBIDDEN);

        expect(signInResponse.body.message).toEqual(
          'Unauthorized - incorrect or missing credentials',
        );
        await mongooseConnection.db.dropCollection('users');
      });
    });
    describe('Logout', () => {
      it('should log out and clear refresh token cookie status 200', async () => {
        await request(app.getHttpServer())
          .post('/auth/register')
          .send({
            email: 'john.doe@example.com',
            password: '1234567Test',
            firstName: 'John',
            lastName: 'Doe',
            username: 'johndoe',
          })
          .expect(HttpStatus.CREATED);
        // Sign in a user or use an existing authenticated user for testing
        const signInResponse = await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            username: 'johndoe',
            password: '1234567Test',
          })
          .expect(HttpStatus.OK);

        const refreshTokenCookieHeader = signInResponse.get('Set-Cookie');

        const logOutResponse = await request(app.getHttpServer())
          .post('/auth/logout')
          .set('Cookie', refreshTokenCookieHeader[0])
          .set('Authorization', `Bearer ${signInResponse.body.access_token}`)
          .expect(HttpStatus.OK);

        // Check if the response contains the 'logout' message
        expect(logOutResponse.body.message).toEqual("logout's");
        await mongooseConnection.db.dropCollection('users');
      });
      it('should throw error without access token status 403', async () => {
        await request(app.getHttpServer())
          .post('/auth/register')
          .send({
            email: 'john.doe@example.com',
            password: '1234567Test',
            firstName: 'John',
            lastName: 'Doe',
            username: 'johndoe',
          })
          .expect(HttpStatus.CREATED);
        // Sign in a user or use an existing authenticated user for testing
        await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            username: 'johndoe',
            password: '1234567Test',
          })
          .expect(HttpStatus.OK);

        const logOutResponse = await request(app.getHttpServer())
          .post('/auth/logout')
          .set('Authorization', `Bearer null`)
          .expect(HttpStatus.FORBIDDEN);
        expect(logOutResponse.body.message).toEqual('jwt malformed');
        await mongooseConnection.db.dropCollection('users');
      });
    });
    describe('Refresh token', () => {
      it('should return a new access token with a valid refresh token', async () => {
        await request(app.getHttpServer())
          .post('/auth/register')
          .send({
            email: 'john.doe@example.com',
            password: '1234567Test',
            firstName: 'John',
            lastName: 'Doe',
            username: 'johndoe',
          })
          .expect(HttpStatus.CREATED);

        // Sign in a user
        const signInResponse = await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            username: 'johndoe',
            password: '1234567Test',
          })
          .expect(HttpStatus.OK);
        const refreshTokenCookie = signInResponse.get('Set-Cookie')[0];
        // Use the refresh token to get a new access token
        const refreshResponse = await request(app.getHttpServer())
          .get('/auth/refresh')
          .set('Cookie', refreshTokenCookie)
          .set('Authorization', `Bearer ${signInResponse.body.access_token}`)
          .expect(HttpStatus.OK);

        expect(refreshResponse.body.access_token).toBeDefined();
        await mongooseConnection.db.dropCollection('users');
      });

      it('should return 401 with missing refresh token', async () => {
        await request(app.getHttpServer())
          .get('/auth/refresh')
          .expect(HttpStatus.UNAUTHORIZED);
      });
    });
  });
});
