// @flow

module.exports = {
  connections: [
    {
      port: '$env.PORT',
    },
  ],
  registrations: [
    {
      plugin: {
        register: __dirname,
      },
    },
  ],
};
