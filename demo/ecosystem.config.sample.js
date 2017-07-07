module.exports = {

  apps: [

    {
      name: 'league-tooltips-demo',
      script: 'app.js',
      env: {
        KEY_RIOT: 'API_KEY',
        PORT: 9000
      },
      args: ['--release'],
      watch: false,
      append_env_to_name: true
    }

  ]

};