#!/usr/bin/env bash
# Pemasang CivicPulse di server Jetson (Ubuntu aarch64). Jalankan sebagai user biasa yang punya sudo (mis. amarine):
#
#   curl -fsSL https://raw.githubusercontent.com/PehPulo/civicpulse/main/deploy/pasang-jetson.sh -o pasang-jetson.sh
#   bash pasang-jetson.sh                    # dengan folder terenkripsi (disarankan)
#   bash pasang-jetson.sh --tanpa-enkripsi   # tanpa gocryptfs (hanya izin berkas)
#
# Hasilnya:
#   - User Linux khusus "webkeren" (tanpa password, tidak bisa login) yang menjalankan aplikasi.
#   - Kode, .env, dan database di /home/webkeren/web-keren (izin 700), disimpan TERENKRIPSI di disk (gocryptfs).
#   - ~/web-keren di home-mu hanya pintasan: dibuka user lain ⇒ "Permission denied".
#   - Aplikasi via pm2 di 127.0.0.1:8787 (tidak terbuka ke LAN). Dibuka ke internet lewat terowongan ke VM Albert.
#   - Perintah pengelola: web-keren buka | kunci | status | log | perbarui | terowongan USER@HOST | reset-data
#
# BATASAN JUJUR: root/sudo TIDAK BISA diblokir 100% di Linux. Pemegang sudo bisa menyamar jadi webkeren
# (sudo -u webkeren ...) saat folder sedang terbuka, atau membaca memori proses. Yang dijamin: tanpa sudo tidak bisa
# dibuka sama sekali; saat terkunci (web-keren kunci / setelah reboot) isinya tidak terbaca bahkan oleh root.
set -euo pipefail

REPO="${REPO:-https://github.com/PehPulo/civicpulse.git}"
CABANG="${CABANG:-main}"
U="webkeren"
H="/home/$U"
DIR="$H/web-keren"
ENC="$H/.web-keren.enc"
NODE_VERSI="22"
NVM_VERSI="v0.40.1"
ENKRIPSI=true
[ "${1:-}" = "--tanpa-enkripsi" ] && ENKRIPSI=false

hijau() { printf '\n\033[1;32m==> %s\033[0m\n' "$*"; }
kuning() { printf '\033[1;33m%s\033[0m\n' "$*"; }
gagal() { printf '\033[1;31mGAGAL: %s\033[0m\n' "$*" >&2; exit 1; }
sebagai() { sudo -u "$U" -H bash -c "umask 077; export NVM_DIR=\"\$HOME/.nvm\"; [ -s \"\$NVM_DIR/nvm.sh\" ] && . \"\$NVM_DIR/nvm.sh\" >/dev/null; $*"; }

# ── 0. Pemeriksaan awal ───────────────────────────────────────────────────────
[ "$(id -u)" -ne 0 ] || gagal "jangan jalankan sebagai root; pakai user biasa yang punya sudo (mis. amarine)."
command -v sudo >/dev/null || gagal "sudo tidak ada."
sudo -v || gagal "butuh sudo."
kuning "Arsitektur: $(uname -m) · $(. /etc/os-release && echo "$PRETTY_NAME")"
if ss -ltn 2>/dev/null | grep -qE '[:.]8787 ' && ! curl -fsS -m 3 http://127.0.0.1:8787/api/v1/health >/dev/null 2>&1; then
  gagal "port 8787 sudah dipakai program lain. Hentikan dulu program itu."
fi
# Catatan: folder terenkripsi yang sedang terbuka TIDAK bisa dibaca root (FUSE tanpa allow_other),
# jadi semua akses ke isi $DIR memakai "sudo -u $U", bukan "sudo" biasa.
terbuka() { grep -qs " $DIR fuse" /proc/self/mounts; }

# ── 1. Paket sistem ──────────────────────────────────────────────────────────
hijau "1/8 Memasang paket sistem"
PAKET="git curl ca-certificates openssl build-essential"
$ENKRIPSI && PAKET="$PAKET gocryptfs fuse3"
sudo apt-get update -qq
# shellcheck disable=SC2086
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq $PAKET

# ── 2. User khusus aplikasi ──────────────────────────────────────────────────
hijau "2/8 Menyiapkan user '$U' (tanpa password, tanpa login)"
if ! id "$U" >/dev/null 2>&1; then
  sudo useradd --create-home --shell /usr/sbin/nologin "$U"
fi
sudo passwd -l "$U" >/dev/null
sudo chown "$U:$U" "$H"
sudo chmod 700 "$H"

# ── 3. Folder terenkripsi ────────────────────────────────────────────────────
hijau "3/8 Menyiapkan folder web-keren"
sudo -u "$U" mkdir -p "$DIR"
if $ENKRIPSI; then
  if ! sudo test -f "$ENC/gocryptfs.conf"; then
    sudo -u "$U" mkdir -p "$ENC"
    sudo -u "$U" test -z "$(sudo -u "$U" ls -A "$DIR")" || gagal "$DIR tidak kosong; pindahkan isinya dulu sebelum dienkripsi."
    kuning "Buat PASSPHRASE untuk folder web-keren (ketik 2x). Simpan baik-baik: hilang = data tidak bisa dibuka."
    kuning "Jangan pakai password akun amarine, karena 7 orang lain tahu itu."
    sudo -u "$U" -H gocryptfs -init "$ENC"
    kuning "Simpan juga 'master key' yang tampil di atas di tempat aman (bukan di Jetson)."
  fi
  if ! terbuka; then
    kuning "Masukkan passphrase untuk membuka folder:"
    sudo -u "$U" -H gocryptfs -q "$ENC" "$DIR"
  fi
fi

# ── 4. Node.js 22 (nvm) + pm2, khusus user webkeren ──────────────────────────
hijau "4/8 Memasang Node.js $NODE_VERSI dan pm2 untuk user $U"
if ! sudo test -s "$H/.nvm/nvm.sh"; then
  sudo -u "$U" -H bash -c "curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/$NVM_VERSI/install.sh | PROFILE=/dev/null bash" >/dev/null
fi
sebagai "nvm install $NODE_VERSI >/dev/null && nvm alias default $NODE_VERSI >/dev/null && node -v"
sebagai "command -v pm2 >/dev/null || npm install -g pm2 >/dev/null 2>&1; pm2 -v >/dev/null"

# ── 5. Kode dari GitHub ──────────────────────────────────────────────────────
hijau "5/8 Mengambil kode ($REPO, cabang $CABANG)"
if sudo -u "$U" test -d "$DIR/.git"; then
  sebagai "cd ~/web-keren && git fetch -q origin $CABANG && git checkout -q $CABANG && git pull -q --ff-only origin $CABANG"
else
  sebagai "git clone -q --branch $CABANG $REPO ~/web-keren"
fi

# ── 6. .env (rahasia) — dibuat sekali, izin 600 ──────────────────────────────
hijau "6/8 Menyiapkan .env"
if sudo -u "$U" test -f "$DIR/.env"; then
  kuning ".env sudah ada, tidak diubah. (Edit: sudo -u $U nano $DIR/.env lalu web-keren mulai-ulang)"
else
  read -r -p "Domain dari Albert (mis. civicpulse.albert.my.id, kosongkan bila belum ada): " DOMAIN
  read -r -s -p "GROQ_API_KEY (opsional, Enter untuk lewati; tidak tampil di layar): " GROQ
  echo
  CORS="http://localhost:8787"
  [ -n "$DOMAIN" ] && CORS="https://$DOMAIN,$CORS"
  JWT="$(openssl rand -hex 32)"
  sudo -u "$U" -H bash -c "umask 077; cat > '$DIR/.env'" <<EOF
# Dibuat oleh deploy/pasang-jetson.sh pada $(date -Iseconds). JANGAN di-commit.
NODE_ENV=production
HOST=127.0.0.1
PORT=8787
JWT_SECRET=$JWT
INSTANSI_SANDI_DEMO=civicpulse2026
CORS_ORIGIN=$CORS
PERCAYA_PROXY=true
DEMO_SEED=true
DATA_FILE=$DIR/data-server/laporan.json
GROQ_API_KEY=$GROQ
EOF
  unset GROQ JWT
fi
sudo -u "$U" chmod 600 "$DIR/.env"

# ── 7. Dependensi + build web ────────────────────────────────────────────────
hijau "7/8 npm ci + build (beberapa menit di Jetson)"
sebagai "cd ~/web-keren && npm ci --no-audit --no-fund && npm run build"

# ── 8. Jalankan + pengelola ──────────────────────────────────────────────────
hijau "8/8 Menjalankan aplikasi"
sudo -u "$U" cat "$DIR/deploy/web-keren.sh" | sudo tee /usr/local/bin/web-keren >/dev/null
sudo chmod 755 /usr/local/bin/web-keren
sebagai "cd ~/web-keren && pm2 startOrRestart deploy/ecosystem.config.cjs --update-env && pm2 save"
sebagai "chmod -R go-rwx ~/web-keren/data-server ~/web-keren/.env 2>/dev/null || true"

# Pintasan di home-mu. Tidak berisi apa pun; isinya hanya bisa dilihat lewat sudo.
if [ ! -e "$HOME/web-keren" ] || [ -L "$HOME/web-keren" ]; then ln -sfn "$DIR" "$HOME/web-keren"; fi

sleep 4
if curl -fsS -m 5 http://127.0.0.1:8787/api/v1/health >/dev/null; then
  hijau "SELESAI. CivicPulse jalan di http://127.0.0.1:8787 (hanya dari Jetson ini)."
else
  kuning "Aplikasi belum menjawab. Cek: web-keren log"
fi
cat <<'TXT'

Langkah berikut:
  1. Terowongan ke VM Albert (setelah Albert membuat user 'tunnel'):
       web-keren terowongan tunnel@IP-VM-ALBERT
     Kirim kunci publik yang tampil ke Albert.
  2. Cek kapan saja:          web-keren status
  3. Setelah Jetson reboot:   web-keren buka      (masukkan passphrase)
  4. Update dari GitHub:      web-keren perbarui
  5. Kunci saat tidak dipakai: web-keren kunci
TXT
