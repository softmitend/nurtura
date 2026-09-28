# SMART - Stunting Monitoring Alert Response Tools

SMART sekarang menggunakan **single-project architecture**. Frontend, backend API, dan runtime model ML berada dalam satu project Node dan memakai satu `package.json`.

## Struktur

```text
stunting/
├── app.js                 # Express API/server
├── migrate.js
├── config/
├── controllers/
├── middlewares/
├── models/
├── routes/
├── utils/
├── src/                   # source frontend
│   ├── index.html
│   ├── scripts/
│   ├── styles/
│   └── public/
├── public/                # output frontend, dokumentasi, dan runtime ML model
│   └── ml-model/model/
├── ml/                    # notebook/dataset/training workspace
├── scripts/               # utilitas project
├── vercel.json            # konfigurasi deployment Vercel
├── webpack.common.js
├── webpack.dev.js
├── webpack.prod.js
├── package.json
└── .env.example
```

## Development

Hanya perlu satu instalasi dependency dan satu command dev:

```bash
npm install
npm run dev
```

`npm run dev` menjalankan Express melalui Nodemon dan Webpack Dev Server secara bersamaan. Web app tersedia di `http://localhost:9000`, sementara request `/api`, `/auth`, `/ml`, dan `/public` otomatis diproxy ke Express di port 5000.

Tidak ada lagi `npm run dev:frontend` atau `npm run dev:backend`.

## Production

```bash
npm run build
npm start
```

Setelah build, aset frontend berada di `public/`. Saat dijalankan lokal, Express menyajikan aset dan API dari proses Node yang sama. Port default backend adalah 5000 atau mengikuti `PORT` di environment.

## Database

Salin `.env.example` menjadi `.env`, isi konfigurasi PostgreSQL/JWT yang diperlukan, kemudian:

```bash
npm run migrate
```

`npm start` menjalankan migrasi sebelum server lokal aktif. Di Vercel, migrasi tidak dijalankan saat cold start; jalankan `npm run migrate` satu kali terhadap database production sebelum aplikasi mulai dipakai.

## ML

Model yang dipakai runtime berada di `public/ml-model/model/` dan dibaca langsung oleh fungsi Node, sehingga tidak ada service Python/ML atau request HTTP internal yang harus dijalankan. Folder `ml/` menyimpan notebook, dataset, dan artefak training untuk pengembangan model dan tidak ikut diunggah ke Vercel.

## Deploy ke Vercel

Project menggunakan runtime Node.js 24 dan terdeteksi sebagai aplikasi Express. Build frontend dijalankan otomatis melalui konfigurasi `vercel.json`.
Request ke `/` ditulis ulang ke `/index.html`, sehingga halaman SPA disajikan dari CDN dan tidak jatuh ke respons `Cannot GET /` milik Express.

1. Push project ke GitHub, GitLab, atau Bitbucket, lalu import repository tersebut di Vercel. Alternatifnya, jalankan `vercel` dari root project.
2. Gunakan root directory project ini dan Framework Preset **Express**. Build Command sudah diatur ke `npm run build`; Output Directory tidak perlu diisi.
3. Tambahkan environment variables berikut pada **Settings > Environment Variables** untuk Production dan Preview jika diperlukan:

   - `DATABASE_URL`: connection string PostgreSQL.
   - `JWT_SECRET`: secret acak yang panjang untuk menandatangani token.
   - `DATABASE_SSL`: gunakan `true` untuk database cloud; gunakan `false` hanya jika server database tidak mendukung SSL.
   - `PG_POOL_MAX`: opsional, default `5` koneksi per instance.
   - `ML_MODEL_URL`: opsional; jika kosong, model lokal akan digunakan.

4. Jalankan migrasi satu kali dengan environment production yang sesuai:

   ```bash
   npm run migrate
   ```

5. Deploy ulang, lalu periksa endpoint `/api/health`. Respons yang benar adalah JSON dengan `status: "ok"`.

Jangan memasukkan `PORT` di Vercel; platform mengatur port fungsi secara otomatis. File `.env`, dataset training, notebook, dan model `.h5` sudah dikecualikan dari upload deployment. File runtime `public/ml-model/model/model.json` dan `group1-shard1of1.bin` harus tetap ikut deployment.
