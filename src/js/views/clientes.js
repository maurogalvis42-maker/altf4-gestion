import { validarCliente, TIPOS_CLIENTE, aCSV } from '../logic.js';
import { esc, modal, cerrarModal, leerForm, mostrarErrores, opciones, toast, confirmar, vacio, descargar } from '../ui.js';

let filtro = { texto: '', tipo: '' };

export function render(el, ctx) {
  const { store } = ctx;
  const equipos = store.todos('equipos');
  const ordenes = store.todos('ordenes');
  const lista = store
    .todos('clientes')
    .filter((c) => !filtro.tipo || c.tipo === filtro.tipo)
    .filter((c) => {
      const t = filtro.texto.toLowerCase();
      return !t || [c.nombre, c.documento, c.telefono, c.email].some((v) => String(v || '').toLowerCase().includes(t));
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  el.innerHTML = `
  <div class="cabecera">
    <div><h1>Clientes</h1><p>Registro de clientes con autorización de tratamiento de datos (Ley 1581 de 2012).</p></div>
    <div class="acciones"><button class="btn btn-sec" id="btn-csv">Exportar CSV</button><button class="btn" id="btn-nuevo">+ Nuevo cliente</button></div>
  </div>
  <div class="panel">
    <div class="filtros">
      <input type="search" id="f-texto" placeholder="Buscar por nombre, documento, teléfono o correo" value="${esc(filtro.texto)}" aria-label="Buscar clientes">
      <select id="f-tipo" aria-label="Filtrar por tipo">${opciones(TIPOS_CLIENTE, filtro.tipo, { vacio: 'Todos los tipos' })}</select>
    </div>
    ${lista.length ? `<div class="tabla-scroll"><table class="tabla">
      <thead><tr><th>Cliente</th><th class="ocultar-movil">Tipo</th><th>Contacto</th><th class="num ocultar-movil">Equipos</th><th class="num ocultar-movil">Servicios</th><th></th></tr></thead>
      <tbody>${lista.map((c) => `
        <tr>
          <td><strong>${esc(c.nombre)}</strong><br><span class="muted">${esc(c.documento)}</span></td>
          <td class="ocultar-movil">${esc(c.tipo)}</td>
          <td>${esc(c.telefono)}<br><span class="muted">${esc(c.email || '')}</span></td>
          <td class="num ocultar-movil">${equipos.filter((e) => e.clienteId === c.id).length}</td>
          <td class="num ocultar-movil">${ordenes.filter((o) => o.clienteId === c.id).length}</td>
          <td><div class="acciones">
            <button class="btn btn-sec btn-peq" data-ver="${esc(c.id)}">Historial</button>
            <button class="btn btn-sec btn-peq" data-editar="${esc(c.id)}">Editar</button>
            <button class="btn btn-sec btn-peq" data-eliminar="${esc(c.id)}" aria-label="Eliminar ${esc(c.nombre)}">🗑</button>
          </div></td>
        </tr>`).join('')}</tbody></table></div>
      <p class="muted">${lista.length} cliente(s)</p>` : vacio('No se encontraron clientes con los filtros aplicados.')}
  </div>`;

  el.querySelector('#f-texto').addEventListener('input', (e) => {
    filtro.texto = e.target.value;
    const pos = e.target.selectionStart;
    render(el, ctx);
    const inp = el.querySelector('#f-texto');
    inp.focus();
    inp.setSelectionRange(pos, pos);
  });
  el.querySelector('#f-tipo').addEventListener('change', (e) => { filtro.tipo = e.target.value; render(el, ctx); });
  el.querySelector('#btn-nuevo').addEventListener('click', () => formulario(null, el, ctx));
  el.querySelector('#btn-csv').addEventListener('click', () => {
    const csv = aCSV(lista, [
      { titulo: 'Nombre', valor: 'nombre' }, { titulo: 'Tipo', valor: 'tipo' }, { titulo: 'Documento', valor: 'documento' },
      { titulo: 'Teléfono', valor: 'telefono' }, { titulo: 'Correo', valor: 'email' }, { titulo: 'Dirección', valor: 'direccion' },
    ]);
    descargar('clientes_altf4.csv', '﻿' + csv, 'text/csv;charset=utf-8');
  });
  el.querySelectorAll('[data-editar]').forEach((b) => b.addEventListener('click', () => formulario(store.obtener('clientes', b.dataset.editar), el, ctx)));
  el.querySelectorAll('[data-ver]').forEach((b) => b.addEventListener('click', () => historial(store.obtener('clientes', b.dataset.ver), store)));
  el.querySelectorAll('[data-eliminar]').forEach((b) =>
    b.addEventListener('click', async () => {
      const id = b.dataset.eliminar;
      if (ordenes.some((o) => o.clienteId === id)) {
        toast('No se puede eliminar: el cliente tiene órdenes de servicio asociadas (trazabilidad).', 'error');
        return;
      }
      if (await confirmar('¿Eliminar este cliente y sus equipos? Esta acción ejerce el derecho de supresión del titular.')) {
        equipos.filter((e) => e.clienteId === id).forEach((e) => store.eliminar('equipos', e.id));
        store.eliminar('clientes', id);
        toast('Cliente eliminado.');
        render(el, ctx);
      }
    })
  );

  if (ctx.params[0] === 'nuevo') formulario(null, el, ctx);
}

export function formulario(cliente, el, ctx, alGuardar) {
  const { store } = ctx;
  const c = cliente || { tipo: 'Microempresa', consentimiento: false };
  const m = modal({
    titulo: cliente ? 'Editar cliente' : 'Nuevo cliente',
    cuerpo: `<form id="form-cli" novalidate><div class="campos">
      <label class="ancho">Nombre o razón social *<input name="nombre" value="${esc(c.nombre || '')}" maxlength="80"></label>
      <label>Tipo de cliente *<select name="tipo">${opciones(TIPOS_CLIENTE, c.tipo)}</select></label>
      <label>CC / NIT *<input name="documento" value="${esc(c.documento || '')}" placeholder="900123456-7"></label>
      <label>Teléfono *<input name="telefono" value="${esc(c.telefono || '')}" placeholder="3101234567"></label>
      <label>Correo electrónico<input name="email" type="email" value="${esc(c.email || '')}"></label>
      <label class="ancho">Dirección<input name="direccion" value="${esc(c.direccion || '')}"></label>
      <label class="check ancho"><input type="checkbox" name="consentimiento" ${c.consentimiento ? 'checked' : ''}>
        <span>El titular autoriza a ALT+F4 el tratamiento de sus datos personales con la finalidad de prestar el servicio técnico, contactarlo y llevar el historial de mantenimiento, conforme a la Ley 1581 de 2012 y el Decreto 1377 de 2013. *</span></label>
    </div></form>`,
    acciones: [
      { texto: 'Cancelar', clase: 'btn-sec', onClick: cerrarModal },
      {
        texto: 'Guardar',
        onClick: () => {
          const form = m.querySelector('#form-cli');
          const datos = leerForm(form);
          const v = validarCliente(datos);
          const duplicado = store.todos('clientes').find((x) => x.documento === datos.documento && x.id !== cliente?.id);
          if (duplicado) v.errores.documento = 'Ya existe un cliente con este documento.';
          if (Object.keys(v.errores).length) return mostrarErrores(form, v.errores);
          if (datos.consentimiento && !c.consentimiento) datos.fechaConsentimiento = new Date().toISOString().slice(0, 10);
          const guardado = cliente ? store.actualizar('clientes', cliente.id, datos) : store.crear('clientes', datos);
          cerrarModal();
          toast(cliente ? 'Cliente actualizado.' : 'Cliente registrado.');
          if (alGuardar) alGuardar(guardado);
          else render(el, { ...ctx, params: [] });
        },
      },
    ],
  });
}

function historial(cliente, store) {
  const equipos = store.todos('equipos').filter((e) => e.clienteId === cliente.id);
  const ordenes = store.todos('ordenes').filter((o) => o.clienteId === cliente.id).sort((a, b) => b.fechaIngreso.localeCompare(a.fechaIngreso));
  modal({
    titulo: `Historial — ${cliente.nombre}`,
    ancho: 'grande',
    cuerpo: `
      <p><strong>${esc(cliente.tipo)}</strong> · ${esc(cliente.documento)} · ${esc(cliente.telefono)} · ${esc(cliente.email || '')}<br>
      <span class="muted">Autorización de datos: ${cliente.consentimiento ? 'Sí, ' + esc(cliente.fechaConsentimiento || '') : 'No'}</span></p>
      <h3>Equipos (${equipos.length})</h3>
      ${equipos.length ? `<ul class="lista-simple">${equipos.map((e) => `<li><span>${esc(e.tipo)} ${esc(e.marca)} ${esc(e.modelo)}</span><span class="muted">S/N ${esc(e.serial)}</span></li>`).join('')}</ul>` : '<p class="muted">Sin equipos.</p>'}
      <h3 style="margin-top:14px">Servicios (${ordenes.length})</h3>
      ${ordenes.length ? `<table class="tabla"><thead><tr><th>Orden</th><th>Fecha</th><th>Servicio</th><th>Estado</th></tr></thead><tbody>
      ${ordenes.map((o) => `<tr><td><a href="#/ordenes/${esc(o.id)}">${esc(o.consecutivo)}</a></td><td>${esc(o.fechaIngreso)}</td><td>${esc(o.tipoServicio)}</td><td>${esc(o.estado)}</td></tr>`).join('')}
      </tbody></table>` : '<p class="muted">Sin servicios registrados.</p>'}`,
    acciones: [{ texto: 'Cerrar', clase: 'btn-sec', onClick: cerrarModal }],
  });
}
