const {
  Client,
  AuditLogEvent,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  WebSocketManager,
  GatewayIntentBits,
  EmbedBuilder,
  SlashCommandBuilder,
  Events,
  Collection,
  Partials,
  Embed,
  Role,
  User,
  ActivityType,
  Routes,
  ApplicationCommandType
} = require("discord.js");
require("dotenv/config");
const fs = require('node:fs');
const path = require('node:path');

const countingChannels = new Map()

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildMessageTyping,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Channel],
});

client.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

const usersPlaying = new Map();

const commands = {
  commands: {
    name: "commands",
    execute: printCommands,
  },
  join: {
    name: "join",
    execute: join
  },
  coinflip: {
    name: "coinflip",
    execute: coinflip
  },
  action: {
    name: "action",
    execute: doSomething
  }, 
  balance: {
    name: "balance",
    execute: getBalance
  }
};

const { handleCommand } = require("./utils/handleCommand.js");

const token = process.env["token_dev"];

function printCommands(message) {
  let cmds = ""
  console.log(Object.keys(commands))
  Object.keys(commands).forEach((entry) => {
    const object = commands[entry]
    cmds = cmds + `${object.name}\n`
  })
  message.reply(`Available commands:\n` + cmds)
}

function join(message) {
  usersPlaying.set(message.author.id, { isPlaying: true, money: 100 })
  message.reply('You are now registered and able to gamble.')
}

function coinflip(message, args) {
  const user = usersPlaying.get(message.author.id)
  if(!user) {
    message.reply('You are not registered. Run !join to do so.')
    return
  }
  let bigOrSmall

  if(args[0] == "big") {
    bigOrSmall = 2000
  } else if(args[0] == "small") {
    bigOrSmall = 500
  } else {
    message.reply('You need to say big or small, buddy')
    return
  }

  const randomValue = Math.floor(Math.random() * 2) + 1
  console.log(randomValue)
  const randomMoneyValue = Math.floor(Math.random() * bigOrSmall) + 1
  if(randomValue == 1) {
    message.reply('You won! You got: ' + randomMoneyValue)
    user.money = user.money + randomMoneyValue
    return
  } else {
    message.reply('You lost, bozo. You lost: ' + randomMoneyValue)
    user.money = user.money - randomMoneyValue
    return
  }
}

function coinflipUSER(message, args) {
  console.log(message.user)
  let user = usersPlaying.get(message.user.id)
  if(!user) {
    const newUser =  usersPlaying.set(message.user.id, { isPlaying: true, money: 1000 })
    user = newUser
  }
  let bigOrSmall

  if(args == "big") {
    bigOrSmall = 2000
  } else if(args == "small") {
    bigOrSmall = 500
  } else {
    message.reply('You need to say big or small, buddy')
    return
  }

  const randomValue = Math.floor(Math.random() * 2) + 1
  console.log(randomValue)
  const randomMoneyValue = Math.floor(Math.random() * bigOrSmall) + 1
  if(randomValue == 1) {
    message.reply('You won! You got: ' + randomMoneyValue)
    let newval = user.money + randomMoneyValue
    if(typeof user.money == "bigint") {
      const bigint = BigInt(newval)
      newval = bigint
    }
    user.money = user.money + newval
    return
  } else {
    let moneyval = randomMoneyValue
    if(typeof user.money == "bigint") {
      const biginte = BigInt(moneyval)
      moneyval = biginte
    }
    message.reply('You lost, bozo. You lost: ' + randomMoneyValue)
    console.log(typeof user.money)
    console.log(typeof moneyval)
    console.log('original money value: ' + user.money)
    user.money = user.money - moneyval
    console.log('new money value: ' + user.money)
    return
  }
}

function doSomething(message, args) {
  const user = usersPlaying.get(message.author.id)
  if(!user) {
    message.reply('You are not registered. Run !join to do so.')
    return
  }
  let bigOrSmall

  if(args[0] == "big") {
    bigOrSmall = 2000
  } else if(args[0] == "small") {
    bigOrSmall = 500
  } else {
    message.reply('You need to say big or small, buddy. (!action [big/small] [action])')
    return
  }

  const randomValue = Math.floor(Math.random())
  const randomMoneyValue = Math.floor(Math.random() * bigOrSmall) + 1
  const diceRoll = Math.floor(Math.random() * 20) + 1
  if(randomValue == 1) {
    // message.reply('You won! You got: ' + randomMoneyValue)
    const dice = diceRoll - 10
    const goodMoney = randomMoneyValue * dice

    const badMoney = randomMoneyValue / dice
    if(diceRoll > 10) {
      message.reply('You succeeded at what you were trying to do, and got ' + goodMoney)
      user.money = user.money + goodMoney
      return
    }
    if(diceRoll < 10) {
      message.reply('You succeeded, but didnt do very well, and got ' + badMoney)
      user.money = user.money + goodMoney
      return
    }

  } else {
    const dice = diceRoll - 10
    const moneyLost = randomMoneyValue * dice

    message.reply('You completely failed, and lost ' + moneyLost)
    user.money = user.money - moneyLost
    return
  }
}

function getBalance(message) {
  const user = usersPlaying.get(message.author.id)
  if(!user) {
    message.reply('You are not registered. Run !join to do so.')
    return
  }
  message.reply('You have: ' + user.money)
}

client.once(Events.ClientReady, async (client) => {
  console.log(`Logged in as ${client.user.username}!`);
});

client.once('ready', ready => {
  console.log('adding sigma command...')
  ready.rest.post(Routes.applicationCommands(ready.user.id), {
      body: {
          name: "gamble",
          description: "gamble your life savings",
          options: [
            {
              type: 3,
              name: 'size',
              description: 'Size of gamble',
              choices: [{
                name: 'big',
                value: 'big',
                description: 'b i g'
              },
              {
                name: 'small',
                value: 'small',
                description: 'smol gambling'
              }
              ],
              required: true,
            },
          ],
          type: ApplicationCommandType.ChatInput,
          integration_types: [0, 1],
          contexts: [0, 1, 2]
      }
  });
  ready.rest.post(Routes.applicationCommands(ready.user.id), {
    body: {
        name: "balance",
        description: "get your balance after gambling",
        type: ApplicationCommandType.ChatInput,
        integration_types: [0, 1],
        contexts: [0, 1, 2]
    }
});
});

client.on(Events.MessageCreate, (message) => {
  if(message.author.bot) {
    return
  }
  const containsNumber = /\d/.test(message.content);
  const isChannelFound = countingChannels.get(message.channel.id)
  if(containsNumber && message.channel.name == 'counting') {
    console.log('passed!')
    if(message.content.includes('1') && !isChannelFound) {
      countingChannels.set(message.channel.id, { currentNumber: 1 })
      message.reply('Beginning counting!')
    } else {
      if(!isChannelFound) { return }
      if(message.content.includes(isChannelFound.currentNumber + 1)) {
        message.react('✅')
        isChannelFound.currentNumber = isChannelFound.currentNumber + 1
      } else {
        console.log(message)
        message.delete()
      }
    }
  }
  if (message.channel.name == "gambling") {
    if (message.content.includes("!")) {
      const prefix = "!"
      let [command, ...args] = message.content
        .slice(prefix.length)
        .trim()
        .split(/ +/);

      try{
        if(!commands[command]) {
          message.reply('doesnt look like that command exists!')
          return
        }
        commands[command].execute(message, args)
      } catch(e) {
        console.log(e)
        message.reply('something bad happened')
        return
      }
    }
  }
});

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;
	const command = interaction.client.commands.get(interaction.commandName);
  console.log(interaction.client.commands)

	if (!command) {
    if(interaction.commandName == 'gamble') {
      coinflipUSER(interaction, interaction.options.getString('size'))
      console.log(interaction.options.getString('size'))
    }
    if(interaction.commandName == "beep") {
      interaction.reply('holy based')
    }
    if(interaction.commandName == 'balance') {
      let user = usersPlaying.get(interaction.user.id)
      if(!user) {
        const newuser = usersPlaying.set(interaction.user.id, { isPlaying: true, money: 100 })
        user = newuser
      }
      if(user.money < 1) {
        interaction.reply('lmao! brokie! u have: ' + user.money)
      } else if(user.money > 100) {
        interaction.reply('bro, ur rich!!! u have: ' + user.money)
      } else {
        interaction.reply('you have: ' + user.money)
      }
      
    }
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});

/*client.on(Events.MessageCreate, async (message) => {
  handleCommand(message.client, message);
});*/

// COUNTING
/*if(message.content.includes('<@')) { return }
  const containsNumber = /\d/.test(message.content);
  const isChannelFound = countingChannels.get(message.channel.id)
  if(containsNumber && message.channel.name == 'counting') {
    console.log('passed!')
    if(message.content.includes('1') && !isChannelFound) {
      countingChannels.set(message.channel.id, { currentNumber: 1 })
      message.reply('Beginning counting!')
    } else {
      if(!isChannelFound) { return }
      if(message.content.includes(isChannelFound.currentNumber + 1)) {
        message.react('✅')
        isChannelFound.currentNumber = isChannelFound.currentNumber + 1
      } else {
        console.log(message)
        message.delete()
      }
    }
  } */

client.login(token);
