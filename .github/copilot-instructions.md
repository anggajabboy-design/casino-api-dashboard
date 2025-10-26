## Tujuan singkat

Panduan ini ditujukan untuk agen AI yang mengerjakan fitur/PR di repositori "slotdashboard".
Tulisan berikut spesifik untuk struktur dan alur kerja proyek — baca referensi file yang disebut sebelum membuat perubahan.

## Gambaran arsitektur (singkat)
- Frontend: Next.js (App Router) di `app/` — statik export diaktifkan (`next.config.mjs` memakai `output: 'export'`).
- Backend: Node/Express + Apollo GraphQL di `backend/src/` (entry: `backend/src/index.js`).
- Static server: `server.js` digunakan untuk menyajikan build statik produksi (menerapkan SSL jika ada `ssl/`).
- State/API: Apollo Client di `lib/apollo-client.ts` menghubungkan ke `http://localhost:2053/graphql` saat development.

## Hal penting yang harus diperhatikan sebelum mengubah kode
- Pola auth: token disimpan di cookie (`auth_token`) dan dipakai oleh `lib/apollo-client.ts` dan `lib/auth-context.tsx`.
- Konfigurasi CORS dan origin dikontrol di `backend/src/index.js` — di dev origin = `http://localhost:3000`, prod `https://moonshoot.fun`.
- Next.js dikonfigurasikan untuk static export: perubahan routing/pages harus kompatibel dengan export statis (lihat `next.config.mjs` `trailingSlash: true`).

## Perintah pengembang (fast-path)
- Frontend dev: `npm run dev` (root) — menjalankan Next dev server.
- Backend dev: `npm run backend` (root) atau `cd backend && npm run dev` — menjalankan `nodemon src/index.js`.
- Start kedua server (parallel): `npm run dev:all` (menggunakan `concurrently`).
- Produksi (statik): `npm run build` lalu `npm start` — `server.js` menyajikan isi `build/` dan mencoba menggunakan `ssl/` bila tersedia.

## Konvensi & pola kode khusus projek
- Apollo: client menggunakan mode `network-only` untuk query/mutate default (lihat `defaultOptions` di `lib/apollo-client.ts`).
- Error handling GraphQL: jika message === 'Not authenticated' code menghapus cookie `auth_token` dan redirect ke `/auth/login`.
- Environment: frontend membaca `NEXT_PUBLIC_API_URL` / `NEXT_PUBLIC_WS_URL` (README), backend memakai `.env` (`MONGODB_URI`, `JWT_SECRET`, `PORT`)
- Backend mengikat port 2053 secara paksa dalam `backend/src/index.js` (lihat konstanta PORT). Jangan ubah asumsi ini tanpa merapihkan dokumentasi dan scripts.

## Pattern perubahan yang aman
- UI: ubahan visual dan components mayor sebaiknya hanya di `components/` dan `app/components`.
- GraphQL: tambah field/queries di `backend/src/schema/*` dan konsisten perubahannya ke `lib/graphql/*` di frontend.
- Service/background tasks: `backend/src/services/*` berisi job seperti `depositWatcher` — berhati-hati saat mengubah interval/background behavior.

## File contoh untuk referensi cepat
- `package.json` — scripts penting: `dev`, `backend`, `dev:all`, `build`, `start`.
- `next.config.mjs` — proyek disiapkan untuk static export/SSG.
- `lib/apollo-client.ts` — konfigurasi endpoint, auth header, error handling.
- `app/providers.tsx` — envelope global: `ApolloProvider` + `AuthProvider`.
- `backend/src/index.js` — bootstrap server, CORS, ApolloServer, dan service inisialisasi.
- `server.js` — static file server + SSL handling untuk produksi.

## Tips debugging cepat
- Jika frontend tidak mengakses GraphQL: periksa `lib/apollo-client.ts` `apiUrl` (env + hardcoded dev URL `http://localhost:2053`).
- Jika build produksi gagal: pastikan `next build` menghasilkan `build/` (perhatikan `next.config.mjs` `output: 'export'`) dan `server.js` mempunyai akses ke `ssl/` jika HTTPS diharapkan.
- Untuk cek logs backend: jalankan `cd backend && npm run dev` dan perhatikan `console.log` yang menampilkan `GraphQL endpoint`.

## Batasan yang harus dihindari
- Jangan mengubah CORS/allowedOrigins tanpa memahami environment deploy (production mengandalkan `moonshoot.fun`).
- Karena proyek terkadang di-deploy sebagai static export, hindari fitur Next server-only (API Routes) tanpa mempertimbangkan backend terpisah.

## Jika kamu butuh menambahkan test / lint
- Repo memiliki `eslint` + TypeScript types; tambahkan tes kecil dan perbarui `package.json` scripts jika menambahkan test runner.

---
Jika ada bagian yang ingin diperjelas (mis. alur WebSocket, rutinitas background `depositWatcher`, atau format env yang dipakai di deployment), beri tahu — saya akan perinci bagian tersebut dengan contoh file dan snippet yang relevan.
