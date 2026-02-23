import type { TeacherSettings, AiProvider } from '../types/planning';

const STORAGE_KEY = 'app-del-maestro-settings';

const defaultSettings: TeacherSettings = {
    teacherName: '',
    apiKey: '',
    aiProvider: 'gemini',
    isVerified: false,
};

export function loadSettings(): TeacherSettings {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return { ...defaultSettings };
        return { ...defaultSettings, ...JSON.parse(stored) };
    } catch {
        return { ...defaultSettings };
    }
}

export function saveSettings(settings: TeacherSettings): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function updateSettings(partial: Partial<TeacherSettings>): TeacherSettings {
    const current = loadSettings();
    const updated = { ...current, ...partial };
    // Si cambia la API key o el provider, invalidar la verificación
    if (partial.apiKey !== undefined || partial.aiProvider !== undefined) {
        updated.isVerified = false;
    }
    saveSettings(updated);
    return updated;
}

export async function verifyApiKey(
    apiKey: string,
    provider: AiProvider
): Promise<{ success: boolean; model?: string; error?: string }> {
    try {
        if (!apiKey.trim()) {
            return { success: false, error: 'La API Key no puede estar vacía' };
        }

        if (provider === 'gemini') {
            const { GoogleGenAI } = await import('@google/genai');
            const ai = new GoogleGenAI({ apiKey });

            // Intentar varios modelos hasta encontrar uno que funcione
            const models = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash-lite', 'gemini-2.0-flash'];
            let lastError = '';

            for (const model of models) {
                try {
                    const response = await ai.models.generateContent({
                        model,
                        contents: 'Di OK',
                    });
                    if (response.text) {
                        // Guardar el modelo que funcionó
                        localStorage.setItem('app-del-maestro-gemini-model', model);
                        return { success: true, model };
                    }
                } catch (modelErr: unknown) {
                    lastError = modelErr instanceof Error ? modelErr.message : '';
                    continue; // Probar siguiente modelo
                }
            }

            // Ningún modelo funcionó
            if (lastError.includes('429') || lastError.includes('quota') || lastError.includes('RESOURCE_EXHAUSTED')) {
                return {
                    success: false,
                    error: 'Tu API Key es válida pero no tiene cuota disponible. Asegúrate de haberla creado desde aistudio.google.com/apikey (no desde Google Cloud Console). Si ya lo hiciste, puede ser un límite temporal — espera unos minutos e inténtalo de nuevo.'
                };
            }
            return { success: false, error: `Error con Gemini: ${lastError}` };
        } else {
            const OpenAI = (await import('openai')).default;
            const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
            const response = await client.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: 'Di OK' }],
                max_tokens: 5,
            });
            if (response.choices[0]?.message?.content) {
                return { success: true };
            }
            return { success: false, error: 'No se recibió respuesta del modelo' };
        }
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error desconocido';
        if (message.includes('401') || message.includes('Unauthorized') || message.includes('API key') || message.includes('API_KEY_INVALID')) {
            return { success: false, error: 'API Key inválida. Verifica que sea correcta.' };
        }
        if (message.includes('429') || message.includes('quota') || message.includes('RESOURCE_EXHAUSTED')) {
            return {
                success: false,
                error: 'Tu API Key es válida pero no tiene cuota. Créala desde aistudio.google.com/apikey y asegúrate de que la "Generative Language API" esté habilitada en tu proyecto.'
            };
        }
        return { success: false, error: `Error: ${message}` };
    }
}
