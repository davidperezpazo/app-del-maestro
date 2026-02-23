import { useState } from 'react';
import { DocumentUploader } from './DocumentUploader';
import { ProgressBar } from './ProgressBar';
import { DownloadButton } from './DownloadButton';
import { loadSettings } from '../stores/settings-store';
import { extractTextWithLimit } from '../services/document-service';
import { generatePlanning } from '../services/ai-service';
import { generateExcel } from '../services/excel-service';
import type { ProcessingState, GenerationResult } from '../types/planning';

export function Generator() {
    const [bookFile, setBookFile] = useState<File | null>(null);
    const [justFile, setJustFile] = useState<File | null>(null);
    const [units, setUnits] = useState('');
    const [nivel, setNivel] = useState('');
    const [asignatura, setAsignatura] = useState('');
    const [grupo, setGrupo] = useState('A-B-C');
    const [processing, setProcessing] = useState<ProcessingState>({
        status: 'idle',
        progress: 0,
        message: '',
    });
    const [results, setResults] = useState<GenerationResult[]>([]);

    const settings = loadSettings();
    const canGenerate =
        bookFile && justFile && units.trim() && settings.apiKey && settings.isVerified;

    async function handleGenerate() {
        if (!bookFile || !justFile || !units.trim()) return;

        const currentSettings = loadSettings();
        if (!currentSettings.apiKey || !currentSettings.isVerified) {
            setProcessing({
                status: 'error',
                progress: 0,
                message: 'Configura y verifica tu API Key en la pestaña de Configuración',
                error: 'API Key no configurada',
            });
            return;
        }

        setResults([]);
        const unitList = units.split(',').map((u) => u.trim()).filter(Boolean);

        try {
            // Fase 1: Extraer texto de los PDFs
            setProcessing({
                status: 'extracting-pdf',
                progress: 5,
                message: 'Extrayendo texto del libro de texto...',
            });

            const bookText = await extractTextWithLimit(bookFile, 300000, (p) => {
                setProcessing((prev) => ({
                    ...prev,
                    progress: 5 + Math.round(p.percentage * 0.2),
                    message: `Extrayendo libro: página ${p.currentPage} de ${p.totalPages}...`,
                }));
            });

            setProcessing({
                status: 'extracting-pdf',
                progress: 30,
                message: 'Extrayendo texto de la justificación curricular...',
            });

            const justText = await extractTextWithLimit(justFile, 200000, (p) => {
                setProcessing((prev) => ({
                    ...prev,
                    progress: 30 + Math.round(p.percentage * 0.1),
                    message: `Extrayendo justificación: página ${p.currentPage} de ${p.totalPages}...`,
                }));
            });

            // Fase 2: Generar planificaciones con IA
            const newResults: GenerationResult[] = [];

            for (let i = 0; i < unitList.length; i++) {
                const unitName = unitList[i];
                const unitProgress = 40 + Math.round(((i + 0.5) / unitList.length) * 45);

                setProcessing({
                    status: 'calling-ai',
                    progress: unitProgress,
                    message: `Generando planificación para ${unitName} con ${currentSettings.aiProvider === 'gemini' ? 'Gemini' : 'OpenAI'
                        }...`,
                });

                const planning = await generatePlanning(
                    bookText,
                    justText,
                    unitName,
                    currentSettings.apiKey,
                    currentSettings.aiProvider,
                    { nivel, asignatura, grupo }
                );

                // Fase 3: Generar Excel
                setProcessing({
                    status: 'generating-excel',
                    progress: 40 + Math.round(((i + 0.8) / unitList.length) * 45),
                    message: `Generando Excel para ${unitName}...`,
                });

                const blob = await generateExcel(planning);
                const sanitizedUnit = unitName.replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ\s]/g, '').trim();
                const fileName = `Planificación_${sanitizedUnit}_${asignatura || 'Asignatura'}.xlsx`;

                newResults.push({ unitName, blob, fileName });
            }

            setResults(newResults);
            setProcessing({
                status: 'done',
                progress: 100,
                message: `¡${newResults.length} planificación${newResults.length > 1 ? 'es' : ''} generada${newResults.length > 1 ? 's' : ''} con éxito!`,
            });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Error desconocido';
            setProcessing({
                status: 'error',
                progress: 0,
                message: 'Error durante la generación',
                error: message,
            });
        }
    }

    return (
        <div className="max-w-3xl mx-auto">
            <div className="glass-card rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 rounded-xl bg-sacramento-100 flex items-center justify-center text-2xl">
                        📋
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-sacramento-800">Generar Planificación</h2>
                        <p className="text-sm text-sacramento-500">
                            Sube los PDFs e indica la unidad a procesar
                        </p>
                    </div>
                </div>

                {/* Subida de Archivos */}
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <DocumentUploader
                        label="Libro de texto"
                        description="El libro que usas para dar la asignatura"
                        file={bookFile}
                        onFileChange={setBookFile}
                        icon="📚"
                    />
                    <DocumentUploader
                        label="Justificación curricular"
                        description="Documento del Ministerio de Educación"
                        file={justFile}
                        onFileChange={setJustFile}
                        icon="🏛️"
                    />
                </div>

                {/* Campos de texto */}
                <div className="space-y-4 mb-6">
                    <div>
                        <label className="block text-sm font-semibold text-sacramento-700 mb-2">
                            📌 Unidad(es) a procesar
                        </label>
                        <input
                            type="text"
                            value={units}
                            onChange={(e) => setUnits(e.target.value)}
                            placeholder="Ej: SA4 o SA3, SA4, SA5 (separadas por comas)"
                            className="w-full px-4 py-3 rounded-xl border border-sacramento-200 focus:border-gold-500 focus:ring-2 focus:ring-gold-200 outline-none transition-all text-sm bg-white"
                        />
                        <p className="text-xs text-sacramento-400 mt-1">
                            Para varias unidades, sepáralas con comas. Cada una generará un Excel independiente.
                        </p>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-sacramento-600 mb-1">
                                Nivel
                            </label>
                            <select
                                value={nivel}
                                onChange={(e) => setNivel(e.target.value)}
                                className="w-full px-3 py-2.5 rounded-xl border border-sacramento-200 focus:border-gold-500 outline-none transition-all text-sm bg-white"
                            >
                                <option value="">Seleccionar</option>
                                <option value="1º">1º Primaria</option>
                                <option value="2º">2º Primaria</option>
                                <option value="3º">3º Primaria</option>
                                <option value="4º">4º Primaria</option>
                                <option value="5º">5º Primaria</option>
                                <option value="6º">6º Primaria</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-sacramento-600 mb-1">
                                Asignatura
                            </label>
                            <input
                                type="text"
                                value={asignatura}
                                onChange={(e) => setAsignatura(e.target.value)}
                                placeholder="Ej: Matemáticas"
                                className="w-full px-3 py-2.5 rounded-xl border border-sacramento-200 focus:border-gold-500 outline-none transition-all text-sm bg-white"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-sacramento-600 mb-1">
                                Grupo
                            </label>
                            <select
                                value={grupo}
                                onChange={(e) => setGrupo(e.target.value)}
                                className="w-full px-3 py-2.5 rounded-xl border border-sacramento-200 focus:border-gold-500 outline-none transition-all text-sm bg-white"
                            >
                                <option value="A">A</option>
                                <option value="B">B</option>
                                <option value="C">C</option>
                                <option value="A-B">A-B</option>
                                <option value="A-C">A-C</option>
                                <option value="B-C">B-C</option>
                                <option value="A-B-C">A-B-C</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Botón generar */}
                <button
                    onClick={handleGenerate}
                    disabled={!canGenerate || processing.status === 'extracting-pdf' || processing.status === 'calling-ai' || processing.status === 'generating-excel'}
                    className={`w-full py-4 px-6 rounded-xl font-bold text-base transition-all duration-300 ${canGenerate &&
                        processing.status !== 'extracting-pdf' &&
                        processing.status !== 'calling-ai' &&
                        processing.status !== 'generating-excel'
                        ? 'bg-gradient-to-r from-sacramento-700 via-sacramento-600 to-sacramento-700 text-white hover:from-sacramento-600 hover:via-sacramento-500 hover:to-sacramento-600 shadow-lg hover:shadow-xl active:scale-[0.98]'
                        : 'bg-sacramento-200 text-sacramento-400 cursor-not-allowed'
                        }`}
                >
                    {processing.status === 'extracting-pdf' || processing.status === 'calling-ai' || processing.status === 'generating-excel'
                        ? '⏳ Procesando...'
                        : '🚀 Generar Planificación'}
                </button>

                {!settings.isVerified && settings.apiKey && (
                    <p className="text-xs text-warning mt-2 text-center">
                        ⚠️ Verifica tu API Key en Configuración antes de generar
                    </p>
                )}
                {!settings.apiKey && (
                    <p className="text-xs text-sacramento-400 mt-2 text-center">
                        Configura tu API Key en la pestaña de Configuración
                    </p>
                )}
            </div>

            {/* Progreso */}
            {processing.status !== 'idle' && (
                <div className="mt-6">
                    <ProgressBar
                        progress={processing.progress}
                        message={processing.message}
                        status={processing.status}
                    />
                    {processing.error && (
                        <div className="mt-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                            <p className="font-medium mb-1">❌ Error</p>
                            <p className="text-xs">{processing.error}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Resultados de descarga */}
            {results.length > 0 && (
                <div className="mt-6 space-y-3">
                    <h3 className="text-sm font-semibold text-sacramento-700 flex items-center gap-2">
                        <span>📥</span>
                        Planificaciones generadas
                    </h3>
                    {results.map((result, idx) => (
                        <DownloadButton
                            key={idx}
                            fileName={result.fileName}
                            blob={result.blob}
                            unitName={result.unitName}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
