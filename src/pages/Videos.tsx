import { useEffect, useState } from 'react';
import { videosApi, syncApi, type VideoMetadata } from '../api/client';
import VideoManager from '../components/VideoManager';
import VideoUploader from '../components/VideoUploader';

export default function Videos() {
  const [videos, setVideos] = useState<VideoMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploader, setShowUploader] = useState(false);
  const [editingVideo, setEditingVideo] = useState<VideoMetadata | null>(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      const data = await videosApi.getAll();
      setVideos(data);
    } catch (error) {
      console.error('Error cargando videos:', error);
      alert('Error al cargar videos. Revisa que el servidor esté corriendo.');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = (newVideo: VideoMetadata) => {
    // El video ya fue creado en el backend por confirmVideo
    // Solo actualizamos la lista local
    setVideos([...videos, newVideo]);
    setShowUploader(false);
    alert('Video subido exitosamente');
  };

  const handleUpdate = async (id: string, updates: Partial<VideoMetadata>) => {
    try {
      const updated = await videosApi.update(id, updates);
      setVideos(videos.map(v => v.id === id ? updated : v));
      setEditingVideo(null);
      alert('Video actualizado exitosamente');
    } catch (error) {
      console.error('Error actualizando video:', error);
      alert('Error al actualizar video');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este video?')) {
      return;
    }

    try {
      await videosApi.delete(id);
      setVideos(videos.filter(v => v.id !== id));
      alert('Video eliminado exitosamente');
    } catch (error) {
      console.error('Error eliminando video:', error);
      alert('Error al eliminar video');
    }
  };

  const handleSync = async () => {
    if (!confirm('¿Sincronizar videos con todos los dispositivos conectados?\n\nEsto eliminará videos huérfanos en los dispositivos y descargará los videos faltantes.')) {
      return;
    }

    setSyncing(true);
    try {
      const result = await syncApi.syncVideos();
      alert(`✅ ${result.message}\n\nVideos sincronizados: ${result.videos_count || 0}`);
    } catch (error) {
      console.error('Error sincronizando videos:', error);
      alert('❌ Error al sincronizar videos. Verifica que el servidor esté corriendo.');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando videos...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Gestión de Videos</h1>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            onClick={handleSync}
            disabled={syncing}
            className={`px-4 md:px-6 py-3 rounded-lg transition-colors flex items-center justify-center space-x-2 text-sm md:text-base ${
              syncing 
                ? 'bg-gray-400 cursor-not-allowed text-white' 
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {syncing ? (
              <>
                <svg className="animate-spin h-4 w-4 md:h-5 md:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Sincronizando...</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                <span className="hidden sm:inline">Sincronizar Dispositivos</span>
                <span className="sm:hidden">Sincronizar</span>
              </>
            )}
          </button>
          <button
            onClick={() => {
              setEditingVideo(null);
              setShowUploader(true);
            }}
            className="px-4 md:px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm md:text-base"
          >
            + Agregar Video
          </button>
        </div>
      </div>

      {showUploader && (
        <div className="mb-4 md:mb-6">
          <VideoUploader
            onSuccess={handleUploadSuccess}
            onCancel={() => setShowUploader(false)}
          />
        </div>
      )}

      <VideoManager
        videos={videos}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        editingVideo={editingVideo}
        onEdit={setEditingVideo}
        onCancelEdit={() => setEditingVideo(null)}
      />
    </div>
  );
}
