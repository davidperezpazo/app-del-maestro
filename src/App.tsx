import { useState } from 'react';
import { Generator } from './components/Generator';
import { SettingsPanel } from './components/SettingsPanel';

type View = 'generator' | 'settings';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('generator');

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header institucional */}
      <header className="bg-gradient-to-r from-sacramento-800 via-sacramento-700 to-sacramento-800 text-white shadow-xl">
        <div className="max-w-5xl mx-auto px-6 py-5">
          <div className="flex items-center gap-5">
            <img
              src="/logo-madre-sacramento.png"
              alt="Colegio Madre Sacramento"
              className="w-16 h-16 rounded-xl object-contain bg-white p-1.5 shadow-lg"
            />
            <div className="flex-1">
              <h1 className="text-xl font-bold tracking-tight">
                Generador de Planificaciones
              </h1>
              <p className="text-sacramento-300 text-sm mt-0.5">
                Colegio Madre Sacramento · LOMLOE · Comunitat Valenciana
              </p>
            </div>
          </div>

          {/* Navegación */}
          <nav className="flex gap-1 mt-5 -mb-[1px]">
            <button
              onClick={() => setCurrentView('generator')}
              className={`px-5 py-2.5 rounded-t-xl text-sm font-medium transition-all duration-300 ${currentView === 'generator'
                ? 'bg-white/10 text-white backdrop-blur-sm border border-b-0 border-white/20'
                : 'text-sacramento-300 hover:text-white hover:bg-white/5'
                }`}
            >
              📋 Generador
            </button>
            <button
              onClick={() => setCurrentView('settings')}
              className={`px-5 py-2.5 rounded-t-xl text-sm font-medium transition-all duration-300 ${currentView === 'settings'
                ? 'bg-white/10 text-white backdrop-blur-sm border border-b-0 border-white/20'
                : 'text-sacramento-300 hover:text-white hover:bg-white/5'
                }`}
            >
              ⚙️ Configuración
            </button>
          </nav>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="flex-1 py-8 px-6">
        {currentView === 'generator' ? <Generator /> : <SettingsPanel />}
      </main>

      {/* Footer */}
      <footer className="border-t border-sacramento-100 bg-white/50 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 text-center">
          <p className="text-xs text-sacramento-400">
            Colegio Madre Sacramento · Valencia · Curso 2025-2026
          </p>
          <p className="text-xs text-sacramento-300 mt-1">
            Planificaciones generadas según la normativa LOMLOE
          </p>
        </div>
      </footer>
    </div>
  );
}
