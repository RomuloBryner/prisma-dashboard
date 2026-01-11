import { useEffect, useState } from 'react';
import { menuApi, type MenuContent, type CategoryContent } from '../api/client';
import MenuEditor from '../components/MenuEditor';

export default function Menu() {
  const [menu, setMenu] = useState<MenuContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    loadMenu();
  }, []);

  const loadMenu = async () => {
    try {
      const data = await menuApi.getMenu();
      setMenu(data);
      // Seleccionar primera categoría por defecto
      const firstCategory = Object.keys(data.categories)[0];
      if (firstCategory) {
        setSelectedCategory(firstCategory);
      }
    } catch (error) {
      console.error('Error cargando menú:', error);
      alert('Error al cargar menú. Revisa que el servidor esté corriendo.');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const handleMenuUpdate = async () => {
    await loadMenu();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando menú...</div>
      </div>
    );
  }

  if (!menu) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">No se pudo cargar el menú</div>
      </div>
    );
  }

  const categories = Object.keys(menu.categories);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Gestión del Menú</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Lista de categorías */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Categorías</h2>
          <ul className="space-y-2">
            {categories.map((categoryId) => {
              const category = menu.categories[categoryId];
              return (
                <li key={categoryId}>
                  <button
                    onClick={() => handleCategoryChange(categoryId)}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                      selectedCategory === categoryId
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <div className="font-medium">{category.title}</div>
                    <div className="text-sm opacity-75">
                      {category.items.length} items
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Editor de categoría */}
        <div className="md:col-span-3">
          {selectedCategory ? (
            <MenuEditor
              categoryId={selectedCategory}
              category={menu.categories[selectedCategory]}
              onUpdate={handleMenuUpdate}
            />
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-500">Selecciona una categoría para editar</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
