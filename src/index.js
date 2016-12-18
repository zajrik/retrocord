#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const Discord = require('discord.js');
const vorpal = require('vorpal')();
const spinner = require('ora')('Loading...').start();
const center = require('./util/center');
const hexToRgb = require('./util/hexToRgb');
const chalk = vorpal.chalk;
const colors = require('ansi-256-colors');
const superagent = require('superagent');

const timestamp = (d = new Date(), mdy = false) => {
  return `${mdy ? `${d.getFullYear().toString().padStart(2, '0')}-${d.getMonth().toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')} ` : ''}
${d.getHours().toString().padStart(2, '0')}:
${d.getMinutes().toString().padStart(2, '0')}:
${d.getSeconds().toString().padStart(2, '0')}
`.replace(/\n/g, '');
}

const logMessage = (message) => {
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
    }
  }

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
}

const client = new Discord.Client();

let current = {};

vorpal.find('help').remove();
vorpal.find('exit').remove();

vorpal.command('/exit', 'exit').action(() => {
  vorpal.log('bye!');
  process.exit(0);
});

vorpal.command('/help')
  .action(function (args, cb) {
    const commands = vorpal.commands.filter(c => c._name !== '').map(c =>
      `${c._name} ${c._args.map(a => `${a.required ? '<' : '['}${a.name}${a.required ? '>' : ']'}`).join(' ')}`
    ).join('\n');
    vorpal.log(`Commands:\n${commands}`);
    cb();
  });

vorpal.command('/join <guild#channel...>', 'join a channel')
  .action(function (args, cb) {
    args = args['guild#channel'].join(' ');
    let [ guild, channel ] = [ args.split('#')[0].trim(), args.split('#')[1].trim() ];
    if (guild !== 'dm') {
      guild = client.guilds.find(g => g.name.toLowerCase() === guild.toLowerCase());
      if (!guild) {
        this.log(chalk.bold('Error: not a valid guild'))
        return cb();
      }
      channel = guild.channels.filter(c => c.type !== 'voice').find(c => c.name.toLowerCase() === channel.toLowerCase());
      if (!channel) {
        this.log(chalk.bold('Error: not a valid channel'));
        return cb();
      }
      this.log(chalk.bold(`Joining ${channel.name} in ${guild.name}`));
      current = { channel: channel.id, guild: guild.id };
    } else {
      channel = client.channels.filter(c => c.type === 'dm').find(c => c.recipient.username.toLowerCase() === channel.toLowerCase());
      if (!channel) {
        this.log(chalk.bold('Error: not a valid channel'));
        return cb();
      }
      this.log(chalk.bold(`Joining DM with ${channel.recipient.username}`));
      current = { channel: channel.id };
    }
    channel.fetchMessages({ limit: 5 }).then(messages => {
      for (const message of messages.array().reverse()) logMessage(message);
    }).catch(err => {
      vorpal.log(`Error fetching channel logs: ${err.message}`);
    });
    cb();
  });

vorpal.command('/nick <name...>', 'set nickname for current guild')
  .action(function (args, cb) {
    if (current.guild) {
      client.guilds.get(current.guild).member(client.user).setNickname(args.name.join(' '))
      .then(() => {
        this.log(chalk.bold(`Set nickname to ${args.name.join(' ')}`));
        cb()
      }).catch(() => {
        this.log(chalk.bold('Error: unable to set nickname!'));
        cb();
      });
    } else {
      this.log(chalk.bold('Error: you must join a guild before you can set your nickname!'));
      cb();
    }
  });

vorpal.command('/search <query...>', 'find messages in the channel')
  .option('--guild')
  .option('--show <number>')
  .action(function (args, cb) {
    if (current.channel) {
      const start = Date.now();
      const scope = args.options.guild ? 'guild' : 'channel'
      const url = `https://discordapp.com/api/${scope}s/${current[scope]}/messages/search?context_size=0&content=${args.query.join(' ')}`;
      superagent.get(url).set('Authorization', client.token).end((err, res) => {
        if (res.body.total_results === 0 || err || res.body.code) {
          this.log(chalk.bold('Error: no results found!'));
          cb();
        } else {
          let results = res.body.messages.map(x => new Discord.Message(client.channels.get(x[0].channel_id), x[0], client));
          const occurances = {};
          for (const m of results) {
            if (!occurances[m.author.id]) occurances[m.author.id] = 0;
            occurances[m.author.id]++;
          }
          let highestUser = client.users.get(Object.keys(occurances)[Object.values(occurances).indexOf(Object.values(occurances).sort().reverse()[0])]);
          highestUser = `${highestUser.username}#${highestUser.discriminator}`;
          results = results.map(r => chalk.bold(`${chalk.yellow(timestamp(new Date(r.createdAt), true))} ${r.author.username}#${r.author.discriminator} `) + r.cleanContent)
            .slice(0, args.options.show || 10).reverse();
          const end = Date.now();
          this.log(chalk.bold(`Found ${res.body.total_results} results in ${end - start}ms (showing ${results.length})`));
          this.log(`Highest User: ${highestUser}`);
          this.log(chalk.bold('-- BEGIN SEARCH --'));
          this.log(results.join('\n'));
          this.log(chalk.bold('--- END SEARCH ---'));
          cb();
        }
      });
    } else {
      this.log(chalk.bold('Error: you must join a channel before you can search!'));
      cb();
    }
  });

vorpal.command('/login <token>')
  .action(function (args, cb) {
    vorpal.localStorage.setItem('token', args.token);
    vorpal.log(chalk.bold('Token saved, use /logout to log out, or /exit to exit'));
    client.login(args.token).then(() => cb()).catch(() => {
      vorpal.localStorage.removeItem('token');
      vorpal.log(chalk.bold('INVALID TOKEN!'))
      client.destroy();
      process.exit();
    });
  });

vorpal.command('/logout')
  .action(function (args, cb) {
    vorpal.localStorage.removeItem('token');
    client.destroy();
    process.exit();
  });

vorpal.catch('[words...]', 'send a message')
  .action(function (args, cb) {
    if (current.channel) {
      args.words = args.words.map(w => w.toString());
      for (let word in args.words) {
        if (args.words[word].startsWith('@')) {
          let user = client.users.find(x => x.username.toLowerCase() === args.words[word].replace('@', '').toLowerCase());
          if (user) args.words[word] = user.toString();
        }
      }
      client.channels.get(current.channel).sendMessage(args.words.join(' ')).catch(() => {});
    } else {
      this.log(chalk.bold('Error: you must join a channel before you can send messages!'));
    }
    cb();
  });

client.on('message', message => {
  if (message.channel.id !== current.channel) return;
  logMessage(message);
});

client.once('ready', () => {
  spinner.stop();
  console.log(center(fs.readFileSync(path.resolve('./assets/banner.txt'), 'utf8')));
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
    vorpal.log(chalk.bold('INVALID TOKEN!'))
    client.destroy();
    process.exit();
  });
}
