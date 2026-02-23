import type { AiProvider, Planning } from '../types/planning';

const SYSTEM_PROMPT = `Eres un experto en planificación educativa de la Comunidad Valenciana, España, bajo la normativa LOMLOE.

Tu tarea es generar una planificación completa para una Situación de Aprendizaje (SA) a partir de:
1. El contenido del libro de texto del maestro
2. La justificación curricular proporcionada por la editorial

DEBES devolver un JSON con la siguiente estructura exacta:

{
  "metadata": {
    "curso": "2025-2026",
    "nivel": "3º",
    "etapa": "PRIMARIA",
    "grupo": "A-B-C",
    "tituloSA": "SA4 Título de la situación de aprendizaje",
    "justificacion": "Texto largo justificativo de la situación de aprendizaje..."
  },
  "rows": [
    {
      "competenciasClave": "CCL\\nCMCT\\nCD\\nCPSAA",
      "ceMismaArea": "1. Descripción de la competencia específica...",
      "ceRelacionada": "CE de otra área relacionada (si aplica, si no déjalo vacío)",
      "sabereBasicos": "BLOQUE 1\\nNombre del bloque\\nContenidos del saber básico...",
      "saberEspecifico": "Saber específico de esta sesión",
      "criteriosEvalSA": "1.1. Criterio de evaluación...",
      "indicadoresLogro": "Indicador de logro observable...",
      "porcentaje": 0.04,
      "instrumentosEval": "Observación y participación",
      "temporizacion": "Sesión 1",
      "actividades": "Descripción detallada de las actividades...",
      "recursos": "Libro págs. 64 a 66",
      "espacio": "Aula"
    }
  ],
  "dua": "1. Feedback formativo para destacar los logros...\\n2. Proporcionar diferentes medios de representación..."
}

REGLAS ESTRICTAS:
- Cada fila del array "rows" corresponde a una sesión o sub-bloque de la planificación.
- Los porcentajes deben ser decimales (ej: 0.04 = 4%, 0.06 = 6%). El total debe sumar entre 0.95 y 1.0.
- Genera entre 8 y 20 filas dependiendo de la complejidad de la unidad.
- Las competencias clave deben seguir las abreviaturas LOMLOE: CCL, CMCT/STEM, CD, CPSAA, CC, CE, CCEC, CP.
- La temporalización debe seguir el formato "Sesión 1", "Sesión 2", etc.
- Los instrumentos de evaluación pueden ser: Observación y participación, Trabajo en el cuaderno, Trabajo cooperativo, Trabajo en ficha, Evaluación ficha SA, Rúbrica, etc.
- El DUA (Diseño Universal para el Aprendizaje) debe incluir principios de accesibilidad educativa.
- Basa TODA la planificación en el contenido real de los PDFs proporcionados. No inventes contenidos que no estén en los documentos.
- El JSON debe ser válido y parseable. No incluyas markdown, solo JSON puro.`;

/**
 * Genera una planificación LOMLOE usando IA.
 */
export async function generatePlanning(
    bookText: string,
    justificationText: string,
    unitName: string,
    apiKey: string,
    provider: AiProvider,
    additionalContext?: { nivel?: string; asignatura?: string; grupo?: string }
): Promise<Planning> {
    const userPrompt = buildUserPrompt(bookText, justificationText, unitName, additionalContext);

    let responseText: string;

    if (provider === 'gemini') {
        responseText = await callGemini(apiKey, userPrompt);
    } else {
        responseText = await callOpenAI(apiKey, userPrompt);
    }

    return parseAiResponse(responseText);
}

function buildUserPrompt(
    bookText: string,
    justificationText: string,
    unitName: string,
    ctx?: { nivel?: string; asignatura?: string; grupo?: string }
): string {
    let prompt = `Genera la planificación LOMLOE para la unidad "${unitName}".`;

    if (ctx?.nivel) prompt += `\nNivel: ${ctx.nivel}`;
    if (ctx?.asignatura) prompt += `\nAsignatura: ${ctx.asignatura}`;
    if (ctx?.grupo) prompt += `\nGrupo: ${ctx.grupo}`;

    prompt += `\n\n=== CONTENIDO DEL LIBRO DE TEXTO ===\n${bookText.substring(0, 200000)}`;
    prompt += `\n\n=== JUSTIFICACIÓN CURRICULAR DE LA EDITORIAL ===\n${justificationText.substring(0, 200000)}`;
    prompt += `\n\nResponde SOLO con el JSON. Sin markdown, sin explicaciones, solo el JSON puro.`;

    return prompt;
}

async function callGemini(apiKey: string, userPrompt: string): Promise<string> {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });

    // Usar el modelo que funcionó durante la verificación
    const savedModel = localStorage.getItem('app-del-maestro-gemini-model') || 'gemini-2.0-flash-lite';

    const response = await ai.models.generateContent({
        model: savedModel,
        contents: userPrompt,
        config: {
            systemInstruction: SYSTEM_PROMPT,
            temperature: 0.3,
            maxOutputTokens: 65536,
            responseMimeType: 'application/json',
        },
    });

    const text = response.text;
    if (!text) throw new Error('Gemini no devolvió respuesta');
    return text;
}

async function callOpenAI(apiKey: string, userPrompt: string): Promise<string> {
    const OpenAI = (await import('openai')).default;
    const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });

    const response = await client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 16384,
        response_format: { type: 'json_object' },
    });

    const text = response.choices[0]?.message?.content;
    if (!text) throw new Error('OpenAI no devolvió respuesta');
    return text;
}

function parseAiResponse(text: string): Planning {
    let cleaned = text.trim();

    // Limpiar markdown fences si la IA los incluyó
    if (cleaned.startsWith('```json')) {
        cleaned = cleaned.slice(7);
    } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.slice(3);
    }
    if (cleaned.endsWith('```')) {
        cleaned = cleaned.slice(0, -3);
    }
    cleaned = cleaned.trim();

    // Si hay texto antes del JSON, intentar extraer el JSON con regex
    if (!cleaned.startsWith('{')) {
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            cleaned = jsonMatch[0];
        }
    }

    try {
        const parsed = JSON.parse(cleaned);

        // Validación básica
        if (!parsed.metadata || !parsed.rows || !Array.isArray(parsed.rows)) {
            throw new Error('El JSON no tiene la estructura esperada (metadata, rows)');
        }
        if (parsed.rows.length === 0) {
            throw new Error('La planificación no contiene filas de datos');
        }

        return parsed as Planning;
    } catch (err) {
        if (err instanceof SyntaxError) {
            // Detectar si el JSON está truncado (respuesta cortada)
            const isTruncated = !cleaned.endsWith('}');
            const hint = isTruncated
                ? 'Parece que la respuesta fue truncada. Intenta con una unidad más corta o con menos contenido.'
                : 'Intenta de nuevo.';
            throw new Error(
                `La IA devolvió un JSON inválido. ${hint}\n\nInicio de la respuesta: "${cleaned.substring(0, 200)}..."`
            );
        }
        throw err;
    }
}

/**
 * Verifica que una API Key funcione correctamente.
 */
export async function verifyApiKeyWithProvider(
    apiKey: string,
    provider: AiProvider
): Promise<{ success: boolean; error?: string }> {
    try {
        if (provider === 'gemini') {
            const { GoogleGenAI } = await import('@google/genai');
            const ai = new GoogleGenAI({ apiKey });
            const response = await ai.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: 'Di OK',
            });
            return { success: !!response.text };
        } else {
            const OpenAI = (await import('openai')).default;
            const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
            const response = await client.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: 'Di OK' }],
                max_tokens: 5,
            });
            return { success: !!response.choices[0]?.message?.content };
        }
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error desconocido';
        return { success: false, error: msg };
    }
}
