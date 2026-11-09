# Indonesia-friendly: prompt gambar ChatGPT & logo CivicPulse

Panduan membuat gambar realistis bernuansa Indonesia untuk setiap halaman CivicPulse dengan ChatGPT
(pembuat gambar GPT), plus prompt logo. Sekarang semua halaman memakai foto Wikimedia Commons berlisensi CC
(daftar dan kreditnya ada di `apps/web/src/lib/pesona.js`). Gambar dari ChatGPT bisa **ditambahkan ke kumpulan
foto acak** atau **menggantikan** foto yang ada.

---

## 1. Cara pakai (singkat)

1. Salin satu prompt di bawah ke ChatGPT. Minta ukuran **landscape 1536×1024** (atau "wide 16:9").
2. Unduh hasilnya, lalu beri nama sesuai kolom **Nama file** (mis. `ai-peta-1.png`).
3. Taruh di `apps/web/public/pesona/`, lalu bilang ke Claude: _"daftarkan gambar ai-peta-1"_. Claude akan:
   - mengubahnya ke `.webp` (±150–300 KB) supaya halaman tetap cepat,
   - menambahkannya ke `FOTO_NUSANTARA` dan kumpulan `SAMPUL` halaman itu di `apps/web/src/lib/pesona.js`,
   - menuliskan kreditnya sebagai **"Ilustrasi dibuat dengan AI"** (wajib jujur: gambar AI bukan foto asli).

> **Kenapa tetap ada gradasi hijau?** Teks putih di sampul harus terbaca. Karena itu setiap prompt meminta
> **sisi kiri lebih tenang / gelap**, tempat judul halaman berada.

### Aturan gaya untuk SEMUA gambar (sudah ada di setiap prompt)

- Fotorealistis, cahaya alami (golden hour / pagi berkabut), warna hangat, tajam, kualitas majalah perjalanan.
- Nuansa Indonesia yang kental: arsitektur, alam, dan kehidupan warga yang khas Nusantara.
- **Tanpa teks, huruf, logo, watermark, atau bendera negara lain.** Bendera Merah Putih boleh, kecil dan sopan.
- Orang boleh ada, tetapi kecil atau dari belakang, **tanpa wajah yang bisa dikenali**.
- Tidak menampilkan logo atau merek resmi pemerintah. Jangan meniru logo "Wonderful Indonesia" atau logo
  Kemenparekraf, karena itu merek terdaftar.
- Komposisi: **sepertiga kiri lebih kosong/gelap** untuk teks, objek utama di kanan.

Tempel blok ini di akhir prompt kalau ChatGPT melenceng:

```text
Style rules: photorealistic, natural light, rich warm colors, travel-magazine quality, sharp detail.
No text, no letters, no logos, no watermarks, no foreign flags. People only small or seen from behind,
no recognizable faces. Keep the left third of the frame calm and slightly darker for overlay text;
main subject on the right. Landscape 1536x1024.
```

---

## 2. Prompt per halaman

### Beranda (hero, di belakang peta Indonesia + efek titik Three.js)

Hero beranda ditimpa gradasi hijau tebal dan peta, jadi gambarnya harus **lebar, tenang, tanpa detail kecil
yang ramai**.

| Nama file         | Prompt                                                                                                                                                                                                                                                                                                                                                                                            |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ai-beranda-1.png` | Ultra-wide aerial photograph of the Indonesian archipelago at sunrise: emerald-green islands scattered across a calm turquoise sea, soft morning mist, gentle golden light from the right. Calm, spacious composition with lots of sea and sky, few small details. Photorealistic, travel-magazine quality. No text, no logos. Left third calmer and darker. Landscape 1536x1024.                    |
| `ai-beranda-2.png` | Photorealistic panorama of terraced rice fields in Java at golden hour, a volcano silhouette in the far background, thin mist in the valleys, a few palm trees, warm light. Wide and calm composition, no people in focus. No text, no logos. Left third darker and calmer. Landscape 1536x1024.                                                                                                     |
| `ai-beranda-3.png` | Photorealistic wide view of a peaceful Indonesian city at dusk seen from a hill: a mosque dome and a church tower side by side, red-tiled roofs, street lights starting to glow, green hills behind, a small Indonesian red-and-white flag on a pole far away. Calm, unity-themed mood. No text, no logos, no recognizable faces. Left third darker. Landscape 1536x1024.                     |

### Peta Laporan

Tema: **bentang Nusantara dari atas**, sesuai "peta".

| Nama file      | Prompt                                                                                                                                                                                                                                                                                                                                         |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ai-peta-1.png` | Photorealistic drone photo looking straight down on karst islands of Raja Ampat, Indonesia: turquoise lagoons, coral reefs visible under clear water, deep green jungle, a small wooden boat. Midday light, vivid but natural colors. No text, no logos. Left third with more open water (calmer). Landscape 1536x1024.                         |
| `ai-peta-2.png` | Photorealistic aerial photo of a winding river through a green Kalimantan rainforest, a small riverside village with stilt houses and colorful roofs, morning mist. No text, no logos, people tiny. Left third darker forest. Landscape 1536x1024.                                                                                            |
| `ai-peta-3.png` | Photorealistic aerial photo of an Indonesian coastal town and its road network meeting green rice fields, seen at golden hour like a living map: roads, small bridges, a river mouth, fishing boats. No text, no logos. Left third calmer (sea). Landscape 1536x1024.                                                                         |

### Lapor (form laporan warga)

Tema: **lingkungan sehari-hari warga**, tempat masalah biasanya dilaporkan: jalan kampung, drainase, lampu
jalan. Harus rapi dan bermartabat, **bukan kumuh**.

| Nama file       | Prompt                                                                                                                                                                                                                                                                                                                                                                                       |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ai-lapor-1.png` | Photorealistic street scene in an Indonesian neighborhood (kampung) in the morning after rain: a narrow asphalt road with a small pothole filled with water, gutters along the side, potted plants in front of colorful houses, a parked motorbike, a small red-and-white flag on a bamboo pole. Hopeful mood, warm light. No text, no logos, no recognizable faces. Left third darker. Landscape 1536x1024. |
| `ai-lapor-2.png` | Photorealistic photo of a resident seen from behind holding a smartphone, photographing a broken street light on a quiet Indonesian residential street at dusk, warm house lights, frangipani tree. Face not visible. No text on the phone screen, no logos. Left third darker. Landscape 1536x1024.                                                                                      |
| `ai-lapor-3.png` | Photorealistic photo of Indonesian public-works staff in orange vests (seen from behind, faces not visible) repairing a drainage channel on a tidy village road, neighbors watching from a distance, green trees, morning light. Cooperative, gotong-royong mood. No text, no logos on uniforms. Left third calmer. Landscape 1536x1024.                                               |

### Dasbor Akuntabilitas

Tema: **pemerintahan yang terbuka dan bekerja**: gedung bersejarah, kota yang tertata.

| Nama file        | Prompt                                                                                                                                                                                                                                                                                                                                                        |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ai-dasbor-1.png` | Photorealistic photo of a grand Indonesian colonial-era government building with a traditional tiered roof, wide green lawn, Indonesian red-and-white flag on a tall pole, blue sky with soft clouds, golden-hour light. Dignified, trustworthy mood. No text on the building, no logos, no recognizable faces. Left third with sky (calmer). Landscape 1536x1024. |
| `ai-dasbor-2.png` | Photorealistic blue-hour skyline of a modern Indonesian city with a national monument tower in the middle distance, light trails from traffic on a wide boulevard, clean and orderly. No text, no logos, no billboards with words. Left third darker sky. Landscape 1536x1024.                                                                                 |
| `ai-dasbor-3.png` | Photorealistic photo of Prambanan-style Hindu temple spires at sunrise with mist and silhouettes of palm trees, symbolizing heritage and long-term stewardship. No text, no logos. Left third calmer. Landscape 1536x1024.                                                                                                                                      |

### Metodologi & Data

Tema: **ketelitian dan keteraturan**, pola alam yang rapi seperti rumus.

| Nama file            | Prompt                                                                                                                                                                                                                                                                                                         |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ai-metodologi-1.png` | Photorealistic aerial photo of Balinese subak rice terraces forming precise geometric curves, morning light casting long shadows, lush green and gold tones. Orderly, mathematical mood. No text, no logos, no people. Left third darker. Landscape 1536x1024.                                                 |
| `ai-metodologi-2.png` | Photorealistic close-up of traditional Indonesian batik kawung pattern being drawn with a canting (wax pen) on cloth, hands visible but no face, warm workshop light, shallow depth of field. No text, no logos. Left third blurred and darker. Landscape 1536x1024.                                        |
| `ai-metodologi-3.png` | Photorealistic photo of rows of traditional Toraja tongkonan houses with boat-shaped roofs, perfectly aligned, green rice field in front, soft morning light. No text, no logos, no recognizable faces. Left third calmer. Landscape 1536x1024.                                                              |

### Lacak Laporan

Tema: **perjalanan sampai tuntas**: jalan, jembatan, matahari terbit.

| Nama file       | Prompt                                                                                                                                                                                                                                                                                         |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ai-lacak-1.png` | Photorealistic photo of a newly paved mountain road winding through tea plantations in West Java at sunrise, mist in the valleys, the road leading toward the light. Hopeful "journey completed" mood. No text, no logos, no vehicles with plates. Left third darker. Landscape 1536x1024.     |
| `ai-lacak-2.png` | Photorealistic photo of a long wooden pier stretching into calm sea at sunrise in eastern Indonesia, a traditional pinisi ship in the distance, golden reflections. No text, no logos. Left third calmer. Landscape 1536x1024.                                                                  |

### Masuk Instansi (halaman login petugas)

Latar penuh di belakang dua panel. Gradasi gelap dari bawah dan efek titik Three.js ada di atasnya, jadi
pilih gambar **berwibawa** dengan detail di bagian atas.

| Nama file       | Prompt                                                                                                                                                                                                                                                                                                                              |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ai-masuk-1.png` | Photorealistic wide photo of an Indonesian regional government office complex at early morning: traditional-inspired architecture, Indonesian red-and-white flag on a pole, neat garden, soft mist, empty plaza. Calm, professional, trustworthy. No text on buildings, no logos, no people in focus. Darker lower half. Landscape 1536x1024. |
| `ai-masuk-2.png` | Photorealistic aerial photo of Jakarta's central monument park at blue hour, city lights, wide green square, orderly streets. No text, no logos, no billboards. Darker lower half. Landscape 1536x1024.                                                                                                                           |

### Acak (tambahan untuk kumpulan foto acak di semua halaman)

| Nama file      | Prompt                                                                                                                                                                                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ai-acak-1.png` | Photorealistic photo of Mount Bromo crater at sunrise above a sea of clouds, Javanese volcanoes in a row, pink-gold sky. No text, no logos. Left third calmer. Landscape 1536x1024.                                                                     |
| `ai-acak-2.png` | Photorealistic photo of Lake Toba with Samosir island, traditional Batak houses on the shore, morning mist over the lake. No text, no logos. Left third calmer. Landscape 1536x1024.                                                                   |
| `ai-acak-3.png` | Photorealistic photo of a floating market in Banjarmasin at dawn: wooden boats filled with fruit and vegetables, sellers in hats seen from afar, golden river reflections. No text, no logos, no recognizable faces. Left third darker. Landscape 1536x1024. |
| `ai-acak-4.png` | Photorealistic photo of the Jam Gadang clock tower in Bukittinggi at dusk with Minangkabau-roofed buildings and Mount Marapi behind. No readable text, no logos. Left third darker sky. Landscape 1536x1024.                                            |
| `ai-acak-5.png` | Photorealistic photo of Komodo National Park hills (Padar Island) at sunrise, three bays with pink, white and black sand beaches. No text, no logos. Left third calmer. Landscape 1536x1024.                                                            |
| `ai-acak-6.png` | Photorealistic photo of Indonesian children (seen from behind, faces not visible) running along a rice-field path flying a traditional kite, golden hour, volcano in background. Joyful mood. No text, no logos. Left third calmer. Landscape 1536x1024. |

---

## 3. Logo CivicPulse

Sekarang logo di navbar masih berupa ikon garis detak di kotak hijau (`lucide-react`). Untuk logo baru, minta
ChatGPT membuat **beberapa varian**, lalu pilih satu. Setelah itu Claude bisa mengubahnya menjadi SVG/ikon
favicon dan memasangnya di navbar, footer, halaman login, dan `index.html`.

**Arahan desain:**

- Nama: **CivicPulse**. Makna: denyut suara warga, didengar dan ditindaklanjuti, **dilengkapi AI**.
- Tagline yang boleh dipakai di bawah logo: **"Lapor warga · dilengkapi AI"**.
- Unsur AI yang halus: kilau kecil (sparkle ✦) atau titik-titik terhubung seperti jaringan saraf, tetap
  sederhana. Jangan pakai robot atau otak kartun.
- Warna utama: hijau `#069550` dan hijau tua `#0a3d24`, aksen kuning `#ffd026`. Merah `#ce1126` hanya sebagai
  aksen kecil (nuansa Merah Putih).
- Unsur Indonesia yang halus: motif **kawung** atau **garis detak yang membentuk siluet kepulauan / pin lokasi**.
- Harus tetap jelas di ukuran 32×32 px (favicon) dan bisa satu warna (putih di atas hijau).
- **Jangan** memakai Garuda Pancasila, lambang negara, logo daerah, atau logo "Wonderful Indonesia". Itu dilindungi
  undang-undang atau merek terdaftar.

### Prompt logo (salin satu per satu)

**A. Ikon pin + detak (utama)**

```text
Design a flat vector logo icon for "CivicPulse", an Indonesian citizen-reporting app.
Concept: a map location pin whose inner shape is a heartbeat/pulse line, and the pulse line subtly
traces the silhouette of Indonesian islands. Colors: green #069550 with dark green #0a3d24 and a small
yellow accent #ffd026. Simple geometric shapes, bold, readable at 32x32 pixels, no gradients, no text,
centered on a plain white background, square 1024x1024. Do not use any national emblem or Garuda.
```

**B. Kawung modern**

```text
Design a minimalist flat vector logo mark for "CivicPulse". Concept: the traditional Indonesian batik
kawung motif (four oval petals around a center) simplified into a modern geometric symbol, with the
center point styled as a small location pin, and one petal containing a short pulse line.
Colors: green #069550, dark green #0a3d24, yellow #ffd026 accent. Bold, symmetric, works in one color,
readable at 32x32 px. No text, no gradients, white background, square 1024x1024.
```

**C. Wordmark (logo + tulisan)**

```text
Design a horizontal logo for "CivicPulse": on the left a rounded-square icon in green #069550 with a
white pulse line that ends in a small location pin; on the right the word "CivicPulse" in a modern
geometric sans-serif (similar to Outfit), "Civic" in dark green #0a3d24 and "Pulse" in green #069550.
Under the pulse line add a tiny red #ce1126 and white stripe accent. Below the name add a small
tagline "Lapor warga · dilengkapi AI" in dark green, with a tiny four-point sparkle before "AI".
Flat vector, clean spacing, white background, 2048x768. Spell the name exactly "CivicPulse" and the
tagline exactly as written.
```

**E. Ikon dengan sentuhan AI**

```text
Design a flat vector logo icon for "CivicPulse", an AI-powered Indonesian citizen-reporting app.
Concept: a location pin with a pulse line inside, and a small yellow #ffd026 four-point sparkle at the
top-right of the pin to signal AI assistance. A few tiny connected dots inside the pin suggest a neural
network, kept very subtle. Colors: green #069550, dark green #0a3d24, yellow #ffd026. Bold, simple,
readable at 32x32 px, no gradients, no text, no robots, white background, square 1024x1024.
```

**D. Versi putih di atas hijau (untuk navbar gelap & ikon aplikasi)**

```text
Same CivicPulse icon as before, but rendered in pure white on a solid green #069550 rounded square
(app icon style), flat, no gradients, no text, 1024x1024.
```

Tips: setelah memilih, minta ChatGPT _"make it even simpler, fewer details, thicker lines"_ supaya tetap jelas
di ukuran kecil. Simpan hasilnya sebagai `apps/web/public/logo-asli.png` (dan `logo-putih.png` untuk varian D),
lalu bilang ke Claude: _"pasang logo baru"_.

---

## 4. Catatan lisensi

- **Foto Wikimedia** (yang sekarang terpasang): CC BY / CC BY-SA. Nama pembuat dan lisensi **wajib tampil**,
  dan sudah otomatis tampil di pojok sampul setiap halaman.
- **Gambar ChatGPT**: boleh dipakai untuk CivicPulse sesuai ketentuan OpenAI. Tetap beri label
  "Ilustrasi dibuat dengan AI" supaya warga tidak mengira itu foto lokasi sungguhan.
- Jangan memakai foto dari Google Images, Instagram, atau situs pariwisata tanpa izin.
