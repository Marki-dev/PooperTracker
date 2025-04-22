import { config } from 'dotenv';
import { Client, GatewayIntentBits, Message, SlashCommandBuilder } from 'discord.js';
import * as fs from 'fs/promises';
import * as path from 'path';

// Load environment variables from .env file
config();

interface PoopData {
  [userId: string]: {
    count: number;
    username: string;
  };
}

class PoopBot {
  private client: Client;
  private poopData: PoopData = {};
  private dataPath: string;

  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
    });
    this.dataPath = path.join(__dirname, '..', 'poopData.json');
    this.setupEventHandlers();
  }

  private async loadData() {
    try {
      const data = await fs.readFile(this.dataPath, 'utf-8');
      this.poopData = JSON.parse(data);
    } catch (error) {
      this.poopData = {};
      await this.saveData();
    }
  }

  private async saveData() {
    await fs.writeFile(this.dataPath, JSON.stringify(this.poopData, null, 2));
  }

  private setupEventHandlers() {
    this.client.once('ready', () => {
      console.log('PoopBot is ready! 💩');
      this.registerCommands();
    });

    this.client.on('messageCreate', async (message: Message) => {
      if (message.author.bot) return;

      const content = message.content.toLowerCase();
      const poopPhrases = [
        'i pooped',
        'i shat',
        'i shitted',
        'i took a dump',
        'i dumped',
        'i took a shit',
        'dropped a load',
        'dumped a load',
        'dropped the kids off',
        'dropped the kids at the pool'
      ];

      if (poopPhrases.some(phrase => content.includes(phrase))) {
        if (message.channel.id !== '1362956137271529602') return;
        await this.handlePoop(message);
      }
    });

    this.client.on('interactionCreate', async (interaction) => {
      if (!interaction.isCommand()) return;

      if (interaction.commandName === 'leaderboard') {
        await this.showLeaderboard(interaction);
      }
    });
  }

  private async handlePoop(message: Message) {
    const userId = message.author.id;
    if (!this.poopData[userId]) {
      this.poopData[userId] = {
        count: 0,
        username: message.author.username,
      };
    }

    this.poopData[userId].count++;
    await this.saveData();

    const responses = [
      "🎉 Congratulations on your successful bowel movement!",
      "💩 Another one for the books!",
      "🚽 Way to go, champion!",
      "✨ Magnificent achievement unlocked!",
      "🌟 Your dedication to regularity is inspiring!"
    ];

    const response = responses[Math.floor(Math.random() * responses.length)];
    const replyMessage = await message.reply(`${response} You've pooped ${this.poopData[userId].count} times!`);
    
    // React with poop emoji to both the original message and our reply
    await message.react('💩');
    await replyMessage.react('💩');
  }

  private async showLeaderboard(interaction: any) {
    const sortedPoopers = Object.entries(this.poopData)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 10);

    const leaderboardText = sortedPoopers
      .map(([, data], index) => `${index + 1}. ${data.username}: ${data.count} poops`)
      .join('\n');

    await interaction.reply({
      content: `🏆 **Poop Leaderboard** 💩\n\n${leaderboardText || 'No poops recorded yet!'}`,
      ephemeral: false,
    });
  }

  private async registerCommands() {
    const commands = [
      new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Show the top poopers'),
    ];

    await this.client.application?.commands.set(commands);
  }

  public async start(token: string) {
    await this.loadData();
    await this.client.login(token);
  }
}

// Create and start the bot
const bot = new PoopBot();
const token = process.env.DISCORD_TOKEN;

if (!token) {
  console.error('Please set the DISCORD_TOKEN environment variable by running:\nexport DISCORD_TOKEN=your_token_here');
  process.exit(1);
}

bot.start(token).catch(console.error);
