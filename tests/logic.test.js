// Pruebas unitarias de las reglas de negocio. Ejecutar con: npm test  (o  node --test tests/)
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  validarCliente, validarEquipo, validarRepuesto, validarCita, hayConflictoCita, calcularTotales,
  descontarInventario, reintegrarInventario, repuestosBajoStock, puedeAvanzarEstado, siguienteConsecutivo,
  avanceChecklist, CHECKLIST_PREVENTIVO, indicadores, ingresosPorMes, serviciosPorTipo, equiposParaRecordatorio,
  formatoCOP, aCSV, hashPassword,
} from '../src/js/logic.js';

const clienteOK = {
  nombre: 'Papelería El Centro', tipo: 'Microempresa', documento: '901234567-1',
  telefono: '3104567890', email: 'a@b.co', consentimiento: true,
};

describe('CP-01 Validación de clientes (RF-01, Ley 1581)', () => {
  test('acepta un cliente válido', () => assert.equal(validarCliente(clienteOK).valido, true));
  test('rechaza cliente sin autorización de datos', () => {
    const r = validarCliente({ ...clienteOK, consentimiento: false });
    assert.equal(r.valido, false);
    assert.ok(r.errores.consentimiento);
  });
  test('rechaza teléfono y correo inválidos', () => {
    const r = validarCliente({ ...clienteOK, telefono: '12345', email: 'malo@' });
    assert.ok(r.errores.telefono);
    assert.ok(r.errores.email);
  });
  test('acepta teléfono fijo 607', () => assert.equal(validarCliente({ ...clienteOK, telefono: '6075712345' }).valido, true));
  test('rechaza documento con letras', () => assert.ok(validarCliente({ ...clienteOK, documento: 'ABC123' }).errores.documento));
});

describe('CP-02 Validación de equipos y repuestos', () => {
  test('equipo sin serial es inválido', () => {
    assert.ok(validarEquipo({ clienteId: 'c1', tipo: 'Portátil', marca: 'HP', serial: '' }).errores.serial);
  });
  test('equipo completo es válido', () => {
    assert.equal(validarEquipo({ clienteId: 'c1', tipo: 'Portátil', marca: 'HP', serial: 'ABC123' }).valido, true);
  });
  test('precio de venta menor al costo es inválido', () => {
    const r = validarRepuesto({ codigo: 'SSD-1', nombre: 'SSD', stock: 1, stockMinimo: 1, costo: 100, precioVenta: 50 });
    assert.ok(r.errores.precioVenta);
  });
  test('stock negativo es inválido', () => {
    assert.ok(validarRepuesto({ codigo: 'SSD-1', nombre: 'SSD', stock: -1, stockMinimo: 1, costo: 1, precioVenta: 2 }).errores.stock);
  });
});

describe('CP-03 Agenda de citas (RF-03)', () => {
  const base = { clienteId: 'c1', tecnico: 'Andrés', fecha: '2026-11-23', hora: '09:00', duracion: 60 }; // lunes
  const existentes = [{ id: 'x', tecnico: 'Andrés', fecha: '2026-11-23', hora: '09:30', duracion: 60, estado: 'Programada' }];
  test('detecta cruce de horario del mismo técnico', () => {
    assert.ok(hayConflictoCita(base, existentes));
    assert.equal(validarCita(base, existentes).valido, false);
  });
  test('no hay cruce si la cita existente está cancelada', () => {
    assert.equal(hayConflictoCita(base, [{ ...existentes[0], estado: 'Cancelada' }]), null);
  });
  test('no hay cruce con otro técnico', () => {
    assert.equal(hayConflictoCita(base, [{ ...existentes[0], tecnico: 'Otro' }]), null);
  });
  test('citas contiguas no se cruzan', () => {
    assert.equal(hayConflictoCita({ ...base, hora: '10:30' }, existentes), null);
  });
  test('rechaza domingos y fuera de horario', () => {
    assert.ok(validarCita({ ...base, fecha: '2026-11-22' }).errores.fecha);
    assert.ok(validarCita({ ...base, hora: '17:30', duracion: 60 }).errores.hora);
    assert.ok(validarCita({ ...base, hora: '07:00' }).errores.hora);
  });
});

describe('CP-04 Cálculo de totales con IVA (RF-05)', () => {
  test('suma repuestos + mano de obra + IVA 19 %', () => {
    const t = calcularTotales({ repuestos: [{ cantidad: 2, precioUnit: 35000 }], manoObra: 90000 });
    assert.equal(t.subtotal, 160000);
    assert.equal(t.iva, 30400);
    assert.equal(t.total, 190400);
  });
  test('aplica descuento antes del IVA y no supera el subtotal', () => {
    const t = calcularTotales({ repuestos: [], manoObra: 100000, descuento: 20000 });
    assert.equal(t.base, 80000);
    assert.equal(t.total, 95200);
    assert.equal(calcularTotales({ repuestos: [], manoObra: 10000, descuento: 50000 }).total, 0);
  });
});

describe('CP-05 Inventario (RF-04)', () => {
  const inv = [
    { id: 'r1', nombre: 'SSD', stock: 3, stockMinimo: 2 },
    { id: 'r2', nombre: 'RAM', stock: 1, stockMinimo: 2 },
  ];
  test('descuenta existencias sin mutar el original', () => {
    const n = descontarInventario(inv, [{ repuestoId: 'r1', cantidad: 2 }]);
    assert.equal(n[0].stock, 1);
    assert.equal(inv[0].stock, 3);
  });
  test('lanza error si el stock es insuficiente', () => {
    assert.throws(() => descontarInventario(inv, [{ repuestoId: 'r2', cantidad: 5 }]), /Stock insuficiente/);
  });
  test('lanza error si la cantidad no es válida', () => {
    assert.throws(() => descontarInventario(inv, [{ repuestoId: 'r1', cantidad: 0 }]), /Cantidad inválida/);
  });
  test('reintegra existencias', () => {
    assert.equal(reintegrarInventario(inv, [{ repuestoId: 'r2', cantidad: 2 }])[1].stock, 3);
  });
  test('identifica repuestos bajo stock mínimo', () => {
    assert.deepEqual(repuestosBajoStock(inv).map((r) => r.id), ['r2']);
  });
});

describe('CP-06 Flujo de la orden de servicio (RF-05)', () => {
  test('solo permite avanzar al estado siguiente', () => {
    assert.equal(puedeAvanzarEstado('Recibido', 'En diagnóstico'), true);
    assert.equal(puedeAvanzarEstado('Recibido', 'Entregado'), false);
    assert.equal(puedeAvanzarEstado('Entregado', 'Recibido'), false);
  });
  test('genera consecutivo anual secuencial', () => {
    assert.equal(siguienteConsecutivo([], 2026), 'OS-2026-0001');
    assert.equal(siguienteConsecutivo([{ consecutivo: 'OS-2026-0009' }, { consecutivo: 'OS-2025-0050' }], 2026), 'OS-2026-0010');
  });
  test('calcula el avance del checklist preventivo', () => {
    const ch = { [CHECKLIST_PREVENTIVO[0]]: true, [CHECKLIST_PREVENTIVO[1]]: true };
    const a = avanceChecklist(ch);
    assert.equal(a.hechos, 2);
    assert.equal(a.porcentaje, Math.round((2 / CHECKLIST_PREVENTIVO.length) * 100));
  });
});

describe('CP-07 Indicadores y reportes (RF-06)', () => {
  const ordenes = [
    { estado: 'Entregado', tipoServicio: 'Mantenimiento preventivo', fechaIngreso: '2026-11-01', fechaEntrega: '2026-11-03', totales: { total: 100000 }, equipoId: 'e1' },
    { estado: 'Entregado', tipoServicio: 'Mantenimiento correctivo', fechaIngreso: '2026-10-10', fechaEntrega: '2026-10-11', totales: { total: 50000 }, equipoId: 'e2' },
    { estado: 'En reparación', tipoServicio: 'Mantenimiento preventivo', fechaIngreso: '2026-11-15', totales: { total: 70000 } },
  ];
  test('indicadores del mes', () => {
    const k = indicadores({ ordenes, citas: [{ fecha: '2026-11-20', estado: 'Programada' }], repuestos: [], clientes: [{}, {}] }, '2026-11-20');
    assert.equal(k.ingresosMes, 100000);
    assert.equal(k.ordenesAbiertas, 1);
    assert.equal(k.citasHoy, 1);
    assert.equal(k.tiempoPromedio, 1.5);
  });
  test('ingresos por mes de los últimos 2 meses', () => {
    assert.deepEqual(ingresosPorMes(ordenes, 2, '2026-11-20'), [{ mes: '2026-10', total: 50000 }, { mes: '2026-11', total: 100000 }]);
  });
  test('servicios por tipo ordenados', () => {
    assert.deepEqual(serviciosPorTipo(ordenes)[0], { tipo: 'Mantenimiento preventivo', cantidad: 2 });
  });
  test('recordatorio de preventivo para equipos sin mantenimiento reciente', () => {
    const r = equiposParaRecordatorio([{ id: 'e1' }, { id: 'e2' }], ordenes, '2026-11-20', 6);
    assert.deepEqual(r.map((x) => x.equipo.id), ['e2']);
  });
});

describe('CP-08 Utilidades y seguridad', () => {
  test('formato de moneda colombiana', () => assert.equal(formatoCOP(1234567), '$ 1.234.567'));
  test('CSV escapa separadores y comillas', () => {
    const csv = aCSV([{ a: 'x;y', b: 'di "hola"' }], [{ titulo: 'A', valor: 'a' }, { titulo: 'B', valor: 'b' }]);
    assert.equal(csv, 'A;B\n"x;y";"di ""hola"""');
  });
  test('la contraseña se almacena como hash SHA-256 y no en texto plano', async () => {
    const h = await hashPassword('Altf4*2026');
    assert.match(h, /^[a-f0-9]{64}$/);
    assert.notEqual(h, 'Altf4*2026');
    assert.equal(h, await hashPassword('Altf4*2026'));
  });
});
