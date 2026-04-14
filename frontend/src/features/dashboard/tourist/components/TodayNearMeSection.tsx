"use client";

import { motion } from "framer-motion";
import { Sparkles, MessageSquare, Mic, Image as ImageIcon, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function AIPreviewSection() {
  return (
    <div className="px-4 py-8">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-[40px] bg-slate-900 p-8 md:p-12 shadow-2xl shadow-green-900/20"
      >
        {/* Background Decorative Elements */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-green-500/20 rounded-full blur-[80px]" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px]" />

        <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
          {/* Left Side: Content */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-black uppercase tracking-widest mb-6">
              <Sparkles size={14} />
              New Feature: Vision & Voice
            </div>
            
            <h2 className="text-3xl md:text-5xl font-black text-white mb-6 leading-[1.1]">
              Ongea na <span className="text-green-500">Kilicare AI</span> <br /> 
              Kama Rafiki wa Kweli.
            </h2>
            
            <p className="text-slate-400 text-lg font-medium mb-8 leading-relaxed">
              Tuma picha ya mnyama umjuwaye, rekodi sauti uulize njia, au panga ratiba ya safari yako ya Dodoma kwa sekunde chache.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link href="/chat">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-green-600 hover:bg-green-500 text-white rounded-2xl font-black flex items-center gap-3 shadow-lg shadow-green-600/20 transition-all"
                >
                  Anza Maongezi <ArrowRight size={20} />
                </motion.button>
              </Link>
              
              <div className="flex items-center -space-x-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-xs overflow-hidden">
                    <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="user" />
                  </div>
                ))}
                <span className="pl-6 text-slate-500 text-xs font-bold">+200 Users Today</span>
              </div>
            </div>
          </div>

          {/* Right Side: Visual Preview (Mockup) */}
          <div className="relative">
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[30px] p-6 shadow-2xl"
            >
              {/* Fake Chat Bubbles */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-green-600 flex items-center justify-center text-[10px]">🍃</div>
                  <div className="bg-white/10 rounded-2xl rounded-tl-none p-3 text-sm text-slate-300 max-w-[80%]">
                    Habari Juma! Nimeona picha ya Twiga uliyotuma. Huyu anapatikana sana Mikumi...
                  </div>
                </div>
                
                <div className="flex items-start gap-3 flex-row-reverse">
                  <div className="w-8 h-8 rounded-xl bg-slate-700 flex items-center justify-center text-[10px]">👤</div>
                  <div className="bg-green-600 rounded-2xl rounded-tr-none p-3 text-sm text-white max-w-[80%]">
                    Asante! Nawezaje kufika huko kutokea Dodoma?
                  </div>
                </div>

                {/* Interactive Icons Preview */}
                <div className="pt-4 border-t border-white/5 flex justify-around">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-green-400">
                      <Mic size={20} />
                    </div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Voice</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-blue-400">
                      <ImageIcon size={20} />
                    </div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Vision</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-purple-400">
                      <MessageSquare size={20} />
                    </div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Memory</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Floating Decorative Tag */}
            <motion.div 
              animate={{ rotate: [0, 5, 0] }}
              transition={{ duration: 5, repeat: Infinity }}
              className="absolute -bottom-6 -right-6 bg-yellow-400 p-4 rounded-2xl shadow-xl rotate-6 hidden lg:block"
            >
              <p className="text-black font-black text-xs">Powered by Llama 3 & Whisper</p>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}