import { ingresosPorMes, serviciosPorTipo, formatoCOP, hoyISO, aCSV, indicadores } from '../logic.js';
import { esc, descargar } from '../ui.js';
import { graficoBarras, barrasHTML } from './graficos.js';

let rango = null;

export function render(el, ctx) {
  const { store } = ctx;
  if (!rango) {
    const d = new Date();
    d.setMonth(d.getMonth() - 6);
    rango = { desde: hoyISO(d), hasta: hoyISO() };
  }
  const clientes = store.todos('clientes');
  const nombreCli = (id) => clientes.find((c) => c.id === id)?.nombre || '—';
  const todas = store.todos('ordenes');
  const ordenes = todas.filter((o) => o.fechaIngreso >= rango.desde && o.fechaIngreso <= rango.hasta);
  const entregadas = ordenes.filter((o) => o.estado === 'Entregado');
  const ingresos = entregadas.reduce((s, o) => s + (o.totales?.total || 0), 0);
  const ticket = entregadas.length ? ingresos / entregadas.length : 0;
  const k = indicadores({ ordenes, citas: [], repuestos: [], clientes });
  const porTipo = serviciosPorTipo(ordenes);
  const porTipoCliente = {};
  for (const o of entregadas) {
    const t = clientes.find((c) => c.id === o.clienteId)?.tipo || 'Otro';
    porTipoCliente[t] = (porTipoCliente[t] || 0) + (o.totales?.total || 0);
  }
  const topClientes = Object.entries(
    entregadas.reduce((m, o) => ({ ...m, [o.clienteId]: (m[o.clienteId] || 0) + (o.totales?.total || 0) }), {})
  ).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const usoRep = {};
  for (const o of ordenes) for (const r of o.repuestos || []) usoRep[r.repuestoId] = (usoRep[r.repuestoId] || 0) + r.cantidad;
  const reps = store.todos('repuestos');

  el.innerHTML = `
  <div class="cabecera">
    <div><h1>Reportes de gestión</h1><p>Indicadores del servicio técnico para la toma de decisiones.</p></div>
    <div class="acciones"><button class="btn btn-sec" id="btn-csv">Exportar órdenes (CSV)</button><button class="btn btn-sec" id="btn-print">Imprimir</button></div>
  </div>
  <div class="panel no-print" style="margin-bottom:16px">
    <div class="filtros" style="margin:0">
      <label>Desde<input type="date" id="r-desde" value="${esc(rango.desde)}"></label>
      <label>Hasta<input type="date" id="r-hasta" value="${esc(rango.hasta)}"></label>
    </div>
  </div>
  <section class="rejilla kpis">
    <div class="kpi"><div class="etq">Órdenes en el periodo</div><div class="val">${ordenes.length}</div></div>
    <div class="kpi"><div class="etq">Órdenes entregadas</div><div class="val">${entregadas.length}</div></div>
    <div class="kpi"><div class="etq">Ingresos (IVA incl.)</div><div class="val">${formatoCOP(ingresos)}</div></div>
    <div class="kpi"><div class="etq">Ticket promedio</div><div class="val">${formatoCOP(ticket)}</div></div>
    <div class="kpi"><div class="etq">Tiempo prom. de entrega</div><div class="val">${k.tiempoPromedio} días</div></div>
  </section>
  <section class="rejilla dos-col">
    <div class="panel"><h2>Ingresos de los últimos 6 meses</h2><canvas id="g-ing" class="grafico" role="img" aria-label="Ingresos mensuales"></canvas></div>
    <div class="panel"><h2>Servicios por tipo</h2>${barrasHTML(porTipo.map((x) => ({ etiqueta: x.tipo, valor: x.cantidad })), (v) => v + ' ord.') || '<p class="muted">Sin datos.</p>'}</div>
  </section>
  <section class="rejilla dos-col" style="margin-top:16px">
    <div class="panel"><h2>Ingresos por segmento de cliente</h2>${barrasHTML(Object.entries(porTipoCliente).map(([etiqueta, valor]) => ({ etiqueta, valor })), formatoCOP) || '<p class="muted">Sin datos.</p>'}</div>
    <div class="panel"><h2>Clientes con mayor facturación</h2>
      <ol>${topClientes.map(([id, v]) => `<li>${esc(nombreCli(id))} — <strong>${formatoCOP(v)}</strong></li>`).join('') || '<li class="muted">Sin datos</li>'}</ol>
      <h2 style="margin-top:12px">Repuestos más utilizados</h2>
      <ol>${Object.entries(usoRep).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, n]) => `<li>${esc(reps.find((r) => r.id === id)?.nombre || id)} — ${n} und.</li>`).join('') || '<li class="muted">Sin datos</li>'}</ol>
    </div>
  </section>`;

  graficoBarras(el.querySelector('#g-ing'), ingresosPorMes(todas, 6).map((s) => ({ etiqueta: new Date(s.mes + '-15').toLocaleDateString('es-CO', { month: 'short' }), valor: s.total })), formatoCOP);

  el.querySelector('#r-desde').addEventListener('change', (e) => { rango.desde = e.target.value; render(el, ctx); });
  el.querySelector('#r-hasta').addEventListener('change', (e) => { rango.hasta = e.target.value; render(el, ctx); });
  el.querySelector('#btn-print').addEventListener('click', () => window.print());
  el.querySelector('#btn-csv').addEventListener('click', () => {
    const csv = aCSV(ordenes, [
      { titulo: 'Orden', valor: 'consecutivo' }, { titulo: 'Cliente', valor: (o) => nombreCli(o.clienteId) },
      { titulo: 'Servicio', valor: 'tipoServicio' }, { titulo: 'Estado', valor: 'estado' },
      { titulo: 'Ingreso', valor: 'fechaIngreso' }, { titulo: 'Entrega', valor: 'fechaEntrega' },
      { titulo: 'Total', valor: (o) => o.totales?.total || 0 },
    ]);
    descargar(`ordenes_${rango.desde}_${rango.hasta}.csv`, '﻿' + csv, 'text/csv;charset=utf-8');
  });
}
