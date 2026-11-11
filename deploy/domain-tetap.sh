#!/usr/bin/env bash
# Pasang alamat tetap https://<DOMAIN> untuk CivicPulse lewat Cloudflare Tunnel bernama.
# Jalankan di Jetson oleh user ber-sudo (bukan webkeren):  bash deploy/domain-tetap.sh civicpulse.my.id
# Syarat: domain sudah "Active" di Cloudflare (nameserver sudah diganti). Satu-satunya langkah manual:
# membuka link login Cloudflare yang muncul, lalu memilih domainnya.
set -euo pipefail

DOMAIN="${1:-civicpulse.my.id}"
NAMA="civicpulse"
PORT=8787
ENV_FILE="/home/webkeren/web-keren/.env"

info() { printf '\n\033[1;32m==> %s\033[0m\n' "$*"; }
gagal() { printf '\n\033[1;31m!! %s\033[0m\n' "$*" >&2; exit 1; }

command -v cloudflared >/dev/null || gagal "cloudflared belum terpasang."

info "1/5 Login Cloudflare (buka link yang muncul, pilih $DOMAIN)"
if [ ! -f "$HOME/.cloudflared/cert.pem" ]; then
  cloudflared tunnel login
fi

info "2/5 Membuat tunnel '$NAMA'"
if ! cloudflared tunnel list 2>/dev/null | awk '{print $2}' | grep -qx "$NAMA"; then
  cloudflared tunnel create "$NAMA"
fi
ID="$(cloudflared tunnel list 2>/dev/null | awk -v n="$NAMA" '$2==n {print $1}')"
[ -n "$ID" ] || gagal "ID tunnel tidak ditemukan."
CRED="$HOME/.cloudflared/$ID.json"
[ -f "$CRED" ] || gagal "File kredensial $CRED tidak ada."

info "3/5 Menghubungkan $DOMAIN ke tunnel"
cloudflared tunnel route dns --overwrite-dns "$NAMA" "$DOMAIN"

info "4/5 Menulis konfigurasi & menjalankan layanan"
sudo mkdir -p /etc/cloudflared
sudo cp "$CRED" "/etc/cloudflared/$ID.json"
sudo tee /etc/cloudflared/config.yml >/dev/null <<EOF
tunnel: $ID
credentials-file: /etc/cloudflared/$ID.json
ingress:
  - hostname: $DOMAIN
    service: http://localhost:$PORT
  - service: http_status:404
EOF
if systemctl list-unit-files | grep -q '^cloudflared.service'; then
  sudo systemctl restart cloudflared
else
  sudo cloudflared service install
fi
sudo systemctl enable --now cloudflared >/dev/null 2>&1 || true
# matikan quick tunnel lama (trycloudflare)
pkill -f "cloudflared tunnel --url" 2>/dev/null || true

info "5/5 Memperbarui CORS aplikasi"
if sudo -u webkeren test -f "$ENV_FILE"; then
  BARIS="CORS_ORIGIN=https://$DOMAIN,http://localhost:$PORT"
  if sudo -u webkeren grep -q '^CORS_ORIGIN=' "$ENV_FILE"; then
    sudo -u webkeren sed -i "s|^CORS_ORIGIN=.*|$BARIS|" "$ENV_FILE"
  else
    echo "$BARIS" | sudo -u webkeren tee -a "$ENV_FILE" >/dev/null
  fi
  web-keren mulai-ulang || true
else
  echo "Folder aplikasi terkunci. Jalankan 'web-keren buka', lalu ulangi skrip ini (aman diulang)."
  exit 1
fi

info "Selesai. Coba buka: https://$DOMAIN"
sleep 3
curl -s -o /dev/null -w "Cek dari Jetson: HTTP %{http_code}\n" "https://$DOMAIN/" || true
