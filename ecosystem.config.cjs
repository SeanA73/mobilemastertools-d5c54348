module.exports = {
  apps: [
    {
      name: 'mobiletoolsbox',
      script: '/var/www/mobiletoolsbox/dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '1G',
      env_file: '/var/www/mobiletoolsbox/.env.production',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: '/var/www/mobiletoolsbox/logs/err.log',
      out_file: '/var/www/mobiletoolsbox/logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000,
      cwd: '/var/www/mobiletoolsbox'
    }
  ]
};

