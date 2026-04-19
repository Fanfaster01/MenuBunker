// Exploración SOLO LECTURA de la DB de La Victoriana.
const fs = require('fs'); const path = require('path'); const sql = require('mssql');
const envPath = path.join(__dirname, '..', '.env');
fs.readFileSync(envPath, 'utf-8').split('\n').forEach((line) => {
  const t = line.trim(); if (!t || t.startsWith('#')) return;
  const eq = t.indexOf('='); if (eq === -1) return;
  const k = t.slice(0, eq).trim(); let v = t.slice(eq + 1).trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  if (!process.env[k]) process.env[k] = v;
});

const config = {
  user: process.env.VICTORIANA_DB_USER,
  password: process.env.VICTORIANA_DB_PASSWORD,
  server: process.env.VICTORIANA_DB_HOST,
  database: process.env.VICTORIANA_DB_NAME,
  port: parseInt(process.env.VICTORIANA_DB_PORT || '14333'),
  options: { trustServerCertificate: true, encrypt: false, enableArithAbort: true },
  connectionTimeout: 30000,
  requestTimeout: 60000,
};

async function main() {
  console.log(`Connecting to ${config.server}:${config.port} / ${config.database}\n`);
  const pool = await sql.connect(config);

  console.log('========== 1) Schema MA_DEPARTAMENTOS ==========');
  const dSchema = await pool.request().query(`SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='MA_DEPARTAMENTOS' ORDER BY ORDINAL_POSITION;`);
  console.table(dSchema.recordset);

  console.log('\n========== 2) Todos los departamentos (con activos) ==========');
  const depts = await pool.request().query(`
    SELECT d.C_CODIGO, d.C_DESCRIPCIO,
      (SELECT COUNT(*) FROM MA_PRODUCTOS p WHERE p.c_Departamento = d.C_CODIGO AND p.n_Activo = 1 AND p.n_Precio1 > 0) AS productos_activos,
      (SELECT COUNT(DISTINCT p.c_Grupo) FROM MA_PRODUCTOS p WHERE p.c_Departamento = d.C_CODIGO AND p.n_Activo = 1 AND p.n_Precio1 > 0) AS grupos_con_productos
    FROM MA_DEPARTAMENTOS d
    ORDER BY d.C_DESCRIPCIO;
  `);
  console.table(depts.recordset);

  console.log('\n========== 3) Schema MA_GRUPOS ==========');
  const gSchema = await pool.request().query(`SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='MA_GRUPOS' ORDER BY ORDINAL_POSITION;`);
  console.table(gSchema.recordset);

  console.log('\n========== 4) Total grupos ==========');
  const gTotal = await pool.request().query(`SELECT COUNT(*) AS total_grupos, COUNT(DISTINCT c_departamento) AS depts_con_grupos FROM MA_GRUPOS;`);
  console.table(gTotal.recordset);

  console.log('\n========== 5) Schema MA_PRODUCTOS (solo columnas relevantes) ==========');
  const pSchema = await pool.request().query(`
    SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME='MA_PRODUCTOS'
      AND COLUMN_NAME IN ('c_Codigo','c_Descri','cu_Descripcion_Corta','n_Precio1','n_Precio2','n_Precio3',
                          'c_Marca','c_Presenta','n_Activo','c_Departamento','c_Grupo','n_Existencia','n_Impuesto1')
    ORDER BY ORDINAL_POSITION;
  `);
  console.table(pSchema.recordset);

  console.log('\n========== 6) Conteos productos (global) ==========');
  const pTotal = await pool.request().query(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN n_Activo = 1 THEN 1 ELSE 0 END) AS activos,
      SUM(CASE WHEN n_Activo = 1 AND n_Precio1 > 0 THEN 1 ELSE 0 END) AS activos_con_precio
    FROM MA_PRODUCTOS;
  `);
  console.table(pTotal.recordset);

  console.log('\n========== 7) Sample 3 productos ==========');
  const samples = await pool.request().query(`
    SELECT TOP 3 c_Codigo, c_Descri, cu_Descripcion_Corta, n_Precio1, c_Marca, c_Presenta, c_Departamento, c_Grupo, n_Activo
    FROM MA_PRODUCTOS WHERE n_Activo = 1 AND n_Precio1 > 0;
  `);
  console.log(JSON.stringify(samples.recordset, null, 2));

  console.log('\n========== 8) Tax / impuesto (hay campo n_Impuesto1?) ==========');
  try {
    const tax = await pool.request().query(`
      SELECT TOP 5 n_Impuesto1, COUNT(*) AS cnt
      FROM MA_PRODUCTOS GROUP BY n_Impuesto1 ORDER BY cnt DESC;
    `);
    console.table(tax.recordset);
  } catch(e) { console.log('  N/A:', e.message); }

  await pool.close();
}
main().catch(e => { console.error('ERR:', e.message); process.exit(1); });
