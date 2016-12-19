module.exports = (vorpal) => {
  const { discord } = vorpal;
  vorpal.command('/shrug [words...]')
    .action((args, cb) => {
      if (vorpal.current.channel) {
        discord.channels.get(vorpal.current.channel).sendMessage(
          `${args.words ? args.words.map(w => w.toString()).join(' ') : ''} ¯\\_(ツ)_/¯`
        );
        return cb();
      } else {
        return cb();
      }
    });
};
