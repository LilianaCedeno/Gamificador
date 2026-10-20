import type { Categoria, Colaborador, Evidencia, Reconocimiento } from '../core/models/impulsa.models';
import { calcularProgreso, calcularResumenMensual } from './impulsa-calculos.mock';

export const colaboradoresMock: readonly Colaborador[] = [
  { id: 'col-1', identificacionInterna: 'DEMO-001', nombre: 'Ana', apellido: 'Ejemplo', cargo: 'Desarrolladora', fotografiaUrl: 'https://example.invalid/ana.jpg', correoCorporativo: 'ana@example.invalid', fechaIngreso: '2022-03-15', rol: 'COLABORADOR' },
  { id: 'col-2', identificacionInterna: 'DEMO-002', nombre: 'Luis', apellido: 'Muestra', cargo: 'Analista', fotografiaUrl: 'https://example.invalid/luis.jpg', correoCorporativo: 'luis@example.invalid', fechaIngreso: '2026-10-01', rol: 'COLABORADOR' },
  { id: 'people-1', identificacionInterna: 'DEMO-003', nombre: 'Sara', apellido: 'Prueba', cargo: 'Especialista People', fotografiaUrl: 'https://example.invalid/sara.jpg', correoCorporativo: 'sara@example.invalid', fechaIngreso: '2020-02-29', rol: 'PEOPLE' },
];

export const categoriasMock: readonly Categoria[] = [
  { id: 'certificaciones', nombre: 'Certificaciones', descripcion: 'Certificaciones profesionales', activa: true, umbralBronce: 5, estrellasPorDefecto: 1 },
  { id: 'clientes', nombre: 'Felicitaciones de clientes', descripcion: 'Reconocimientos externos registrados por People', activa: true, umbralBronce: 5, estrellasPorDefecto: 1 },
  { id: 'innovacion', nombre: 'Innovación', descripcion: 'Ideas y mejoras', activa: true, umbralBronce: 5, estrellasPorDefecto: 1 },
  { id: 'mentorias', nombre: 'Mentorías', descripcion: 'Acompañamiento a compañeros', activa: true, umbralBronce: 5, estrellasPorDefecto: 1 },
  { id: 'capacitaciones', nombre: 'Capacitaciones', descripcion: 'Aprendizaje continuo', activa: true, umbralBronce: 5, estrellasPorDefecto: 1 },
];

/** Referencias inertes: no contienen archivos ni realizan subidas o solicitudes. */
export const evidenciasMock: readonly Evidencia[] = [
  { id: 'ev-pdf', tipo: 'PDF', nombre: 'Certificado ficticio.pdf', url: 'https://example.invalid/certificado.pdf', mimeType: 'application/pdf' },
  { id: 'ev-jpg', tipo: 'JPG', nombre: 'Respaldo ficticio.jpg', url: 'https://example.invalid/respaldo.jpg', mimeType: 'image/jpeg' },
  { id: 'ev-url', tipo: 'ENLACE', nombre: 'Certificado de demostración', url: 'https://example.invalid/certificado' },
];

const lotes = [
  { categoriaId: 'certificaciones', cantidad: 25 },
  { categoriaId: 'clientes', cantidad: 15 },
  { categoriaId: 'innovacion', cantidad: 10 },
  { categoriaId: 'mentorias', cantidad: 5 },
];

export const reconocimientosMock: readonly Reconocimiento[] = [
  ...lotes.flatMap(({ categoriaId, cantidad }) => Array.from({ length: cantidad }, (_, i): Reconocimiento => {
    const dia = String(i + 1).padStart(2, '0');
    return {
      id: `${categoriaId}-${dia}`, destinatarioId: 'col-1', categoriaId,
      motivo: `Reconocimiento ficticio ${i + 1} de ${categoriaId}`,
      fecha: `2026-09-${dia}T09:00:00.000Z`,
      evidencias: [evidenciasMock[i % evidenciasMock.length]],
      ...(categoriaId === 'clientes'
        ? { origen: 'EXTERNO' as const, emisorExterno: { nombre: 'Cliente de ejemplo', correo: 'cliente@example.invalid' }, registradoPorId: 'people-1' }
        : { origen: 'INTERNO' as const, emisorId: 'col-2' }),
      estado: 'APROBADO', validadoPorId: 'people-1',
      fechaDecision: `2026-${i < 4 ? '09' : '10'}-${String(Math.min(i + 1, 19)).padStart(2, '0')}T12:00:00.000Z`,
    };
  })),
  { id: 'pendiente-1', origen: 'INTERNO', emisorId: 'col-1', destinatarioId: 'col-2', categoriaId: 'mentorias', motivo: 'Acompañamiento ficticio pendiente de revisión', fecha: '2026-10-15T09:00:00.000Z', evidencias: [evidenciasMock[2]], estado: 'PENDIENTE' },
  { id: 'rechazado-1', origen: 'INTERNO', emisorId: 'col-2', destinatarioId: 'col-1', categoriaId: 'capacitaciones', motivo: 'Solicitud ficticia con respaldo insuficiente', fecha: '2026-10-16T09:00:00.000Z', evidencias: [evidenciasMock[1]], estado: 'RECHAZADO', validadoPorId: 'people-1', fechaDecision: '2026-10-17T12:00:00.000Z' },
];

/** Se generan copias derivadas: las estrellas y la antigüedad no se persisten. */
export function crearEscenarioMock() {
  const colaboradores = structuredClone(colaboradoresMock);
  const categorias = structuredClone(categoriasMock);
  const reconocimientos = structuredClone(reconocimientosMock);
  return {
    colaboradores, categorias, reconocimientos,
    progresos: colaboradores.flatMap(c => categorias.map(categoria =>
      calcularProgreso(c.id, categoria, reconocimientos))),
    resumenesMensuales: colaboradores.map(c =>
      calcularResumenMensual(c.id, '2026-10', categorias, reconocimientos)),
  };
}
