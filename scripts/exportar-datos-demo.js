// Genera data/datos_demo.json con el conjunto de datos simulados usado por el prototipo.
// Uso: node scripts/exportar-datos-demo.js
import { writeFile } from 'node:fs/promises';
import { generarDatosDemo } from '../src/js/seed.js';

const datos = await generarDatosDemo();
for (const u of datos.usuarios) delete u.hash;
await writeFile(new URL('../data/datos_demo.json', import.meta.url), JSON.stringify(datos, null, 2), 'utf8');
console.log('data/datos_demo.json generado:', Object.fromEntries(Object.entries(datos).map(([k, v]) => [k, Array.isArray(v) ? v.length : 1])));
