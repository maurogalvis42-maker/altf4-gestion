# Registro de sprints (Scrum)

Roles: Andrés Mauricio Galvis Gutiérrez (Product Owner, Scrum Master y Equipo de desarrollo).

**Definition of Done:** código en GitHub, criterios de aceptación cumplidos, pruebas automatizadas aprobadas, vista revisada en escritorio y celular y documentación actualizada.

## Sprint 0 (26/10/2026 – 29/10/2026)

**Objetivo:** Preparar el proyecto: visión del producto, Product Backlog priorizado, entorno de desarrollo y repositorio.

**Sprint Backlog:**
- Definición de la visión, alcance y Definition of Done
- Levantamiento de requerimientos y redacción de historias de usuario
- Priorización MoSCoW y estimación con puntos de historia
- Creación del repositorio Git, estructura de carpetas y licencia

**Incremento:** Product Backlog de 18 historias (71 puntos; 63 comprometidos para esta versión), estructura del repositorio y guía de estilo visual.

**Sprint Review:** Se validó con el Product Owner que el alcance mínimo para TRL 5 corresponde a las historias Must y Should.

**Retrospectiva:** Bien: el backlog quedó claro y priorizado. Mejorar: definir criterios de aceptación medibles desde el inicio. Acción: incluir cada criterio como caso de prueba.

## Sprint 1 (30/10/2026 – 05/11/2026)

**Objetivo:** Contar con el acceso seguro, la estructura responsiva y la gestión de clientes y equipos.

**Sprint Backlog:**
- HU-01 Inicio de sesión (3 pts)
- HU-02 Menú responsivo (3 pts)
- HU-03 Registro de clientes con autorización de datos (5 pts)
- HU-04 Búsqueda e historial de clientes (3 pts)
- HU-05 Registro de equipos (3 pts)

**Incremento:** Login con contraseña cifrada, layout responsivo, módulos de Clientes y Equipos con validaciones y datos de demostración.

**Sprint Review:** 17 de 17 puntos terminados. Se ajustó la validación del teléfono para aceptar números fijos con indicativo 607.

**Retrospectiva:** Bien: separar la lógica de negocio en logic.js facilitó las pruebas. Mejorar: las validaciones se repetían en las vistas. Acción: centralizarlas en funciones puras reutilizables.

## Sprint 2 (06/11/2026 – 12/11/2026)

**Objetivo:** Gestionar la agenda y el ciclo de vida de la orden de servicio.

**Sprint Backlog:**
- HU-06 Agenda de citas sin cruces (5 pts)
- HU-07 Convertir cita en orden (2 pts)
- HU-08 Crear orden con consecutivo (5 pts)
- HU-09 Flujo de estados (3 pts)
- HU-10 Checklist preventivo (3 pts)

**Incremento:** Módulo de Agenda y módulo de Órdenes con flujo de estados, consecutivo automático y checklist de 10 actividades.

**Sprint Review:** 18 de 18 puntos terminados. Se agregó la regla de no entregar un preventivo con el checklist incompleto (RN-05).

**Retrospectiva:** Bien: el flujo de estados es fácil de entender. Mejorar: faltaban pruebas de los cruces de citas. Acción: escribir primero la prueba y luego el código en reglas críticas.

## Sprint 3 (13/11/2026 – 16/11/2026)

**Objetivo:** Controlar repuestos, costos e inventario y emitir documentos al cliente.

**Sprint Backlog:**
- HU-11 Repuestos y total con IVA (5 pts)
- HU-12 Inventario con alertas (5 pts)
- HU-13 Informe técnico y cotización (3 pts)

**Incremento:** Descuento y reintegro de inventario, cálculo de totales con IVA, módulo de Inventario y documentos imprimibles.

**Sprint Review:** 13 de 13 puntos terminados. Se decidió calcular el IVA sobre la base después del descuento.

**Retrospectiva:** Bien: las pruebas detectaron que el inventario se mutaba por referencia. Mejorar: revisar la vista en celular durante el sprint. Acción: probar cada pantalla en 375 px antes de cerrar la historia.

## Sprint 4 (17/11/2026 – 21/11/2026)

**Objetivo:** Completar indicadores, reportes y configuración; probar y desplegar el prototipo.

**Sprint Backlog:**
- HU-14 Tablero con indicadores (5 pts)
- HU-15 Reportes y CSV (5 pts)
- HU-16 Configuración, respaldo y bitácora (3 pts)
- HU-17 Recordatorio de preventivo (2 pts)
- Pruebas, corrección de defectos, documentación y despliegue

**Incremento:** Tablero, Reportes, Configuración, 38 pruebas automatizadas aprobadas, corrección de desbordes en celular, README, manual de usuario y despliegue en GitHub Pages.

**Sprint Review:** 15 de 15 puntos terminados. Prototipo funcional completo (63 de 63 puntos comprometidos; 100 % de las historias Must, Should y Could de esta versión).

**Retrospectiva:** Bien: el producto cumple el alcance mínimo de TRL 5. Mejorar: validar con más usuarios reales. Acción: aplicar el protocolo de validación con usuarios y priorizar las mejoras en el backlog.
