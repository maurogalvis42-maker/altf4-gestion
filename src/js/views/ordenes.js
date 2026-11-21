import {
  ESTADOS_ORDEN, CHECKLIST_PREVENTIVO, calcularTotales, descontarInventario, reintegrarInventario,
  siguienteConsecutivo, puedeAvanzarEstado, avanceChecklist, formatoCOP, hoyISO,
} from '../logic.js';
import { esc, modal, cerrarModal, leerForm, mostrarErrores, opciones, toast, badge, vacio, confirmar } from '../ui.js';
import { formularioEquipo } from './equipos.js';
import { documentoOrden } from './documentos.js';

let filtro = { estado: 'abiertas', texto: '' };

export function render(el, ctx) {
  const [p0, p1] = ctx.params;
  if (p0 === 'nueva') return nueva(el, ctx, p1);
  if (p0) {
    detalle(el, ctx, p0);
    if (p1 === 'informe' || p1 === 'cotizacion') {
      const o = ctx.store.obtener('ordenes', p0);
      if (o) documentoOrden(ctx.store, o, p1);
    }
    return;
  }
  lista(el, ctx);
}

/* ------------------------------------------------------------------- listado */

function lista(el, ctx) {
  const { store } = ctx;
  const clientes = store.todos('clientes');
  const nombreCli = (id) => clientes.find((c) => c.id === id)?.nombre || '—';
  const ords = store
    .todos('ordenes')
    .filter((o) => (filtro.estado === 'abiertas' ? o.estado !== 'Entregado' : !filtro.estado || o.estado === filtro.estado))
    .filter((o) => {
      const t = filtro.texto.toLowerCase();
      return !t || [o.consecutivo, nombreCli(o.clienteId), o.tipoServicio].some((v) => v.toLowerCase().includes(t));
    })
    .sort((a, b) => b.consecutivo.localeCompare(a.consecutivo));

  el.innerHTML = `
  <div class="cabecera">
    <div><h1>Órdenes de servicio</h1><p>Recepción, diagnóstico, reparación y entrega de equipos con trazabilidad completa.</p></div>
    <div class="acciones"><a class="btn" href="#/ordenes/nueva">+ Nueva orden</a></div>
  </div>
  <div class="panel">
    <div class="filtros">
      <input type="search" id="f-texto" placeholder="Buscar por número, cliente o servicio" value="${esc(filtro.texto)}" aria-label="Buscar órdenes">
      <select id="f-estado" aria-label="Filtrar por estado">
        <option value="abiertas" ${filtro.estado === 'abiertas' ? 'selected' : ''}>Abiertas (no entregadas)</option>
        ${opciones(ESTADOS_ORDEN, filtro.estado, { vacio: 'Todas' })}
      </select>
    </div>
    ${ords.length ? `<div class="tabla-scroll"><table class="tabla">
      <thead><tr><th>Orden</th><th>Cliente</th><th class="ocultar-movil">Servicio</th><th class="ocultar-movil">Ingreso</th><th>Estado</th><th class="num">Total</th></tr></thead>
      <tbody>${ords.map((o) => `<tr>
        <td><a href="#/ordenes/${esc(o.id)}"><strong>${esc(o.consecutivo)}</strong></a></td>
        <td>${esc(nombreCli(o.clienteId))}</td>
        <td class="ocultar-movil">${esc(o.tipoServicio)}</td>
        <td class="ocultar-movil">${esc(o.fechaIngreso)}</td>
        <td>${badge(o.estado)}</td>
        <td class="num">${formatoCOP(o.totales?.total || 0)}</td></tr>`).join('')}
      </tbody></table></div><p class="muted">${ords.length} orden(es)</p>` : vacio('No hay órdenes con los filtros aplicados.')}
  </div>`;

  el.querySelector('#f-texto').addEventListener('input', (e) => {
    filtro.texto = e.target.value;
    lista(el, ctx);
    const i = el.querySelector('#f-texto');
    i.focus();
    i.setSelectionRange(filtro.texto.length, filtro.texto.length);
  });
  el.querySelector('#f-estado').addEventListener('change', (e) => { filtro.estado = e.target.value; lista(el, ctx); });
}

/* ------------------------------------------------------------- nueva orden */

function nueva(el, ctx, citaId) {
  const { store, usuario } = ctx;
  const cita = citaId ? store.obtener('citas', citaId) : null;
  const clientes = store.todos('clientes').sort((a, b) => a.nombre.localeCompare(b.nombre));
  const servicios = store.todos('servicios');

  el.innerHTML = `
  <div class="cabecera"><div><h1>Nueva orden de servicio</h1><p>Registro de recepción del equipo${cita ? ' (desde cita agendada)' : ''}.</p></div>
  <div class="acciones"><a class="btn btn-sec" href="#/ordenes">← Volver</a></div></div>
  <form class="panel" id="form-orden" novalidate>
    <div class="campos">
      <label class="ancho">Cliente *<select name="clienteId" id="sel-cli">${opciones(clientes, cita?.clienteId, { valor: (c) => c.id, texto: (c) => `${c.nombre} — ${c.documento}`, vacio: 'Seleccione…' })}</select></label>
      <label class="ancho">Equipo *<span style="display:flex;gap:6px"><select name="equipoId" id="sel-eq"></select><button type="button" class="btn btn-sec" id="btn-eq" title="Registrar equipo nuevo">+</button></span></label>
      <label>Tipo de servicio *<select name="tipoServicio">${opciones(servicios, cita?.tipoServicio, { valor: (s) => s.nombre, texto: (s) => `${s.nombre} (${formatoCOP(s.tarifa)})` })}</select></label>
      <label>Técnico asignado<select name="tecnico">${opciones(store.todos('usuarios').map((u) => u.nombre), cita?.tecnico || usuario.nombre)}</select></label>
      <label class="ancho">Falla reportada / diagnóstico inicial *<textarea name="diagnostico" placeholder="Describa el síntoma reportado por el cliente y el estado físico del equipo">${esc(cita?.notas || '')}</textarea></label>
      <label class="ancho">Accesorios recibidos<input name="accesorios" placeholder="Cargador, maletín, mouse…"></label>
    </div>
    <div style="margin-top:14px" class="acciones"><button class="btn" type="submit">Crear orden</button></div>
  </form>`;

  const selCli = el.querySelector('#sel-cli');
  const selEq = el.querySelector('#sel-eq');
  const llenar = (sel) => {
    const eqs = store.todos('equipos').filter((e) => e.clienteId === selCli.value);
    selEq.innerHTML = opciones(eqs, sel, { valor: (e) => e.id, texto: (e) => `${e.tipo} ${e.marca} ${e.modelo || ''} (S/N ${e.serial})`, vacio: eqs.length ? 'Seleccione…' : 'Registre un equipo con el botón +' });
  };
  selCli.addEventListener('change', () => llenar());
  llenar(cita?.equipoId);
  el.querySelector('#btn-eq').addEventListener('click', () => {
    if (!selCli.value) return toast('Seleccione primero el cliente.', 'error');
    formularioEquipo(null, ctx, (eq) => llenar(eq.id), selCli.value);
  });

  el.querySelector('#form-orden').addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.target;
    const d = leerForm(form);
    const errores = {};
    if (!d.clienteId) errores.clienteId = 'Seleccione el cliente.';
    if (!d.equipoId) errores.equipoId = 'Seleccione o registre el equipo.';
    if (!d.diagnostico || d.diagnostico.length < 10) errores.diagnostico = 'Describa la falla (mínimo 10 caracteres).';
    if (Object.keys(errores).length) return mostrarErrores(form, errores);
    const srv = servicios.find((s) => s.nombre === d.tipoServicio);
    const orden = {
      ...d,
      consecutivo: siguienteConsecutivo(store.todos('ordenes')),
      estado: 'Recibido',
      fechaIngreso: hoyISO(),
      fechaEntrega: null,
      citaId: cita?.id || null,
      repuestos: [],
      manoObra: srv?.tarifa || 0,
      descuento: 0,
      checklist: {},
      garantiaDias: store.config().garantiaDias || 30,
      observaciones: '',
    };
    orden.totales = calcularTotales(orden);
    const creada = store.crear('ordenes', orden);
    toast(`Orden ${creada.consecutivo} creada.`);
    ctx.navegar('ordenes/' + creada.id);
  });
}

/* ------------------------------------------------------------------ detalle */

function detalle(el, ctx, id) {
  const { store } = ctx;
  const o = store.obtener('ordenes', id);
  if (!o) { el.innerHTML = vacio('La orden no existe.'); return; }
  const cli = store.obtener('clientes', o.clienteId) || {};
  const eq = store.obtener('equipos', o.equipoId) || {};
  const inventario = store.todos('repuestos');
  const cerrada = o.estado === 'Entregado';
  const idx = ESTADOS_ORDEN.indexOf(o.estado);
  const siguiente = ESTADOS_ORDEN[idx + 1];
  const av = avanceChecklist(o.checklist);
  const esPreventivo = o.tipoServicio === 'Mantenimiento preventivo';
  const t = calcularTotales(o);

  el.innerHTML = `
  <div class="cabecera">
    <div><h1>Orden ${esc(o.consecutivo)} ${badge(o.estado)}</h1><p>${esc(cli.nombre || '')} · ${esc(o.tipoServicio)} · Ingreso ${esc(o.fechaIngreso)}${o.fechaEntrega ? ' · Entrega ' + esc(o.fechaEntrega) : ''}</p></div>
    <div class="acciones">
      <a class="btn btn-sec" href="#/ordenes">← Volver</a>
      <button class="btn btn-sec" id="btn-cotizacion">Cotización</button>
      <button class="btn btn-sec" id="btn-informe">Informe técnico</button>
      ${siguiente ? `<button class="btn btn-ok" id="btn-avanzar">Pasar a: ${esc(siguiente)}</button>` : ''}
    </div>
  </div>
  <div class="estado-flujo" aria-label="Flujo de estados">${ESTADOS_ORDEN.map((s, i) => `<span class="${i < idx ? 'hecho' : i === idx ? 'actual' : ''}">${i + 1}. ${esc(s)}</span>`).join('')}</div>

  <div class="rejilla dos-col">
    <section class="panel">
      <h2>Equipo y diagnóstico</h2>
      <p><strong>${esc(eq.tipo || '')} ${esc(eq.marca || '')} ${esc(eq.modelo || '')}</strong> — S/N ${esc(eq.serial || '')}<br>
      <span class="muted">${esc(eq.so || '')} · RAM ${esc(eq.ram || '—')} · ${esc(eq.almacenamiento || '—')}</span></p>
      <form id="form-diag" novalidate>
        <label>Diagnóstico técnico<textarea name="diagnostico" ${cerrada ? 'disabled' : ''}>${esc(o.diagnostico || '')}</textarea></label>
        <label style="margin-top:10px">Observaciones y recomendaciones<textarea name="observaciones" ${cerrada ? 'disabled' : ''}>${esc(o.observaciones || '')}</textarea></label>
        ${cerrada ? '' : '<div class="acciones" style="margin-top:10px"><button class="btn btn-sec" type="submit">Guardar diagnóstico</button></div>'}
      </form>
    </section>
    <section class="panel">
      <h2>Checklist de mantenimiento preventivo</h2>
      ${esPreventivo ? `
      <div class="progreso" aria-label="Avance ${av.porcentaje}%"><span style="width:${av.porcentaje}%"></span></div>
      <p class="muted">${av.hechos} de ${av.total} actividades (${av.porcentaje} %)</p>
      <div class="checklist">${CHECKLIST_PREVENTIVO.map((tarea, i) => `<label class="check"><input type="checkbox" data-tarea="${i}" ${o.checklist?.[tarea] ? 'checked' : ''} ${cerrada ? 'disabled' : ''}><span>${esc(tarea)}</span></label>`).join('')}</div>`
      : '<p class="muted">El checklist estandarizado aplica a órdenes de mantenimiento preventivo. Para este servicio registre el procedimiento en el diagnóstico.</p>'}
    </section>
  </div>

  <section class="panel" style="margin-top:16px">
    <h2>Repuestos y costos</h2>
    <div class="tabla-scroll"><table class="tabla">
      <thead><tr><th>Repuesto</th><th class="num">Cant.</th><th class="num">Valor unit.</th><th class="num">Subtotal</th><th></th></tr></thead>
      <tbody>
      ${(o.repuestos || []).map((r, i) => {
        const rep = inventario.find((x) => x.id === r.repuestoId) || { nombre: r.repuestoId };
        return `<tr><td>${esc(rep.nombre)}</td><td class="num">${r.cantidad}</td><td class="num">${formatoCOP(r.precioUnit)}</td><td class="num">${formatoCOP(r.cantidad * r.precioUnit)}</td>
        <td>${cerrada ? '' : `<button class="btn btn-sec btn-peq" data-quitar="${i}" aria-label="Quitar repuesto">✕</button>`}</td></tr>`;
      }).join('') || '<tr><td colspan="5" class="muted">Sin repuestos.</td></tr>'}
      </tbody></table></div>
    ${cerrada ? '' : `
    <form id="form-rep" class="filtros" style="margin-top:10px" novalidate>
      <select name="repuestoId" aria-label="Repuesto">${opciones(inventario, '', { valor: (r) => r.id, texto: (r) => `${r.nombre} — stock ${r.stock} — ${formatoCOP(r.precioVenta)}`, vacio: 'Agregar repuesto del inventario…' })}</select>
      <input type="number" name="cantidad" value="1" min="1" style="max-width:90px" aria-label="Cantidad">
      <button class="btn btn-sec" type="submit">Agregar</button>
    </form>`}
    <div class="rejilla" style="grid-template-columns:1fr 1fr;margin-top:12px;align-items:start">
      <form id="form-costos" class="campos" style="display:grid;gap:10px" novalidate>
        <label>Mano de obra<input type="number" name="manoObra" value="${o.manoObra}" min="0" step="1000" ${cerrada ? 'disabled' : ''}></label>
        <label>Descuento<input type="number" name="descuento" value="${o.descuento || 0}" min="0" step="1000" ${cerrada ? 'disabled' : ''}></label>
        ${cerrada ? '' : '<button class="btn btn-sec" type="submit">Actualizar costos</button>'}
      </form>
      <div class="resumen-totales">
        <div><span>Repuestos</span><span>${formatoCOP(t.repuestos)}</span></div>
        <div><span>Mano de obra</span><span>${formatoCOP(t.manoObra)}</span></div>
        <div><span>Descuento</span><span>- ${formatoCOP(t.descuento)}</span></div>
        <div><span>Base gravable</span><span>${formatoCOP(t.base)}</span></div>
        <div><span>IVA 19 %</span><span>${formatoCOP(t.iva)}</span></div>
        <div class="total"><span>Total</span><span>${formatoCOP(t.total)}</span></div>
      </div>
    </div>
  </section>`;

  const guardar = (cambios, msg) => {
    const actual = store.obtener('ordenes', id);
    const nuevo = { ...actual, ...cambios };
    nuevo.totales = calcularTotales(nuevo);
    store.actualizar('ordenes', id, { ...cambios, totales: nuevo.totales });
    if (msg) toast(msg);
    detalle(el, ctx, id);
  };

  el.querySelector('#btn-informe').addEventListener('click', () => documentoOrden(store, store.obtener('ordenes', id), 'informe'));
  el.querySelector('#btn-cotizacion').addEventListener('click', () => documentoOrden(store, store.obtener('ordenes', id), 'cotizacion'));

  el.querySelector('#btn-avanzar')?.addEventListener('click', async () => {
    if (!puedeAvanzarEstado(o.estado, siguiente)) return;
    if (siguiente === 'Entregado') {
      if (esPreventivo && av.porcentaje < 100) {
        toast('Complete el checklist de mantenimiento preventivo antes de entregar.', 'error');
        return;
      }
      if (!(await confirmar(`¿Confirmar la entrega del equipo? Total a pagar: ${formatoCOP(t.total)}. La orden quedará cerrada.`))) return;
      return guardar({ estado: siguiente, fechaEntrega: hoyISO() }, `Orden ${o.consecutivo} entregada.`);
    }
    guardar({ estado: siguiente }, `Estado actualizado a "${siguiente}".`);
  });

  el.querySelector('#form-diag')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const d = leerForm(e.target);
    guardar({ diagnostico: d.diagnostico, observaciones: d.observaciones }, 'Diagnóstico guardado.');
  });

  el.querySelectorAll('[data-tarea]').forEach((cb) => cb.addEventListener('change', () => {
    const tarea = CHECKLIST_PREVENTIVO[Number(cb.dataset.tarea)];
    guardar({ checklist: { ...(o.checklist || {}), [tarea]: cb.checked } });
  }));

  el.querySelector('#form-rep')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const d = leerForm(e.target);
    if (!d.repuestoId) return toast('Seleccione un repuesto.', 'error');
    try {
      const item = { repuestoId: d.repuestoId, cantidad: Number(d.cantidad) };
      const inv = descontarInventario(store.todos('repuestos'), [item]);
      store.reemplazar('repuestos', inv);
      store.registrar('Salida de inventario', 'repuestos', d.repuestoId);
      const rep = inv.find((r) => r.id === d.repuestoId);
      guardar({ repuestos: [...(o.repuestos || []), { ...item, precioUnit: rep.precioVenta }] }, `${rep.nombre} agregado. Stock restante: ${rep.stock}.`);
    } catch (err) {
      toast(err.message, 'error');
    }
  });

  el.querySelectorAll('[data-quitar]').forEach((b) => b.addEventListener('click', () => {
    const i = Number(b.dataset.quitar);
    const item = o.repuestos[i];
    store.reemplazar('repuestos', reintegrarInventario(store.todos('repuestos'), [item]));
    guardar({ repuestos: o.repuestos.filter((_, k) => k !== i) }, 'Repuesto retirado y reintegrado al inventario.');
  }));

  el.querySelector('#form-costos')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const d = leerForm(e.target);
    if (d.manoObra < 0 || d.descuento < 0) return toast('Los valores no pueden ser negativos.', 'error');
    guardar({ manoObra: Number(d.manoObra) || 0, descuento: Number(d.descuento) || 0 }, 'Costos actualizados.');
  });
}
