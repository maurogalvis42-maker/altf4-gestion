import { validarEquipo, TIPOS_EQUIPO } from '../logic.js';
import { esc, modal, cerrarModal, leerForm, mostrarErrores, opciones, toast, confirmar, vacio } from '../ui.js';

let texto = '';

export function render(el, ctx) {
  const { store } = ctx;
  const clientes = store.todos('clientes');
  const ordenes = store.todos('ordenes');
  const nombreCli = (id) => clientes.find((c) => c.id === id)?.nombre || '—';
  const lista = store
    .todos('equipos')
    .filter((e) => {
      const t = texto.toLowerCase();
      return !t || [e.marca, e.modelo, e.serial, nombreCli(e.clienteId)].some((v) => String(v).toLowerCase().includes(t));
    });

  el.innerHTML = `
  <div class="cabecera">
    <div><h1>Equipos</h1><p>Hoja de vida de los equipos de cómputo de cada cliente.</p></div>
    <div class="acciones"><button class="btn" id="btn-nuevo">+ Nuevo equipo</button></div>
  </div>
  <div class="panel">
    <div class="filtros"><input type="search" id="f-texto" placeholder="Buscar por marca, modelo, serial o cliente" value="${esc(texto)}" aria-label="Buscar equipos"></div>
    ${lista.length ? `<div class="tabla-scroll"><table class="tabla">
    <thead><tr><th>Equipo</th><th>Cliente</th><th class="ocultar-movil">Especificaciones</th><th class="num ocultar-movil">Servicios</th><th></th></tr></thead>
    <tbody>${lista.map((e) => `<tr>
      <td><strong>${esc(e.tipo)} ${esc(e.marca)}</strong> ${esc(e.modelo || '')}<br><span class="muted">S/N ${esc(e.serial)}</span></td>
      <td>${esc(nombreCli(e.clienteId))}</td>
      <td class="ocultar-movil">${esc(e.so || '')}<br><span class="muted">RAM ${esc(e.ram || '—')} · ${esc(e.almacenamiento || '—')}</span></td>
      <td class="num ocultar-movil">${ordenes.filter((o) => o.equipoId === e.id).length}</td>
      <td><div class="acciones"><button class="btn btn-sec btn-peq" data-editar="${esc(e.id)}">Editar</button>
      <button class="btn btn-sec btn-peq" data-eliminar="${esc(e.id)}" aria-label="Eliminar equipo">🗑</button></div></td>
    </tr>`).join('')}</tbody></table></div>` : vacio('No hay equipos registrados.')}
  </div>`;

  el.querySelector('#f-texto').addEventListener('input', (ev) => {
    texto = ev.target.value;
    render(el, ctx);
    const i = el.querySelector('#f-texto');
    i.focus();
    i.setSelectionRange(texto.length, texto.length);
  });
  el.querySelector('#btn-nuevo').addEventListener('click', () => formularioEquipo(null, ctx, () => render(el, ctx)));
  el.querySelectorAll('[data-editar]').forEach((b) => b.addEventListener('click', () => formularioEquipo(store.obtener('equipos', b.dataset.editar), ctx, () => render(el, ctx))));
  el.querySelectorAll('[data-eliminar]').forEach((b) => b.addEventListener('click', async () => {
    if (ordenes.some((o) => o.equipoId === b.dataset.eliminar)) return toast('No se puede eliminar: el equipo tiene historial de servicios.', 'error');
    if (await confirmar('¿Eliminar este equipo?')) { store.eliminar('equipos', b.dataset.eliminar); toast('Equipo eliminado.'); render(el, ctx); }
  }));
}

export function formularioEquipo(equipo, { store }, alGuardar, clienteFijo = null) {
  const e = equipo || { tipo: 'Portátil', clienteId: clienteFijo || '' };
  const clientes = store.todos('clientes').sort((a, b) => a.nombre.localeCompare(b.nombre));
  const m = modal({
    titulo: equipo ? 'Editar equipo' : 'Nuevo equipo',
    cuerpo: `<form id="form-eq" novalidate><div class="campos">
      <label class="ancho">Cliente *<select name="clienteId">${opciones(clientes, e.clienteId, { valor: (c) => c.id, texto: (c) => c.nombre, vacio: 'Seleccione…' })}</select></label>
      <label>Tipo *<select name="tipo">${opciones(TIPOS_EQUIPO, e.tipo)}</select></label>
      <label>Marca *<input name="marca" value="${esc(e.marca || '')}"></label>
      <label>Modelo<input name="modelo" value="${esc(e.modelo || '')}"></label>
      <label>Serial *<input name="serial" value="${esc(e.serial || '')}"></label>
      <label>Sistema operativo<input name="so" value="${esc(e.so || '')}" placeholder="Windows 11 Pro"></label>
      <label>Memoria RAM<input name="ram" value="${esc(e.ram || '')}" placeholder="8 GB"></label>
      <label class="ancho">Almacenamiento<input name="almacenamiento" value="${esc(e.almacenamiento || '')}" placeholder="SSD 512 GB"></label>
    </div></form>`,
    acciones: [
      { texto: 'Cancelar', clase: 'btn-sec', onClick: cerrarModal },
      { texto: 'Guardar', onClick: () => {
        const form = m.querySelector('#form-eq');
        const datos = leerForm(form);
        const v = validarEquipo(datos);
        if (store.todos('equipos').some((x) => x.serial === datos.serial && x.id !== equipo?.id)) v.errores.serial = 'Ya existe un equipo con este serial.';
        if (Object.keys(v.errores).length) return mostrarErrores(form, v.errores);
        const g = equipo ? store.actualizar('equipos', equipo.id, datos) : store.crear('equipos', datos);
        cerrarModal();
        toast('Equipo guardado.');
        alGuardar?.(g);
      } },
    ],
  });
}
