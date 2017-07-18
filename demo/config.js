module.exports = {
  port: process.env.PORT || 3000,

  key: {
    riot: process.env.KEY_RIOT
  },

  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    prefix: process.env.REDIS_PREFIX
  }
};
