import { validarCita, ESTADOS_CITA, hoyISO } from '../logic.js';
import { esc, modal, cerrarModal, leerForm, mostrarErrores, opciones, toast, badge, vacio } from '../ui.js';

let vista = { desde: null, estado: '' };

export function render(el, ctx) {
  const { store } = ctx;
  if (!vista.desde) vista.desde = hoyISO();
  const clientes = store.todos('clientes');
  const equipos = store.todos('equipos');
  const nombreCli = (id) => clientes.find((c) => c.id === id)?.nombre || '—';
  const eq = (id) => equipos.find((e) => e.id === id);
  const citas = store
    .todos('citas')
    .filter((c) => c.fecha >= vista.desde)
    .filter((c) => !vista.estado || c.estado === vista.estado)
    .sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora));
  const porDia = {};
  for (const c of citas) (porDia[c.fecha] ||= []).push(c);

  el.innerHTML = `
  <div class="cabecera">
    <div><h1>Agenda de citas</h1><p>Horario de atención: lunes a sábado, 08:00 a 18:00. El sistema evita cruces de horario por técnico.</p></div>
    <div class="acciones"><button class="btn" id="btn-nueva">+ Agendar cita</button></div>
  </div>
  <div class="panel">
    <div class="filtros">
      <label>Desde<input type="date" id="f-desde" value="${esc(vista.desde)}"></label>
      <label>Estado<select id="f-estado">${opciones(ESTADOS_CITA, vista.estado, { vacio: 'Todos' })}</select></label>
    </div>
    ${Object.keys(porDia).length ? Object.entries(porDia).map(([fecha, lista]) => `
      <div class="agenda-dia">
        <h3>${new Date(fecha + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}</h3>
        <div class="tabla-scroll"><table class="tabla"><tbody>
        ${lista.map((c) => {
          const e = eq(c.equipoId);
          return `<tr>
            <td style="width:90px"><strong>${esc(c.hora)}</strong><br><span class="muted">${c.duracion} min</span></td>
            <td><strong>${esc(nombreCli(c.clienteId))}</strong><br><span class="muted">${esc(c.tipoServicio)}${e ? ' · ' + esc(e.marca + ' ' + (e.modelo || '')) : ''}</span></td>
            <td class="ocultar-movil">${esc(c.tecnico)}</td>
            <td>${badge(c.estado)}</td>
            <td><div class="acciones">
              ${c.estado === 'Programada' ? `<button class="btn btn-sec btn-peq" data-estado="Confirmada" data-id="${esc(c.id)}">Confirmar</button>` : ''}
              ${['Programada', 'Confirmada'].includes(c.estado) ? `<button class="btn btn-ok btn-peq" data-atender="${esc(c.id)}">Atender</button>
              <button class="btn btn-sec btn-peq" data-editar="${esc(c.id)}">Editar</button>
              <button class="btn btn-sec btn-peq" data-estado="Cancelada" data-id="${esc(c.id)}">Cancelar</button>` : ''}
            </div></td></tr>`;
        }).join('')}
        </tbody></table></div>
      </div>`).join('') : vacio('No hay citas en el rango seleccionado.')}
  </div>`;

  el.querySelector('#f-desde').addEventListener('change', (e) => { vista.desde = e.target.value || hoyISO(); render(el, ctx); });
  el.querySelector('#f-estado').addEventListener('change', (e) => { vista.estado = e.target.value; render(el, ctx); });
  el.querySelector('#btn-nueva').addEventListener('click', () => formulario(null, el, ctx));
  el.querySelectorAll('[data-editar]').forEach((b) => b.addEventListener('click', () => formulario(store.obtener('citas', b.dataset.editar), el, ctx)));
  el.querySelectorAll('[data-estado]').forEach((b) => b.addEventListener('click', () => {
    store.actualizar('citas', b.dataset.id, { estado: b.dataset.estado });
    toast(`Cita ${b.dataset.estado.toLowerCase()}.`);
    render(el, ctx);
  }));
  el.querySelectorAll('[data-atender]').forEach((b) => b.addEventListener('click', () => {
    store.actualizar('citas', b.dataset.atender, { estado: 'Atendida' });
    toast('Cita atendida. Se abre una orden de servicio.');
    ctx.navegar('ordenes/nueva/' + b.dataset.atender);
  }));

  if (ctx.params[0] === 'nueva') formulario(null, el, ctx);
}

function formulario(cita, el, ctx) {
  const { store, usuario } = ctx;
  const c = cita || { fecha: hoyISO(), hora: '09:00', duracion: 60, tecnico: usuario.nombre, estado: 'Programada' };
  const clientes = store.todos('clientes').sort((a, b) => a.nombre.localeCompare(b.nombre));
  const servicios = store.todos('servicios');
  const tecnicos = store.todos('usuarios').map((u) => u.nombre);
  const m = modal({
    titulo: cita ? 'Editar cita' : 'Agendar cita',
    cuerpo: `<form id="form-cita" novalidate><div class="campos">
      <label class="ancho">Cliente *<select name="clienteId" id="sel-cli">${opciones(clientes, c.clienteId, { valor: (x) => x.id, texto: (x) => x.nombre, vacio: 'Seleccione…' })}</select></label>
      <label class="ancho">Equipo<select name="equipoId" id="sel-eq"></select></label>
      <label>Servicio *<select name="tipoServicio" id="sel-srv">${opciones(servicios, c.tipoServicio, { valor: (s) => s.nombre, texto: (s) => s.nombre })}</select></label>
      <label>Técnico *<select name="tecnico">${opciones(tecnicos, c.tecnico)}</select></label>
      <label>Fecha *<input type="date" name="fecha" value="${esc(c.fecha)}"></label>
      <label>Hora *<input type="time" name="hora" value="${esc(c.hora)}" step="900"></label>
      <label>Duración (min)<input type="number" name="duracion" value="${esc(c.duracion)}" min="30" step="15"></label>
      <label>Estado<select name="estado">${opciones(ESTADOS_CITA, c.estado)}</select></label>
      <label class="ancho">Notas<textarea name="notas">${esc(c.notas || '')}</textarea></label>
    </div></form>`,
    acciones: [
      { texto: 'Cancelar', clase: 'btn-sec', onClick: cerrarModal },
      { texto: 'Guardar', onClick: () => {
        const form = m.querySelector('#form-cita');
        const datos = leerForm(form);
        const v = validarCita({ ...datos, id: cita?.id }, store.todos('citas'));
        if (!v.valido) return mostrarErrores(form, v.errores);
        cita ? store.actualizar('citas', cita.id, datos) : store.crear('citas', datos);
        cerrarModal();
        toast('Cita guardada.');
        vista.desde = datos.fecha < vista.desde ? datos.fecha : vista.desde;
        render(el, { ...ctx, params: [] });
      } },
    ],
  });
  const selCli = m.querySelector('#sel-cli');
  const selEq = m.querySelector('#sel-eq');
  const llenarEquipos = () => {
    const eqs = store.todos('equipos').filter((e) => e.clienteId === selCli.value);
    selEq.innerHTML = opciones(eqs, c.equipoId, { valor: (e) => e.id, texto: (e) => `${e.tipo} ${e.marca} ${e.modelo || ''} (${e.serial})`, vacio: eqs.length ? 'Seleccione…' : 'El cliente no tiene equipos' });
  };
  selCli.addEventListener('change', llenarEquipos);
  llenarEquipos();
  m.querySelector('#sel-srv').addEventListener('change', (e) => {
    const s = servicios.find((x) => x.nombre === e.target.value);
    if (s) m.querySelector('[name=duracion]').value = s.duracion;
  });
}
