# Deploy ke server Jetson

Untuk satu server Jetson (Ubuntu aarch64) yang **dipakai bersama**. Aplikasi jalan sebagai user Linux khusus
`webkeren` di folder **terenkripsi** `web-keren`, hanya di `127.0.0.1:8787`, lalu dibuka ke internet lewat terowongan
SSH ke VM yang memegang domain.

| Berkas                 | Isi                                                                                   |
| ---------------------- | ------------------------------------------------------------------------------------- |
| `pasang-jetson.sh`     | Pemasang sekali jalan: paket, user `webkeren`, gocryptfs, Node 22, clone, `.env`, build, pm2 |
| `web-keren.sh`         | Pengelola, dipasang sebagai `/usr/local/bin/web-keren`                                |
| `ecosystem.config.cjs` | Konfigurasi pm2 (satu proses: web + API, `NODE_ENV=production`)                       |

## Pasang (copy-paste di Jetson)

```bash
curl -fsSL https://raw.githubusercontent.com/PehPulo/civicpulse/main/deploy/pasang-jetson.sh -o pasang-jetson.sh
bash pasang-jetson.sh
```

Script akan menanyakan:

1. **Passphrase folder** (2x). Jangan pakai password akun bersama. Kalau passphrase hilang, data tidak bisa dibuka.
   Simpan juga _master key_ yang tampil, di luar Jetson.
2. **Domain** dari pemilik VM (boleh dikosongkan dulu).
3. **GROQ_API_KEY** (opsional, tidak tampil di layar).

Script aman dijalankan ulang: `.env` yang sudah ada tidak ditimpa.

## Perintah harian

```bash
web-keren status        # folder terbuka/terkunci, pm2, health check
web-keren buka          # WAJIB setelah Jetson reboot: masukkan passphrase, aplikasi menyala
web-keren kunci         # matikan aplikasi + kunci folder
web-keren perbarui      # git pull + npm ci + build + restart
web-keren log           # 80 baris log terakhir
web-keren reset-data    # kembali ke data demo (hapus database berkas)
```

## Terowongan ke VM domain (tanpa memberi akses SSH ke Jetson)

Arah koneksinya **dari Jetson ke VM**. Pemilik VM tidak mendapat akses apa pun ke Jetson.

Di Jetson:

```bash
web-keren terowongan tunnel@IP-VM
```

Perintah ini mencetak kunci publik. Kirim kunci itu ke pemilik VM.

Di VM (pemilik VM, sekali):

```bash
sudo adduser --disabled-password --gecos "" tunnel
sudo mkdir -p /home/tunnel/.ssh
echo 'restrict,port-forwarding,permitlisten="127.0.0.1:9000" KUNCI-PUBLIK-DARI-JETSON' | sudo tee /home/tunnel/.ssh/authorized_keys
sudo chown -R tunnel:tunnel /home/tunnel/.ssh && sudo chmod 700 /home/tunnel/.ssh && sudo chmod 600 /home/tunnel/.ssh/authorized_keys
```

nginx di VM:

```nginx
server {
    server_name DOMAIN;
    client_max_body_size 12m;
    location / {
        proxy_pass http://127.0.0.1:9000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $remote_addr;   # timpa, jangan tambahkan (anti IP palsu)
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Lalu jalankan `sudo certbot --nginx -d DOMAIN`.

## Seberapa terisolasi?

| Siapa                                  | Bisa buka `web-keren`?                                                       |
| -------------------------------------- | ---------------------------------------------------------------------------- |
| User lain **tanpa** sudo               | Tidak bisa (`/home/webkeren` izin 700, dan user `webkeren` tidak bisa login) |
| Siapa pun saat folder **terkunci**     | Tidak bisa, termasuk root. Isi disk terenkripsi (gocryptfs)                  |
| Root biasa (`sudo ls`, `sudo cat`)     | Ditolak, karena mount FUSE tanpa `allow_other`                               |
| Pemegang sudo yang **sengaja** menyamar (`sudo -u webkeren …`) saat folder terbuka | **Bisa.** Linux tidak bisa mencegahnya |

Root/sudo tidak bisa diblokir 100% di mesin yang dia kuasai. Kalau server dipakai bersama orang lain yang punya sudo,
anggap semua isi server bisa dilihat mereka:

- Jangan simpan rahasia penting di sini.
- Ganti `JWT_SECRET` dan kunci Groq kalau ada yang curiga.
- Kalau butuh isolasi penuh, pakai mesin yang hanya kamu pegang.
