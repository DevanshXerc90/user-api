import { EventEmitter } from 'events';
import { RequestLoggerMiddleware } from './request-logger.middleware';

describe('RequestLoggerMiddleware', () => {
  const middleware = new RequestLoggerMiddleware();

  it('logs request metadata on finish', () => {
    const stdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const nowSpy = jest.spyOn(Date, 'now');
    nowSpy.mockImplementationOnce(() => 1000);
    nowSpy.mockImplementationOnce(() => 1025);
    nowSpy.mockImplementationOnce(() => 2000);

    const res = new EventEmitter() as any;
    res.statusCode = 201;
    const req = {
      method: 'POST',
      path: '/users',
      requestId: 'req-123',
    } as any;
    const next = jest.fn();

    middleware.use(req, res, next);
    res.emit('finish');

    expect(next).toHaveBeenCalled();
    expect(stdoutSpy).toHaveBeenCalledTimes(1);

    const logged = JSON.parse(stdoutSpy.mock.calls[0][0] as string);
    expect(logged).toMatchObject({
      level: 'info',
      msg: 'request completed',
      method: 'POST',
      path: '/users',
      duration: '25ms',
      status: 201,
      requestId: 'req-123',
    });

    stdoutSpy.mockRestore();
    nowSpy.mockRestore();
  });
});