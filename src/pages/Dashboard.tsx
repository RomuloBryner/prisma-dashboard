import { useEffect, useState } from 'react';
import { videosApi, menuApi, syncApi } from '../api/client';

export default function Dashboard() {
  const [stats, setStats] = useState({
    videosCount: 0,
    categoriesCount: 0,
    itemsCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [videos, menu] = await Promise.all([
        videosApi.getAll(),
        menuApi.getMenu(),
      ]);

      const categoriesCount = Object.keys(menu.categories).length;
      const itemsCount = Object.values(menu.categories).reduce(
        (sum, cat) => sum + cat.items.length,
        0
      );

      setStats({
        videosCount: videos.length,
        categoriesCount,
        itemsCount,
      });
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await Promise.all([syncApi.syncVideos(), syncApi.syncMenu()]);
      alert('Sincronización completada exitosamente');
    } catch (error) {
      console.error('Error sincronizando:', error);
      alert('Error al sincronizar. Revisa la consola para más detalles.');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando...</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Videos</p>
              <p className="text-3xl font-bold mt-2">{stats.videosCount}</p>
            </div>
            <div className="text-4xl">🎬</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Categorías</p>
              <p className="text-3xl font-bold mt-2">{stats.categoriesCount}</p>
            </div>
            <div className="text-4xl">📋</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Items del Menú</p>
              <p className="text-3xl font-bold mt-2">{stats.itemsCount}</p>
            </div>
            <div className="text-4xl">📝</div>
          </div>
        </div>
      </div>

      {/* Botón de sincronización */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Sincronización</h2>
        <p className="text-gray-600 mb-4">
          Sincroniza los cambios con la app móvil vía WebSocket.
        </p>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {syncing ? 'Sincronizando...' : 'Sincronizar Ahora'}
        </button>
      </div>
    </div>
  );
}
