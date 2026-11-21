import { formatoCOP } from '../logic.js';
import { esc, leerForm, toast, confirmar, descargar } from '../ui.js';

export function render(el, ctx) {
  const { store } = ctx;
  const cfg = store.config();
  const servicios = store.todos('servicios');
  const bitacora = store.todos('bitacora').slice(0, 15);

  el.innerHTML = `
  <div class="cabecera"><div><h1>Configuración</h1><p>Datos de la empresa, tarifas de servicio, respaldo y bitácora de auditoría.</p></div></div>
  <div class="rejilla dos-col">
    <form class="panel" id="form-emp" novalidate>
      <h2>Datos de la empresa</h2>
      <div class="campos">
        <label class="ancho">Razón social<input name="empresa" value="${esc(cfg.empresa || '')}"></label>
        <label>NIT<input name="nit" value="${esc(cfg.nit || '')}"></label>
        <label>Teléfono<input name="telefono" value="${esc(cfg.telefono || '')}"></label>
        <label>Correo<input name="email" value="${esc(cfg.email || '')}"></label>
        <label>Dirección<input name="direccion" value="${esc(cfg.direccion || '')}"></label>
        <label>Periodo preventivo (meses)<input type="number" name="periodoPreventivoMeses" value="${cfg.periodoPreventivoMeses || 6}" min="1" max="24"></label>
        <label>Garantía (días)<input type="number" name="garantiaDias" value="${cfg.garantiaDias || 30}" min="0" max="365"></label>
      </div>
      <div class="acciones" style="margin-top:12px"><button class="btn" type="submit">Guardar</button></div>
    </form>
    <form class="panel" id="form-tar" novalidate>
      <h2>Tarifas de servicios</h2>
      <table class="tabla"><thead><tr><th>Servicio</th><th class="num">Tarifa (COP)</th><th class="num">Min.</th></tr></thead><tbody>
      ${servicios.map((s) => `<tr><td>${esc(s.nombre)}</td><td><input type="number" name="t_${esc(s.id)}" value="${s.tarifa}" min="0" step="5000" aria-label="Tarifa ${esc(s.nombre)}"></td><td class="num">${s.duracion}</td></tr>`).join('')}
      </tbody></table>
      <div class="acciones" style="margin-top:12px"><button class="btn" type="submit">Guardar tarifas</button></div>
    </form>
  </div>
  <div class="rejilla dos-col" style="margin-top:16px">
    <div class="panel">
      <h2>Respaldo de información</h2>
      <p class="muted">Exporte toda la información a un archivo JSON (copia de seguridad) o restáurela.</p>
      <div class="acciones">
        <button class="btn btn-sec" id="btn-exp">Descargar respaldo</button>
        <label class="btn btn-sec" style="flex-direction:row">Restaurar respaldo<input type="file" id="inp-imp" accept="application/json" hidden></label>
        <button class="btn btn-peligro" id="btn-reset">Restablecer datos de demostración</button>
      </div>
    </div>
    <div class="panel">
      <h2>Bitácora de auditoría (últimos 15)</h2>
      <ul class="lista-simple">${bitacora.map((b) => `<li><span>${esc(b.accion)} · ${esc(b.coleccion)}<br><span class="muted">${esc(b.usuario)}</span></span><span class="muted">${new Date(b.fecha).toLocaleString('es-CO')}</span></li>`).join('') || '<li class="muted">Sin registros aún.</li>'}</ul>
    </div>
  </div>`;

  el.querySelector('#form-emp').addEventListener('submit', (e) => {
    e.preventDefault();
    store.guardarConfig(leerForm(e.target));
    toast('Configuración guardada.');
  });
  el.querySelector('#form-tar').addEventListener('submit', (e) => {
    e.preventDefault();
    const d = leerForm(e.target);
    const nuevos = servicios.map((s) => ({ ...s, tarifa: Math.max(0, Number(d['t_' + s.id]) || 0) }));
    store.reemplazar('servicios', nuevos);
    toast('Tarifas actualizadas: ' + nuevos.map((s) => formatoCOP(s.tarifa)).join(', ').slice(0, 60) + '…');
  });
  el.querySelector('#btn-exp').addEventListener('click', () => {
    descargar(`respaldo_altf4_${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(store.exportar(), null, 2), 'application/json');
  });
  el.querySelector('#inp-imp').addEventListener('change', async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    try {
      store.importar(JSON.parse(await f.text()));
      toast('Respaldo restaurado correctamente.');
      ctx.render();
    } catch (err) {
      toast(err.message || 'Archivo inválido.', 'error');
    }
  });
  el.querySelector('#btn-reset').addEventListener('click', async () => {
    if (!(await confirmar('Se borrarán todos los datos actuales y se cargarán los datos de demostración. ¿Continuar?'))) return;
    store.limpiar();
    await ctx.sembrarDatos();
    toast('Datos de demostración restablecidos.');
    ctx.render();
  });
}
