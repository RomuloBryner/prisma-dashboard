import { useState } from 'react';
import { menuApi, type CategoryContent, type MenuItemCreate, type MenuItemUpdate } from '../api/client';

interface MenuEditorProps {
  categoryId: string;
  category: CategoryContent;
  onUpdate: () => void;
}

export default function MenuEditor({ categoryId, category, onUpdate }: MenuEditorProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddItem = async (item: MenuItemCreate) => {
    try {
      await menuApi.addItem(categoryId, item);
      setShowAddForm(false);
      onUpdate();
      alert('Item agregado exitosamente');
    } catch (error) {
      console.error('Error agregando item:', error);
      alert('Error al agregar item');
    }
  };

  const handleUpdateItem = async (index: number, item: MenuItemUpdate) => {
    try {
      await menuApi.updateItem(categoryId, index, item);
      setEditingIndex(null);
      onUpdate();
      alert('Item actualizado exitosamente');
    } catch (error) {
      console.error('Error actualizando item:', error);
      alert('Error al actualizar item');
    }
  };

  const handleDeleteItem = async (index: number) => {
    if (!confirm('¿Estás seguro de eliminar este item?')) {
      return;
    }

    try {
      await menuApi.deleteItem(categoryId, index);
      onUpdate();
      alert('Item eliminado exitosamente');
    } catch (error) {
      console.error('Error eliminando item:', error);
      alert('Error al eliminar item');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">{category.title}</h2>
        <button
          onClick={() => {
            setEditingIndex(null);
            setShowAddForm(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Agregar Item
        </button>
      </div>

      {showAddForm && (
        <MenuItemForm
          onSubmit={handleAddItem}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      <div className="space-y-4">
        {category.items.map((item, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4">
            {editingIndex === index ? (
              <MenuItemEditForm
                item={item}
                onSubmit={(updates) => handleUpdateItem(index, updates)}
                onCancel={() => setEditingIndex(null)}
              />
            ) : (
              <>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-lg">{item.name}</h3>
                    <p className="text-gray-600 mt-1">{item.description}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      📍 {item.location}
                    </p>
                    {item.category && (
                      <span className="inline-block mt-2 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        {item.category}
                      </span>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setEditingIndex(index)}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteItem(index)}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
                {item.image && (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="mt-2 w-32 h-20 object-cover rounded"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
              </>
            )}
          </div>
        ))}

        {category.items.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No hay items en esta categoría. Agrega uno para comenzar.
          </div>
        )}
      </div>
    </div>
  );
}

interface MenuItemFormProps {
  onSubmit: (item: MenuItemCreate) => void;
  onCancel: () => void;
  initialValues?: Partial<MenuItemCreate>;
}

function MenuItemForm({ onSubmit, onCancel, initialValues }: MenuItemFormProps) {
  const [name, setName] = useState(initialValues?.name || '');
  const [description, setDescription] = useState(initialValues?.description || '');
  const [location, setLocation] = useState(initialValues?.location || '');
  const [category, setCategory] = useState(initialValues?.category || '');
  const [image, setImage] = useState(initialValues?.image || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim() || !location.trim()) {
      alert('Nombre, descripción y ubicación son requeridos');
      return;
    }
    onSubmit({
      name: name.trim(),
      description: description.trim(),
      location: location.trim(),
      category: category.trim() || undefined,
      image: image.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3">
      <input
        type="text"
        placeholder="Nombre *"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        required
      />
      <textarea
        placeholder="Descripción *"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        required
      />
      <input
        type="text"
        placeholder="Ubicación *"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        required
      />
      <input
        type="text"
        placeholder="Categoría (opcional)"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <input
        type="url"
        placeholder="URL de imagen (opcional)"
        value={image}
        onChange={(e) => setImage(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <div className="flex space-x-2">
        <button
          type="submit"
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Guardar
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

interface MenuItemEditFormProps {
  item: { name: string; description: string; location: string; category?: string; image?: string };
  onSubmit: (updates: MenuItemUpdate) => void;
  onCancel: () => void;
}

function MenuItemEditForm({ item, onSubmit, onCancel }: MenuItemEditFormProps) {
  const [name, setName] = useState(item.name);
  const [description, setDescription] = useState(item.description);
  const [location, setLocation] = useState(item.location);
  const [category, setCategory] = useState(item.category || '');
  const [image, setImage] = useState(item.image || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name: name.trim() || undefined,
      description: description.trim() || undefined,
      location: location.trim() || undefined,
      category: category.trim() || undefined,
      image: image.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="text"
        placeholder="Nombre"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <textarea
        placeholder="Descripción"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <input
        type="text"
        placeholder="Ubicación"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <input
        type="text"
        placeholder="Categoría"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <input
        type="url"
        placeholder="URL de imagen"
        value={image}
        onChange={(e) => setImage(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <div className="flex space-x-2">
        <button
          type="submit"
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Guardar
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
