import { useEffect, useState } from 'react';

interface DeviceInfo {
  device_id: string;
  screen_type: 'frontal' | 'lateral';
  status: 'playing' | 'idle' | 'error' | 'offline';
  current_video_id?: string;
  current_video_name?: string;
  video_position?: number;
  playlist_index?: number;
  total_videos?: number;
  last_video_change?: string;
  errors?: string[];
  app_version?: string;
  last_heartbeat: string;
  is_online: boolean;
  uptime?: number;
}

const API_BASE_URL = 'https://prisma-backend.oneorigyn.com';
const REFRESH_INTERVAL = 5000; // Refrescar cada 5 segundos

export default function Devices() {
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDevices = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/devices`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data: DeviceInfo[] = await response.json();
      setDevices(data);
      setError(null);
    } catch (err: any) {
      console.error('Error cargando dispositivos:', err);
      setError(err.message || 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDevices();

    // Auto-refresh cada 5 segundos
    const interval = setInterval(loadDevices, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds?: number): string => {
    if (!seconds) return 'N/A';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatTimestamp = (isoString: string): string => {
    const date = new Date(isoString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return `hace ${diff}s`;
    if (diff < 3600) return `hace ${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`;
    return date.toLocaleString();
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'playing':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'idle':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'offline':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'playing':
        return '▶️';
      case 'idle':
        return '⏸️';
      case 'error':
        return '❌';
      case 'offline':
        return '🔴';
      default:
        return '❓';
    }
  };

  const getScreenTypeIcon = (screenType: string): string => {
    return screenType === 'frontal' ? '🖥️' : '📺';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando dispositivos...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Dispositivos</h1>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            Actualización automática cada {REFRESH_INTERVAL / 1000}s
          </div>
          <button
            onClick={loadDevices}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            🔄 Actualizar
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Estadísticas generales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total</p>
              <p className="text-3xl font-bold mt-2">{devices.length}</p>
            </div>
            <div className="text-4xl">📱</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">En Línea</p>
              <p className="text-3xl font-bold mt-2 text-green-600">
                {devices.filter((d) => d.is_online).length}
              </p>
            </div>
            <div className="text-4xl">✅</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Offline</p>
              <p className="text-3xl font-bold mt-2 text-red-600">
                {devices.filter((d) => !d.is_online).length}
              </p>
            </div>
            <div className="text-4xl">🔴</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Con Errores</p>
              <p className="text-3xl font-bold mt-2 text-orange-600">
                {devices.filter((d) => d.errors && d.errors.length > 0).length}
              </p>
            </div>
            <div className="text-4xl">⚠️</div>
          </div>
        </div>
      </div>

      {/* Lista de dispositivos */}
      {devices.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-6xl mb-4">📱</div>
          <h3 className="text-xl font-semibold mb-2">No hay dispositivos conectados</h3>
          <p className="text-gray-600">
            Los dispositivos aparecerán aquí cuando empiecen a enviar heartbeats.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {devices.map((device) => (
            <div
              key={device.device_id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
            >
              {/* Header */}
              <div className="border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{getScreenTypeIcon(device.screen_type)}</span>
                    <div>
                      <h3 className="text-lg font-semibold">{device.device_id}</h3>
                      <p className="text-sm text-gray-600 capitalize">
                        Pantalla {device.screen_type}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                      device.status
                    )}`}
                  >
                    {getStatusIcon(device.status)} {device.status.toUpperCase()}
                  </div>
                </div>
              </div>

              {/* Contenido */}
              <div className="px-6 py-4 space-y-3">
                {/* Video actual */}
                {device.current_video_name && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">🎬 Video Actual:</p>
                    <p className="font-medium">{device.current_video_name}</p>
                    {device.playlist_index !== undefined &&
                      device.total_videos !== undefined && (
                        <p className="text-sm text-gray-500">
                          Video {device.playlist_index + 1} de {device.total_videos}
                        </p>
                      )}
                  </div>
                )}

                {/* Última actualización */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">⏱️ Última actualización:</span>
                  <span className="font-medium">
                    {formatTimestamp(device.last_heartbeat)}
                  </span>
                </div>

                {/* Uptime */}
                {device.uptime !== undefined && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">⏰ Tiempo activo:</span>
                    <span className="font-medium">{formatUptime(device.uptime)}</span>
                  </div>
                )}

                {/* Versión de la app */}
                {device.app_version && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">📦 Versión:</span>
                    <span className="font-medium">{device.app_version}</span>
                  </div>
                )}

                {/* Errores */}
                {device.errors && device.errors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-3">
                    <p className="text-sm font-medium text-red-800 mb-2">
                      ⚠️ Errores ({device.errors.length}):
                    </p>
                    <ul className="text-sm text-red-700 space-y-1">
                      {device.errors.slice(0, 3).map((error, idx) => (
                        <li key={idx} className="truncate">
                          • {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
