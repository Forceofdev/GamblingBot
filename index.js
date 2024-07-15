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
  ApplicationCommandType,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
require("dotenv/config");
const fs = require("node:fs");
const path = require("node:path");
const { writeUserData, getUserData } = require("./userData.js");

const userData = getUserData();
console.log({ userData });

const countingChannels = new Map();

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
const foldersPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js"));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ("data" in command && "execute" in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.log(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
      );
    }
  }
}

const usersPlaying = new Map(userData);

const commands = {
  commands: {
    name: "commands",
    execute: printCommands,
  },
  join: {
    name: "join",
    execute: join,
  },
  coinflip: {
    name: "coinflip",
    execute: coinflip,
  },
  action: {
    name: "action",
    execute: doSomething,
  },
  balance: {
    name: "balance",
    execute: getBalance,
  },
};

const developer = {
  activeDeveloperToggles: [],
};

const { handleCommand } = require("./utils/handleCommand.js");

const token = process.env["token_dev"];

function printCommands(message) {
  let cmds = "";
  Object.keys(commands).forEach((entry) => {
    const object = commands[entry];
    cmds = cmds + `${object.name}\n`;
  });
  message.reply(`Available commands:\n` + cmds);
}

function join(message) {
  usersPlaying.set(message.author.id, { isPlaying: true, money: 100 });
  message.reply("You are now registered and able to gamble.");
}

function coinflip(message, args) {
  const user = usersPlaying.get(message.author.id);
  if (!user) {
    message.reply("You are not registered. Run !join to do so.");
    return;
  }
  let max;
  let min;

  if (args[0] == "big") {
    max = 2000;
    min = 1000;
  } else if (args[0] == "small") {
    max = 500;
  } else {
    message.reply("You need to say big or small, buddy");
    return;
  }

  const randomValue = Math.floor(Math.random() * 2) + 1;
  console.log(randomValue);
  const randomMoneyValue = Math.floor(Math.random() * (max - min + 1)) + min;
  if (randomValue == 1) {
    message.reply("You won! You got: " + randomMoneyValue);
    user.money = user.money + randomMoneyValue;
    return;
  } else {
    message.reply("You lost, bozo. You lost: " + randomMoneyValue);
    user.money = user.money - randomMoneyValue;
    return;
  }
}

function coinflipUSER(message, args) {
  let user = usersPlaying.get(message.user.id);
  message.deferReply({ ephemeral: true })
  if (!user) {
    const newUser = usersPlaying.set(message.user.id, {
      username: message.user.username,
      isPlaying: true,
      money: 1000,
      resets: 0,
    });
    console.log({ newUser });
    user = usersPlaying.get(message.user.id);
  }
  let bigOrSmall;
  let allIn;
  let min = 0;
  let max;

  if (args == "big") {
    max = 2000;
    min = 1000;
  } else if (args == "small") {
    if (user.developer) {
      const btn = new ButtonBuilder()
        .setCustomId("toggleDeveloper")
        .setLabel("Open DevMenu")
        .setStyle(ButtonStyle.Primary);
      const btn2 = new ButtonBuilder()
        .setCustomId("initDev")
        .setLabel("initDev")
        .setStyle(ButtonStyle.Primary);

      const actionrow = new ActionRowBuilder().addComponents(btn, btn2);

      message.editReply({
        content: "Wow! you found a secret thing!",
        components: [actionrow],
      });
      return;
    }
    max = 500;
  } else if (args == "allin") {
    if (user.money < 0) {
      message.editReply("you cant go all in with negative numbers bucko");
      return;
    }
    allIn = true;
  } else {
    message.editReply("You need to say big or small, buddy");
    return;
  }

  let randomValue = Math.floor(Math.random() * 2) + 1;
  console.log(randomValue);
  let randomMoneyValue = Math.floor(Math.random() * (max - min + 1)) + min;
  if (user.developer && user.developerOverrides) {
    if (user.developerOverrides.alwaysWin) {
      randomValue = 1;
    }
    if (user.developerOverrides.alwaysLose) {
      randomValue = 2;
    }
    if (user.developerOverrides.moneyOverride) {
      randomMoneyValue = user.developerOverrides.moneyOverride;
    }
  }

  if (allIn) {
    randomMoneyValue = user.money;
  }
  if (randomValue == 1) {
    let newval = randomMoneyValue;
    if (typeof user.money == "bigint") {
      const bigint = BigInt(newval);
      newval = bigint;
    }
    const moneys = user.money + newval;
    user.money = moneys;
    if (allIn) {
      message.editReply("you won and DOUBLED your money! congrats!");
      return;
    }
    message.editReply("You won! You got: " + randomMoneyValue);
    return;
  } else {
    let moneyval = randomMoneyValue;
    if (typeof user.money == "bigint") {
      const biginte = BigInt(moneyval);
      moneyval = biginte;
    }
    console.log(typeof user.money);
    console.log(typeof moneyval);
    console.log("original money value: " + user.money);
    user.money = user.money - moneyval;
    if (allIn) {
      message.editReply("you lost EVERYTHING!! L");
      return;
    }

    message.editReply("You lost, bozo. You lost: " + randomMoneyValue);

    console.log("new money value: " + user.money);
    return;
  }
}

function doSomething(message, args) {
  const user = usersPlaying.get(message.author.id);
  if (!user) {
    message.reply("You are not registered. Run !join to do so.");
    return;
  }
  let bigOrSmall;

  if (args[0] == "big") {
    bigOrSmall = 2000;
  } else if (args[0] == "small") {
    bigOrSmall = 500;
  } else {
    message.reply(
      "You need to say big or small, buddy. (!action [big/small] [action])"
    );
    return;
  }

  const randomValue = Math.floor(Math.random());
  const randomMoneyValue = Math.floor(Math.random() * bigOrSmall) + 1;
  const diceRoll = Math.floor(Math.random() * 20) + 1;
  if (randomValue == 1) {
    // message.reply('You won! You got: ' + randomMoneyValue)
    const dice = diceRoll - 10;
    const goodMoney = randomMoneyValue * dice;

    const badMoney = randomMoneyValue / dice;
    if (diceRoll > 10) {
      message.reply(
        "You succeeded at what you were trying to do, and got " + goodMoney
      );
      user.money = user.money + goodMoney;
      return;
    }
    if (diceRoll < 10) {
      message.reply(
        "You succeeded, but didnt do very well, and got " + badMoney
      );
      user.money = user.money + goodMoney;
      return;
    }
  } else {
    const dice = diceRoll - 10;
    const moneyLost = randomMoneyValue * dice;

    message.reply("You completely failed, and lost " + moneyLost);
    user.money = user.money - moneyLost;
    return;
  }
}

function getBalance(message) {
  const user = usersPlaying.get(message.author.id);
  if (!user) {
    message.reply("You are not registered. Run !join to do so.");
    return;
  }
  message.reply("You have: " + user.money);
}

client.once(Events.ClientReady, async (client) => {
  console.log(`Logged in as ${client.user.username}!`);
});

client.once("ready", async (ready) => {
  console.log("adding sigma command...");
  ready.rest.post(Routes.applicationCommands(ready.user.id), {
    body: {
      name: "gamble",
      description: "gamble your life savings",
      options: [
        {
          type: 3,
          name: "size",
          description: "Size of gamble",
          choices: [
            {
              name: "big",
              value: "big",
              description: "b i g",
            },
            {
              name: "small",
              value: "small",
              description: "smol gambling",
            },
            {
              name: "all-in",
              value: "allin",
              description: "gamble EVERYTHING!!",
            },
          ],
          required: true,
        },
      ],
      type: ApplicationCommandType.ChatInput,
      integration_types: [0, 1],
      contexts: [0, 1, 2],
    },
  });
  ready.rest.post(Routes.applicationCommands(ready.user.id), {
    body: {
      name: "balance",
      description: "get your balance after gambling",
      type: ApplicationCommandType.ChatInput,
      integration_types: [0, 1],
      contexts: [0, 1, 2],
    },
  });
  ready.rest.post(Routes.applicationCommands(ready.user.id), {
    body: {
      name: "riddle",
      description: "get an unfunny riddle provided by hetris",
      type: ApplicationCommandType.ChatInput,
      integration_types: [0, 1],
      contexts: [0, 1, 2],
    },
  });
  ready.rest.post(Routes.applicationCommands(ready.user.id), {
    body: {
      name: "bankruptcy",
      description: "declare yourself bankrupt",
      type: ApplicationCommandType.ChatInput,
      integration_types: [0, 1],
      contexts: [0, 1, 2],
    },
  });
  ready.rest.post(Routes.applicationCommands(ready.user.id), {
    body: {
      name: "leaderboard",
      description: "see whos actually good at gambling",
      type: ApplicationCommandType.ChatInput,
      integration_types: [0, 1],
      contexts: [0, 1, 2],
    },
  });
});

const SSUrequests = {
  activeRequests: [],
};

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) {
    return;
  }
  /*if(message.content.toLowerCase().includes('ssu')) {
    const usr = SSUrequests.activeRequests.find((entry) => {
        if(entry.userid == message.author.id) {
            console.log('found user')
            if((entry.time - Date.now()) < 1000) {
                console.log('nope')
                return true
            } else {
                return false
            }
        }
    })
    console.log({usr})
    if((usr && Date.now() - usr.time) < 5000) {
        console.log(usr.time - Date.now())
        return
    }
    message.reply('SSD')
    SSUrequests.activeRequests.push({ userid: message.author.id, time: Date.now() })
    return
  }*/

  try {
    const refmessage = message.channel.messages.cache.get(
      message.reference.messageId
    );
    if (!refmessage) {
      return;
    }
    developer.activeDeveloperToggles.forEach((entry) => {
      if (entry.message == refmessage) {
        const user = usersPlaying.get(message.author.id);
        if (user.developer) {
          if (message.content.includes("set_money")) {
            const splitmessage = message.content.split("|");
            const command = splitmessage[1].split(",");
            const userToChange = usersPlaying.get(command[0]);
            const money = Number(command[1]);
            userToChange.money = money;
            message.reply("Successful!");
          }
          if (message.content.includes("save")) {
            writeUserData(usersPlaying);
            message.reply("Successful!");
          }
          if (message.content.includes("change_user_values")) {
            console.log("change user values!");
            const splitmessage = message.content.split("|");
            console.log(splitmessage);
            const command = splitmessage[1].split(", ");
            console.log(command);
            const userToChange = command[0];
            const parsed = JSON.parse(command[1]);
            console.log({ parsed });
            usersPlaying.set(userToChange, parsed);
            message.reply("Successful!");
          }
          if (message.content.includes("add_custom_badge")) {
            const splitmessage = message.content.split("|");
            console.log(splitmessage);
            const command = splitmessage[1].split(", ");
            console.log(command);
            const userToChange = command[0];
            const usr = usersPlaying.get(userToChange);
            usr.customTag = command[1];
            message.reply("Successful!");
          }
          if (message.content.includes("Exit")) {
            entry = undefined;
          }
        }
      }
    });
  } catch (e) {}
  const containsNumber = /\d/.test(message.content);
  const isChannelFound = countingChannels.get(message.channel.id);
  if (containsNumber && message.channel.name == "counting") {
    console.log("passed!");
    if (message.content.includes("1") && !isChannelFound) {
      countingChannels.set(message.channel.id, { currentNumber: 1 });
      message.reply("Beginning counting!");
    } else {
      if (!isChannelFound) {
        return;
      }
      if (message.content.includes(isChannelFound.currentNumber + 1)) {
        message.react("✅");
        isChannelFound.currentNumber = isChannelFound.currentNumber + 1;
      } else {
        console.log(message);
        message.delete();
      }
    }
  }
  if (message.channel.name == "gambling") {
    if (message.content.includes("!")) {
      const prefix = "!";
      let [command, ...args] = message.content
        .slice(prefix.length)
        .trim()
        .split(/ +/);

      try {
        if (!commands[command]) {
          message.reply("doesnt look like that command exists!");
          return;
        }
        commands[command].execute(message, args);
      } catch (e) {
        console.log(e);
        message.reply("something bad happened");
        return;
      }
    }
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isButton()) {
    if (interaction.customId == "noResetMoney") {
      interaction.reply("k! ur not a loser! congrats!");
    }
    if (interaction.customId == "yesResetMoney") {
      console.log("resetting!");
      let user = usersPlaying.get(interaction.user.id);
      interaction.reply("resetting ur money, loser");
      user.money = 0;
      user.resets = user.resets + 1;
    }
    if (interaction.customId == "toggleDeveloper") {
      console.log("enabling developer mode");
      let user = usersPlaying.get(interaction.user.id);
      try {
        if (!user.developer) {
          return;
        }
      } catch (e) {}

      const emb = new EmbedBuilder()
        .setTitle("Gambling: DEVELOPER")
        .setDescription(
          "Reply to this message with the respective command you wish to execute:\n**set_money**: Set your money to the value you wish\n**change_user_values**: Change the map values for a user [MUST BE IN JSON FORMAT]\n**add_custom_badge**: [UNFINISHED] Give a user a custom badge\n**save**: Save all user data to userinfo.txt"
        );

      developer.activeDeveloperToggles.push({
        user: interaction.user,
        message: interaction.message,
      });

      interaction.reply({ embeds: [emb] });

      const devtggles = developer.activeDeveloperToggles[0].message;

      console.log({ devtggles });
    }
    if (interaction.customId == "initDev") {
      console.log("enabling developer mode");
      let user = usersPlaying.get(interaction.user.id);
      if (!user.developer) {
        return;
      }

      developer.activeDeveloperToggles.push({
        user: interaction.user,
        message: interaction.message,
      });
    }
  }
  if (!interaction.isChatInputCommand()) return;
  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    if (interaction.commandName == "gamble") {
      try {
        coinflipUSER(interaction, interaction.options.getString("size"));
      } catch (e) {}
      console.log(interaction.options.getString("size"));
    }

    if (interaction.commandName == "leaderboard") {
      const emb = new EmbedBuilder().setTitle("Gambling Leaderboard");
      console.log(usersPlaying);
      interaction.deferReply({ ephemeral: true })

      const gamblers = Array.from(usersPlaying.entries());
      gamblers.sort((a, b) => b[1].money - a[1].money);
      let i = 0;
      console.log(gamblers);
      let stringifiedGamblers = [];

      gamblers.forEach((gambler) => {
        console.log("running!");
        if (i == 10) return;
        console.log({ gambler });
        i++;
        if (gambler[1].customTag) {
          stringifiedGamblers.push(
            `${i}. **${gambler[1].username} [${gambler[1].customTag}]** : ${gambler[1].money}`
          );
          return;
        }
        if (gambler[1].meganerd) {
          stringifiedGamblers.push(
            `${i}. **${gambler[1].username} [MEGA LOSER]** : ${gambler[1].money}`
          );
          return;
        }
        if (gambler[1].resets > 0) {
          stringifiedGamblers.push(
            `${i}. **${gambler[1].username} [LOSER]** : ${gambler[1].money}`
          );
          return;
        }
        if (gambler[1].developer) {
          stringifiedGamblers.push(
            `${i}. **${gambler[1].username} [DEV]** : ${gambler[1].money}`
          );
          return;
        }
        stringifiedGamblers.push(
          `${i}. **${gambler[1].username}** : ${gambler[1].money}`
        );
      });

      console.log(stringifiedGamblers.join("\n"));
      emb.setDescription(stringifiedGamblers.join("\n"));
      interaction.editReply({ embeds: [emb] });
    }
    if (interaction.commandName == "beep") {
      interaction.reply("holy based");
    }

    if (interaction.commandName == "riddle") {
      fetch("https://riddles-api.vercel.app/random")
        .then((response) => response.json())
        .then((json) => getRiddle(json.riddle, json.answer));

      function getRiddle(riddle, answer) {
        interaction.deferReply({ ephemeral: true })
        interaction.editReply(riddle + "\n\n||" + answer + "||");
      }
    }
    if (interaction.commandName == "balance") {
      let user = usersPlaying.get(interaction.user.id);
      if (!user) {
        usersPlaying.set(interaction.user.id, {
          username: interaction.user.username,
          isPlaying: true,
          money: 1000,
          resets: 0,
        });
        user = usersPlaying.get(interaction.user.id);
      }
      if (user.money < 1) {
        if (user.resets > 0) {
          interaction.reply(
            "lmao! ur in debt, even after going bankrupt! you have: " +
              user.money
          );
          return;
        }
        interaction.reply("lmao! brokie! u have: " + user.money);
      } else if (user.money > 100) {
        if (user.resets > 0) {
          interaction.reply(
            "congrats, ur rich, loser. you have: " + user.money
          );
          return;
        }
        interaction.reply("bro, ur rich!!! u have: " + user.money);
      } else {
        if (user.resets > 0) {
          interaction.reply("you have: " + user.money + ", loser.");
          return;
        }
        interaction.reply("you have: " + user.money);
      }
    }
    if (interaction.commandName == "bankruptcy") {
      console.log("running bankruptcy!");
      let user = usersPlaying.get(interaction.user.id);
      if (!user) {
        usersPlaying.set(interaction.user.id, {
          username: interaction.user.username,
          isPlaying: true,
          money: 1000,
        });
        user = usersPlaying.get(interaction.user.id);
      }
      const yesButton = new ButtonBuilder()
        .setCustomId("yesResetMoney")
        .setStyle(ButtonStyle.Danger)
        .setLabel("Yes!");
      const noButton = new ButtonBuilder()
        .setCustomId("noResetMoney")
        .setStyle(ButtonStyle.Secondary)
        .setLabel("Nah.");
      const actionRow = new ActionRowBuilder().addComponents(
        yesButton,
        noButton
      );

      if (user.money < -50000) {
        interaction.reply({
          content:
            "are you sure? this resets your debt, but gives you the loser tag",
          components: [actionRow],
        });
      } else {
        interaction.reply("ur not poor enough");
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
      await interaction.followUp({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
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
