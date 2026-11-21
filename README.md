# ALT+F4 Gestión — Prototipo funcional TRL 5

Sistema web de gestión operativa para el emprendimiento **ALT+F4: Mantenimiento y Soporte Técnico Informático**, orientado a microempresas, profesionales independientes y usuarios residenciales de Cúcuta, Norte de Santander.

> Proyecto de grado — Ingeniería de Sistemas, UNAD (curso 202016907, Fase 4: componente práctico).
> Metodología de desarrollo: **Scrum** adaptado a un desarrollador. Nivel de madurez tecnológica: **TRL 5** (validado en un entorno relevante simulado).

## Integrante

| Nombre | Rol en Scrum |
|---|---|
| Andrés Mauricio Galvis Gutiérrez | Product Owner, Scrum Master y Equipo de desarrollo |

## Objetivo

Sistematizar la operación del servicio técnico de ALT+F4 (agenda, clientes, hoja de vida de equipos, órdenes de servicio, inventario de repuestos y reportes) para ofrecer un servicio trazable, profesional y escalable, en cumplimiento de la Ley 1581 de 2012 sobre protección de datos personales.

## Demostración

- **URL del prototipo (GitHub Pages):** `https://maurogalvis42-maker.github.io/altf4-gestion/`
- **Credenciales de prueba (datos simulados):**

| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | `admin@altf4.co` | `Altf4*2026` |
| Técnico | `tecnico@altf4.co` | `Tecnico*2026` |

## Funcionalidades

| Módulo | Qué hace |
|---|---|
| Inicio de sesión | Autenticación con contraseña cifrada (SHA-256) y control de acceso por rol |
| Tablero | Indicadores (citas del día, órdenes abiertas, ingresos del mes, stock bajo, tiempo de entrega), gráfico de ingresos y alertas |
| Agenda de citas | Programar, confirmar, atender o cancelar citas; evita cruces de horario por técnico y fuera del horario de atención |
| Órdenes de servicio | Flujo Recibido → En diagnóstico → En reparación → Listo para entrega → Entregado, con consecutivo automático `OS-AAAA-0000` |
| Checklist preventivo | 10 actividades estandarizadas; no deja entregar un preventivo incompleto |
| Repuestos y costos | Descuenta inventario en tiempo real, calcula subtotal, descuento, IVA 19 % y total |
| Informe técnico / Cotización | Documentos imprimibles o exportables a PDF |
| Clientes | Registro con autorización de tratamiento de datos (Ley 1581), historial y exportación CSV |
| Equipos | Hoja de vida del equipo (marca, modelo, serial, SO, RAM, almacenamiento) |
| Inventario | Existencias, stock mínimo, entradas, valor del inventario y exportación CSV |
| Reportes | Ingresos por mes, servicios por tipo, segmentos de cliente, top de clientes y repuestos |
| Configuración | Datos de la empresa, tarifas, respaldo/restauración JSON y bitácora de auditoría |

Es responsivo (celular, tablet y escritorio).

## Tecnologías

- HTML5, CSS3 y JavaScript (ES Modules), sin frameworks ni dependencias externas.
- Persistencia en `localStorage` mediante un repositorio genérico (`store.js`) que se puede cambiar por una API REST.
- Pruebas automatizadas con el ejecutor nativo de Node.js (`node --test`).
- Git y GitHub para el control de versiones; GitHub Pages para el despliegue.

## Estructura del repositorio

```
altf4-gestion/
├── README.md
├── LICENSE
├── index.html               ← redirige a src/ (para GitHub Pages)
├── package.json
├── src/                     ← código fuente del prototipo
│   ├── index.html
│   ├── css/styles.css
│   ├── img/favicon.svg
│   └── js/
│       ├── app.js           ← arranque, sesión y enrutador
│       ├── logic.js         ← reglas de negocio (puras y probadas)
│       ├── store.js         ← capa de datos (patrón Repository)
│       ├── seed.js          ← datos simulados de demostración
│       ├── ui.js            ← componentes de interfaz
│       └── views/           ← una vista por módulo
├── tests/                   ← pruebas unitarias e integración (38 casos)
├── scripts/                 ← servidor local y exportación de datos
├── data/datos_demo.json     ← conjunto de datos simulados
├── docs/                    ← backlog, plan de pruebas, manual, diagramas, informe final
└── evidencias/capturas/     ← capturas de pantalla del prototipo
```

## Instrucciones de uso

### Opción 1: en línea
Abrir la URL de GitHub Pages e ingresar con las credenciales de prueba.

### Opción 2: en local (requiere Node.js 20 o superior)

```bash
git clone https://github.com/maurogalvis42-maker/altf4-gestion.git
cd altf4-gestion
npm start          # abre http://localhost:5173
npm test           # ejecuta las 38 pruebas automatizadas
```

> Los módulos ES no se cargan con doble clic sobre `index.html` (`file://`); use `npm start` o cualquier servidor estático.

Para volver a los datos iniciales: **Configuración → Restablecer datos de demostración**.

## Documentación

- [Product Backlog e historias de usuario](docs/product_backlog.md)
- [Registro de sprints (Scrum)](docs/sprints.md)
- [Plan y resultados de pruebas](docs/plan_pruebas.md)
- [Manual de usuario](docs/manual_usuario.md)
- [Diagramas](docs/diagramas/)
- Informe final (documento maestro): `docs/informe_final.pdf`

## Licencia

MIT. Consulte [LICENSE](LICENSE).
