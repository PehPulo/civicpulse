-- Skema awal CivicPulse (Postgres/Supabase). Turunan langsung dari docs/DATA-MODEL.md.
-- PEMILIK: Albert. Perubahan skema = migrasi baru (002_…), jangan mengedit file ini setelah dijalankan.

create table laporan (
  kode          text primary key check (kode ~ '^CP-\d{4}-\d{4}$'),
  kategori_id   text not null check (kategori_id in ('drainase','banjir','jalan','longsor','lainnya')),
  wilayah_id    text not null,
  lat           double precision not null,
  lng           double precision not null,
  judul         text not null check (char_length(judul) <= 80),
  deskripsi     text not null check (char_length(deskripsi) between 10 and 280),
  foto_url      text,
  pelapor_id    uuid not null,
  dibuat        timestamptz not null default now(),
  status        text not null check (status in ('diterima','diproses','klaim_selesai','terverifikasi','dibuka_ulang')),
  prioritas     jsonb not null,          -- { skor, level, faktor[], penjelasan, versiRumus }
  ai            jsonb,                   -- { kategoriSaran, yakin, modelVersi } | null
  tanggapan     jsonb                    -- { isi, petugas, waktu, buktiUrl } | null
);
create index laporan_status_idx on laporan (status);
create index laporan_wilayah_idx on laporan (wilayah_id);
create index laporan_pelapor_dibuat_idx on laporan (pelapor_id, dibuat);

create table status_event (
  id            bigserial primary key,
  laporan_kode  text not null references laporan(kode) on delete cascade,
  status        text not null,
  waktu         timestamptz not null default now(),
  oleh          text not null check (oleh in ('warga','instansi','sistem')),
  catatan       text,
  bukti_url     text
);
create index status_event_laporan_idx on status_event (laporan_kode, waktu);

create table dukungan (
  laporan_kode  text not null references laporan(kode) on delete cascade,
  device_id     uuid not null,
  waktu         timestamptz not null default now(),
  primary key (laporan_kode, device_id)
);

create table verifikasi (
  id            bigserial primary key,
  laporan_kode  text not null references laporan(kode) on delete cascade,
  device_id     uuid not null,
  beres         boolean not null,
  foto_url      text,
  lat           double precision,
  lng           double precision,
  waktu         timestamptz not null default now(),
  waktu_foto    timestamptz,
  sah           boolean not null,
  cek           jsonb not null,          -- { lokasiOk, waktuOk, aiMeragukan, alasan[] }
  ai            jsonb                    -- { beres, yakin, modelVersi } | null
);
create index verifikasi_laporan_idx on verifikasi (laporan_kode, waktu);

-- Log AI untuk MLOps (docs/MLOPS.md § Monitoring): saran vs pilihan akhir warga.
create table ai_log (
  id            bigserial primary key,
  waktu         timestamptz not null default now(),
  tugas         text not null check (tugas in ('klasifikasi','verifikasi')),
  model_versi   text not null,
  saran         text,
  yakin         real,
  pilihan_akhir text,
  laporan_kode  text references laporan(kode) on delete set null
);

-- Akses hanya lewat service key di server; tidak ada akses publik langsung ke tabel.
alter table laporan enable row level security;
alter table status_event enable row level security;
alter table dukungan enable row level security;
alter table verifikasi enable row level security;
alter table ai_log enable row level security;
