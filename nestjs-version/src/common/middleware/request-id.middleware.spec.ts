import { RequestIdMiddleware } from './request-id.middleware';
import { v4 as uuidv4 } from 'uuid';

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'generated-request-id'),
}));

describe('RequestIdMiddleware', () => {
  const middleware = new RequestIdMiddleware();

  it('generates a request id when missing', () => {
    const req = { headers: {} } as any;
    const res = { setHeader: jest.fn() } as any;
    const next = jest.fn();

    middleware.use(req, res, next);

    expect(uuidv4).toHaveBeenCalled();
    expect(req.requestId).toBe('generated-request-id');
    expect(res.setHeader).toHaveBeenCalledWith('X-Request-Id', 'generated-request-id');
    expect(next).toHaveBeenCalled();
  });

  it('preserves an existing request id', () => {
    const req = { headers: { 'x-request-id': '  abc-123  ' } } as any;
    const res = { setHeader: jest.fn() } as any;
    const next = jest.fn();

    middleware.use(req, res, next);

    expect(req.requestId).toBe('abc-123');
    expect(res.setHeader).toHaveBeenCalledWith('X-Request-Id', 'abc-123');
    expect(next).toHaveBeenCalled();
  });
});