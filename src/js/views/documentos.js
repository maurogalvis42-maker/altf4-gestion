/** Generación de documentos imprimibles: informe técnico y cotización de una orden. */
import { calcularTotales, formatoCOP, CHECKLIST_PREVENTIVO, avanceChecklist } from '../logic.js';
import { esc, modal, cerrarModal } from '../ui.js';

export function documentoOrden(store, o, tipo = 'informe') {
  const cfg = store.config();
  const cli = store.obtener('clientes', o.clienteId) || {};
  const eq = store.obtener('equipos', o.equipoId) || {};
  const inv = store.todos('repuestos');
  const t = calcularTotales(o);
  const esInforme = tipo === 'informe';
  const av = avanceChecklist(o.checklist);
  const titulo = esInforme ? 'Informe técnico de servicio' : 'Cotización de servicio';

  const html = `
  <article class="documento" id="doc-imprimir">
    <header class="doc-cab">
      <div><div class="logo" style="display:inline-grid;margin-right:8px;vertical-align:middle">F4</div>
        <strong>${esc(cfg.empresa || 'ALT+F4')}</strong><br>
        <span class="muted">NIT ${esc(cfg.nit || '')} · ${esc(cfg.telefono || '')} · ${esc(cfg.email || '')}<br>${esc(cfg.direccion || '')}</span></div>
      <div style="text-align:right"><h2>${titulo}</h2><strong>${esc(o.consecutivo)}</strong><br>
        <span class="muted">Fecha: ${esc(esInforme ? o.fechaEntrega || o.fechaIngreso : new Date().toISOString().slice(0, 10))}</span></div>
    </header>
    <table class="tabla" style="margin-bottom:14px"><tbody>
      <tr><th style="width:24%">Cliente</th><td>${esc(cli.nombre || '')} — ${esc(cli.documento || '')}</td></tr>
      <tr><th>Contacto</th><td>${esc(cli.telefono || '')} · ${esc(cli.email || '')}</td></tr>
      <tr><th>Equipo</th><td>${esc(eq.tipo || '')} ${esc(eq.marca || '')} ${esc(eq.modelo || '')} — S/N ${esc(eq.serial || '')}</td></tr>
      <tr><th>Servicio</th><td>${esc(o.tipoServicio)} · Técnico: ${esc(o.tecnico || '')}</td></tr>
      ${esInforme ? `<tr><th>Estado</th><td>${esc(o.estado)} · Ingreso ${esc(o.fechaIngreso)}${o.fechaEntrega ? ' · Entrega ' + esc(o.fechaEntrega) : ''}</td></tr>` : ''}
    </tbody></table>
    ${esInforme ? `
      <h3>Diagnóstico</h3><p>${esc(o.diagnostico || '—')}</p>
      ${o.tipoServicio === 'Mantenimiento preventivo' ? `<h3>Actividades de mantenimiento preventivo (${av.porcentaje} %)</h3>
      <ul>${CHECKLIST_PREVENTIVO.map((x) => `<li>${o.checklist?.[x] ? '✔' : '✘'} ${esc(x)}</li>`).join('')}</ul>` : ''}
      <h3>Observaciones y recomendaciones</h3><p>${esc(o.observaciones || '—')}</p>` : `<p>Por medio de la presente, ALT+F4 presenta la siguiente cotización para el servicio solicitado. Vigencia de la oferta: 15 días calendario.</p>`}
    <h3>Detalle de costos</h3>
    <table class="tabla"><thead><tr><th>Concepto</th><th class="num">Cant.</th><th class="num">Valor unit.</th><th class="num">Valor</th></tr></thead><tbody>
      <tr><td>Mano de obra — ${esc(o.tipoServicio)}</td><td class="num">1</td><td class="num">${formatoCOP(t.manoObra)}</td><td class="num">${formatoCOP(t.manoObra)}</td></tr>
      ${(o.repuestos || []).map((r) => `<tr><td>${esc(inv.find((x) => x.id === r.repuestoId)?.nombre || r.repuestoId)}</td><td class="num">${r.cantidad}</td><td class="num">${formatoCOP(r.precioUnit)}</td><td class="num">${formatoCOP(r.cantidad * r.precioUnit)}</td></tr>`).join('')}
    </tbody></table>
    <div class="resumen-totales" style="margin-top:10px">
      <div><span>Subtotal</span><span>${formatoCOP(t.subtotal)}</span></div>
      <div><span>Descuento</span><span>- ${formatoCOP(t.descuento)}</span></div>
      <div><span>IVA 19 %</span><span>${formatoCOP(t.iva)}</span></div>
      <div class="total"><span>Total</span><span>${formatoCOP(t.total)}</span></div>
    </div>
    <p class="muted" style="margin-top:14px">Garantía de ${o.garantiaDias || 30} días sobre la mano de obra y los repuestos instalados. Los datos personales se tratan conforme a la Ley 1581 de 2012.</p>
    <div class="firma"><div>Firma técnico ALT+F4</div><div>Firma y C.C. del cliente</div></div>
  </article>`;

  modal({
    titulo,
    ancho: 'grande',
    cuerpo: html,
    acciones: [
      { texto: 'Cerrar', clase: 'btn-sec', onClick: cerrarModal },
      { texto: 'Imprimir / Guardar PDF', onClick: () => {
        document.body.classList.add('imprimiendo');
        window.print();
        setTimeout(() => document.body.classList.remove('imprimiendo'), 500);
      } },
    ],
  });
}
