import { INestApplication, NotFoundException, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { HttpExceptionFilter } from '../common/filters/http-exception.filter';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let app: INestApplication;

  const usersService = {
    createUser: jest.fn(),
    getUserById: jest.fn(),
    listUsersPaginated: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: usersService }],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: false,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());

    await app.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates a user and returns 201 with the service response', async () => {
    usersService.createUser.mockResolvedValue({
      id: 1,
      name: 'Alice',
      dob: '2000-01-01',
      age: 26,
    });

    await request(app.getHttpServer())
      .post('/users')
      .send({ name: 'Alice', dob: '2000-01-01' })
      .expect(201)
      .expect({ id: 1, name: 'Alice', dob: '2000-01-01', age: 26 });

    expect(usersService.createUser).toHaveBeenCalledWith({ name: 'Alice', dob: '2000-01-01' });
  });

  it('rejects create requests with missing required fields', async () => {
    const response = await request(app.getHttpServer())
      .post('/users')
      .send({ dob: '2000-01-01' })
      .expect(400);

    expect(response.body).toMatchObject({ error: 'validation failed' });
    expect(Array.isArray(response.body.details)).toBe(true);
    expect(usersService.createUser).not.toHaveBeenCalled();
  });

  it('rejects create requests with an invalid dob format', async () => {
    const response = await request(app.getHttpServer())
      .post('/users')
      .send({ name: 'Alice', dob: '01-01-2000' })
      .expect(400);

    expect(response.body).toMatchObject({ error: 'validation failed' });
    expect(usersService.createUser).not.toHaveBeenCalled();
  });

  it('returns a found user by id', async () => {
    usersService.getUserById.mockResolvedValue({
      id: 5,
      name: 'Bob',
      dob: '1990-06-15',
      age: 36,
    });

    await request(app.getHttpServer())
      .get('/users/5')
      .expect(200)
      .expect({ id: 5, name: 'Bob', dob: '1990-06-15', age: 36 });

    expect(usersService.getUserById).toHaveBeenCalledWith(5);
  });

  it('returns 404 when a user is not found by id', async () => {
    usersService.getUserById.mockRejectedValue(new NotFoundException('user not found'));

    await request(app.getHttpServer()).get('/users/999').expect(404);
  });

  it('lists users with default pagination', async () => {
    usersService.listUsersPaginated.mockResolvedValue([]);

    await request(app.getHttpServer()).get('/users').expect(200).expect([]);

    expect(usersService.listUsersPaginated).toHaveBeenCalledWith(1, 10);
  });

  it('lists users with custom pagination values', async () => {
    usersService.listUsersPaginated.mockResolvedValue([]);

    await request(app.getHttpServer())
      .get('/users?page=2&limit=5')
      .expect(200)
      .expect([]);

    expect(usersService.listUsersPaginated).toHaveBeenCalledWith(2, 5);
  });

  it('returns 400 for out-of-range pagination values', async () => {
    const pageResponse = await request(app.getHttpServer()).get('/users?page=0').expect(400);
    const limitResponse = await request(app.getHttpServer()).get('/users?limit=0').expect(400);

    expect(pageResponse.body).toMatchObject({ error: 'invalid page' });
    expect(limitResponse.body).toMatchObject({ error: 'invalid limit' });
  });

  it('returns an empty array when pagination yields no users', async () => {
    usersService.listUsersPaginated.mockResolvedValue([]);

    await request(app.getHttpServer())
      .get('/users?page=99&limit=10')
      .expect(200)
      .expect([]);
  });

  it('updates a user and returns the updated response', async () => {
    usersService.updateUser.mockResolvedValue({
      id: 1,
      name: 'Alice Updated',
      dob: '1991-03-20',
      age: 35,
    });

    await request(app.getHttpServer())
      .put('/users/1')
      .send({ name: 'Alice Updated', dob: '1991-03-20' })
      .expect(200)
      .expect({ id: 1, name: 'Alice Updated', dob: '1991-03-20', age: 35 });

    expect(usersService.updateUser).toHaveBeenCalledWith(1, { name: 'Alice Updated', dob: '1991-03-20' });
  });

  it('rejects partial update payloads because PUT requires the full resource', async () => {
    await request(app.getHttpServer())
      .put('/users/1')
      .send({ name: 'Partial Update Only' })
      .expect(400);

    expect(usersService.updateUser).not.toHaveBeenCalled();
  });

  it('returns 404 when updating a missing user', async () => {
    usersService.updateUser.mockRejectedValue(new NotFoundException('user not found'));

    await request(app.getHttpServer())
      .put('/users/999')
      .send({ name: 'Ghost', dob: '2000-01-01' })
      .expect(404);
  });

  it('deletes a user with 204 No Content', async () => {
    usersService.deleteUser.mockResolvedValue(undefined);

    await request(app.getHttpServer()).delete('/users/1').expect(204);

    expect(usersService.deleteUser).toHaveBeenCalledWith(1);
  });

  it('keeps delete idempotent when the user does not exist', async () => {
    usersService.deleteUser.mockResolvedValue(undefined);

    await request(app.getHttpServer()).delete('/users/999').expect(204);
  });
});