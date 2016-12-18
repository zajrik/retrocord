module.exports = (vorpal) => {
  vorpal.command('/help')
    .action((args, cb) => {
      const commands = vorpal.commands.filter(c => c._name !== '').map(c =>
        `${c._name} ${c._args.map(a => `${a.required ? '<' : '['}${a.name}${a.required ? '>' : ']'}`).join(' ')}`
      ).join('\n');
      vorpal.log(`Commands:\n${commands}`);
      cb();
    });
};
