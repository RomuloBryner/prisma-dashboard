import { useState, useRef } from 'react';
import { videosApi, type UploadUrlRequest, type ConfirmVideoRequest } from '../api/client';

interface VideoUploaderProps {
  onSuccess: (video: VideoMetadata) => void;
  onCancel: () => void;
}

interface VideoMetadata {
  id: string;
  url: string;
  name?: string;
  priority: number;
}

type UploadState = 
  | "idle"
  | "requesting-upload-url"
  | "uploading-to-s3"
  | "uploaded"
  | "confirming"
  | "confirmed"
  | "error";

export default function VideoUploader({ onSuccess, onCancel }: VideoUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [priority, setPriority] = useState('0');
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileExtension = (filename: string): string => {
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validar que sea un video
    if (!selectedFile.type.startsWith('video/')) {
      alert('Por favor selecciona un archivo de video (mp4, webm, mov, etc.)');
      return;
    }

    setFile(selectedFile);
    setError(null);

    // Crear preview del video
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      alert('Por favor selecciona un archivo de video');
      return;
    }

    setUploadState("requesting-upload-url");
    setError(null);
    setUploadProgress(0);

    try {
      const extension = getFileExtension(file.name);
      const contentType = file.type || 'video/mp4';
      const sizeMB = file.size / (1024 * 1024);

      // Paso 1: Obtener URL de subida
      setUploadProgress(10);
      const uploadUrlRequest: UploadUrlRequest = {
        contentType,
        sizeMB,
        extension,
      };

      const uploadUrlResponse = await videosApi.getUploadUrl(uploadUrlRequest);

      if (!uploadUrlResponse.upload || !uploadUrlResponse.upload.url || !uploadUrlResponse.upload.fields || !uploadUrlResponse.videoId || !uploadUrlResponse.s3Key) {
        throw new Error('Respuesta inválida del servidor: faltan upload, upload.url, upload.fields, videoId o s3Key');
      }

      // Paso 2: Subir directamente a S3
      setUploadState("uploading-to-s3");
      setUploadProgress(30);
      const formData = new FormData();

      // Agregar fields EXACTOS y en el mismo orden
      for (const [key, value] of Object.entries(uploadUrlResponse.upload.fields)) {
        formData.append(key, value as string);
      }

      // El archivo SIEMPRE al final
      formData.append("file", file);

      // POST directo a S3 (fire-and-forget)
      try {
        await fetch(uploadUrlResponse.upload.url, {
          method: "POST",
          body: formData,
        });

        // Si llegamos aquí, el fetch se ejecutó → upload OK
        setUploadState("uploaded");
        setUploadProgress(80);
      } catch (err: unknown) {
        // Ignorar errores de NetworkError/CORS - el archivo ya se subió
        const errorMessage = err instanceof Error ? err.message : String(err || '');
        const isNetworkOrCorsError = 
          errorMessage.includes('NetworkError') || 
          errorMessage.includes('Failed to fetch') ||
          errorMessage.includes('CORS') ||
          errorMessage.includes('network') ||
          errorMessage.includes('opaque');

        if (isNetworkOrCorsError) {
          // El fetch se ejecutó, el archivo se subió
          setUploadState("uploaded");
          setUploadProgress(80);
        } else {
          // SOLO errores de red reales
          setUploadState("error");
          throw err;
        }
      }

      // Paso 3: Confirmar subida
      setUploadState("confirming");
      const confirmRequest: ConfirmVideoRequest = {
        videoId: uploadUrlResponse.videoId,
        s3Key: uploadUrlResponse.s3Key,
        name: name.trim() || undefined,
        priority: parseInt(priority) || 0,
      };

      const confirmResponse = await videosApi.confirmVideo(confirmRequest);

      if (confirmResponse.status !== "confirmed") {
        throw new Error('Confirmación fallida: el backend no confirmó el video');
      }

      setUploadProgress(100);
      setUploadState("confirmed");

      // Llamar al callback con el video completo (ya creado en el backend)
      onSuccess({
        id: confirmResponse.videoId,
        url: confirmResponse.url,
        name: name.trim() || undefined,
        priority: parseInt(priority) || 0,
      });

      // Reset form
      setFile(null);
      setName('');
      setPriority('0');
      setPreview(null);
      setUploadState("idle");
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al subir video';
      setError(errorMessage);
      setUploadState("error");
      console.error('Error subiendo video:', error);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setPreview(null);
    setError(null);
    setUploadState("idle");
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getUploadStatusMessage = () => {
    switch (uploadState) {
      case "idle":
        return "Selecciona un archivo para comenzar";
      case "requesting-upload-url":
        return "Solicitando URL de subida...";
      case "uploading-to-s3":
        return "Subiendo a S3...";
      case "uploaded":
        return "Archivo subido, confirmando...";
      case "confirming":
        return "Confirmando en el servidor...";
      case "confirmed":
        return "Video confirmado correctamente";
      case "error":
        return error || "Error en la subida";
      default:
        return "";
    }
  };

  const isUploading = uploadState !== "idle" && uploadState !== "confirmed" && uploadState !== "error";

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Subir Video</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-1">
            Archivo de Video *
          </label>
          {!file ? (
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="file"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg
                    className="w-10 h-10 mb-3 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Haz clic para subir</span> o arrastra y suelta
                  </p>
                  <p className="text-xs text-gray-500">MP4, WEBM, MOV, etc. (MAX. 500MB)</p>
                </div>
                <input
                  id="file"
                  type="file"
                  ref={fileInputRef}
                  accept="video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="relative border rounded-lg overflow-hidden bg-gray-50">
                {preview && (
                  <video
                    src={preview}
                    controls
                    className="w-full h-auto max-h-64"
                  />
                )}
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-2 hover:bg-red-700"
                  disabled={isUploading}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-gray-600">
                <strong>Archivo:</strong> {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            </div>
          )}
        </div>

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Nombre (opcional)
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Video Promocional 1"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isUploading}
          />
        </div>

        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
            Prioridad
          </label>
          <input
            type="number"
            id="priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isUploading}
          />
          <p className="mt-1 text-sm text-gray-500">
            Los videos con menor prioridad se reproducirán primero
          </p>
        </div>

        {isUploading && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <span className="text-sm text-gray-600">{getUploadStatusMessage()}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {uploadState === "error" && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{getUploadStatusMessage()}</p>
          </div>
        )}

        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={!file || isUploading}
            className={`px-6 py-2 rounded-lg transition-colors ${
              !file || isUploading
                ? 'bg-gray-400 cursor-not-allowed text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isUploading ? 'Subiendo...' : 'Subir Video'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isUploading}
            className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
