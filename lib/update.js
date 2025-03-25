const readFile = require('./read-file');
const writeFile = require('./write-file');

class UnchangedError extends Error {
  constructor () {
    super('Unchanged');
  }
}

const parseCommitTag = services => {
  const head = services.slice(0, 1)
  const tail = services.slice(1)
  return `${head[0].name}${tail.length > 0 ? `, +${tail.length}`: ""}`
}

const parseCommitMessage = msg => {
  if (msg.match(/^Merge pull request/)) {
    return msg.split('\n').slice(1).join('\n').trim();
  }
  return msg;
};

module.exports = settings => {

  return {
    update: (services) => {
      return Promise.resolve()
        .then(() => readFile(settings))
        .then(data => {
          for (const {name, version} of services) {
            if (data[name] === version) {
              throw new UnchangedError();
            }
            data[name] = version;
          }
          return data;
        })
        .then(data => writeFile(settings, data, `[${parseCommitTag(services)}] ${parseCommitMessage(process.env.DRONE_COMMIT_MESSAGE)}`))
        .catch(e => {
          if (!(e instanceof UnchangedError)) {
            throw e;
          }
          console.log('Version is not changed.');
        });
    }
  };

};
