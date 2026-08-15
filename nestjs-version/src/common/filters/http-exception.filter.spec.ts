import { HttpException, HttpStatus } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

function createHost(response: any, request: any = {}) {
  return {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => request,
    }),
  } as any;
}

describe('HttpExceptionFilter', () => {
  const filter = new HttpExceptionFilter();

  it('maps simple HttpException messages into { error }', () => {
    const response = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    filter.catch(new HttpException('not found', HttpStatus.NOT_FOUND), createHost(response));

    expect(response.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(response.json).toHaveBeenCalledWith({ error: 'not found' });
  });

  it('maps validation errors into { error, details }', () => {
    const response = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const exception = new HttpException(
      { statusCode: 400, message: ['name is required'], error: 'Bad Request' },
      HttpStatus.BAD_REQUEST,
    );

    filter.catch(exception, createHost(response));

    expect(response.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(response.json).toHaveBeenCalledWith({
      error: 'validation failed',
      details: ['name is required'],
    });
  });

  it('logs and returns 500 for unknown errors', () => {
    const response = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const stderrSpy = jest.spyOn(process.stderr, 'write').mockImplementation(() => true);

    filter.catch(new Error('boom'), createHost(response, { requestId: 'req-1' }));

    expect(stderrSpy).toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(response.json).toHaveBeenCalledWith({ error: 'internal server error' });

    stderrSpy.mockRestore();
  });
});