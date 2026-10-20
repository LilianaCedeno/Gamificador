/** Modelos de demostración IMPULSA; no constituyen un contrato HTTP. */
export type RolFuncional = 'COLABORADOR' | 'PEOPLE';
export type NivelInsignia = 'BRONCE' | 'PLATA' | 'ORO' | 'PLATINO';
export type EstadoReconocimiento = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';

export interface Antiguedad {
  anios: number;
  meses: number;
  dias: number;
}

export interface Colaborador {
  id: string;
  identificacionInterna: string;
  nombre: string;
  apellido: string;
  cargo: string;
  fotografiaUrl: string;
  correoCorporativo: string;
  /** Fecha civil YYYY-MM-DD. La antigüedad se deriva, nunca se persiste. */
  fechaIngreso: string;
  rol: RolFuncional;
}

export interface Categoria {
  id: string;
  nombre: string;
  descripcion: string;
  activa: boolean;
  /** Metadato para futura integración; cada aprobación sigue otorgando una estrella. */
  estrellasPorDefecto: number;
  /** Campo legado; los umbrales oficiales actuales son 5/10/15/25. */
  umbralBronce: number;
}

export type Evidencia =
  | { id: string; tipo: 'PDF'; nombre: string; url: string; mimeType: 'application/pdf' }
  | { id: string; tipo: 'JPG'; nombre: string; url: string; mimeType: 'image/jpeg' }
  | { id: string; tipo: 'ENLACE'; nombre: string; url: string };

interface ReconocimientoBase {
  id: string;
  destinatarioId: string;
  categoriaId: string;
  motivo: string;
  fecha: string;
  evidencias: readonly Evidencia[];
}

type OrigenReconocimiento =
  | { origen: 'INTERNO'; emisorId: string }
  | {
      origen: 'EXTERNO';
      emisorExterno: { nombre: string; correo: string };
      /** Persona People que registra y asigna la felicitación recibida por correo. */
      registradoPorId: string;
    };

type DecisionReconocimiento =
  | { estado: 'PENDIENTE'; validadoPorId?: never; fechaDecision?: never }
  | { estado: 'APROBADO' | 'RECHAZADO'; validadoPorId: string; fechaDecision: string };

export type Reconocimiento = ReconocimientoBase & OrigenReconocimiento & DecisionReconocimiento;

export interface Insignia {
  categoriaId: string;
  nivel: NivelInsignia;
  umbral: number;
}

export interface AscensoInsignia {
  colaboradorId: string;
  insignia: Insignia;
  fecha: string;
  reconocimientoId: string;
}

export interface ProgresoCategoria {
  colaboradorId: string;
  categoriaId: string;
  estrellas: number;
  insigniaActual: Insignia | null;
  proximaInsignia: Insignia | null;
  estrellasFaltantes: number;
  /** Avance acumulado hacia la próxima meta; Platino devuelve 100. */
  porcentajeAvance: number;
  historialAscensos: readonly AscensoInsignia[];
}

export interface ResumenMensual {
  colaboradorId: string;
  /** YYYY-MM; se agrupa por fecha de decisión, en UTC. */
  mes: string;
  estrellasObtenidas: number;
  reconocimientosAprobados: number;
  estrellasPorCategoria: readonly { categoriaId: string; estrellas: number }[];
  insigniasObtenidas: readonly AscensoInsignia[];
}
