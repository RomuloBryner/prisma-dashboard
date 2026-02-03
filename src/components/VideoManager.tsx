import { useState } from 'react';
import { type VideoMetadata } from '../api/client';

interface VideoManagerProps {
  videos: VideoMetadata[];
  onUpdate: (id: string, updates: Partial<VideoMetadata>) => void;
  onDelete: (id: string) => void;
  editingVideo: VideoMetadata | null;
  onEdit: (video: VideoMetadata) => void;
  onCancelEdit: () => void;
}

export default function VideoManager({
  videos,
  onUpdate,
  onDelete,
  editingVideo,
  onEdit,
  onCancelEdit,
}: VideoManagerProps) {
  if (videos.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-gray-500">No hay videos. Agrega uno para comenzar.</p>
      </div>
    );
  }

  return (
    <>
      {/* Vista de tabla para desktop (oculta en móvil) */}
      <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nombre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                URL
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Prioridad
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {videos.map((video) => (
              <tr key={video.id} className="hover:bg-gray-50">
                {editingVideo?.id === video.id ? (
                  <VideoEditRow
                    video={video}
                    onSave={(updates) => {
                      onUpdate(video.id, updates);
                    }}
                    onCancel={onCancelEdit}
                    isMobile={false}
                  />
                ) : (
                  <>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {video.id.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {video.name || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <a
                        href={video.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline truncate block max-w-xs"
                      >
                        {video.url}
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {video.priority || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => onEdit(video)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => onDelete(video.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Eliminar
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Vista de tarjetas para móvil (visible solo en móvil) */}
      <div className="md:hidden space-y-4">
        {videos.map((video) => (
          <div
            key={video.id}
            className="bg-white rounded-lg shadow p-4 border border-gray-200"
          >
            {editingVideo?.id === video.id ? (
              <VideoEditRow
                video={video}
                onSave={(updates) => {
                  onUpdate(video.id, updates);
                }}
                onCancel={onCancelEdit}
                isMobile={true}
              />
            ) : (
              <>
                <div className="space-y-3">
                  <div>
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                      ID
                    </div>
                    <div className="text-sm font-medium text-gray-900 break-all">
                      {video.id.substring(0, 8)}...
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                      Nombre
                    </div>
                    <div className="text-sm text-gray-500">
                      {video.name || '-'}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                      URL
                    </div>
                    <a
                      href={video.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline break-all block"
                    >
                      {video.url}
                    </a>
                  </div>

                  <div>
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                      Prioridad
                    </div>
                    <div className="text-sm text-gray-500">
                      {video.priority || 0}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex space-x-3">
                      <button
                        onClick={() => onEdit(video)}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => onDelete(video.id)}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

interface VideoEditRowProps {
  video: VideoMetadata;
  onSave: (updates: Partial<VideoMetadata>) => void;
  onCancel: () => void;
  isMobile?: boolean;
}

function VideoEditRow({ video, onSave, onCancel, isMobile = false }: VideoEditRowProps) {
  const [name, setName] = useState(video.name || '');
  const [url, setUrl] = useState(video.url);
  const [priority, setPriority] = useState(video.priority?.toString() || '0');

  const handleSave = () => {
    onSave({
      name: name || undefined,
      url,
      priority: parseInt(priority) || 0,
    });
  };

  if (isMobile) {
    return (
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
            Nombre
          </label>
          <input
            type="text"
            placeholder="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
            URL
          </label>
          <input
            type="text"
            placeholder="URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
            Prioridad
          </label>
          <input
            type="number"
            placeholder="Prioridad"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
        <div className="flex space-x-2 pt-2">
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
          >
            Guardar
          </button>
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 text-sm font-medium"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <td colSpan={5} className="px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="number"
            placeholder="Prioridad"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex space-x-2">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Guardar
            </button>
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              Cancelar
            </button>
          </div>
        </div>
      </td>
    </>
  );
}
