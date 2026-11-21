// Pruebas de integración: capa de datos + datos de demostración + reglas de negocio.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { Store, driverMemoria } from '../src/js/store.js';
import { generarDatosDemo, CREDENCIALES_DEMO } from '../src/js/seed.js';
import { hashPassword, descontarInventario, calcularTotales } from '../src/js/logic.js';

async function storeDemo() {
  const s = new Store(driverMemoria());
  const d = await generarDatosDemo();
  for (const [c, v] of Object.entries(d)) s.reemplazar(c, v);
  return s;
}

describe('CI-01 Repositorio de datos (CRUD)', () => {
  test('crear, obtener, actualizar y eliminar', () => {
    const s = new Store(driverMemoria());
    const c = s.crear('clientes', { nombre: 'Prueba' });
    assert.ok(c.id);
    assert.equal(s.obtener('clientes', c.id).nombre, 'Prueba');
    s.actualizar('clientes', c.id, { nombre: 'Editado' });
    assert.equal(s.obtener('clientes', c.id).nombre, 'Editado');
    assert.equal(s.eliminar('clientes', c.id), true);
    assert.equal(s.todos('clientes').length, 0);
  });
  test('registra la bitácora de auditoría', () => {
    const s = new Store(driverMemoria());
    s.usuarioActual = { nombre: 'Tester' };
    s.crear('repuestos', { nombre: 'X' });
    const b = s.todos('bitacora');
    assert.equal(b[0].accion, 'Crear');
    assert.equal(b[0].usuario, 'Tester');
  });
  test('exporta e importa un respaldo completo', async () => {
    const s = await storeDemo();
    const resp = s.exportar();
    const s2 = new Store(driverMemoria());
    s2.importar(JSON.parse(JSON.stringify(resp)));
    assert.equal(s2.todos('clientes').length, s.todos('clientes').length);
    assert.throws(() => s2.importar({ app: 'otra' }), /respaldo válido/);
  });
});

describe('CI-02 Datos de demostración consistentes', () => {
  test('todas las órdenes referencian clientes y equipos existentes', async () => {
    const s = await storeDemo();
    for (const o of s.todos('ordenes')) {
      assert.ok(s.obtener('clientes', o.clienteId), `cliente de ${o.consecutivo}`);
      const eq = s.obtener('equipos', o.equipoId);
      assert.ok(eq, `equipo de ${o.consecutivo}`);
      assert.equal(eq.clienteId, o.clienteId, `equipo pertenece al cliente en ${o.consecutivo}`);
      assert.deepEqual(o.totales, calcularTotales(o));
    }
  });
  test('todos los clientes tienen autorización de datos', async () => {
    const s = await storeDemo();
    assert.ok(s.todos('clientes').every((c) => c.consentimiento === true));
  });
  test('las credenciales de prueba validan contra el hash almacenado', async () => {
    const s = await storeDemo();
    for (const c of CREDENCIALES_DEMO) {
      const u = s.todos('usuarios').find((x) => x.email === c.email);
      assert.equal(u.hash, await hashPassword(c.password));
      assert.equal(u.password, undefined, 'no se guarda la contraseña en claro');
    }
  });
});

describe('CI-03 Flujo extremo a extremo: recepción → repuesto → entrega', () => {
  test('una orden consume inventario y calcula el total', async () => {
    const s = await storeDemo();
    const rep = s.todos('repuestos').find((r) => r.codigo === 'SSD-480');
    const stockIni = rep.stock;
    const orden = s.crear('ordenes', { consecutivo: 'OS-TEST-1', clienteId: 'cli_1', equipoId: 'eq_1', tipoServicio: 'Mantenimiento correctivo', estado: 'Recibido', repuestos: [], manoObra: 120000 });
    s.reemplazar('repuestos', descontarInventario(s.todos('repuestos'), [{ repuestoId: rep.id, cantidad: 1 }]));
    const repuestos = [{ repuestoId: rep.id, cantidad: 1, precioUnit: rep.precioVenta }];
    const totales = calcularTotales({ ...orden, repuestos });
    s.actualizar('ordenes', orden.id, { repuestos, totales, estado: 'Entregado', fechaEntrega: '2026-11-20' });
    assert.equal(s.obtener('repuestos', rep.id).stock, stockIni - 1);
    assert.equal(s.obtener('ordenes', orden.id).totales.total, Math.round((120000 + rep.precioVenta) * 1.19));
  });
});
