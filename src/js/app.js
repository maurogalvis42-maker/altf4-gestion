/**
 * ALT+F4 Gestión — punto de entrada.
 * Arquitectura: SPA (Single Page Application) con enrutador por hash,
 * vistas modulares, capa de reglas de negocio (logic.js) y capa de datos (store.js).
 */
import { Store } from './store.js';
import { generarDatosDemo, CREDENCIALES_DEMO } from './seed.js';
import { hashPassword } from './logic.js';
import { esc, $, $$, toast, cerrarModal } from './ui.js';
import * as dashboard from './views/dashboard.js';
import * as clientes from './views/clientes.js';
import * as equipos from './views/equipos.js';
import * as citas from './views/citas.js';
import * as ordenes from './views/ordenes.js';
import * as inventario from './views/inventario.js';
import * as reportes from './views/reportes.js';
import * as configuracion from './views/configuracion.js';

export const store = new Store();
const SESION = 'altf4.sesion';

const RUTAS = {
  dashboard: { titulo: 'Tablero', ico: '▦', vista: dashboard },
  citas: { titulo: 'Agenda de citas', ico: '🗓', vista: citas },
  ordenes: { titulo: 'Órdenes de servicio', ico: '🛠', vista: ordenes },
  clientes: { titulo: 'Clientes', ico: '👥', vista: clientes },
  equipos: { titulo: 'Equipos', ico: '💻', vista: equipos },
  inventario: { titulo: 'Inventario', ico: '📦', vista: inventario },
  reportes: { titulo: 'Reportes', ico: '📊', vista: reportes },
  configuracion: { titulo: 'Configuración', ico: '⚙', vista: configuracion, rol: 'Administrador' },
};

function sesionActual() {
  try {
    const s = JSON.parse(sessionStorage.getItem(SESION) || 'null');
    if (!s) return null;
    return store.todos('usuarios').find((u) => u.id === s.id && u.activo) || null;
  } catch {
    return null;
  }
}

function iniciarSesion(usuario) {
  try { sessionStorage.setItem(SESION, JSON.stringify({ id: usuario.id })); } catch { /* modo privado */ }
  store.usuarioActual = usuario;
}

export function cerrarSesion() {
  try { sessionStorage.removeItem(SESION); } catch { /* sin acción */ }
  store.usuarioActual = null;
  location.hash = '#/login';
  render();
}

export async function sembrarDatos() {
  const datos = await generarDatosDemo();
  for (const [col, val] of Object.entries(datos)) store.reemplazar(col, val);
}

export function navegar(ruta) {
  location.hash = '#/' + ruta;
}

/* --------------------------------------------------------------------- login */

function vistaLogin(app) {
  app.innerHTML = `
  <main class="login">
    <form class="login-caja" id="form-login" novalidate>
      <div class="login-marca"><div class="logo">F4</div><div><h1>ALT+F4 Gestión</h1></div></div>
      <p class="sub">Sistema de gestión operativa para servicios de mantenimiento y soporte técnico informático.</p>
      <div style="display:grid;gap:12px">
        <label>Correo electrónico<input type="email" name="email" autocomplete="username" required placeholder="usuario@altf4.co"></label>
        <label>Contraseña<input type="password" name="password" autocomplete="current-password" required></label>
        <button class="btn btn-bloque" type="submit">Ingresar</button>
      </div>
      <p id="login-error" class="campo-error" role="alert"></p>
      <div class="demo-info">
        <strong>Entorno de pruebas (datos simulados)</strong><br>
        ${CREDENCIALES_DEMO.map((c) => `${esc(c.rol)}: <code>${esc(c.email)}</code> / <code>${esc(c.password)}</code>`).join('<br>')}
      </div>
    </form>
  </main>`;
  $('#form-login').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target;
    const email = f.email.value.trim().toLowerCase();
    const pass = f.password.value;
    const err = $('#login-error');
    if (!email || !pass) { err.textContent = 'Ingrese correo y contraseña.'; return; }
    const usuario = store.todos('usuarios').find((u) => u.email === email && u.activo);
    if (!usuario || usuario.hash !== (await hashPassword(pass))) {
      err.textContent = 'Credenciales incorrectas. Verifique e intente de nuevo.';
      f.password.value = '';
      f.password.focus();
      return;
    }
    iniciarSesion(usuario);
    store.registrar('Inicio de sesión', 'usuarios', usuario.id);
    toast(`Bienvenido(a), ${usuario.nombre}`);
    navegar('dashboard');
  });
}

/* -------------------------------------------------------------------- layout */

function layout(app, rutaActual, usuario) {
  const enlaces = Object.entries(RUTAS)
    .filter(([, r]) => !r.rol || r.rol === usuario.rol)
    .map(([k, r]) => `<a href="#/${k}" class="${k === rutaActual ? 'activo' : ''}" ${k === rutaActual ? 'aria-current="page"' : ''}><span class="ico" aria-hidden="true">${r.ico}</span>${r.titulo}</a>`)
    .join('');
  app.innerHTML = `
  <div class="layout" id="layout">
    <aside class="lateral" aria-label="Menú principal">
      <div class="marca"><div class="logo">F4</div><div>ALT+F4 Gestión<small>Soporte técnico · Cúcuta</small></div></div>
      <nav class="nav">${enlaces}</nav>
      <div class="pie">
        <div><strong>${esc(usuario.nombre)}</strong></div>
        <div class="muted" style="color:#8fb0d6">${esc(usuario.rol)}</div>
        <button class="btn btn-sec btn-peq" id="btn-salir">Cerrar sesión</button>
      </div>
    </aside>
    <div>
      <div class="barra-movil"><button id="btn-menu" aria-label="Abrir menú">☰</button><strong>ALT+F4 Gestión</strong></div>
      <main class="principal" id="vista"></main>
    </div>
  </div>`;
  $('#btn-salir').addEventListener('click', cerrarSesion);
  $('#btn-menu').addEventListener('click', () => $('#layout').classList.toggle('menu-abierto'));
  $$('.nav a').forEach((a) => a.addEventListener('click', () => $('#layout').classList.remove('menu-abierto')));
}

/* -------------------------------------------------------------------- router */

export function render() {
  cerrarModal();
  const app = $('#app');
  const usuario = sesionActual();
  store.usuarioActual = usuario;
  const [ruta, ...params] = (location.hash.replace(/^#\/?/, '') || 'dashboard').split('/');

  if (!usuario) {
    if (ruta !== 'login') { location.replace('#/login'); return; }
    return vistaLogin(app);
  }
  if (ruta === 'login' || !RUTAS[ruta]) return navegar('dashboard');
  const def = RUTAS[ruta];
  if (def.rol && def.rol !== usuario.rol) {
    toast('No tiene permisos para acceder a este módulo.', 'error');
    return navegar('dashboard');
  }
  layout(app, ruta, usuario);
  document.title = `${def.titulo} · ALT+F4 Gestión`;
  const cont = $('#vista');
  try {
    def.vista.render(cont, { store, usuario, params, render, navegar, sembrarDatos });
  } catch (err) {
    console.error(err);
    cont.innerHTML = `<div class="panel"><h2>Ocurrió un error</h2><p>${esc(err.message)}</p></div>`;
  }
}

async function arrancar() {
  if (!store.inicializado()) await sembrarDatos();
  // Modo demostración para capturas automáticas: ?demo=1 inicia sesión como administrador.
  const qs = new URLSearchParams(location.search);
  if (qs.get('demo') === '1' && !sesionActual()) {
    const admin = store.todos('usuarios').find((u) => u.rol === 'Administrador');
    if (admin) iniciarSesion(admin);
  }
  window.addEventListener('hashchange', render);
  render();
}

arrancar();
