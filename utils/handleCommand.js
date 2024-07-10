const { Client, Message, EmbedBuilder } = require("discord.js");

// Variables for reading files
const fs = require("fs");
const path = require("path");

/**
 * @param {Client} client
 * @param {Message} message
*/

function readDirectory(dirPath) {
  const files = fs.readdirSync(dirPath);
  const array = [];

  files.map((file) => {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      const folderCommands = readDirectory(filePath);

      const config = require(`${filePath}/folderConfig.json`)
      
      if(config.ignore && config.ignore == "true") {
        return
      }

      const commands = folderCommands.map((entry) => {
        array.push(entry);
      });
    } else if (path.extname(file) === ".js") {
      try {
        const moduleExports = require(filePath);
        let directory = dirPath.split("/");
        moduleExports.source = directory[directory.length - 1];
        array.push(moduleExports);
      } catch (err) {
        console.error(`Error reading ${filePath}: ${err}`);
      }
    }
  });
  console.log({ array });
  return array;
}

module.exports = {
  async handleCommand(client, message) {
    const prefix = "!";

    if (!message.content.startsWith(prefix)) {
      return;
    }

    let directorypath = path.join(__dirname, "../commands");
    let CommandsArray = readDirectory(directorypath);

    if (message.author.bot || !message.guild) {
      return;
    }

    let [command, ...args] = message.content
      .slice(prefix.length)
      .trim()
      .split(/ +/);

    console.log(CommandsArray);
    const commandObject = CommandsArray.find((commandObj) => {
      console.log(commandObj.name)
      if (commandObj) {
        const obj = commandObj.name.toLowerCase()
        const cmd = command.toLowerCase()
        return obj === cmd;
      }
    });

    if (commandObject) {
      try {
        console.log(message);
        await commandObject.execute(client, message, args);
      } catch (error) {
        console.error(error);
        message.reply("There was an error executing the command.");
      }
    }
  },
  getCommands() {
    return readDirectory(path.join(__dirname, '../commands'))
  }
};
