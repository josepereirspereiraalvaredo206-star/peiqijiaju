'use client';

import { useState } from 'react';
import { Sofa, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export function Login({ onLogin }: { onLogin: (name: string) => void }) {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onLogin(name.trim());
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-zinc-50">
      <div className="flex-1 bg-zinc-900 text-white p-12 flex flex-col justify-between relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-white text-zinc-900 rounded-xl flex items-center justify-center">
              <Sofa size={24} />
            </div>
            <span className="text-xl font-bold tracking-tight">家具视界 AI</span>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-6xl font-medium leading-tight mb-6">
              在任何空间中可视化您的家具。
            </h1>
            <p className="text-zinc-400 text-lg max-w-md leading-relaxed">
              上传您的图册，让客户使用先进的 AI 技术，直观地看到您的家具在他们自己家中的效果。
            </p>
          </motion.div>
        </div>
        
        {/* Decorative background elements */}
        <div className="absolute top-1/4 right-[-10%] w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl"></div>
      </div>
      
      <div className="flex-1 flex items-center justify-center p-8 md:p-12">
        <div className="max-w-md w-full">
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-zinc-900 mb-2">欢迎回来</h2>
            <p className="text-zinc-500">输入您的公司信息以进入工作台。</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-zinc-700 mb-2">
                公司名称
              </label>
              <input
                id="companyName"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：某某家具有限公司"
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 outline-none transition-all"
                required
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-zinc-900 text-white font-medium py-3 px-4 rounded-xl hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2 group"
            >
              进入工作台
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
