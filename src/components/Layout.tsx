import { Link, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: '📊', shortLabel: 'Inicio' },
    { path: '/videos', label: 'Videos', icon: '🎬', shortLabel: 'Videos' },
    { path: '/menu', label: 'Menú', icon: '📋', shortLabel: 'Menú' },
    { path: '/devices', label: 'Dispositivos', icon: '📱', shortLabel: 'Devices' },
    { path: '/config', label: 'Configuración', icon: '⚙️', shortLabel: 'Config' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header Mobile */}
      <header className="md:hidden fixed top-0 left-0 right-0 bg-gray-900 text-white shadow-lg z-50">
        <div className="px-4 py-3">
          <h1 className="text-lg font-bold">Prisma Dashboard</h1>
        </div>
      </header>

      {/* Navegación lateral (Desktop) - OCULTO EN MÓVIL */}
      <nav className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-gray-900 text-white shadow-lg z-40">
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-8">Prisma Dashboard</h1>
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    location.pathname === item.path
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Navegación inferior (Mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="grid grid-cols-5 h-16">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center space-y-1 ${
                location.pathname === item.path
                  ? 'text-blue-600'
                  : 'text-gray-500'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs font-medium">{item.shortLabel}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Contenido principal */}
      <main className="min-h-screen md:ml-64 pt-16 md:pt-0 px-4 md:px-8 py-4 md:py-8 pb-20 md:pb-8">
        {children}
      </main>
    </div>
  );
}
