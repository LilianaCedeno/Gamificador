# IMPULSA — Etapa 1

Modelos provisionales en `../core/models/impulsa.models.ts`, sin contratos HTTP ni integración con pantallas, rutas o autenticación.

`crearEscenarioMock()` entrega copias independientes de datos completamente ficticios. Ana tiene 25/15/10/5/0 estrellas en las cinco categorías (Platino/Oro/Plata/Bronce/sin insignia). Luis y Sara comienzan en cero. Hay reconocimientos internos y felicitaciones externas registradas por People, evidencias PDF/JPG/enlace y los tres estados. Las URL `example.invalid` son referencias inertes, sin archivos o fotografías descargables.

Los cálculos son exclusivamente demostrativos; backend decidirá estrellas, permisos, validaciones y ascensos. Cada aprobado suma una estrella, conservada al ascender. Los umbrales oficiales son Bronce 5, Plata 10, Oro 15 y Platino 25; reemplazan la regla anterior 5/8/12. El campo legado umbralBronce se conserva como metadato, pero no cambia estos umbrales. estrellasPorDefecto se conserva para integración futura y no se usa todavía para calcular estrellas. Se conserva la historia de ascensos, mostrando una sola insignia actual; en cero no hay insignia y Platino carece de próxima meta.

Convenciones mock explícitas pendientes de validación: fechas civiles para antigüedad, aniversarios ajustados al último día del mes, fechas de eventos UTC y resúmenes agrupados por fecha de decisión. El avance es estrellas acumuladas / próxima meta (100% en Platino). La fecha de referencia de antigüedad se recibe como argumento; no se almacena una antigüedad fija. Los cálculos reciben el historial completo, con identificadores únicos y decisiones coherentes; no implementan autorización o mutaciones de estados. Para resúmenes históricos, suministrar también categorías históricas si sus reglas cambiaron; no se ha definido versionado de reglas.

Las funciones no consultan redes ni simulan carga/error: esa responsabilidad corresponde a la futura capa de acceso a datos. Los estados vacíos sí se admiten. No se añadieron servicios ni componentes en esta etapa.
