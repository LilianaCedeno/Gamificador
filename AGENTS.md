# AGENTS.md — Portal de Logros y Gamificación

## 1. Contexto y objetivo
Proyecto frontend Angular del MVP **Portal de Logros y Gamificación**. Hay tres vistas principales: inicio de sesión, Colaborador y Mantenedor People. El frontend trabaja temporalmente con **mocks**; la API REST y sus endpoints están en desarrollo por otro integrante.

Este archivo guía a los agentes de desarrollo. **No autoriza cambios automáticos:** antes de implementar cada etapa, presentar el plan, los archivos afectados y solicitar aprobación.

## 2. Restricciones obligatorias
- La rama de referencia es `main`, pero el agente **no debe realizar ninguna operación que cambie el estado de Git o GitHub** sin autorización previa y expresa de la responsable del proyecto. No crear commits ni cambiar ramas por iniciativa propia.
- **No modificar** el inicio de sesión ni la autenticación a cargo de otro integrante: `src/app/auth/**`, `src/app/guards/**` y `src/app/services/auth.service*`. No alterar flujos de login, sesiones o permisos sin coordinación explícita.
- Conservar las rutas existentes `/`, `/home`, `/main`, `/wall` y sus comportamientos mientras se define la integración. Solicitar aprobación antes de modificar `app.routes.ts`, `app.config.ts` o archivos compartidos con login.
- El MVP tiene **dos roles de negocio: COLABORADOR y PEOPLE**. No diseñar nuevas funciones de administrador. Si el código actual contiene `ADMIN`, no eliminarlo ni refactorizar autenticación sin acordarlo con el responsable del login.
- No crear ni asumir endpoints reales; no inventar contratos HTTP. Los modelos mock son provisionales y deberán validarse con backend.
- No incorporar rankings avanzados, notificaciones, reportes complejos o integración corporativa. Compartir en LinkedIn queda postergado.
- No subir datos personales reales, credenciales, tokens o evidencias confidenciales al repositorio; usar datos ficticios.
- No añadir dependencias ni reformatear masivamente archivos sin autorización.

## Control de Git y GitHub — Regla crítica de autorización
- **La responsable del proyecto es la única encargada de aprobar y ejecutar commits, sincronizaciones y publicaciones.** El agente no debe efectuar estas acciones por cuenta propia.
- **PROHIBIDO sin aprobación previa y explícita:** `git add`, `git commit`, `git push`, `git pull`, `git fetch`, `git merge`, `git reset`, `git rebase`, `git checkout`, `git switch`, crear/eliminar ramas o etiquetas, cambiar remotos, abrir/modificar Pull Requests o realizar cualquier otra operación que altere Git/GitHub.
- **Permitido para inspección local, sin alterar el repositorio:** `git status`, `git diff` y `git log`.
- Antes de proponer una operación de Git, explicar su finalidad, archivos o ramas involucradas y riesgos; esperar instrucciones expresas.
- Tras completar una tarea, informar archivos creados/modificados, pruebas ejecutadas y pendientes; **detenerse sin hacer staging, commit ni push**.
- Ninguna instrucción genérica como «continúa» o «termina la tarea» debe interpretarse como autorización para publicar cambios.

## 3. Arquitectura objetivo (sin reestructuración destructiva)
Mantener las carpetas existentes `auth/`, `guards/`, `services/`, `components/`, `shared/`. Añadir gradualmente:

```text
src/app/
  features/
    colaborador/
      dashboard/
      reconocimientos/
      insignias/
      historial/
    people/
      dashboard/
      categorias/
      reglas-insignias/
      validaciones/
      trazabilidad/
      resumenes/
  core/
    models/
    data-access/
  mocks/
  shared/  # ampliar componentes reutilizables existentes
```

- Usar Angular standalone, TypeScript y Angular Material cuando sea adecuado; componentes pequeños, accesibles y responsivos.
- Los componentes presentan información; los servicios de `data-access` obtienen datos y ocultan si provienen de mocks o API.
- Definir interfaces claras para Colaborador, Categoría, Reconocimiento, Evidencia, Insignia, ProgresoCategoria y ResumenMensual, sujetas al futuro contrato backend.
- Durante el desarrollo, los servicios retornarán datos simulados y permitirán probar estados de carga, vacío y error.
- El cálculo autoritativo de estrellas, el cambio de insignia, la validación de reconocimientos y los permisos finales corresponden al backend; los cálculos del mock sirven solo para demostración UX/UI.

## 4. Reglas funcionales del MVP
### Categorías de prueba
Certificaciones, Felicitaciones de clientes, Innovación, Mentorías y Capacitaciones. People puede crear y configurar categorías y parámetros sin cambios de código.

### Datos del colaborador
- Perfil visible: **nombre, apellido, cargo, fotografía, fecha de ingreso, antigüedad completa (años, meses y días), correo corporativo e identificación interna**.
- El rol funcional será `COLABORADOR` o `PEOPLE`. La antigüedad debe derivarse de la fecha de ingreso (no persistir una cifra fija en los mocks).
- El dashboard también presenta estrellas, insignia actual por categoría, progreso e historial de reconocimientos.

### Reconocimientos
- El colaborador puede reconocer a otro colaborador.
- People recibe por correo las felicitaciones externas y **las registra y asigna** al colaborador destinatario.
- La evidencia puede ser archivo **PDF**, **JPG** o **enlace** a certificado o respaldo. La subida/almacenamiento definitivo depende del backend.
- Estados propuestos: `PENDIENTE`, `APROBADO`, `RECHAZADO`; confirmar nombres exactos y campos con backend.
- **Solo un reconocimiento aprobado por People suma una estrella** a la categoría pertinente. Los pendientes y rechazados no suman, pero mantienen trazabilidad.
- La trazabilidad conserva emisor, destinatario, categoría, motivo, fecha, evidencia, estado, persona que validó y fecha de decisión. Se consulta en el historial del colaborador y dentro del Mantenedor People; **no existe un módulo separado de auditoría**.

### Insignias
- Cada categoría tiene su progresión independiente: **Bronce → Plata → Oro → Platino**.
- Los umbrales de referencia en la demostración actual son **Bronce: 5, Plata: 10, Oro: 15 y Platino: 25 estrellas**. Confirmar con People/backend si deben ser configurables y validar los umbrales definitivos antes de la integración REST.
- Cada colaborador empieza con **0 estrellas en cada categoría**; antes de Bronce se muestra el progreso hacia la primera insignia (estrella vacía y cantidad acumulada), **sin insignia obtenida**.
- Mostrar **solo la insignia actual (mayor nivel alcanzado) por categoría** y las estrellas acumuladas debajo; guardar la historia de ascensos para trazabilidad. Las estrellas no se descuentan ni reinician al subir.

### Pantallas
**Inicio de sesión:** pertenece al compañero responsable; no intervenir.

**Colaborador:** dashboard con progreso e insignia actual por categoría; enviar reconocimientos a compañeros; consultar reconocimientos recibidos y enviados, sus estados e historial/trazabilidad personal.

**Mantenedor People:** dashboard, alta y configuración de categorías y reglas, carga de felicitaciones externas, aprobación/rechazo, consulta por colaborador e historial, y resúmenes mensuales por colaborador e insignias. Trazabilidad integrada para revisión sencilla.

## 5. Identidad visual y diseño UX/UI aprobado — IMPULSA
- **Nombre de la aplicación:** IMPULSA. No utilizar «Inspírate» como nombre final en las nuevas pantallas; **no cambiar la landing existente** hasta obtener aprobación para hacerlo.
- **Paleta de referencia aprobada:** `#061A24` (azul casi negro, encabezados/fondos oscuros), `#0B3A53` (azul profundo, navegación y texto secundario), `#0FA3B1` (turquesa, acentos y progreso), `#B5E2FA` (celeste, fondos destacados), `#F3FAFF` (blanco azulado, fondo general). Usar contraste accesible; puede emplearse blanco puro en tarjetas.
- Colores de medallas **solo para distinguir niveles**: Bronce, Plata, Oro y Platino. No confundir esos tonos con la paleta corporativa.
- Mantener las variables de diseño compartidas centralizadas (por ejemplo en `src/styles.css` y el tema existente `src/material-theme.scss`) **sin cambiarlas hasta aprobar el alcance de modificación**. Reutilizar tokens de color, espaciado, bordes y tipografía en ambas vistas, sin duplicar reglas globales en cada componente.
- Cada componente nuevo debe tener archivos **`.ts`, `.html`, `.css` y pruebas `.spec.ts`** separados, usando los patrones del Angular existente. No mezclar HTML o CSS grandes dentro de TypeScript.
- Mantener los componentes visuales desacoplados de mocks y API; diseño responsive para escritorio, tablet y móvil, navegación por teclado y etiquetas accesibles.

### Dashboard Colaborador — disposición UX/UI aprobada
1. **Cabecera superior IMPULSA:** identidad y navegación, sin modificar el login/landing de otro integrante.
2. **Primera sección — perfil:** fotografía, nombre y apellido, cargo, correo y antigüedad **completa (años, meses y días)** calculada desde fecha de ingreso. Mostrar fecha de ingreso si resulta útil en la ficha.
3. **Segunda sección — insignias y progreso:** tarjetas por categoría con **una sola insignia, la actual**, estrellas acumuladas **debajo de la insignia**, barra de avance y próxima meta cuando exista. Desde 0 estrellas, mostrar una **estrella vacía** y ningún nivel obtenido. Con Platino como nivel máximo, indicar «Nivel máximo alcanzado» sin barra hacia otro nivel.
4. **Tercera sección — avances:** tarjetas o métricas resumidas con total de estrellas, logros aprobados y progreso mensual, siempre calculadas con datos simulados coherentes.
5. **Cuarta sección — historial y trazabilidad:** línea de tiempo/listado con fecha, categoría, motivo, emisor y estado (pendiente/aprobado/rechazado); detalle y evidencia si corresponde. Incluir acceso a «Reconocer a un compañero» dentro del dashboard.
- En escritorio, perfil arriba, insignias debajo y avances e historial en secciones inferiores diferenciadas. En móvil, apilar tarjetas y hacer legible el historial.
- Las imágenes compartidas de referencia sirven para **composición visual**, no autorizan añadir rankings avanzados, una interfaz de Teams ni controles administrativos fuera del MVP.
- **Este diseño está aprobado a nivel conceptual**, no supone que Codex pueda implementarlo sin aprobar primero la etapa, los archivos afectados y los cambios de estilos globales.

## 6. Mocks y futura API
- Crear datos sintéticos representativos para las cinco categorías, distintos colaboradores, varios estados y umbrales configurables.
- Diseñar servicios con contratos tipados que puedan reemplazar mocks por `HttpClient` más adelante sin rehacer componentes.
- **No modificar `app.config.ts` solo para añadir `provideHttpClient()` hasta iniciar la integración REST acordada.**
- Si falta una regla funcional, registrar la duda y pedir definición; no asumirla silenciosamente.

## 7. Secuencia de implementación aprobable por etapas
### Modo de trabajo en Codex (IntelliJ IDEA)
- Este `AGENTS.md` es la **fuente central de instrucciones y etapas** para Codex en IntelliJ. No depender de mensajes externos para recordar las reglas.
- Codex debe **trabajar solo en la etapa autorizada**. Antes de empezar, entregar un plan breve (objetivo, archivos, alcance, riesgos) y **solicitar visto bueno**.
- Al terminar la etapa, entregar lista de archivos creados o modificados, explicación funcional, pruebas y errores o pendientes. **Detenerse y pedir validación**; no iniciar otra etapa por iniciativa propia.
- Si cambia un requisito, **proponer la actualización de este archivo para aprobación antes de implementar el cambio**. No reescribir `AGENTS.md` unilateralmente.
- No instalar paquetes, alterar configuración compartida ni modificar autenticación sin autorización explícita.
- **Control de versiones siempre reservado a la usuaria**: ningún cambio de Git/GitHub sin su aprobación previa y ejecución por ella.

### Hoja de ruta con puertas de aprobación
**Etapa 0 — Inspección y plan**
- Leer esta guía y revisar únicamente la estructura real; identificar componentes existentes reutilizables y puntos de integración. Revisar también `src/styles.css`, `src/material-theme.scss` y los CSS actuales para detectar patrones y posibles conflictos con la paleta oficial IMPULSA.
- Entregable: plan de archivos y posibles conflictos; **sin escribir código**.

**Etapa 1 — Modelos y mocks**
- Modelos tipados: colaborador (incluyendo foto, cargo, fecha de ingreso y antigüedad calculada), categoría, reconocimiento, evidencia, insignia, progreso por categoría y resumen mensual.
- Datos ficticios de cinco categorías, varios colaboradores, evidencias PDF/JPG/URL, estados `PENDIENTE`/`APROBADO`/`RECHAZADO` y distintos niveles de progreso.
- Simular las cinco categorías, los umbrales de referencia **5/10/15/25** y casos desde 0 estrellas. No inventar endpoints; confirmar antes de integrar si los umbrales deben configurarse por categoría.
- Comprobar escenarios de progresión y que solo aprobados suman estrellas.
- Entregable: archivos creados, ejemplos de datos y pruebas. **Sin rutas, pantallas ni cambios en login**.

**Etapa 2 — Dashboard Colaborador**
- Diseñar e implementar solo después de aprobar etapa 1, **siguiendo exactamente la disposición UX/UI aprobada en la sección 5**: cabecera, ficha de perfil, insignias por categoría, avances, historial/trazabilidad y formulario para reconocer compañeros.
- Utilizar servicios de datos mock tipados; componentes pequeños y reutilizables; UX adaptable y accesible.
- Entregable: demostración local y pruebas, sin cambios en autenticación.

**Etapa 3 — Mantenedor People**
- Dashboard general y resúmenes mensuales por colaborador e insignias.
- Configurar categorías, umbral base y reglas; registrar felicitaciones externas recibidas por correo, asignarlas a colaboradores, adjuntar evidencia PDF/JPG o URL; validar/rechazar reconocimientos.
- Consultar historial y trazabilidad dentro del mantenedor, sin módulo separado de auditoría.
- Entregable: flujos funcionales simulados, casos de prueba y validación de UX/UI.

**Etapa 4 — Integración de navegación y roles**
- Proponer rutas para las dos vistas privadas sin romper `/`, `/home`, `/main`, `/wall`.
- Coordinar cualquier modificación de guards y login con el compañero responsable; no realizarla sin autorización. No introducir rol ADMIN como requisito del MVP.
- Entregable: prueba de navegación autorizada por rol y regresión de pantallas existentes.

**Etapa 5 — Integración REST y estabilización**
- Solo cuando backend entregue contratos documentados: adaptar data-access a `HttpClient`, definir manejo de carga/error, evidencias y permisos reales; validar el redondeo de umbrales con backend.
- Ejecutar compilación, pruebas e integración y documentar divergencias respecto a mocks.
- LinkedIn, rankings, notificaciones avanzadas e integraciones corporativas quedan fuera de la prioridad actual; no desarrollarlas sin nueva aprobación.

## 8. Criterios de calidad y entrega
- Antes de cada cambio: explicar propósito, archivos involucrados y riesgos de afectar código ajeno.
- Después de cada cambio aprobado: ejecutar scripts disponibles de build y pruebas; comunicar resultados reales y limitaciones.
- Mantener accesibilidad básica, estados vacíos y mensajes claros de validación; no mostrar datos ficticios como reales.
- Documentar cambios relevantes y el comportamiento de los mocks. Entregar un resumen y esperar la aprobación de la responsable antes de cualquier acción de control de versiones.
