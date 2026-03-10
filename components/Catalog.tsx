'use client';

import { useState, useRef } from 'react';
import { Upload, Trash2, Image as ImageIcon } from 'lucide-react';
import { FurnitureItem } from './Dashboard';
import { motion } from 'motion/react';
import Image from 'next/image';

export function Catalog({ 
  catalog, 
  onAdd, 
  onDelete 
}: { 
  catalog: FurnitureItem[], 
  onAdd: (item: FurnitureItem) => void,
  onDelete: (id: string) => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
    }
  };

  const processFiles = (files: File[]) => {
    files.forEach(file => {
      if (!file.type.startsWith('image/')) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const base64Data = event.target.result.toString().split(',')[1];
          onAdd({
            id: Math.random().toString(36).substring(2, 9),
            name: file.name.replace(/\.[^/.]+$/, ""),
            data: base64Data,
            mimeType: file.type
          });
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900 mb-1">家具图册</h2>
        <p className="text-zinc-500">上传和管理您的家具，以便在室内编辑器中使用。</p>
      </div>

      {/* Upload Area */}
      <div 
        className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all ${
          isDragging ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="w-16 h-16 bg-white border border-zinc-100 shadow-sm rounded-full flex items-center justify-center mx-auto mb-4">
          <Upload className="text-zinc-400" size={24} />
        </div>
        <h3 className="text-lg font-medium text-zinc-900 mb-1">上传家具图片</h3>
        <p className="text-zinc-500 text-sm mb-6 max-w-md mx-auto">
          将您的产品图片拖放到此处，或点击浏览。建议使用透明背景的 PNG 格式。
        </p>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          className="hidden" 
          accept="image/*"
          multiple
        />
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="bg-white border border-zinc-200 text-zinc-900 font-medium py-2 px-6 rounded-xl hover:bg-zinc-50 transition-colors shadow-sm"
        >
          浏览文件
        </button>
      </div>

      {/* Catalog Grid */}
      {catalog.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {catalog.map((item) => (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              key={item.id} 
              className="group relative bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all"
            >
              <div className="aspect-square relative bg-zinc-100 flex items-center justify-center overflow-hidden">
                <Image 
                  src={`data:${item.mimeType};base64,${item.data}`} 
                  alt={item.name}
                  fill
                  className="object-contain p-4"
                  referrerPolicy="no-referrer"
                />
                <button 
                  onClick={() => onDelete(item.id)}
                  className="absolute top-2 right-2 w-8 h-8 bg-white/90 backdrop-blur-sm text-red-500 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                  title="删除项目"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="p-3 border-t border-zinc-100">
                <p className="text-sm font-medium text-zinc-900 truncate">{item.name}</p>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white border border-zinc-200 rounded-2xl border-dashed">
          <ImageIcon className="mx-auto text-zinc-300 mb-3" size={32} />
          <p className="text-zinc-500">您的图册是空的。</p>
        </div>
      )}
    </div>
  );
}
