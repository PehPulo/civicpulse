#!/usr/bin/env bash
# Pengelola CivicPulse di Jetson. Dipasang oleh pasang-jetson.sh sebagai /usr/local/bin/web-keren.
#   web-keren buka                 buka folder terenkripsi (minta passphrase) lalu nyalakan aplikasi
#   web-keren kunci                matikan aplikasi lalu kunci folder (isi disk tidak terbaca tanpa passphrase)
#   web-keren status               status aplikasi, folder, dan health check
#   web-keren log                  80 baris log terakhir
#   web-keren perbarui             ambil kode terbaru dari GitHub, build, restart
#   web-keren mulai-ulang          restart aplikasi
#   web-keren terowongan USER@HOST sambungkan ke VM Albert lewat terowongan SSH balik
#   web-keren reset-data           hapus database berkas ⇒ kembali ke data demo saat restart
set -euo pipefail

U="${WEB_KEREN_USER:-webkeren}"
H="/home/$U"
DIR="$H/web-keren"
ENC="$H/.web-keren.enc"
PORT_APP="${PORT_APP:-8787}"
PORT_TEROWONGAN="${PORT_TEROWONGAN:-9000}"

hijau() { printf '\033[1;32m%s\033[0m\n' "$*"; }
kuning() { printf '\033[1;33m%s\033[0m\n' "$*"; }
merah() { printf '\033[1;31m%s\033[0m\n' "$*" >&2; }

# Jalankan perintah sebagai user aplikasi dengan Node (nvm) aktif.
sebagai() { sudo -u "$U" -H bash -c "umask 077; export NVM_DIR=\"\$HOME/.nvm\"; . \"\$NVM_DIR/nvm.sh\" >/dev/null; $*"; }
terenkripsi() { sudo test -f "$ENC/gocryptfs.conf"; }
# Root tidak bisa stat folder FUSE milik user lain ⇒ cek dari daftar mount.
terbuka() { grep -qs " $DIR fuse" /proc/self/mounts; }

buka_folder() {
  if terenkripsi && ! terbuka; then
    kuning "Masukkan passphrase folder web-keren:"
    sudo -u "$U" -H gocryptfs -q "$ENC" "$DIR"
  fi
}

case "${1:-status}" in
  buka)
    buka_folder
    sebagai "cd ~/web-keren && pm2 startOrRestart deploy/ecosystem.config.cjs --update-env && pm2 save"
    if sebagai "pm2 describe civicpulse-tunnel >/dev/null 2>&1"; then sebagai "pm2 restart civicpulse-tunnel"; fi
    sleep 3
    "$0" status
    ;;
  kunci)
    sebagai "pm2 stop all >/dev/null 2>&1 || true"
    if terbuka; then sudo -u "$U" -H fusermount -u "$DIR" 2>/dev/null || sudo -u "$U" -H fusermount3 -u "$DIR"; fi
    hijau "Aplikasi dimatikan dan folder web-keren terkunci."
    ;;
  status)
    if terenkripsi; then
      if terbuka; then hijau "Folder: terenkripsi, sedang TERBUKA"; else kuning "Folder: terenkripsi, TERKUNCI (jalankan: web-keren buka)"; fi
    else
      kuning "Folder: tidak terenkripsi"
    fi
    sebagai "pm2 status" || true
    if curl -fsS -m 5 "http://127.0.0.1:$PORT_APP/api/v1/health" >/dev/null 2>&1; then
      hijau "Health check: OK (http://127.0.0.1:$PORT_APP)"
    else
      merah "Health check: GAGAL. Lihat: web-keren log"
    fi
    ;;
  log)
    sebagai "pm2 logs civicpulse --lines 80 --nostream"
    ;;
  perbarui)
    buka_folder
    sebagai "cd ~/web-keren && git pull --ff-only && npm ci && npm run build && pm2 startOrRestart deploy/ecosystem.config.cjs --update-env && pm2 save"
    sudo -u "$U" cat "$DIR/deploy/web-keren.sh" | sudo tee /usr/local/bin/web-keren >/dev/null
    hijau "Diperbarui ke commit terbaru."
    ;;
  mulai-ulang)
    sebagai "cd ~/web-keren && pm2 startOrRestart deploy/ecosystem.config.cjs --update-env"
    ;;
  terowongan)
    TUJUAN="${2:-}"
    [ -n "$TUJUAN" ] || { merah "Pakai: web-keren terowongan tunnel@IP-VM-ALBERT"; exit 1; }
    sudo -u "$U" -H bash -c 'mkdir -p ~/.ssh && chmod 700 ~/.ssh; [ -f ~/.ssh/civicpulse_tunnel ] || ssh-keygen -q -t ed25519 -N "" -C civicpulse-jetson -f ~/.ssh/civicpulse_tunnel'
    kuning "Kunci publik untuk Albert (tempel di authorized_keys user tunnel di VM-nya):"
    sudo -u "$U" -H cat "$H/.ssh/civicpulse_tunnel.pub"
    sebagai "pm2 delete civicpulse-tunnel >/dev/null 2>&1 || true; pm2 start ssh --name civicpulse-tunnel --restart-delay 5000 -- -N -i ~/.ssh/civicpulse_tunnel -o ServerAliveInterval=30 -o ServerAliveCountMax=3 -o ExitOnForwardFailure=yes -o StrictHostKeyChecking=accept-new -R 127.0.0.1:$PORT_TEROWONGAN:127.0.0.1:$PORT_APP $TUJUAN && pm2 save"
    hijau "Terowongan dijalankan. Cek: web-keren status (civicpulse-tunnel harus 'online')."
    ;;
  reset-data)
    buka_folder
    sebagai "rm -f ~/web-keren/data-server/laporan.json && cd ~/web-keren && pm2 restart civicpulse"
    hijau "Database direset ke data demo."
    ;;
  *)
    sed -n '2,11p' "$0"
    exit 1
    ;;
esac
