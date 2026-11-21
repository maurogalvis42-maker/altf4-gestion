import { indicadores, ingresosPorMes, repuestosBajoStock, formatoCOP, hoyISO, equiposParaRecordatorio } from '../logic.js';
import { esc, badge, vacio } from '../ui.js';
import { graficoBarras } from './graficos.js';

export function render(el, { store }) {
  const datos = {
    ordenes: store.todos('ordenes'),
    citas: store.todos('citas'),
    repuestos: store.todos('repuestos'),
    clientes: store.todos('clientes'),
  };
  const k = indicadores(datos);
  const hoy = hoyISO();
  const nombreCli = (id) => datos.clientes.find((c) => c.id === id)?.nombre || '—';
  const proximas = datos.citas
    .filter((c) => c.fecha >= hoy && c.estado !== 'Cancelada' && c.estado !== 'Atendida')
    .sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora))
    .slice(0, 5);
  const abiertas = datos.ordenes.filter((o) => o.estado !== 'Entregado').sort((a, b) => a.fechaIngreso.localeCompare(b.fechaIngreso));
  const bajo = repuestosBajoStock(datos.repuestos);
  const cfg = store.config();
  const recordatorios = equiposParaRecordatorio(store.todos('equipos'), datos.ordenes, hoy, cfg.periodoPreventivoMeses || 6);

  el.innerHTML = `
  <div class="cabecera">
    <div><h1>Tablero de control</h1><p>Resumen operativo al ${new Date().toLocaleDateString('es-CO', { dateStyle: 'full' })}</p></div>
    <div class="acciones"><a class="btn" href="#/ordenes/nueva">+ Nueva orden</a><a class="btn btn-sec" href="#/citas/nueva">+ Agendar cita</a></div>
  </div>
  <section class="rejilla kpis" aria-label="Indicadores">
    <div class="kpi"><div class="etq">Citas de hoy</div><div class="val">${k.citasHoy}</div></div>
    <div class="kpi"><div class="etq">Órdenes abiertas</div><div class="val">${k.ordenesAbiertas}</div></div>
    <div class="kpi"><div class="etq">Ingresos del mes</div><div class="val">${formatoCOP(k.ingresosMes)}</div></div>
    <div class="kpi ${k.bajoStock ? 'alerta' : ''}"><div class="etq">Repuestos bajo mínimo</div><div class="val">${k.bajoStock}</div></div>
    <div class="kpi"><div class="etq">Tiempo prom. de entrega</div><div class="val">${k.tiempoPromedio} días</div></div>
    <div class="kpi"><div class="etq">Clientes registrados</div><div class="val">${k.clientes}</div></div>
  </section>
  <section class="rejilla dos-col">
    <div class="panel">
      <h2>Ingresos por mes (órdenes entregadas, IVA incluido)</h2>
      <canvas id="graf-ingresos" class="grafico" role="img" aria-label="Gráfico de barras de ingresos de los últimos seis meses"></canvas>
    </div>
    <div class="panel">
      <h2>Próximas citas</h2>
      ${proximas.length ? `<ul class="lista-simple">${proximas.map((c) => `
        <li><span><strong>${esc(c.fecha)} ${esc(c.hora)}</strong><br><span class="muted">${esc(nombreCli(c.clienteId))} · ${esc(c.tipoServicio)}</span></span>${badge(c.estado)}</li>`).join('')}</ul>` : vacio('No hay citas próximas.')}
    </div>
  </section>
  <section class="rejilla dos-col" style="margin-top:16px">
    <div class="panel">
      <h2>Órdenes en curso</h2>
      ${abiertas.length ? `<div class="tabla-scroll"><table class="tabla"><thead><tr><th>Orden</th><th>Cliente</th><th class="ocultar-movil">Servicio</th><th>Estado</th></tr></thead><tbody>
      ${abiertas.map((o) => `<tr><td><a href="#/ordenes/${esc(o.id)}">${esc(o.consecutivo)}</a></td><td>${esc(nombreCli(o.clienteId))}</td><td class="ocultar-movil">${esc(o.tipoServicio)}</td><td>${badge(o.estado)}</td></tr>`).join('')}
      </tbody></table></div>` : vacio('No hay órdenes abiertas.')}
    </div>
    <div class="panel">
      <h2>Alertas</h2>
      <ul class="lista-simple">
        ${bajo.map((r) => `<li><span>⚠ Stock bajo: <strong>${esc(r.nombre)}</strong></span><span class="badge badge-rojo">${r.stock} / mín. ${r.stockMinimo}</span></li>`).join('')}
        ${recordatorios.slice(0, 4).map((x) => `<li><span>🔔 Preventivo pendiente: ${esc(x.equipo.marca)} ${esc(x.equipo.modelo)}<br><span class="muted">${esc(nombreCli(x.equipo.clienteId))}</span></span><span class="muted">${x.ultimo ? 'Último: ' + esc(x.ultimo) : 'Sin registro'}</span></li>`).join('')}
        ${!bajo.length && !recordatorios.length ? '<li>Sin alertas.</li>' : ''}
      </ul>
    </div>
  </section>`;

  const serie = ingresosPorMes(datos.ordenes, 6, hoy);
  graficoBarras(
    el.querySelector('#graf-ingresos'),
    serie.map((s) => ({ etiqueta: new Date(s.mes + '-15').toLocaleDateString('es-CO', { month: 'short' }), valor: s.total })),
    (v) => formatoCOP(v)
  );
}
