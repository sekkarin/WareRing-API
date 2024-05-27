import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import * as mongoose from 'mongoose';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import * as path from 'path';

import { AppModule } from '../src/app.module';

describe('Users (e2e)', () => {
  let app: INestApplication;
  const mongooseConnection = mongoose.connection;
  let accessToken: string;
  let user_id: string;
  let accessTokenAdmin: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
    await signUp('user2');
    await signIn('user2', 'Password1234');
  });
  afterEach(async () => {
    if (mongooseConnection) {
      await mongooseConnection.close();
    }

    await app.close();
  });

  const signUp = async (username: string) => {
    await mongooseConnection.db.collection('users').insertOne({
      firstName: 'fname',
      lastName: 'lname',
      username,
      password: '$2b$10$gY4RF/bDlBqCNvaAtsJUqOCHQNQ5WWFwCgbMQiv4aCoQ5Ul9kdLHG',
      email: 'sekkri1234@gmail.com',
      roles: ['user'],
      isActive: true,
      verifired: true,
    });
    const currentUser = await mongooseConnection.db
      .collection('users')
      .findOne({ username });
    // console.log(currentUser._id.toString());
    user_id = currentUser._id.toString();
  };

  const signIn = async (username: string, password: string) => {
    const signInResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username, password })
      .expect(HttpStatus.OK);
    const signInResponseAdmin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        username: 'AdminWareringCaxknsa',
        password: 'kmsad9ASdjas0LSJWd9iaa',
      })
      .expect(HttpStatus.OK);

    accessToken = signInResponse.body.access_token;
    accessTokenAdmin = signInResponseAdmin.body.access_token;
  };
  describe('PUT /users', () => {
    it('should update a user successfully', async () => {
      const updateDto = {
        password: 'Password1231',
      };

      const response = await request(app.getHttpServer())
        .put(`/users`)
        .send(updateDto)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.OK);
      // console.log(response.body);

      expect(response.body).toBeDefined();
      expect(response.body).toHaveProperty('id');
    });
    it('should return 400 if request body is empty', async () => {
      const updateDto = {}; // Empty request body

      await request(app.getHttpServer())
        .put(`/users`)
        .send(updateDto)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.BAD_REQUEST);
    });
    it('should upload a file successfully', async () => {
      const filePath = path.resolve(
        __dirname,
        'resources/images/test-file-image.png',
      ); // Path to your test file
      await request(app.getHttpServer())
        .put(`/users`)
        .attach('file', filePath) // Attach the file to the request
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.OK);
    });
    // it('should return 400 if invalid file type', async () => {
    //   const filePath = path.resolve(
    //     __dirname,
    //     'resources/images/gif-file.gif',
    //   ); // Path to your test file
    //   console.log(filePath);
    //   await request(app.getHttpServer())
    //     .put(`/users`)
    //     .attach('file', filePath) // Attach the file to the request
    //     .set('Authorization', `Bearer ${accessToken}`)
    //     .expect(HttpStatus.BAD_REQUEST);
    // });
  });
  describe('PUT /users/banned/:id', () => {
    it('should set user to banned', async () => {
      const response = await request(app.getHttpServer())
        .put(`/users/banned/${user_id}`)
        .send({ banned: true })
        .set('Authorization', `Bearer ${accessTokenAdmin}`)
        .expect(HttpStatus.OK);
      expect(response.body).toBeDefined();
      expect(response.body.isActive).toEqual(true);
    });
    it('should return 404 when user not found', async () => {
      const id = new mongoose.Types.ObjectId();
      await request(app.getHttpServer())
        .put(`/users/banned/${id}`)
        .set('Authorization', `Bearer ${accessTokenAdmin}`)
        .send({ banned: true })
        .expect(HttpStatus.NOT_FOUND);
    });
    it('should return 403 when user is not authorized', async () => {
      await request(app.getHttpServer())
        .put(`/users/banned/${user_id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ banned: true })
        .expect(HttpStatus.FORBIDDEN);
    });
    it('should return 400 when request body is invalid', async () => {
      await request(app.getHttpServer())
        .put(`/users/banned/${user_id}`)
        .set('Authorization', `Bearer ${accessTokenAdmin}`)
        .send({ invalidField: true })
        .expect(400);
    });
  });
  describe('GET search', () => {
    it('should return paginated list of users matching the query', async () => {
      const query = 'search_query';
      const page = 1;
      const limit = 10;
      const res = await request(app.getHttpServer())
        .get(`/users/search?query=${query}&page=${page}&limit=${limit}`)
        .set('Authorization', `Bearer ${accessTokenAdmin}`)
        .expect(HttpStatus.OK);
      expect(res.body.data).toBeDefined();
      expect(res.body.metadata.page).toBe('1');
      expect(res.body.metadata.limit).toBe('10');
      expect(res.body.metadata.itemCount).toBeDefined();
    });

    it('should return 401 when user is not authorized', async () => {
      const query = 'search_query';
      const page = 1;
      const limit = 10;
      await request(app.getHttpServer())
        .get(`/users/search?query=${query}&page=${page}&limit=${limit}`)
        .expect(401);
    });

    it('should return 400 when page parameter is missing', () => {
      const query = 'search_query';
      const limit = 'sda5%^&*()';
      return request(app.getHttpServer())
        .get(`/users/search?query=${query}&limit=${limit}`)
        .set('Authorization', `Bearer ${accessTokenAdmin}`)
        .expect(400);
    });
  });
  describe('GET users', () => {
    it('should return a paginated list of users', async () => {
      const page = 1;
      const limit = 10;
      const res = await request(app.getHttpServer())
        .get(`/users?page=${page}&limit=${limit}`)
        .set('Authorization', `Bearer ${accessTokenAdmin}`)
        .expect(HttpStatus.OK);
      expect(res.body.data).toBeDefined();
      expect(res.body.metadata.page).toBe('1');
      expect(res.body.metadata.limit).toBe('10');
      expect(res.body.metadata.itemCount).toBeDefined();
    });
    it('should return 401 when user is not authorized', async () => {
      const page = 1;
      const limit = 10;
      return request(app.getHttpServer())
        .get(`/users?page=${page}&limit=${limit}`)
        .expect(401);
    });
  });
  describe('DELETE user', () => {
    it('should delete the current user', async () => {
      // Act: Delete the current user
      const res = await request(app.getHttpServer())
        .delete('/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.OK);

      expect(res.body.message).toBe('delete user successfully');
    });
  });
  describe('GET user', () => {
    it('should create a new user and retrieve it by ID', async () => {
      const getUserResponse = await request(app.getHttpServer())
        .get(`/users/${user_id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.OK);

      // Verify that the retrieved user matches the created user
      expect(getUserResponse.body.id).toBe(user_id);
      expect(getUserResponse.body.email).toBe('sekkri1234@gmail.com');
    });
    // describe('GET profile image', () => {
    //   it('should retrieve profile picture by filename', async () => {
    //     // Assuming you have a test profile picture named 'test.jpg' in the 'uploads/profiles' directory
    //     const filename = 'test.jpg';

    //     // Make a request to retrieve the profile picture
    //     const res = await request(app.getHttpServer())
    //       .get(`/users/profile/${filename}`)
    //       .expect(HttpStatus.OK);

    //     // // Check if the content type of the response is an image
    //     // expect(res.headers['content-type']).toMatch(/^image/);

    //     // // Check if the response body matches the content of the profile picture file
    //     // const fileContent = fs.readFileSync(`./uploads/profiles/${filename}`);
    //     // expect(res.body).toEqual(fileContent);
    //   });
  });
});
