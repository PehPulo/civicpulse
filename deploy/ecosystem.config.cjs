/* global __dirname */
// Konfigurasi pm2 untuk server Jetson (dipakai deploy/web-keren.sh). Jalankan dari akar repo.
// Satu proses: web hasil build (apps/web/dist) + API /api/v1, mendengarkan di HOST:PORT dari .env (bawaan 127.0.0.1:8787).
module.exports = {
  apps: [
    {
      name: 'civicpulse',
      cwd: __dirname + '/..',
      script: 'apps/api/src/server.js',
      node_args: '--env-file-if-exists=.env',
      env: { NODE_ENV: 'production' },
      max_memory_restart: '1500M',
      restart_delay: 3000,
      time: true,
    },
  ],
}
