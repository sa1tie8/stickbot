const { Client, GatewayIntentBits } = require('discord.js');
const { prefix } = require('./config.json');
const dotenv = require('dotenv');

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Use a map to store sticked messages and their content by channel ID
const stickedMessages = new Map();

client.once('ready', () => {
  console.log('Bot is online!');
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  if (message.content.startsWith(prefix)) {
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'stick') {
      const stickedMessageContent = args.join(' ');
      if (stickedMessageContent === '') {
        message.channel.send('Please provide a message to stick.');
        return;
      }

      if (stickedMessages.has(message.channel.id)) {
        const { stickedMessage } = stickedMessages.get(message.channel.id);
        if (stickedMessage) {
          try {
            await stickedMessage.delete();
          } catch (error) {
            if (error.code !== 10008) {
              console.error('Failed to delete the sticked message:', error);
            }
          }
        }
      }

      const newStickedMessage = await message.channel.send(stickedMessageContent);
      stickedMessages.set(message.channel.id, {
        stickedMessage: newStickedMessage,
        stickedMessageContent,
      });
    } else if (command === 'stopstick') {
      if (stickedMessages.has(message.channel.id)) {
        const { stickedMessage } = stickedMessages.get(message.channel.id);
        if (stickedMessage) {
          try {
            await stickedMessage.delete();
          } catch (error) {
            if (error.code !== 10008) {
              console.error('Failed to delete the sticked message:', error);
            }
          }
        }
        stickedMessages.delete(message.channel.id);
        message.channel.send('Stopped sticking the message.');
      }
    }
  } else {
    if (stickedMessages.has(message.channel.id)) {
      const { stickedMessage, stickedMessageContent } = stickedMessages.get(message.channel.id);

      // Check if sticked message still exists
      try {
        await client.channels.cache.get(stickedMessage.channel.id).messages.fetch(stickedMessage.id);
      } catch (error) {
        if (error.code === 10008) {
          // Message no longer exists, remove from map
          stickedMessages.delete(message.channel.id);
          return;
        }
      }

      if (stickedMessage) {
        try {
          await stickedMessage.delete();
        } catch (error) {
          if (error.code !== 10008) {
            console.error('Failed to delete the sticked message:', error);
          }
        }

        // Ensure the sticked message is at the bottom
        const newStickedMessage = await message.channel.send(stickedMessageContent);
        stickedMessages.set(message.channel.id, {
          stickedMessage: newStickedMessage,
          stickedMessageContent,
        });
      }
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
