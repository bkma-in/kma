<script setup lang="ts">
import { ref, computed } from 'vue'
import { User, Mail, Lock, Eye, EyeOff, ChevronRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-vue-next'
import { 
  validateName, validateEmail, validatePassword, getPasswordStrength, type Role 
} from '../utils/validation'

const emit = defineEmits<{
  (e: 'success', email: string): void
  (e: 'switch-to-login'): void
}>()

const formData = ref({
  name: '',
  email: '',
  role: 'user' as Role,
  password: '',
  confirmPassword: ''
})

const showPassword = ref(false)
const showConfirmPassword = ref(false)
const isLoading = ref(false)
const errors = ref<Record<string, string>>({})
const successMsg = ref<string | null>(null)

const passwordStrength = computed(() => getPasswordStrength(formData.value.password))

const strengthColor = computed(() => {
  const strength = passwordStrength.value
  if (strength <= 25) return "bg-red-500"
  if (strength <= 75) return "bg-yellow-400"
  return "bg-green-500"
})

const validateForm = () => {
  const newErrors: Record<string, string> = {}
  const nameV = validateName(formData.value.name)
  if (!nameV.isValid) newErrors.name = nameV.message!
  const emailV = validateEmail(formData.value.email)
  if (!emailV.isValid) newErrors.email = emailV.message!
  const passV = validatePassword(formData.value.password)
  if (!passV.isValid) newErrors.password = passV.message!
  if (formData.value.password !== formData.value.confirmPassword) newErrors.confirmPassword = "Passwords do not match"
  errors.value = newErrors
  return Object.keys(newErrors).length === 0
}

const handleSubmit = async () => {
  if (!validateForm()) return
  isLoading.value = true
  
  setTimeout(() => {
    isLoading.value = false
    let msg = "Registration successful! Flipping to login..."
    if (formData.value.role === 'reviewer') {
      msg = "Your reviewer registration has been submitted and is pending admin approval. Flipping to login..."
    }
    successMsg.value = msg
    
    setTimeout(() => {
      emit('success', formData.value.email)
    }, 2000)
  }, 1500)
}
</script>

<template>
  <div class="w-full h-full flex flex-col justify-center p-8 md:p-12 overflow-y-auto custom-scrollbar">
    <div class="max-w-md mx-auto w-full py-8">
      <header class="mb-8">
        <h2 class="text-3xl font-bold text-black mb-2">Create Account</h2>
        <p class="text-zinc-500 text-sm">Join the Kerala Mathematical Association</p>
      </header>

      <Transition name="fade-scale" mode="out-in">
        <div v-if="successMsg" class="p-8 bg-zinc-50 border border-zinc-200 rounded-3xl flex flex-col items-center text-center space-y-4">
          <div class="w-20 h-20 bg-black text-white rounded-full flex items-center justify-center shadow-2xl shadow-black/20">
            <CheckCircle2 :size="40" />
          </div>
          <div class="space-y-2">
            <p class="text-black font-bold text-lg">Registration Success</p>
            <p class="text-zinc-600 text-sm leading-relaxed">{{ successMsg }}</p>
          </div>
          <div class="pt-4 flex gap-2">
            <div class="w-2 h-2 bg-black rounded-full animate-bounce"></div>
            <div class="w-2 h-2 bg-black rounded-full animate-bounce delay-200"></div>
            <div class="w-2 h-2 bg-black rounded-full animate-bounce delay-400"></div>
          </div>
        </div>

        <form v-else @submit.prevent="handleSubmit" class="space-y-6">
          <!-- Name -->
          <div class="space-y-2">
            <label class="form-label" for="reg-name-vue">Full Name</label>
            <div class="relative group">
              <User class="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-black transition-colors" :size="18" />
              <input
                id="reg-name-vue"
                v-model="formData.name"
                class="input-field pl-12"
                :class="{ 'border-red-500': errors.name }"
                placeholder="Enter your full name"
              />
            </div>
            <p v-if="errors.name" class="text-red-500 text-[11px] font-medium flex items-center gap-1 ml-1"><AlertCircle :size="10"/> {{ errors.name }}</p>
          </div>

          <!-- Email -->
          <div class="space-y-2">
            <label class="form-label" for="reg-email-vue">Email Address</label>
            <div class="relative">
              <Mail class="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" :size="18" />
              <input
                id="reg-email-vue"
                v-model="formData.email"
                type="email"
                class="input-field pl-12"
                :class="{ 'border-red-500': errors.email }"
                placeholder="Enter your email address"
              />
            </div>
            <p v-if="errors.email" class="text-red-500 text-[11px] font-medium flex items-center gap-1 ml-1"><AlertCircle :size="10"/> {{ errors.email }}</p>
          </div>

          <!-- Role -->
          <div class="space-y-3">
            <label class="form-label">Role Selection</label>
            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="r in (['user', 'author', 'reviewer'] as Role[])"
                :key="r"
                type="button"
                @click="formData.role = r"
                class="py-3 rounded-xl border transition-all text-[10px] font-bold uppercase tracking-widest"
                :class="formData.role === r ? 'bg-black text-white border-black shadow-lg shadow-black/20' : 'bg-white text-zinc-400 border-zinc-200 hover:border-black/30'"
              >
                {{ r }}
              </button>
            </div>
          </div>

          <!-- Password -->
          <div class="space-y-2">
            <label class="form-label" for="reg-password-vue">Password</label>
            <div class="relative">
              <Lock class="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" :size="18" />
              <input
                id="reg-password-vue"
                v-model="formData.password"
                :type="showPassword ? 'text' : 'password'"
                class="input-field pl-12 pr-12"
                :class="{ 'border-red-500': errors.password }"
                placeholder="••••••••"
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
            <!-- Strength -->
            <div class="flex gap-1.5 mt-2">
              <div 
                v-for="i in [1, 2, 3, 4]" :key="i"
                class="h-1 px-1 flex-1 rounded-full transition-all duration-700"
                :class="passwordStrength >= i * 25 ? strengthColor : 'bg-zinc-100'"
              ></div>
            </div>
          </div>

          <!-- Confirm Password -->
          <div class="space-y-2">
            <label class="form-label" for="reg-confirm-vue">Confirm Password</label>
            <div class="relative">
              <Lock class="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" :size="18" />
              <input
                id="reg-confirm-vue"
                v-model="formData.confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                class="input-field pl-12 pr-12"
                :class="{ 'border-red-500': errors.confirmPassword }"
                placeholder="••••••••"
              />
              <button
                type="button"
                @click="showConfirmPassword = !showConfirmPassword"
                class="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400"
              >
                <EyeOff v-if="showConfirmPassword" :size="18" />
                <Eye v-else :size="18" />
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            :disabled="isLoading"
            class="btn-primary w-full flex items-center justify-center gap-2 group mt-4 overflow-hidden"
          >
            <Loader2 v-if="isLoading" class="animate-spin" :size="20" />
            <template v-else>
              <span class="relative z-10">Register</span>
              <ChevronRight :size="18" class="relative z-10 transition-transform group-hover:translate-x-1" />
            </template>
          </button>

          <p class="text-center text-zinc-500 text-sm">
            Already have an account?
            <button 
              type="button"
              @click="emit('switch-to-login')"
              class="text-black font-bold hover:underline ml-1"
            >
              Login
            </button>
          </p>
        </form>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.fade-scale-enter-active, .fade-scale-leave-active { transition: all 0.3s ease; }
.fade-scale-enter-from, .fade-scale-leave-to { opacity: 0; transform: scale(0.95); }

.delay-200 { animation-delay: 200ms; }
.delay-400 { animation-delay: 400ms; }
</style>
