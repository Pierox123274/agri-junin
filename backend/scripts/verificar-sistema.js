/**
 * Verifica MySQL, APIs externas y endpoints principales.
 * Uso: node scripts/verificar-sistema.js
 */
require('../config/env');
const http = require('http');
const https = require('https');
const { pool } = require('../config/database');

const ok = (msg) => console.log(`  ✓ ${msg}`);
const fail = (msg) => console.log(`  ✗ ${msg}`);
const warn = (msg) => console.log(`  ⚠ ${msg}`);

let errores = 0;

function httpJson(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: 'localhost',
        port: parseInt(process.env.PORT || '3000', 10),
        path: `/api${path}`,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => { raw += c; });
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(raw) });
          } catch {
            resolve({ status: res.statusCode, data: raw });
          }
        });
      }
    );
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { family: 4 }, (res) => {
        let raw = '';
        res.on('data', (c) => { raw += c; });
        res.on('end', () => resolve({ status: res.statusCode, raw }));
      })
      .on('error', reject);
  });
}

async function verificarDb() {
  console.log('\n1. Base de datos MySQL');
  try {
    const [tables] = await pool.query('SHOW TABLES');
    if (!tables.length) {
      fail('Sin tablas. Ejecute: mysql -u root -p < database/agri_junin_completo.sql');
      errores += 1;
      return;
    }
    const [[{ c: usuarios }]] = await pool.query('SELECT COUNT(*) AS c FROM usuarios');
    const [[{ c: lotes }]] = await pool.query('SELECT COUNT(*) AS c FROM lotes');
    ok(`Conectado — ${usuarios} usuarios, ${lotes} lotes`);
  } catch (e) {
    fail(e.message);
    fail('Revise DB_HOST, DB_USER, DB_PASSWORD, DB_NAME en backend/.env');
    errores += 1;
  }
}

async function verificarEnv() {
  console.log('\n2. Variables de entorno (backend/.env)');
  if (process.env.TREFLE_API_TOKEN?.trim()) ok('TREFLE_API_TOKEN');
  else { warn('TREFLE_API_TOKEN vacía — búsqueda científica desactivada'); errores += 1; }

  if (process.env.GOOGLE_MAPS_API_KEY?.trim()) ok('GOOGLE_MAPS_API_KEY');
  else { warn('GOOGLE_MAPS_API_KEY vacía — mapas de lotes desactivados'); errores += 1; }

  if (process.env.APISPERU_DNI_TOKEN?.trim()) ok('APISPERU_DNI_TOKEN');
  else warn('APISPERU_DNI_TOKEN vacía — DNI manual en registro (opcional)');
}

async function verificarApisExternas() {
  console.log('\n3. APIs externas');
  const trefle = process.env.TREFLE_API_TOKEN?.trim();
  if (trefle) {
    try {
      const { status, raw } = await httpsGet(
        `https://trefle.io/api/v1/plants/search?token=${encodeURIComponent(trefle)}&q=papa`
      );
      if (status === 200 && raw.includes('"data"')) ok('Trefle.io responde');
      else { fail(`Trefle HTTP ${status}`); errores += 1; }
    } catch (e) {
      fail(`Trefle: ${e.message}`);
      errores += 1;
    }
  }

  const dniToken = process.env.APISPERU_DNI_TOKEN?.trim();
  if (dniToken) {
    try {
      const { status, raw } = await httpsGet(
        `https://dniruc.apisperu.com/api/v1/dni/45218763?token=${encodeURIComponent(dniToken)}`
      );
      if (status === 200 && raw.includes('success')) ok('APIS Peru DNI responde');
      else warn(`APIS Peru HTTP ${status} — verifique token o créditos`);
    } catch (e) {
      warn(`APIS Peru: ${e.message}`);
    }
  }
}

async function verificarApiLocal() {
  console.log('\n4. API local (http://localhost:3000)');
  try {
    const health = await httpJson('GET', '/health');
    if (health.status === 200) ok('/api/health');
    else { fail(`/api/health → ${health.status}`); errores += 1; return; }

    const login = await httpJson('POST', '/auth/login', {
      email: 'admin@agrijunin.pe',
      password: 'Admin123!',
    });
    if (login.status !== 200 || !login.data?.data?.token) {
      fail('Login admin falló — ejecute: node database/fix-passwords.js');
      errores += 1;
      return;
    }
    ok('Login administrador');

    const token = login.data.data.token;
    const rutas = [
      '/dashboard/stats',
      '/clima/huancayo',
      '/plantas/buscar?q=papa',
      '/maps/config',
      '/lotes?limit=1',
      '/alertas?limit=1',
    ];
    for (const ruta of rutas) {
      const r = await httpJson('GET', ruta, null, token);
      if (r.status === 200) ok(ruta);
      else { fail(`${ruta} → ${r.status}`); errores += 1; }
    }
  } catch (e) {
    fail(`Servidor no responde: ${e.message}`);
    fail('Inicie el backend: cd backend && npm run dev');
    errores += 1;
  }
}

async function run() {
  console.log('=== AgriJunín — verificación del sistema ===');
  await verificarDb();
  await verificarEnv();
  await verificarApisExternas();
  await verificarApiLocal();
  await pool.end();

  console.log('\n' + (errores ? `Resultado: ${errores} problema(s) detectado(s)` : 'Resultado: TODO OK — sistema listo'));
  console.log('\nAbra: http://127.0.0.1:4200');
  console.log('Login: admin@agrijunin.pe / Admin123!\n');
  process.exit(errores ? 1 : 0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
