<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  User, Mail, Lock, CheckCircle2, AlertCircle, Loader2, ChevronRight, Eye, EyeOff 
} from 'lucide-vue-next'
import logo from '../assets/logo.png'
import { 
  validateName, validateEmail, validatePassword, getPasswordStrength, type Role 
} from '../utils/validation'

// Form State
const formData = ref({
  name: '',
  email: '',
  role: 'user' as Role,
  password: '',
  confirmPassword: ''
})

// UI State
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const isLoading = ref(false)
const errors = ref<Record<string, string>>({})
const successMsg = ref<string | null>(null)

// Derived State
const passwordStrength = computed(() => getPasswordStrength(formData.value.password))

// Validation
const validateForm = () => {
  const newErrors: Record<string, string> = {}
  
  const nameV = validateName(formData.value.name)
  if (!nameV.isValid) newErrors.name = nameV.message!

  const emailV = validateEmail(formData.value.email)
  if (!emailV.isValid) newErrors.email = emailV.message!

  const passV = validatePassword(formData.value.password)
  if (!passV.isValid) newErrors.password = passV.message!

  if (formData.value.password !== formData.value.confirmPassword) {
    newErrors.confirmPassword = "Passwords do not match"
  }

  errors.value = newErrors
  return Object.keys(newErrors).length === 0
}

const handleSubmit = async () => {
  if (!validateForm()) return

  isLoading.value = true
  
  // Simulate API call
  setTimeout(() => {
    isLoading.value = false
    if (formData.value.role === 'reviewer') {
      successMsg.value = "Registration submitted! You will be able to log in once your account is approved by the admin."
    } else {
      successMsg.value = "Registration successful! Please log in to continue."
    }
  }, 1500)
}

const reloadPage = () => {
  window.location.reload()
}
</script>

<template>
  <div class="min-h-[800px] w-full max-w-5xl bg-white rounded-[2.5rem] shadow-kma-card overflow-hidden flex flex-col md:flex-row border border-zinc-100">
    
    <!-- Left Decoration / Branding Side -->
    <div class="w-full md:w-2/5 bg-black p-12 text-white flex flex-col justify-between relative overflow-hidden">
      <!-- Geometric Accents -->
      <div class="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
      <div class="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -ml-32 -mb-32"></div>
      
      <div class="relative z-10">
        <div class="bg-white p-2 rounded-xl inline-block mb-8 shadow-2xl overflow-hidden">
          <img :src="logo" alt="KMA Logo" class="w-[100px] h-[100px] object-contain" />
        </div>
        <h1 class="text-4xl font-bold mb-4 tracking-tight leading-[1.1]">
          Kerala <br />
          Mathematical <br />
          Association
        </h1>
        <p class="text-zinc-400 font-medium tracking-wide uppercase text-sm mb-12">
          Advancing Mathematical Excellence
        </p>
        
        <div class="space-y-6">
          <div v-for="item in ['Publish Research Articles', 'Peer-Reviewed Content', 'Access Scholarly Papers']" :key="item" 
               class="flex items-center gap-4 group cursor-default">
            <div class="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center transition-colors group-hover:bg-white/20">
              <CheckCircle2 color="#d4d4d8" :size="20" />
            </div>
            <span class="text-zinc-300 font-medium">{{ item }}</span>
          </div>
        </div>
      </div>

      <div class="relative z-10 pt-12">
        <p class="text-zinc-500 text-sm leading-relaxed">
          Joining the KMA provides a platform for authors, reviewers, and members to collaborate and access high-quality scholarly articles.
        </p>
      </div>
    </div>

    <!-- Right Form Side -->
    <div class="w-full md:w-3/5 p-8 md:p-12 bg-white flex flex-col justify-center">
      <div class="max-w-md mx-auto w-full">
        <header class="mb-10">
          <h2 class="text-3xl font-bold text-black mb-2">Create Account</h2>
          <p class="text-zinc-500">Enter your details to join the association</p>
        </header>

        <Transition name="fade" mode="out-in">
          <div v-if="successMsg" class="p-6 bg-zinc-50 border border-zinc-200 rounded-2xl flex flex-col items-center text-center space-y-4">
            <div class="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center">
              <CheckCircle2 color="white" :size="32" />
            </div>
            <p class="text-zinc-800 font-medium leading-relaxed">{{ successMsg }}</p>
            <button @click="reloadPage" class="btn-primary w-full mt-4">
              Continue to Login
            </button>
          </div>

          <form v-else @submit.prevent="handleSubmit" class="space-y-6">
            <!-- Full Name -->
            <div class="space-y-2">
              <label class="form-label" for="name">Full Name</label>
              <div class="relative">
                <User class="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" :size="18" />
                <input
                  id="name"
                  v-model="formData.name"
                  type="text"
                  :class="['input-field pl-12', errors.name ? 'border-red-500' : '']"
                  placeholder="e.g. Dr. Srinivasa Ramanujan"
                />
              </div>
              <p v-if="errors.name" class="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle :size="12"/> {{ errors.name }}</p>
            </div>

            <!-- Email Address -->
            <div class="space-y-2">
              <label class="form-label" for="email">Email Address</label>
              <div class="relative">
                <Mail class="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" :size="18" />
                <input
                  id="email"
                  v-model="formData.email"
                  type="email"
                  :class="['input-field pl-12', errors.email ? 'border-red-500' : '']"
                  placeholder="ramanujan@kma.org"
                />
              </div>
              <p v-if="errors.email" class="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle :size="12"/> {{ errors.email }}</p>
            </div>

            <!-- Role Selection -->
            <div class="space-y-3">
              <label class="form-label">Role Selection</label>
              <div class="grid grid-cols-3 gap-3">
                <button
                  v-for="r in (['user', 'author', 'reviewer'] as Role[])"
                  :key="r"
                  type="button"
                  @click="formData.role = r"
                  :class="[
                    'py-3 rounded-xl border transition-all text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2',
                    formData.role === r 
                      ? 'bg-black text-white border-black shadow-lg shadow-black/20' 
                      : 'bg-white text-zinc-500 border-zinc-200 hover:border-black/30'
                  ]"
                >
                  {{ r }}
                </button>
              </div>
              <Transition name="slide">
                <div v-if="formData.role === 'reviewer'" class="bg-zinc-50 border border-zinc-200 p-3 rounded-xl flex gap-3">
                  <AlertCircle :size="16" class="text-zinc-500 shrink-0 mt-0.5" />
                  <p class="text-[11px] text-zinc-600 leading-normal">
                    <strong>Reviewer</strong> accounts require admin approval. You will be able to log in only after your account is approved.
                  </p>
                </div>
              </Transition>
            </div>

            <!-- Password -->
            <div class="space-y-2">
              <label class="form-label" for="password">Password</label>
              <div class="relative">
                <Lock class="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" :size="18" />
                <input
                  id="password"
                  v-model="formData.password"
                  :type="showPassword ? 'text' : 'password'"
                  :class="['input-field pl-12 pr-12', errors.password ? 'border-red-500' : '']"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  @click="showPassword = !showPassword"
                  class="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black transition-colors"
                >
                  <EyeOff v-if="showPassword" :size="18" />
                  <Eye v-else :size="18" />
                </button>
              </div>
              <!-- Strength Indicator -->
              <div class="flex gap-1 mt-2">
                <div 
                  v-for="i in [1, 2, 3, 4]" :key="i"
                  :class="[
                    'h-1 flex-1 rounded-full transition-all duration-500',
                    passwordStrength >= i * 25 ? 'bg-black' : 'bg-zinc-100'
                  ]"
                ></div>
              </div>
              <p v-if="errors.password" class="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle :size="12"/> {{ errors.password }}</p>
            </div>

            <!-- Confirm Password -->
            <div class="space-y-2">
              <label class="form-label" for="confirmPassword">Confirm Password</label>
              <div class="relative">
                <Lock class="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" :size="18" />
                <input
                  id="confirmPassword"
                  v-model="formData.confirmPassword"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  :class="['input-field pl-12 pr-12', errors.confirmPassword ? 'border-red-500' : '']"
                  placeholder="Enter your password again"
                />
                <button
                  type="button"
                  @click="showConfirmPassword = !showConfirmPassword"
                  class="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black transition-colors"
                >
                  <EyeOff v-if="showConfirmPassword" :size="18" />
                  <Eye v-else :size="18" />
                </button>
              </div>
              <p v-if="errors.confirmPassword" class="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle :size="12"/> {{ errors.confirmPassword }}</p>
            </div>

            <button 
              type="submit" 
              :disabled="isLoading"
              class="btn-primary w-full flex items-center justify-center gap-2 group"
            >
              <Loader2 v-if="isLoading" class="animate-spin" :size="20" />
              <template v-else>
                Register
                <ChevronRight :size="18" class="transition-transform group-hover:translate-x-1" />
              </template>
            </button>

            <p class="text-center text-zinc-500 text-sm">
              Already have an account?
              <a href="/login" class="text-black font-bold hover:underline transition-all ml-1">Login</a>
            </p>
          </form>
        </Transition>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.slide-enter-active, .slide-leave-active { transition: all 0.3s ease; max-height: 100px; }
.slide-enter-from, .slide-leave-to { opacity: 0; max-height: 0; }
</style>
