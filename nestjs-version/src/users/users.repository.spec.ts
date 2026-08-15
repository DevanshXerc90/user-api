import { Repository } from 'typeorm';
import { UsersRepository } from './users.repository';
import { User } from './user.entity';

function makeUser(overrides: Partial<User> = {}): User {
  const user = new User();
  user.id = overrides.id ?? 1;
  user.name = overrides.name ?? 'John Doe';
  user.dob = overrides.dob ?? new Date('2000-01-01');
  return user;
}

describe('UsersRepository', () => {
  const repo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    delete: jest.fn(),
  } as unknown as jest.Mocked<Partial<Repository<User>>>;

  let usersRepository: UsersRepository;

  beforeEach(() => {
    usersRepository = new UsersRepository(repo as Repository<User>);
    jest.clearAllMocks();
  });

  it('creates and saves a user', async () => {
    const entity = makeUser({ name: 'Alice', dob: new Date('2000-01-01') });
    (repo.create as jest.Mock).mockReturnValue(entity);
    (repo.save as jest.Mock).mockResolvedValue(entity);

    const result = await usersRepository.createUser('Alice', new Date('2000-01-01'));

    expect(repo.create).toHaveBeenCalledWith({ name: 'Alice', dob: new Date('2000-01-01') });
    expect(repo.save).toHaveBeenCalledWith(entity);
    expect(result).toBe(entity);
  });

  it('finds a user by id', async () => {
    const entity = makeUser({ id: 7 });
    (repo.findOne as jest.Mock).mockResolvedValue(entity);

    const result = await usersRepository.getUserById(7);

    expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 7 } });
    expect(result).toBe(entity);
  });

  it('lists users ordered by id ascending', async () => {
    (repo.find as jest.Mock).mockResolvedValue([]);

    await usersRepository.listUsers();

    expect(repo.find).toHaveBeenCalledWith({ order: { id: 'ASC' } });
  });

  it('lists paginated users with take and skip', async () => {
    (repo.find as jest.Mock).mockResolvedValue([]);

    await usersRepository.listUsersPaginated(10, 20);

    expect(repo.find).toHaveBeenCalledWith({
      order: { id: 'ASC' },
      take: 10,
      skip: 20,
    });
  });

  it('updates an existing user', async () => {
    const entity = makeUser({ id: 3, name: 'Old', dob: new Date('1990-01-01') });
    (repo.findOne as jest.Mock).mockResolvedValue(entity);
    (repo.save as jest.Mock).mockResolvedValue({ ...entity, name: 'New' });

    const result = await usersRepository.updateUser(3, 'New', new Date('1991-02-02'));

    expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 3 } });
    expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ id: 3, name: 'New' }));
    expect(result?.name).toBe('New');
  });

  it('returns null when updating a missing user', async () => {
    (repo.findOne as jest.Mock).mockResolvedValue(null);

    const result = await usersRepository.updateUser(999, 'Missing', new Date('2000-01-01'));

    expect(result).toBeNull();
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('returns true when delete affects a row and false otherwise', async () => {
    (repo.delete as jest.Mock).mockResolvedValueOnce({ affected: 1 });
    (repo.delete as jest.Mock).mockResolvedValueOnce({ affected: 0 });

    await expect(usersRepository.deleteUser(1)).resolves.toBe(true);
    await expect(usersRepository.deleteUser(2)).resolves.toBe(false);
  });
});