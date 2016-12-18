module.exports = (vorpal) => {
  const { chalk, discord } = vorpal;
  vorpal.command('/nick <name...>', 'set nickname for current guild')
    .action((args, cb) => {
      if (vorpal.current.guild) {
        discord.guilds.get(vorpal.current.guild).member(discord.user).setNickname(args.name.join(' '))
        .then(() => {
          vorpal.log(chalk.bold(`Set nickname to ${args.name.join(' ')}`));
          cb();
        })
        .catch(() => {
          vorpal.log(chalk.bold('Error: unable to set nickname!'));
          cb();
        });
      } else {
        vorpal.log(chalk.bold('Error: you must join a guild before you can set your nickname!'));
        return cb();
      }
      return true;
    });
};
