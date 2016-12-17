module.exports = (text) => {
  const offset = (process.stdout.columns / 2) - (text.split('\n')[0].length / 2);
  return text.split('\n').map(t => ' '.repeat(offset) + t).join('\n');
}
