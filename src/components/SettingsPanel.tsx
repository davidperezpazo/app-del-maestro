import { useState, useEffect } from 'react';
import type { TeacherSettings, AiProvider } from '../types/planning';
import { loadSettings, saveSettings, verifyApiKey } from '../stores/settings-store';

export function SettingsPanel() {
    const [settings, setSettings] = useState<TeacherSettings>(loadSettings);
    const [verifying, setVerifying] = useState(false);
    const [verifyResult, setVerifyResult] = useState<{ success: boolean; error?: string } | null>(null);

    useEffect(() => {
        saveSettings(settings);
    }, [settings]);

    function updateField<K extends keyof TeacherSettings>(key: K, value: TeacherSettings[K]) {
        setVerifyResult(null);
        setSettings((prev) => ({
            ...prev,
            [key]: value,
            ...(key === 'apiKey' || key === 'aiProvider' ? { isVerified: false } : {}),
        }));
    }

    async function handleVerify() {
        setVerifying(true);
        setVerifyResult(null);
        try {
            const result = await verifyApiKey(settings.apiKey, settings.aiProvider);
            setVerifyResult(result);
            if (result.success) {
                setSettings((prev) => {
                    const updated = { ...prev, isVerified: true };
                    saveSettings(updated);
                    return updated;
                });
            }
        } catch {
            setVerifyResult({ success: false, error: 'Error de conexión' });
        } finally {
            setVerifying(false);
        }
    }

    return (
        <div className="max-w-xl mx-auto">
            <div className="glass-card rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 rounded-xl bg-sacramento-100 flex items-center justify-center text-2xl">
                        ⚙️
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-sacramento-800">Configuración</h2>
                        <p className="text-sm text-sacramento-500">Configuración de la API de IA</p>
                    </div>
                </div>

                {/* Proveedor de IA */}
                <div className="mb-6">
                    <label className="block text-sm font-semibold text-sacramento-700 mb-2">
                        🤖 Proveedor de IA
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        {(['gemini', 'openai'] as AiProvider[]).map((provider) => (
                            <button
                                key={provider}
                                onClick={() => updateField('aiProvider', provider)}
                                className={`p-4 rounded-xl border-2 transition-all duration-300 text-sm font-medium ${settings.aiProvider === provider
                                    ? 'border-gold-500 bg-gold-100 text-sacramento-800 shadow-md'
                                    : 'border-sacramento-200 bg-white text-sacramento-600 hover:border-sacramento-300'
                                    }`}
                            >
                                {provider === 'gemini' ? (
                                    <>
                                        <span className="text-2xl block mb-1">✨</span>
                                        Google / Gemini
                                    </>
                                ) : (
                                    <>
                                        <span className="text-2xl block mb-1">🧠</span>
                                        OpenAI / ChatGPT
                                    </>
                                )}
                            </button>
                        ))}
                    </div>
                    <p className="text-xs text-sacramento-400 mt-2">
                        {settings.aiProvider === 'gemini'
                            ? 'Obtén tu API Key en ai.google.dev'
                            : 'Obtén tu API Key en platform.openai.com'}
                    </p>
                </div>

                {/* API Key */}
                <div className="mb-6">
                    <label className="block text-sm font-semibold text-sacramento-700 mb-2">
                        🔑 API Key
                    </label>
                    <div className="relative">
                        <input
                            type="password"
                            value={settings.apiKey}
                            onChange={(e) => updateField('apiKey', e.target.value)}
                            placeholder={
                                settings.aiProvider === 'gemini'
                                    ? 'AIza...'
                                    : 'sk-...'
                            }
                            className="w-full px-4 py-3 rounded-xl border border-sacramento-200 focus:border-gold-500 focus:ring-2 focus:ring-gold-200 outline-none transition-all text-sm bg-white font-mono pr-12"
                        />
                        {settings.isVerified && (
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-success text-lg">✅</span>
                        )}
                    </div>
                </div>

                {/* Botón Verificar */}
                <button
                    onClick={handleVerify}
                    disabled={!settings.apiKey.trim() || verifying}
                    className={`w-full py-3 px-6 rounded-xl font-semibold text-sm transition-all duration-300 ${!settings.apiKey.trim() || verifying
                        ? 'bg-sacramento-200 text-sacramento-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-gold-500 to-gold-600 text-white hover:from-gold-600 hover:to-gold-500 shadow-md hover:shadow-lg active:scale-[0.98]'
                        }`}
                >
                    {verifying ? (
                        <span className="flex items-center justify-center gap-2">
                            <span className="animate-spin">⏳</span>
                            Verificando...
                        </span>
                    ) : (
                        'Verificar API Key'
                    )}
                </button>

                {/* Resultado de verificación */}
                {verifyResult && (
                    <div
                        className={`mt-4 p-4 rounded-xl text-sm flex items-start gap-3 ${verifyResult.success
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                            }`}
                    >
                        <span className="text-lg shrink-0">{verifyResult.success ? '✅' : '❌'}</span>
                        <p>
                            {verifyResult.success
                                ? '¡API Key verificada correctamente! Ya puedes generar planificaciones.'
                                : verifyResult.error || 'La API Key no es válida.'}
                        </p>
                    </div>
                )}

                {/* Info de seguridad */}
                <div className="mt-6 p-4 rounded-xl bg-sacramento-50 border border-sacramento-100">
                    <p className="text-xs text-sacramento-500 leading-relaxed">
                        🔒 Tu API Key se guarda solo en tu navegador y nunca sale de tu dispositivo excepto para conectarse directamente con el servicio de IA que hayas elegido.
                    </p>
                </div>
            </div>
        </div>
    );
}
