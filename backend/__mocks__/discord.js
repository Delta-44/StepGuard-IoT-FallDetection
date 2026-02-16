const Discord = {
  Client: jest.fn().mockImplementation(() => ({
    login: jest.fn().mockResolvedValue('token'),
    on: jest.fn(),
    once: jest.fn(),
    user: { tag: 'TestBot#0001' },
    channels: {
      cache: {
        get: jest.fn().mockReturnValue({
          send: jest.fn().mockResolvedValue({ id: '12345' }),
        }),
      },
    },
  })),
  GatewayIntentBits: {
    Guilds: 1,
    GuildMessages: 512,
    MessageContent: 32768,
  },
  EmbedBuilder: jest.fn().mockImplementation(() => ({
    setTitle: jest.fn().mockReturnThis(),
    setDescription: jest.fn().mockReturnThis(),
    setColor: jest.fn().mockReturnThis(),
    addFields: jest.fn().mockReturnThis(),
    setTimestamp: jest.fn().mockReturnThis(),
    setFooter: jest.fn().mockReturnThis(),
  })),
  TextChannel: jest.fn(),
  User: jest.fn(),
};

module.exports = Discord;