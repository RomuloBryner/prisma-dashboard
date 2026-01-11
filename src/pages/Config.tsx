export default function Config() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Configuración</h1>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Configuraciones Generales</h2>
        <p className="text-gray-600">
          Las configuraciones del sistema se pueden ajustar desde las variables de entorno
          o desde el archivo de configuración del backend.
        </p>

        <div className="mt-6 space-y-4">
          <div>
            <h3 className="font-medium text-gray-700 mb-2">API Base URL</h3>
            <p className="text-sm text-gray-500">
              Configurada en: <code className="bg-gray-100 px-2 py-1 rounded">VITE_API_BASE_URL</code>
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Valor actual: <code className="bg-gray-100 px-2 py-1 rounded">
                {import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}
              </code>
            </p>
          </div>

          <div>
            <h3 className="font-medium text-gray-700 mb-2">WebSocket Server</h3>
            <p className="text-sm text-gray-500">
              El servidor WebSocket se configura desde el archivo <code className="bg-gray-100 px-2 py-1 rounded">python/config.py</code>
            </p>
          </div>

          <div>
            <h3 className="font-medium text-gray-700 mb-2">Cloud Storage</h3>
            <p className="text-sm text-gray-500">
              Para usar Cloudinary, configura las variables de entorno:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-500 mt-2 space-y-1">
              <li><code className="bg-gray-100 px-2 py-1 rounded">CLOUDINARY_CLOUD_NAME</code></li>
              <li><code className="bg-gray-100 px-2 py-1 rounded">CLOUDINARY_API_KEY</code></li>
              <li><code className="bg-gray-100 px-2 py-1 rounded">CLOUDINARY_API_SECRET</code></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
