module.exports = {

  apps: [

    {
      name: 'league-tooltips-demo',
      script: 'app.js',
      env: {
        KEY_RIOT: 'API_KEY',
        REDIS_HOST: 'localhost',
        REDIS_PORT: 6379,
        REDIS_PREFIX: 'league-tooltips-demo_',
        PORT: 9000
      },
      args: ['--release'],
      watch: false,
      append_env_to_name: true
    }

  ]

};
