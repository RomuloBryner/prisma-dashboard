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
    <div className="bg-white rounded-lg shadow overflow-hidden">
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
  );
}

interface VideoEditRowProps {
  video: VideoMetadata;
  onSave: (updates: Partial<VideoMetadata>) => void;
  onCancel: () => void;
}

function VideoEditRow({ video, onSave, onCancel }: VideoEditRowProps) {
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
