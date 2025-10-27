module.exports = {
  apps: [{
    name: 'mobiletoolsbox',
    script: './dist/index.js',
    instances: 2,
    exec_mode: 'cluster',
    max_memory_restart: '1G',
    env_file: './.env.production',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_restarts: 10,
    min_uptime: '10s',
    restart_delay: 4000
  }]
};

