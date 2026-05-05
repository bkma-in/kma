<script setup lang="ts">
import logo from '../assets/logo.png'
import { CheckCircle2, Info } from 'lucide-vue-next'
</script>

<template>
  <div class="w-full h-full bg-black p-12 flex flex-col justify-between relative overflow-hidden flex-shrink-0">
    <!-- Subtle Background Accents -->
    <div class="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl -mr-40 -mt-40"></div>
    <div class="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full blur-3xl -ml-40 -mb-40"></div>
    
    <div class="relative z-10">
      <div class="bg-white p-2 rounded-2xl inline-block mb-10 shadow-xl overflow-hidden">
        <img :src="logo" alt="KMA Logo" class="w-[120px] h-[120px] object-contain" />
      </div>
      
      <h1 class="text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight leading-[1.1]">
        Kerala <br />
        Mathematical <br />
        Association
      </h1>
      
      <p class="text-yellow-400 font-bold tracking-widest uppercase text-xs mb-12 flex items-center gap-2">
        <span class="w-8 h-[1px] bg-yellow-400/30 inline-block"></span>
        Advancing Mathematical Excellence
      </p>
      
      <div class="space-y-6 max-w-sm">
        <p class="text-zinc-400 leading-relaxed text-sm">
          The Kerala Mathematical Association promotes advanced mathematical research and higher education through collaboration among scholars worldwide.
        </p>
        
        <div class="pt-6 border-t border-zinc-800 space-y-4">
          <div class="flex items-start gap-3 p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm shadow-sm group transition-all hover:bg-white/10 hover:shadow-md">
            <CheckCircle2 class="text-zinc-300 shrink-0 mt-0.5" :size="18" />
            <p class="text-zinc-400 text-[13px] leading-snug">
              Access peer-reviewed scholarly articles and research papers.
            </p>
          </div>
          
          <div class="flex items-start gap-3 p-4 bg-white text-black rounded-2xl shadow-lg group">
            <Info class="text-black shrink-0 mt-0.5" :size="18" />
            <div class="space-y-1">
              <p class="font-bold text-[11px] uppercase tracking-wider text-zinc-500">Reviewer Notice</p>
              <p class="text-[13px] leading-snug text-zinc-600">
                Reviewer accounts require admin approval. You will be able to log in only after your account has been approved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="relative z-10 pt-12">
      <p class="text-zinc-400 text-[10px] uppercase font-bold tracking-widest">
        &copy; 2026 Kerala Mathematical Association
      </p>
    </div>
  </div>
</template>
