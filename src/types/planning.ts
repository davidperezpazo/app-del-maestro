/** Proveedor de IA soportado */
export type AiProvider = 'gemini' | 'openai';

/** Configuración del maestro almacenada en localStorage */
export interface TeacherSettings {
    teacherName: string;
    apiKey: string;
    aiProvider: AiProvider;
    isVerified: boolean;
}

/** Metadatos de la planificación (fila 1 y cabecera) */
export interface PlanningMetadata {
    curso: string;       // e.g. "2025-2026"
    nivel: string;       // e.g. "3º"
    etapa: string;       // e.g. "PRIMARIA"
    grupo: string;       // e.g. "A-B-C"
    tituloSA: string;    // e.g. "SA4 Toma tu parte"
    justificacion: string; // Texto largo justificativo
}

/** Una fila de la planificación (filas 8+) */
export interface PlanningRow {
    competenciasClave: string;
    ceMismaArea: string;
    ceRelacionada: string;
    sabereBasicos: string;
    saberEspecifico: string;
    criteriosEvalSA: string;
    indicadoresLogro: string;
    porcentaje: number;
    instrumentosEval: string;
    temporizacion: string;
    actividades: string;
    recursos: string;
    espacio: string;
}

/** Planificación completa generada por la IA */
export interface Planning {
    metadata: PlanningMetadata;
    rows: PlanningRow[];
    dua: string; // Texto DUA (columnas O-S merged)
}

/** Estado de progreso del procesamiento */
export interface ProcessingState {
    status: 'idle' | 'extracting-pdf' | 'calling-ai' | 'generating-excel' | 'done' | 'error';
    progress: number; // 0-100
    message: string;
    error?: string;
}

/** Resultado de la generación */
export interface GenerationResult {
    unitName: string;
    blob: Blob;
    fileName: string;
}
