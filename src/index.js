#!/usr/bin/env node

const logo = `______ _____ ___________ _____ _____ _________________
| ___ \\  ___|_   _| ___ \\  _  /  __ \\  _  | ___ \\  _  \\
| |_/ / |__   | | | |_/ / | | | /  \\/ | | | |_/ / | | |
|    /|  __|  | | |    /| | | | |   | | | |    /| | | |
| |\\ \\| |___  | | | | \\ \\ \\_/ / \\__/\\ \\_/ / |\\ \\| |/ /
\\_| \\_\\____/  \\_/ \\_| \\_|\\___/ \\____/\\___/\\_| \\_|___/
                   The best in life
`;

const Discord = require('discord.js');
const vorpal = require('vorpal')();
const spinner = require('ora')('Loading...').start();
const center = require('./util/center');
const hexToRgb = require('./util/hexToRgb');
const chalk = vorpal.chalk;
const colors = require('ansi-256-colors');
const emoji = require('node-emoji');

const timestamp = vorpal.timestamp = (d = new Date(), mdy = false) =>
  `${mdy ? `${d.getFullYear().toString().padStart(2, '0')}-${d.getMonth().toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')} ` : ''}
${d.getHours().toString().padStart(2, '0')}:
${d.getMinutes().toString().padStart(2, '0')}:
${d.getSeconds().toString().padStart(2, '0')}
`.replace(/\n/g, '');

const logMessage = vorpal.logMessage = (message) => {
  let name = message.author.username;
  let color = (...x) => colors.fg.getRgb(5, 5, 5) + x.join(' ') + colors.reset;
  let content = message.content;

  for (const mention of message.mentions.users.values()) {
    if (mention.id === client.user.id) {
      content = content.replace(new RegExp(`<@!?${mention.id}>`, 'g'), chalk.red.bold(`@${client.user.username}`));
      process.stdout.write('\x07');
    } else {
      content = content.replace(new RegExp(`<@!?${mention.id}>`, 'g'), `@${mention.username}`);
    }
  }

  if (message.member) {
    color = (...x) => {
      const role = message.member.roles.filter(r => r.color !== 0).last();
      if (!role) return colors.fg.getRgb(5, 5, 5) + x.join(' ') + colors.reset;
      const c = hexToRgb(role.hexColor);
      return colors.fg.getRgb(c.r, c.g, c.b) + x.join(' ') + colors.reset;
    };
  }

  for (const match of content.match(/:[^:]+:/g) || []) content = content.replace(match, emoji.get(match));

  if (message.type !== 'DEFAULT') {
    switch (message.type) {
      case 'RECIPIENT_ADD':
        break;
      case 'RECIPIENT_REMOVE':
        break;
      case 'CALL':
        break;
      case 'CHANNEL_NAME_CHANGE':
        break;
      case 'CHANNEL_ICON_CHANGE':
        break;
      case 'PINS_ADD':
        vorpal.log(`${chalk.yellow(timestamp(message.createdAt))} ${color(name, message.author.discriminator)} ${chalk.bold('pinned a message!')}`);
        break;
      default:
        break;
    }
  } else {
    vorpal.log(`${chalk.yellow(timestamp(message.createdAt))} ${color(`${name}#${message.author.discriminator}`)} ${content}`);
  }
};

const client = vorpal.discord = new Discord.Client();

vorpal.current = {};

vorpal.find('help').remove();
vorpal.find('exit').remove();

for (const command of [
  'help',
  'join',
  'nick',
  'search',
]) require(`./commands/${command}`)(vorpal);

vorpal.command('/exit', 'exit').action(() => {
  vorpal.log('bye!');
  process.exit(0);
});

vorpal.command('/login <token>')
  .action((args, cb) => {
    vorpal.localStorage.setItem('token', args.token);
    vorpal.log(chalk.bold('Token saved, use /logout to log out, or /exit to exit'));
    client.login(args.token).then(() => cb()).catch(() => {
      vorpal.localStorage.removeItem('token');
      vorpal.log(chalk.bold('INVALID TOKEN!'));
      client.destroy();
      process.exit();
    });
  });

vorpal.command('/logout')
  .action((args, cb) => {
    vorpal.localStorage.removeItem('token');
    client.destroy();
    process.exit();
    return cb();
  });

vorpal.command('/shrug [words...]')
  .action((args, cb) => {
    if (vorpal.current.channel) {
      client.channels.get(vorpal.current.channel).sendMessage(
        `${args.words ? args.words.map(w => w.toString()).join(' ') : ''} ¯\\_(ツ)_/¯`
      );
      return cb();
    } else {
      return cb();
    }
  });

vorpal.catch('[words...]', 'send a message')
  .autocomplete([
    ...vorpal.current.guild ? client.guilds.get(vorpal.current.guild).emojis.map(x => `:${x.name}:`) : [],
    ...Object.keys(emoji.emoji).map(x => `:${x}:`),
  ])
  .action((args, cb) => {
    if (vorpal.current.channel) {
      args.words = args.words.map(w => w.toString());
      for (let word in args.words) {
        if (args.words[word].startsWith('@')) {
          let user = client.users.find(x => x.username.toLowerCase() === args.words[word].replace('@', '').toLowerCase());
          if (user) args.words[word] = user.toString();
        }
      }

      let words = args.words.join(' ');
      for (const match of words.match(/:[^:]+:/g) || []) {
        let found;
        if (vorpal.current.guild) {
          found = client.guilds.get(vorpal.current.guild).emojis.find(x => x.name.toLowerCase() === match.replace(/:/g, '').toLowerCase());
        }
        words = words.replace(match, found ? found.toString() : null || emoji.get(match));
      }

      client.channels.get(vorpal.current.channel).sendMessage(words);
    } else {
      vorpal.log(chalk.bold('Error: you must join a channel before you can send messages!'));
    }
    cb();
  });

client.on('message', message => {
  if (message.channel.id !== vorpal.current.channel) return;
  logMessage(message);
});

client.once('ready', () => {
  spinner.stop();
  if (client.user.bot) {
    vorpal.log(chalk.yellow.bold('NO BOTS'));
    vorpal.localStorage.removeItem('token');
    client.destroy();
    process.exit();
  }
  console.log(center(logo));
  console.log(center(`Connected as ${client.user.username}#${client.user.discriminator}`));
  vorpal.delimiter('>').show();
});

vorpal.localStorage('retrocord');
let token = vorpal.localStorage.getItem('token');
if (!token) {
  spinner.stop();
  vorpal.delimiter('>').show();
  vorpal.log(chalk.bold('You are not logged in, please use the login command!'));
} else {
  client.login(token).catch(() => {
    vorpal.localStorage.removeItem('token');
    vorpal.log(chalk.bold('INVALID TOKEN!'));
    client.destroy();
    process.exit();
  });
}
