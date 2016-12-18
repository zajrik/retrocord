module.exports = (vorpal) => {
  const { chalk, discord, logMessage } = vorpal;
  vorpal.command('/join <guild#channel...>', 'join a channel')
    .action((args, cb) => {
      args = args['guild#channel'].join(' ');
      if (!args.includes('#')) return cb(chalk.bold('INVALID!'));
      let [guild, channel] = [args.split('#')[0].trim(), args.split('#')[1].trim()];
      if (guild !== 'dm') {
        guild = discord.guilds.find(g => g.name.toLowerCase() === guild.toLowerCase());
        if (!guild) {
          vorpal.log(chalk.bold('Error: not a valid guild'));
          return cb();
        }
        channel = guild.channels.filter(c => c.type !== 'voice').find(c => c.name.toLowerCase() === channel.toLowerCase());
        if (!channel) {
          vorpal.log(chalk.bold('Error: not a valid channel'));
          return cb();
        }
        vorpal.log(chalk.bold(`Joining ${channel.name} in ${guild.name}`));
        vorpal.current = { channel: channel.id, guild: guild.id };
      } else {
        channel = discord.channels.filter(c => c.type === 'dm').find(c => c.recipient.username.toLowerCase() === channel.toLowerCase());
        if (!channel) {
          vorpal.log(chalk.bold('Error: not a valid channel'));
          return cb();
        }
        vorpal.log(chalk.bold(`Joining DM with ${channel.recipient.username}`));
        vorpal.current = { channel: channel.id };
      }
      channel.fetchMessages({ limit: 5 }).then(messages => {
        for (const message of messages.array().reverse()) logMessage(message);
      }).catch(err => {
        vorpal.log(`Error fetching channel logs: ${err.message}`);
      });
      return cb();
    });
};
