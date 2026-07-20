import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersService, UserResponse } from '../users.service';
import { UsersRepository } from '../users.repository';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { User } from '../user.entity';

// ─────────────────────────── Helpers ─────────────────────────────────────

/** Build a mock User entity for test scenarios */
function makeUser(overrides: Partial<User> = {}): User {
  const user = new User();
  user.id = overrides.id ?? 1;
  user.name = overrides.name ?? 'John Doe';
  // Default dob: 2000-01-01 (a passed birthday for most test years)
  user.dob = overrides.dob ?? new Date('2000-01-01');
  return user;
}

// Mock repository — every method is a jest.fn() spy
const mockRepo = {
  createUser: jest.fn(),
  getUserById: jest.fn(),
  listUsers: jest.fn(),
  listUsersPaginated: jest.fn(),
  updateUser: jest.fn(),
  deleteUser: jest.fn(),
};

// ─────────────────────────── Test suite ──────────────────────────────────

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UsersRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  // ═══════════════════════ calculateAge ══════════════════════════════════
  // Mirrors Go's TestCalculateAge in internal/service/age_test.go

  describe('calculateAge', () => {
    it('returns correct age when birthday has already passed this year', () => {
      // Mirrors Go test: "Birthday passed this year"
      //   dob: time.Date(2000, 1, 1, ...)
      //   expected: time.Now().Year() - 2000
      const dob = new Date(2000, 0, 1); // Jan 1, 2000
      const age = service.calculateAge(dob);
      const currentYear = new Date().getFullYear();
      expect(age).toBe(currentYear - 2000);
    });

    it('returns age-1 when birthday has not yet occurred this year', () => {
      // Mirrors Go test: "Birthday not yet passed this year"
      //   dob: time.Date(now.Year()-20, 12, 31, ...)  → Dec 31
      //   expected: 19
      const currentYear = new Date().getFullYear();
      const dob = new Date(currentYear - 20, 11, 31); // Dec 31, 20 years ago
      const age = service.calculateAge(dob);
      expect(age).toBe(19);
    });

    it('returns 0 for a future date (non-negative guard)', () => {
      // Extra test beyond Go's coverage: ensures negative ages are clamped
      const futureDate = new Date(new Date().getFullYear() + 10, 0, 1);
      const age = service.calculateAge(futureDate);
      expect(age).toBe(0);
    });

    it('returns correct age on the exact birthday (boundary)', () => {
      // Birthday IS today → age should be exact years (not decremented)
      const today = new Date();
      const dob = new Date(today.getFullYear() - 25, today.getMonth(), today.getDate());
      const age = service.calculateAge(dob);
      expect(age).toBe(25);
    });

    it('returns age-1 for Dec 31 born persons before year end (leap-year safety)', () => {
      // Ensures the boundary condition works consistently regardless of leap years
      const currentYear = new Date().getFullYear();
      const dob = new Date(currentYear - 30, 11, 31); // Dec 31
      const age = service.calculateAge(dob);
      // Unless today IS Dec 31, the birthday hasn't occurred yet this year
      const today = new Date();
      const isDecember31 = today.getMonth() === 11 && today.getDate() === 31;
      expect(age).toBe(isDecember31 ? 30 : 29);
    });
  });

  // ═══════════════════════ createUser ════════════════════════════════════

  describe('createUser', () => {
    it('creates a user and returns a response with age', async () => {
      const dto: CreateUserDto = { name: 'Alice', dob: '2000-01-01' };
      const entity = makeUser({ name: 'Alice', dob: new Date('2000-01-01') });
      mockRepo.createUser.mockResolvedValue(entity);

      const result: UserResponse = await service.createUser(dto);

      expect(mockRepo.createUser).toHaveBeenCalledWith('Alice', new Date('2000-01-01'));
      expect(result.id).toBe(1);
      expect(result.name).toBe('Alice');
      expect(result.dob).toBe('2000-01-01');
      // Age should be a non-negative integer
      expect(typeof result.age).toBe('number');
      expect(result.age).toBeGreaterThanOrEqual(0);
    });

    it('propagates repository errors', async () => {
      const dto: CreateUserDto = { name: 'Bob', dob: '1990-06-15' };
      mockRepo.createUser.mockRejectedValue(new Error('db connection lost'));

      await expect(service.createUser(dto)).rejects.toThrow('db connection lost');
    });
  });

  // ═══════════════════════ getUserById ════════════════════════════════════

  describe('getUserById', () => {
    it('returns a user response when user exists', async () => {
      const entity = makeUser({ id: 5, name: 'Bob', dob: new Date('1990-06-15') });
      mockRepo.getUserById.mockResolvedValue(entity);

      const result = await service.getUserById(5);

      expect(mockRepo.getUserById).toHaveBeenCalledWith(5);
      expect(result.id).toBe(5);
      expect(result.name).toBe('Bob');
      expect(result.dob).toBe('1990-06-15');
      expect(typeof result.age).toBe('number');
    });

    it('throws NotFoundException when user does not exist', async () => {
      // DIVERGENCE documented: Go returns 500 (bug); NestJS returns 404
      mockRepo.getUserById.mockResolvedValue(null);

      await expect(service.getUserById(999)).rejects.toThrow(NotFoundException);
      await expect(service.getUserById(999)).rejects.toThrow('user not found');
    });
  });

  // ═══════════════════════ listUsersPaginated ══════════════════════════════

  describe('listUsersPaginated', () => {
    const users = [
      makeUser({ id: 1, name: 'Alice', dob: new Date('2000-01-01') }),
      makeUser({ id: 2, name: 'Bob', dob: new Date('1990-06-15') }),
    ];

    it('returns paginated users with correct offset calculation', async () => {
      // page=1, limit=10 → offset=0
      mockRepo.listUsersPaginated.mockResolvedValue(users);

      const result = await service.listUsersPaginated(1, 10);

      // Mirrors Go: offset = (page - 1) * limit = (1-1)*10 = 0
      expect(mockRepo.listUsersPaginated).toHaveBeenCalledWith(10, 0);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Alice');
      expect(result[1].name).toBe('Bob');
    });

    it('calculates correct offset for page 2', async () => {
      // page=2, limit=5 → offset=5
      mockRepo.listUsersPaginated.mockResolvedValue([]);

      await service.listUsersPaginated(2, 5);

      // Mirrors Go: offset = (2-1)*5 = 5
      expect(mockRepo.listUsersPaginated).toHaveBeenCalledWith(5, 5);
    });

    it('calculates correct offset for page 3 with limit 10', async () => {
      // page=3, limit=10 → offset=20
      mockRepo.listUsersPaginated.mockResolvedValue([]);

      await service.listUsersPaginated(3, 10);

      expect(mockRepo.listUsersPaginated).toHaveBeenCalledWith(10, 20);
    });

    it('clamps page < 1 to page=1 (mirrors Go guard)', async () => {
      // Go: if page < 1 { page = 1 }
      mockRepo.listUsersPaginated.mockResolvedValue([]);

      await service.listUsersPaginated(0, 10);

      // offset should be 0 (page clamped to 1)
      expect(mockRepo.listUsersPaginated).toHaveBeenCalledWith(10, 0);
    });

    it('clamps limit < 1 to limit=10 (mirrors Go guard)', async () => {
      // Go: if limit < 1 { limit = 10 }
      mockRepo.listUsersPaginated.mockResolvedValue([]);

      await service.listUsersPaginated(1, 0);

      expect(mockRepo.listUsersPaginated).toHaveBeenCalledWith(10, 0);
    });

    it('returns empty array when no users match the page', async () => {
      mockRepo.listUsersPaginated.mockResolvedValue([]);

      const result = await service.listUsersPaginated(100, 10);

      expect(result).toEqual([]);
    });

    it('each result includes computed age field', async () => {
      mockRepo.listUsersPaginated.mockResolvedValue(users);

      const result = await service.listUsersPaginated(1, 10);

      result.forEach((u) => {
        expect(typeof u.age).toBe('number');
        expect(u.age).toBeGreaterThanOrEqual(0);
      });
    });
  });

  // ═══════════════════════ updateUser ═════════════════════════════════════

  describe('updateUser', () => {
    it('updates a user and returns updated response with recalculated age', async () => {
      const dto: UpdateUserDto = { name: 'Alice Updated', dob: '1991-03-20' };
      const entity = makeUser({ id: 1, name: 'Alice Updated', dob: new Date('1991-03-20') });
      mockRepo.updateUser.mockResolvedValue(entity);

      const result = await service.updateUser(1, dto);

      expect(mockRepo.updateUser).toHaveBeenCalledWith(1, 'Alice Updated', new Date('1991-03-20'));
      expect(result.name).toBe('Alice Updated');
      expect(result.dob).toBe('1991-03-20');
      expect(typeof result.age).toBe('number');
    });

    it('throws NotFoundException when user does not exist (DIVERGENCE: Go returns 500)', async () => {
      mockRepo.updateUser.mockResolvedValue(null);

      const dto: UpdateUserDto = { name: 'Ghost', dob: '2000-01-01' };
      await expect(service.updateUser(999, dto)).rejects.toThrow(NotFoundException);
    });
  });

  // ═══════════════════════ deleteUser ═════════════════════════════════════

  describe('deleteUser', () => {
    it('calls repository deleteUser with the correct id', async () => {
      mockRepo.deleteUser.mockResolvedValue(true);

      await service.deleteUser(1);

      expect(mockRepo.deleteUser).toHaveBeenCalledWith(1);
    });

    it('is idempotent — does not throw when user does not exist', async () => {
      // Mirrors Go: DELETE is a :exec query that returns no error on missing row
      mockRepo.deleteUser.mockResolvedValue(false);

      await expect(service.deleteUser(999)).resolves.toBeUndefined();
    });

    it('propagates repository errors', async () => {
      mockRepo.deleteUser.mockRejectedValue(new Error('constraint violation'));

      await expect(service.deleteUser(1)).rejects.toThrow('constraint violation');
    });
  });
});
