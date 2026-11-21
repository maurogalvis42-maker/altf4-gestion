/**
 * ALT+F4 Gestión — Reglas de negocio (módulo puro, sin dependencias del navegador).
 * Se importa tanto desde la interfaz web como desde las pruebas unitarias (node --test).
 */

export const IVA = 0.19;

export const ESTADOS_ORDEN = ['Recibido', 'En diagnóstico', 'En reparación', 'Listo para entrega', 'Entregado'];
export const ESTADOS_CITA = ['Programada', 'Confirmada', 'Atendida', 'Cancelada'];
export const TIPOS_CLIENTE = ['Microempresa', 'Profesional independiente', 'Residencial'];
export const TIPOS_EQUIPO = ['Portátil', 'Escritorio', 'Todo en uno', 'Servidor', 'Impresora'];

export const CHECKLIST_PREVENTIVO = [
  'Limpieza interna con aire comprimido',
  'Cambio de pasta térmica del procesador',
  'Revisión de ventiladores y disipadores',
  'Diagnóstico S.M.A.R.T. del disco (CrystalDiskInfo)',
  'Prueba de memoria RAM (MemTest86)',
  'Monitoreo de temperaturas (HWMonitor)',
  'Actualización del sistema operativo y controladores',
  'Análisis antivirus / antimalware',
  'Limpieza de archivos temporales y programas de inicio',
  'Verificación de copia de seguridad del cliente',
];

/* ---------------------------------------------------------------- utilidades */

export function uid(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

export function redondear(valor) {
  return Math.round((Number(valor) + Number.EPSILON) * 100) / 100;
}

export function formatoCOP(valor) {
  const n = Math.round(Number(valor) || 0);
  return '$ ' + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function hoyISO(fecha = new Date()) {
  const d = new Date(fecha);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

/* --------------------------------------------------------------- validaciones */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TEL_RE = /^(\+?57)?\s?3\d{2}\s?\d{3}\s?\d{4}$|^(\+?57)?\s?60\d\s?\d{3}\s?\d{4}$/;
const DOC_RE = /^\d{6,10}(-\d)?$/;

export function validarCliente(c) {
  const errores = {};
  if (!c.nombre || c.nombre.trim().length < 3) errores.nombre = 'El nombre debe tener al menos 3 caracteres.';
  if (!TIPOS_CLIENTE.includes(c.tipo)) errores.tipo = 'Seleccione un tipo de cliente válido.';
  if (!c.documento || !DOC_RE.test(String(c.documento).replace(/\./g, '')))
    errores.documento = 'Documento inválido (CC o NIT de 6 a 10 dígitos, NIT con dígito de verificación opcional).';
  if (!c.telefono || !TEL_RE.test(String(c.telefono).trim()))
    errores.telefono = 'Teléfono inválido (celular 3XX XXX XXXX o fijo 60X XXX XXXX).';
  if (c.email && !EMAIL_RE.test(c.email)) errores.email = 'Correo electrónico inválido.';
  if (!c.consentimiento)
    errores.consentimiento = 'Se requiere la autorización de tratamiento de datos personales (Ley 1581 de 2012).';
  return { valido: Object.keys(errores).length === 0, errores };
}

export function validarEquipo(e) {
  const errores = {};
  if (!e.clienteId) errores.clienteId = 'Seleccione el cliente propietario.';
  if (!TIPOS_EQUIPO.includes(e.tipo)) errores.tipo = 'Seleccione un tipo de equipo válido.';
  if (!e.marca || e.marca.trim().length < 2) errores.marca = 'Indique la marca.';
  if (!e.serial || e.serial.trim().length < 4) errores.serial = 'El serial debe tener al menos 4 caracteres.';
  return { valido: Object.keys(errores).length === 0, errores };
}

export function validarRepuesto(r) {
  const errores = {};
  if (!r.codigo || !/^[A-Z0-9-]{3,15}$/.test(r.codigo)) errores.codigo = 'Código en mayúsculas, 3 a 15 caracteres.';
  if (!r.nombre || r.nombre.trim().length < 3) errores.nombre = 'Indique el nombre del repuesto.';
  if (!Number.isInteger(Number(r.stock)) || Number(r.stock) < 0) errores.stock = 'El stock debe ser un entero mayor o igual a 0.';
  if (!Number.isInteger(Number(r.stockMinimo)) || Number(r.stockMinimo) < 0) errores.stockMinimo = 'El stock mínimo debe ser un entero ≥ 0.';
  if (!(Number(r.costo) >= 0)) errores.costo = 'Costo inválido.';
  if (!(Number(r.precioVenta) >= 0)) errores.precioVenta = 'Precio inválido.';
  if (Number(r.precioVenta) < Number(r.costo)) errores.precioVenta = 'El precio de venta no puede ser menor al costo.';
  return { valido: Object.keys(errores).length === 0, errores };
}

/* --------------------------------------------------------------------- citas */

function aMinutos(hora) {
  const [h, m] = String(hora).split(':').map(Number);
  return h * 60 + m;
}

/** Horario de atención: lunes a sábado de 08:00 a 18:00. */
export function validarCita(cita, citasExistentes = []) {
  const errores = {};
  if (!cita.clienteId) errores.clienteId = 'Seleccione el cliente.';
  if (!cita.fecha) errores.fecha = 'Seleccione la fecha.';
  if (!cita.hora) errores.hora = 'Seleccione la hora.';
  const dur = Number(cita.duracion) || 60;
  if (cita.fecha && cita.hora) {
    const dia = new Date(cita.fecha + 'T00:00:00').getDay();
    if (dia === 0) errores.fecha = 'No se agendan citas los domingos.';
    const ini = aMinutos(cita.hora);
    if (ini < 8 * 60 || ini + dur > 18 * 60) errores.hora = 'La cita debe estar entre las 08:00 y las 18:00.';
    const choque = hayConflictoCita({ ...cita, duracion: dur }, citasExistentes);
    if (choque) errores.hora = `El técnico ya tiene una cita a las ${choque.hora} ese día.`;
  }
  return { valido: Object.keys(errores).length === 0, errores };
}

export function hayConflictoCita(cita, citas) {
  const ini = aMinutos(cita.hora);
  const fin = ini + (Number(cita.duracion) || 60);
  return (
    citas.find((c) => {
      if (c.id === cita.id || c.estado === 'Cancelada') return false;
      if (c.fecha !== cita.fecha || c.tecnico !== cita.tecnico) return false;
      const ci = aMinutos(c.hora);
      const cf = ci + (Number(c.duracion) || 60);
      return ini < cf && ci < fin;
    }) || null
  );
}

/* ------------------------------------------------------- órdenes e inventario */

export function calcularTotales(orden, tarifaBase = 0) {
  const repuestos = (orden.repuestos || []).reduce(
    (s, r) => s + Number(r.cantidad || 0) * Number(r.precioUnit || 0),
    0
  );
  const manoObra = Number(orden.manoObra ?? tarifaBase) || 0;
  const subtotal = repuestos + manoObra;
  const descuento = Math.min(Number(orden.descuento || 0), subtotal);
  const base = subtotal - descuento;
  const iva = redondear(base * IVA);
  return {
    repuestos: redondear(repuestos),
    manoObra: redondear(manoObra),
    subtotal: redondear(subtotal),
    descuento: redondear(descuento),
    base: redondear(base),
    iva,
    total: redondear(base + iva),
  };
}

/**
 * Verifica que haya existencias para los repuestos pedidos y devuelve el
 * inventario actualizado (sin mutar el original). Lanza Error si no alcanza.
 */
export function descontarInventario(inventario, items) {
  const copia = inventario.map((r) => ({ ...r }));
  for (const it of items) {
    const rep = copia.find((r) => r.id === it.repuestoId);
    if (!rep) throw new Error(`El repuesto ${it.repuestoId} no existe en el inventario.`);
    const cant = Number(it.cantidad);
    if (!Number.isInteger(cant) || cant <= 0) throw new Error(`Cantidad inválida para ${rep.nombre}.`);
    if (rep.stock < cant) throw new Error(`Stock insuficiente de ${rep.nombre}: disponible ${rep.stock}, solicitado ${cant}.`);
    rep.stock -= cant;
  }
  return copia;
}

export function reintegrarInventario(inventario, items) {
  const copia = inventario.map((r) => ({ ...r }));
  for (const it of items) {
    const rep = copia.find((r) => r.id === it.repuestoId);
    if (rep) rep.stock += Number(it.cantidad) || 0;
  }
  return copia;
}

export function repuestosBajoStock(inventario) {
  return inventario.filter((r) => Number(r.stock) <= Number(r.stockMinimo));
}

export function puedeAvanzarEstado(actual, siguiente) {
  const i = ESTADOS_ORDEN.indexOf(actual);
  const j = ESTADOS_ORDEN.indexOf(siguiente);
  return i >= 0 && j >= 0 && (j === i + 1 || j === i);
}

export function siguienteConsecutivo(ordenes, anio = new Date().getFullYear()) {
  const pref = `OS-${anio}-`;
  const max = ordenes
    .map((o) => o.consecutivo || '')
    .filter((c) => c.startsWith(pref))
    .map((c) => parseInt(c.slice(pref.length), 10) || 0)
    .reduce((a, b) => Math.max(a, b), 0);
  return pref + String(max + 1).padStart(4, '0');
}

export function avanceChecklist(checklist = {}) {
  const total = CHECKLIST_PREVENTIVO.length;
  const hechos = CHECKLIST_PREVENTIVO.filter((t) => checklist[t]).length;
  return { hechos, total, porcentaje: Math.round((hechos / total) * 100) };
}

/* ---------------------------------------------------------------- indicadores */

export function indicadores({ ordenes = [], citas = [], repuestos = [], clientes = [] }, hoy = hoyISO()) {
  const mes = hoy.slice(0, 7);
  const entregadasMes = ordenes.filter((o) => o.estado === 'Entregado' && (o.fechaEntrega || '').startsWith(mes));
  const ingresosMes = entregadasMes.reduce((s, o) => s + (o.totales?.total || 0), 0);
  const abiertas = ordenes.filter((o) => o.estado !== 'Entregado').length;
  const citasHoy = citas.filter((c) => c.fecha === hoy && c.estado !== 'Cancelada').length;
  const bajoStock = repuestosBajoStock(repuestos).length;

  const tiempos = ordenes
    .filter((o) => o.estado === 'Entregado' && o.fechaIngreso && o.fechaEntrega)
    .map((o) => (new Date(o.fechaEntrega) - new Date(o.fechaIngreso)) / 86400000);
  const tiempoPromedio = tiempos.length ? redondear(tiempos.reduce((a, b) => a + b, 0) / tiempos.length) : 0;

  return {
    clientes: clientes.length,
    citasHoy,
    ordenesAbiertas: abiertas,
    ingresosMes: redondear(ingresosMes),
    bajoStock,
    tiempoPromedio,
  };
}

export function ingresosPorMes(ordenes, meses = 6, hoy = hoyISO()) {
  const [a, m] = hoy.split('-').map(Number);
  const res = [];
  for (let k = meses - 1; k >= 0; k--) {
    const d = new Date(a, m - 1 - k, 1);
    const clave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const total = ordenes
      .filter((o) => o.estado === 'Entregado' && (o.fechaEntrega || '').startsWith(clave))
      .reduce((s, o) => s + (o.totales?.total || 0), 0);
    res.push({ mes: clave, total: redondear(total) });
  }
  return res;
}

export function serviciosPorTipo(ordenes) {
  const mapa = {};
  for (const o of ordenes) mapa[o.tipoServicio] = (mapa[o.tipoServicio] || 0) + 1;
  return Object.entries(mapa)
    .map(([tipo, cantidad]) => ({ tipo, cantidad }))
    .sort((x, y) => y.cantidad - x.cantidad);
}

/** Equipos cuyo último mantenimiento preventivo supera el periodo recomendado (meses). */
export function equiposParaRecordatorio(equipos, ordenes, hoy = hoyISO(), periodoMeses = 6) {
  const limite = new Date(hoy);
  limite.setMonth(limite.getMonth() - periodoMeses);
  return equipos
    .map((e) => {
      const prev = ordenes
        .filter((o) => o.equipoId === e.id && o.tipoServicio === 'Mantenimiento preventivo' && o.estado === 'Entregado')
        .map((o) => o.fechaEntrega)
        .sort()
        .pop();
      return { equipo: e, ultimo: prev || null };
    })
    .filter((x) => !x.ultimo || new Date(x.ultimo) < limite);
}

/* ----------------------------------------------------------------- utilidades */

export function aCSV(filas, columnas) {
  const esc = (v) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",;\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const cab = columnas.map((c) => esc(c.titulo)).join(';');
  const cuerpo = filas.map((f) => columnas.map((c) => esc(typeof c.valor === 'function' ? c.valor(f) : f[c.valor])).join(';'));
  return [cab, ...cuerpo].join('\n');
}

export async function hashPassword(texto) {
  const data = new TextEncoder().encode('altf4::' + texto);
  const buf = await globalThis.crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
