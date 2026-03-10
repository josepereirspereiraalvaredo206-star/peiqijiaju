'use client';

import { useState, useRef } from 'react';
import { Upload, Sparkles, Image as ImageIcon, CheckCircle2, Loader2, Download, History, Clock, X, Layers, MessageSquareText, Maximize2 } from 'lucide-react';
import { FurnitureItem } from './Dashboard';
import { GoogleGenAI } from '@google/genai';
import Image from 'next/image';

export interface RoomImage {
  id: string;
  data: string;
  mimeType: string;
  aspectRatio?: string;
}

export interface HistoryItem {
  id: string;
  roomImage: RoomImage;
  furniture: FurnitureItem;
  generatedImage: string;
  timestamp: number;
  customInstruction?: string;
}

export function RoomEditor({ catalog }: { catalog: FurnitureItem[] }) {
  const [roomImages, setRoomImages] = useState<RoomImage[]>([]);
  const [selectedFurnitures, setSelectedFurnitures] = useState<FurnitureItem[]>([]);
  const [customInstruction, setCustomInstruction] = useState('');
  const [currentGeneratedImage, setCurrentGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number, total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [previewFurniture, setPreviewFurniture] = useState<FurnitureItem | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleRoomUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      files.forEach(file => {
        if (!file.type.startsWith('image/')) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            const base64Data = event.target.result.toString().split(',')[1];
            
            const img = new window.Image();
            img.onload = () => {
              const ratio = img.width / img.height;
              const ratios = [
                { name: "1:1", value: 1 },
                { name: "4:3", value: 4/3 },
                { name: "3:4", value: 3/4 },
                { name: "16:9", value: 16/9 },
                { name: "9:16", value: 9/16 }
              ];
              let closest = ratios[0];
              let minDiff = Math.abs(ratio - closest.value);
              for (let i = 1; i < ratios.length; i++) {
                const diff = Math.abs(ratio - ratios[i].value);
                if (diff < minDiff) {
                  minDiff = diff;
                  closest = ratios[i];
                }
              }
              
              setRoomImages(prev => [...prev, {
                id: Math.random().toString(36).substring(2, 9),
                data: base64Data,
                mimeType: file.type,
                aspectRatio: closest.name
              }]);
            };
            img.src = event.target.result as string;
          }
        };
        reader.readAsDataURL(file);
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeRoom = (id: string) => {
    setRoomImages(prev => prev.filter(r => r.id !== id));
  };

  const toggleFurniture = (item: FurnitureItem) => {
    setSelectedFurnitures(prev => 
      prev.some(f => f.id === item.id) 
        ? prev.filter(f => f.id !== item.id) 
        : [...prev, item]
    );
  };

  const handleGenerate = async () => {
    if (roomImages.length === 0 || selectedFurnitures.length === 0) return;
    
    setIsGenerating(true);
    setError(null);
    
    const total = roomImages.length * selectedFurnitures.length;
    let current = 0;
    setBatchProgress({ current, total });
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });
      
      let prompt = `你是一位专业的室内设计师和照片编辑专家。
我按顺序提供了两张图片：
[图片 1]：这是基础场景（一张室内房间的照片）。
[图片 2]：这是目标物体（一件或多件家具的参考图）。

【核心任务】
必须以 [图片 1]（室内房间）作为基础背景。
将 [图片 2]（家具）中的主体提取出来，并逼真地合成到 [图片 1] 的房间中。
绝对不能反过来！绝对不能改变 [图片 1] 的主体背景地位！

【合成与摆放要求】
1. 保持 [图片 1] 房间的整体结构、视角和风格完全不变。
2. 必须准确识别 [图片 1] 中的原有主要家具（如沙发、床、桌子等），并用 [图片 2] 中的家具进行精准替换。
3. 新家具的摆放位置、朝向和占地面积必须符合真实物理逻辑、空间透视和室内设计规范。
4. 确保新加入的家具在比例、光照和阴影上与 [图片 1] 的房间环境完美融合。
5. 最终的图像必须看起来像一张真实的、未经编辑的实景照片。`;

      if (customInstruction.trim()) {
        prompt += `\n\n【用户的特别指示】\n${customInstruction}`;
      }

      for (const room of roomImages) {
        for (const furniture of selectedFurnitures) {
          current++;
          setBatchProgress({ current, total });
          
          try {
            const response = await ai.models.generateContent({
              model: 'gemini-3-pro-image-preview',
              contents: {
                parts: [
                  {
                    inlineData: {
                      data: room.data,
                      mimeType: room.mimeType,
                    },
                  },
                  {
                    inlineData: {
                      data: furniture.data,
                      mimeType: furniture.mimeType,
                    },
                  },
                  {
                    text: prompt,
                  },
                ],
              },
              config: {
                imageConfig: {
                  aspectRatio: room.aspectRatio || "1:1"
                }
              }
            });

            let foundImage = false;
            for (const part of response.candidates?.[0]?.content?.parts || []) {
              if (part.inlineData) {
                const finalImage = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                setCurrentGeneratedImage(finalImage);
                foundImage = true;
                
                const newHistoryItem: HistoryItem = {
                  id: Math.random().toString(36).substring(2, 9),
                  roomImage: room,
                  furniture: furniture,
                  generatedImage: finalImage,
                  timestamp: Date.now(),
                  customInstruction: customInstruction.trim() ? customInstruction : undefined,
                };
                setHistory(prev => [newHistoryItem, ...prev]);
                break;
              }
            }

            if (!foundImage) {
              console.warn(`组合生成失败: 房间 ${room.id}, 家具 ${furniture.id}`);
            }
          } catch (err: any) {
            console.error("单个组合生成错误:", err);
            if (err.message && err.message.includes("Requested entity was not found")) {
              throw err; // 抛出以触发 API 密钥重新选择
            }
          }
        }
      }

    } catch (err: any) {
      console.error("批量生成错误:", err);
      setError(err.message || "生成过程中发生错误。");
      
      if (err.message && err.message.includes("Requested entity was not found")) {
        if (window.aistudio && window.aistudio.openSelectKey) {
          await window.aistudio.openSelectKey();
          setError("API 密钥已更新。请尝试重新生成。");
        }
      }
    } finally {
      setIsGenerating(false);
      setBatchProgress(null);
    }
  };

  const loadHistoryItem = (item: HistoryItem) => {
    setRoomImages([item.roomImage]);
    setSelectedFurnitures([item.furniture]);
    setCurrentGeneratedImage(item.generatedImage);
    setCustomInstruction(item.customInstruction || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalCombos = roomImages.length * selectedFurnitures.length;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900 mb-1">室内编辑器 (批量处理)</h2>
        <p className="text-zinc-500">上传多张室内照片，选择多件家具，一次性生成所有组合的可视化效果。</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Inputs */}
        <div className="space-y-6 lg:col-span-1">
          {/* Step 1: Room Images */}
          <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-900 font-bold flex items-center justify-center text-sm">1</div>
                <h3 className="font-medium text-zinc-900">上传室内图</h3>
              </div>
              <span className="text-xs font-medium bg-zinc-100 text-zinc-600 px-2 py-1 rounded-md">
                已选 {roomImages.length} 张
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mb-3">
              {roomImages.map(room => (
                <div key={room.id} className="relative aspect-video rounded-xl overflow-hidden border border-zinc-200 group">
                  <Image 
                    src={`data:${room.mimeType};base64,${room.data}`} 
                    alt="Room" 
                    fill
                    className="object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <button 
                    onClick={() => removeRoom(room.id)}
                    className="absolute top-1 right-1 bg-white/90 text-red-500 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="aspect-video border-2 border-dashed border-zinc-200 rounded-xl flex flex-col items-center justify-center text-zinc-500 hover:bg-zinc-50 hover:border-zinc-300 transition-colors"
              >
                <Upload size={20} className="mb-1 text-zinc-400" />
                <span className="text-xs font-medium">添加图片</span>
              </button>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleRoomUpload} 
              className="hidden" 
              accept="image/*"
              multiple
            />
          </div>

          {/* Step 2: Select Furniture */}
          <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-900 font-bold flex items-center justify-center text-sm">2</div>
                <h3 className="font-medium text-zinc-900">选择家具</h3>
              </div>
              <span className="text-xs font-medium bg-zinc-100 text-zinc-600 px-2 py-1 rounded-md">
                已选 {selectedFurnitures.length} 件
              </span>
            </div>
            
            {catalog.length === 0 ? (
              <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
                请先在图册中添加家具。
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                {catalog.map((item) => {
                  const isSelected = selectedFurnitures.some(f => f.id === item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleFurniture(item)}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all cursor-pointer group ${
                        isSelected 
                          ? 'border-indigo-500 ring-2 ring-indigo-500/20' 
                          : 'border-zinc-100 hover:border-zinc-300'
                      }`}
                    >
                      <Image 
                        src={`data:${item.mimeType};base64,${item.data}`} 
                        alt={item.name}
                        fill
                        className="object-contain bg-zinc-50 p-1"
                        referrerPolicy="no-referrer"
                      />
                      {isSelected && (
                        <div className="absolute top-1 right-1 bg-indigo-500 text-white rounded-full p-0.5 z-10">
                          <CheckCircle2 size={14} />
                        </div>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewFurniture(item);
                        }}
                        className="absolute bottom-1 right-1 bg-white/90 text-zinc-700 p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-zinc-100 hover:text-zinc-900 shadow-sm z-10"
                        title="放大查看"
                      >
                        <Maximize2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Step 3: Custom Instructions */}
          <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-900 font-bold flex items-center justify-center text-sm">3</div>
              <h3 className="font-medium text-zinc-900">附加指令 <span className="text-zinc-400 text-sm font-normal">(可选)</span></h3>
            </div>
            <textarea
              value={customInstruction}
              onChange={(e) => setCustomInstruction(e.target.value)}
              placeholder="例如：只提取图中的单人沙发，并替换房间里的木椅子..."
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 outline-none transition-all resize-none h-24 text-sm"
            />
          </div>

          {/* Step 4: Generate */}
          <button
            onClick={handleGenerate}
            disabled={totalCombos === 0 || isGenerating}
            className={`w-full py-4 rounded-2xl font-medium flex items-center justify-center gap-2 transition-all ${
              totalCombos === 0
                ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                : isGenerating
                ? 'bg-indigo-500 text-white cursor-wait'
                : 'bg-zinc-900 text-white hover:bg-zinc-800 shadow-md hover:shadow-lg'
            }`}
          >
            {isGenerating ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                正在生成 ({batchProgress?.current}/{batchProgress?.total})...
              </>
            ) : (
              <>
                {totalCombos > 1 ? <Layers size={20} /> : <Sparkles size={20} />}
                {totalCombos > 1 ? `批量生成 (${totalCombos} 个组合)` : '在房间中可视化'}
              </>
            )}
          </button>
          
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-200">
              {error}
            </div>
          )}
        </div>

        {/* Right Column: Result */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
            <h3 className="font-medium text-zinc-900 flex items-center gap-2">
              <ImageIcon size={18} className="text-zinc-400" />
              生成结果 {isGenerating && batchProgress && <span className="text-indigo-600 text-sm ml-2">({batchProgress.current}/{batchProgress.total})</span>}
            </h3>
            {currentGeneratedImage && !isGenerating && (
              <a 
                href={currentGeneratedImage} 
                download="furniture-visualization.png"
                className="text-sm flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 font-medium bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Download size={16} />
                下载当前
              </a>
            )}
          </div>
          
          <div className="flex-1 p-6 flex flex-col items-center justify-center min-h-[400px] bg-zinc-50/30 relative">
            {isGenerating && batchProgress && (
              <div className="absolute top-0 left-0 w-full h-1 bg-zinc-100">
                <div 
                  className="h-full bg-indigo-500 transition-all duration-300"
                  style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                ></div>
              </div>
            )}

            {isGenerating && !currentGeneratedImage ? (
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-zinc-600 font-medium">AI 正在批量处理...</p>
                <p className="text-zinc-400 text-sm mt-1">请耐心等待，结果将自动保存到历史记录中。</p>
              </div>
            ) : currentGeneratedImage ? (
              <div className="relative w-full h-full min-h-[400px] rounded-xl overflow-hidden shadow-lg border border-zinc-200">
                <Image 
                  src={currentGeneratedImage} 
                  alt="Generated visualization" 
                  fill
                  className="object-contain bg-zinc-100"
                  referrerPolicy="no-referrer"
                />
                {isGenerating && (
                  <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1.5 rounded-lg backdrop-blur-md flex items-center gap-2 text-sm font-medium">
                    <Loader2 size={14} className="animate-spin" />
                    正在生成下一张...
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center max-w-sm">
                <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Layers size={32} className="text-zinc-300" />
                </div>
                <h4 className="text-lg font-medium text-zinc-900 mb-2">准备批量生成</h4>
                <p className="text-zinc-500 text-sm">
                  上传多张室内照片并选择多件家具，AI 将为您生成所有组合的可视化效果。
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* History Section */}
      {history.length > 0 && (
        <div className="pt-10 mt-10 border-t border-zinc-200">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center text-zinc-600">
                <History size={20} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                  生成历史
                  <span className="bg-zinc-900 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {history.length}
                  </span>
                </h3>
                <p className="text-sm text-zinc-500 mt-1">点击任意卡片即可恢复之前的编辑状态</p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {history.map((item) => (
              <div 
                key={item.id}
                onClick={() => loadHistoryItem(item)}
                className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col"
              >
                {/* Main Result Image */}
                <div className="relative aspect-[4/3] bg-zinc-100 overflow-hidden">
                  <Image 
                    src={item.generatedImage} 
                    alt="History result" 
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-3">
                    <div className="bg-white text-zinc-900 font-medium text-sm px-4 py-2 rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                      点击恢复此状态
                    </div>
                  </div>

                  {/* Timestamp Badge */}
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md text-zinc-700 text-xs font-medium px-2.5 py-1.5 rounded-lg shadow-sm flex items-center gap-1.5">
                    <Clock size={12} />
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                {/* Parameters Info */}
                <div className="p-4 bg-white flex-1 flex flex-col justify-between border-t border-zinc-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-xs font-medium text-zinc-400 uppercase tracking-wider w-12">家具</div>
                    <div className="flex items-center gap-2 bg-zinc-50 px-2 py-1.5 rounded-lg flex-1 border border-zinc-100 overflow-hidden">
                      <div className="relative w-6 h-6 rounded-md overflow-hidden bg-white border border-zinc-200 shrink-0">
                        <Image 
                          src={`data:${item.furniture.mimeType};base64,${item.furniture.data}`} 
                          alt={item.furniture.name}
                          fill
                          className="object-contain p-0.5"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <span className="text-sm font-medium text-zinc-700 truncate">
                        {item.furniture.name}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-xs font-medium text-zinc-400 uppercase tracking-wider w-12">场景</div>
                    <div className="flex items-center gap-2 bg-zinc-50 px-2 py-1.5 rounded-lg flex-1 border border-zinc-100 overflow-hidden">
                      <div className="relative w-6 h-6 rounded-md overflow-hidden bg-zinc-200 shrink-0">
                        <Image 
                          src={`data:${item.roomImage.mimeType};base64,${item.roomImage.data}`} 
                          alt="Original Room"
                          fill
                          className="object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <span className="text-sm text-zinc-600 truncate">
                        原始室内图
                      </span>
                    </div>
                  </div>

                  {item.customInstruction && (
                    <div className="flex items-start gap-3 mt-3 pt-3 border-t border-zinc-100">
                      <div className="text-xs font-medium text-zinc-400 uppercase tracking-wider w-12 mt-0.5">指令</div>
                      <div className="text-xs text-zinc-600 flex-1 line-clamp-2" title={item.customInstruction}>
                        {item.customInstruction}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Furniture Preview Modal */}
      {previewFurniture && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setPreviewFurniture(null)}
        >
          <div 
            className="relative w-full max-w-3xl aspect-square md:aspect-video bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setPreviewFurniture(null)}
              className="absolute top-4 right-4 z-10 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
            >
              <X size={20} />
            </button>
            <Image 
              src={`data:${previewFurniture.mimeType};base64,${previewFurniture.data}`} 
              alt={previewFurniture.name}
              fill
              className="object-contain p-4"
              referrerPolicy="no-referrer"
            />
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-6 pt-12">
              <h3 className="text-white text-xl font-medium">{previewFurniture.name}</h3>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
