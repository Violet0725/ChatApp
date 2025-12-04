require('./setup');
const { User, Message, Channel } = require('../src/models');

describe('User Model', () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  it('should hash password before saving', async () => {
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'plainpassword',
    });

    expect(user.password).not.toBe('plainpassword');
    expect(user.password.length).toBeGreaterThan(20);
  });

  it('should compare passwords correctly', async () => {
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'testpassword',
    });

    const userWithPassword = await User.findById(user._id).select('+password');
    const isMatch = await userWithPassword.comparePassword('testpassword');
    const isNotMatch = await userWithPassword.comparePassword('wrongpassword');

    expect(isMatch).toBe(true);
    expect(isNotMatch).toBe(false);
  });

  it('should return public JSON without password', async () => {
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'testpassword',
    });

    const publicUser = user.toPublicJSON();
    expect(publicUser.password).toBeUndefined();
    expect(publicUser.username).toBe('testuser');
  });
});

describe('Message Model', () => {
  beforeEach(async () => {
    await Message.deleteMany({});
  });

  it('should create a message', async () => {
    const message = await Message.create({
      room: 'general',
      authorName: 'testuser',
      message: 'Hello, world!',
    });

    expect(message.room).toBe('general');
    expect(message.message).toBe('Hello, world!');
    expect(message.reactions).toHaveLength(0);
  });

  it('should add reactions to message', async () => {
    const message = await Message.create({
      room: 'general',
      authorName: 'testuser',
      message: 'Test message',
    });

    message.reactions.push({ emoji: '👍', users: ['user1', 'user2'] });
    await message.save();

    const updated = await Message.findById(message._id);
    expect(updated.reactions).toHaveLength(1);
    expect(updated.reactions[0].emoji).toBe('👍');
    expect(updated.reactions[0].users).toContain('user1');
  });
});

describe('Channel Model', () => {
  beforeEach(async () => {
    await Channel.deleteMany({});
  });

  it('should create a channel', async () => {
    const channel = await Channel.create({
      name: 'test-channel',
      description: 'A test channel',
    });

    expect(channel.name).toBe('test-channel');
    expect(channel.description).toBe('A test channel');
  });

  it('should enforce unique channel names', async () => {
    await Channel.create({ name: 'unique-channel' });

    await expect(
      Channel.create({ name: 'unique-channel' })
    ).rejects.toThrow();
  });
});
