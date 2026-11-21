/**
 * Capa de persistencia de ALT+F4 Gestión.
 * Implementa un repositorio genérico (patrón Repository) sobre un "driver" de
 * almacenamiento. En el navegador se usa localStorage; en pruebas, memoria.
 * Esto permite reemplazar el almacenamiento por una API REST en versiones futuras
 * sin modificar las vistas.
 */
import { uid } from './logic.js';

export const COLECCIONES = ['usuarios', 'clientes', 'equipos', 'citas', 'ordenes', 'repuestos', 'servicios', 'bitacora', 'config'];
const PREFIJO = 'altf4.v1.';

export function driverMemoria() {
  const mapa = new Map();
  return {
    getItem: (k) => (mapa.has(k) ? mapa.get(k) : null),
    setItem: (k, v) => mapa.set(k, String(v)),
    removeItem: (k) => mapa.delete(k),
  };
}

function driverPorDefecto() {
  try {
    const t = '__altf4_test__';
    globalThis.localStorage.setItem(t, '1');
    globalThis.localStorage.removeItem(t);
    return globalThis.localStorage;
  } catch {
    return driverMemoria();
  }
}

export class Store {
  constructor(driver = driverPorDefecto()) {
    this.driver = driver;
    this.oyentes = new Set();
    this.usuarioActual = null;
  }

  leer(col) {
    try {
      const raw = this.driver.getItem(PREFIJO + col);
      return raw ? JSON.parse(raw) : col === 'config' ? {} : [];
    } catch {
      return col === 'config' ? {} : [];
    }
  }

  escribir(col, datos) {
    this.driver.setItem(PREFIJO + col, JSON.stringify(datos));
    this.oyentes.forEach((fn) => fn(col));
  }

  todos(col) {
    return this.leer(col);
  }

  obtener(col, id) {
    return this.leer(col).find((x) => x.id === id) || null;
  }

  crear(col, obj) {
    const lista = this.leer(col);
    const nuevo = { ...obj, id: obj.id || uid(col.slice(0, 3)), creado: obj.creado || new Date().toISOString() };
    lista.push(nuevo);
    this.escribir(col, lista);
    this.registrar('Crear', col, nuevo.id);
    return nuevo;
  }

  actualizar(col, id, cambios) {
    const lista = this.leer(col);
    const i = lista.findIndex((x) => x.id === id);
    if (i < 0) throw new Error(`Registro ${id} no encontrado en ${col}.`);
    lista[i] = { ...lista[i], ...cambios, id, actualizado: new Date().toISOString() };
    this.escribir(col, lista);
    this.registrar('Actualizar', col, id);
    return lista[i];
  }

  eliminar(col, id) {
    const lista = this.leer(col);
    const filtrada = lista.filter((x) => x.id !== id);
    if (filtrada.length === lista.length) return false;
    this.escribir(col, filtrada);
    this.registrar('Eliminar', col, id);
    return true;
  }

  reemplazar(col, lista) {
    this.escribir(col, lista);
  }

  config() {
    return this.leer('config');
  }

  guardarConfig(cfg) {
    this.escribir('config', { ...this.config(), ...cfg });
  }

  registrar(accion, coleccion, registroId) {
    if (coleccion === 'bitacora') return;
    const bit = this.leer('bitacora');
    bit.unshift({
      id: uid('bit'),
      fecha: new Date().toISOString(),
      usuario: this.usuarioActual?.nombre || 'sistema',
      accion,
      coleccion,
      registroId,
    });
    this.driver.setItem(PREFIJO + 'bitacora', JSON.stringify(bit.slice(0, 300)));
  }

  inicializado() {
    return this.leer('usuarios').length > 0;
  }

  exportar() {
    const out = { app: 'ALT+F4 Gestión', version: 1, fecha: new Date().toISOString() };
    for (const c of COLECCIONES) out[c] = this.leer(c);
    return out;
  }

  importar(respaldo) {
    if (!respaldo || respaldo.app !== 'ALT+F4 Gestión') throw new Error('El archivo no es un respaldo válido de ALT+F4 Gestión.');
    for (const c of COLECCIONES) if (respaldo[c] !== undefined) this.escribir(c, respaldo[c]);
  }

  limpiar() {
    for (const c of COLECCIONES) this.driver.removeItem(PREFIJO + c);
  }

  suscribir(fn) {
    this.oyentes.add(fn);
    return () => this.oyentes.delete(fn);
  }
}
