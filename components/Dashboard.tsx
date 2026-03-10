'use client';

import { useState } from 'react';
import { LogOut, LayoutGrid, Sparkles, Sofa } from 'lucide-react';
import { Catalog } from './Catalog';
import { RoomEditor } from './RoomEditor';

export interface FurnitureItem {
  id: string;
  name: string;
  data: string; // base64
  mimeType: string;
}

export function Dashboard({ companyName, onLogout }: { companyName: string, onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<'catalog' | 'editor'>('catalog');
  const [catalog, setCatalog] = useState<FurnitureItem[]>([]);

  const handleAddFurniture = (item: FurnitureItem) => {
    setCatalog([...catalog, item]);
  };

  const handleDeleteFurniture = (id: string) => {
    setCatalog(catalog.filter(item => item.id !== id));
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-zinc-900 text-white rounded-lg flex items-center justify-center">
              <Sofa size={18} />
            </div>
            <span className="font-bold text-zinc-900 tracking-tight">{companyName}</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-1 bg-zinc-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('catalog')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === 'catalog' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              <LayoutGrid size={16} />
              家具图册
            </button>
            <button
              onClick={() => setActiveTab('editor')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === 'editor' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              <Sparkles size={16} />
              室内编辑器
            </button>
          </nav>
          
          <button
            onClick={onLogout}
            className="text-zinc-500 hover:text-zinc-900 p-2 rounded-lg hover:bg-zinc-100 transition-colors"
            title="退出登录"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Mobile Nav */}
      <div className="md:hidden bg-white border-b border-zinc-200 px-4 py-2 flex gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'catalog' ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-500'
          }`}
        >
          <LayoutGrid size={16} />
          家具图册
        </button>
        <button
          onClick={() => setActiveTab('editor')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'editor' ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-500'
          }`}
        >
          <Sparkles size={16} />
          室内编辑器
        </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'catalog' ? (
          <Catalog catalog={catalog} onAdd={handleAddFurniture} onDelete={handleDeleteFurniture} />
        ) : (
          <RoomEditor catalog={catalog} />
        )}
      </main>
    </div>
  );
}
