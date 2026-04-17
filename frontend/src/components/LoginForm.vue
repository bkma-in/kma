<script setup lang="ts">
import { ref, computed } from 'vue'
import { Mail, Lock, Eye, EyeOff, LogIn, AlertTriangle } from 'lucide-vue-next'

const props = defineProps<{
  email?: string
}>()

const emit = defineEmits<{
  (e: 'switch-to-register'): void
}>()

const email = ref(props.email || '')
const password = ref('')
const showPassword = ref(false)

const passwordFilledSegments = computed(() => Math.ceil(password.value.length / 2))
const passwordLineColor = computed(() => {
  if (password.value.length === 0) return 'bg-zinc-200'
  return password.value.length === 8 ? 'bg-green-500' : 'bg-red-500'
})
</script>

<template>
  <div class="w-full h-full flex flex-col justify-center p-8 md:p-12">
    <header class="mb-10">
      <h2 class="text-3xl font-bold text-black mb-2">Welcome Back</h2>
      <p class="text-zinc-500">Log in to your KMA account</p>
    </header>

    <form class="space-y-6" @submit.prevent>
      <!-- Email Address -->
      <div class="space-y-2">
        <label class="form-label" for="login-email-vue">Email Address</label>
        <div class="relative">
          <Mail class="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" :size="18" />
          <input
            id="login-email-vue"
            type="email"
            class="input-field pl-12"
            placeholder="ramanujan@kma.org"
            v-model="email"
          />
        </div>
      </div>

      <!-- Password -->
      <div class="space-y-2">
        <div class="flex justify-between items-center">
          <label class="form-label mb-0" for="login-password-vue">Password</label>
          <a href="#" class="text-[11px] font-bold text-zinc-400 hover:text-black uppercase tracking-wider">Forgot?</a>
        </div>
        <div class="relative">
          <Lock class="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" :size="18" />
          <input
            id="login-password-vue"
            :type="showPassword ? 'text' : 'password'"
            class="input-field pl-12 pr-12"
            placeholder="Enter your password"
            maxlength="8"
            v-model="password"
          />
          <button
            type="button"
            @click="showPassword = !showPassword"
            class="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400"
          >
            <EyeOff v-if="showPassword" :size="18" />
            <Eye v-else :size="18" />
          </button>
        </div>
        <!-- Indicator lines -->
        <div class="flex gap-1.5 mt-1.5">
          <div
            v-for="i in 4"
            :key="i"
            class="h-1 flex-1 rounded-full transition-all duration-300"
            :class="i <= passwordFilledSegments ? passwordLineColor : 'bg-zinc-200'"
          ></div>
        </div>
      </div>

      <!-- Development Notice -->
      <div class="bg-zinc-50 border border-zinc-200 p-4 rounded-2xl flex gap-3 text-amber-600">
        <AlertTriangle class="shrink-0" :size="20" />
        <div class="space-y-1">
          <p class="text-xs font-bold uppercase tracking-wider">Feature Notice</p>
          <p class="text-[12px] leading-snug text-zinc-600">
            Login functionality is not active at the moment. Please contact the administrator for access or check back later.
          </p>
        </div>
      </div>

      <button 
        type="button"
        :disabled="password.length !== 8" 
        class="btn-primary w-full flex items-center justify-center gap-2 transition-all transition-colors"
        :class="{ 'opacity-50 cursor-not-allowed grayscale': password.length !== 8 }"
      >
        <LogIn :size="18" />
        Login
      </button>

      <p class="text-center text-zinc-500 text-sm pt-4">
        Don't have an account?
        <button 
          type="button"
          @click="emit('switch-to-register')"
          class="text-black font-bold hover:underline ml-1"
        >
          Register
        </button>
      </p>
    </form>
  </div>
</template>
