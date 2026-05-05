<script setup lang="ts">
import { ref } from 'vue';
import RegistrationForm from './RegistrationForm.vue';
import LoginForm from './LoginForm.vue';

// Define reactive boolean state to control the flip animation
const isFlipped = ref<boolean>(false);

// Reactive variable to store email after successful registration
const registeredEmail = ref<string>("");

/**
 * Toggles the value of isFlipped to switch between 
 * Registration and Login forms.
 */
const toggleFlip = (): void => {
  isFlipped.value = !isFlipped.value;
};

/**
 * Handles the success event from RegistrationForm.
 * Stores the email and triggers the flip animation.
 * @param email The email address used for registration
 */
const handleRegistrationSuccess = (email: string): void => {
  registeredEmail.value = email;
  toggleFlip(); // Switch to Login form
};
</script>

<template>
  <div class="auth-page-wrapper">
    <!-- Perspective container for 3D animation -->
    <div class="auth-perspective-container">
      <!-- Flip-card wrapper with dynamic class binding -->
      <div class="auth-flip-card" :class="{ flipped: isFlipped }">
        
        <!-- Front Side: Registration Form -->
        <div class="card-face front-side">
          <div class="form-scroll-container custom-scrollbar">
            <RegistrationForm 
              @success="handleRegistrationSuccess" 
              @switch-to-login="toggleFlip"
            />
          </div>
        </div>

        <!-- Back Side: Login Form -->
        <div class="card-face back-side">
          <div class="form-scroll-container custom-scrollbar">
            <LoginForm 
              :email="registeredEmail" 
              @switch-to-register="toggleFlip"
            />
          </div>
        </div>

      </div>
    </div>
    
    <!-- Decorative background elements for a premium feel -->
    <div class="bg-blur-circle top-right"></div>
    <div class="bg-blur-circle bottom-left"></div>
  </div>
</template>

<style scoped>
/* Main Wrapper */
.auth-page-wrapper {
  min-height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fcfcfc;
  background-image: radial-gradient(circle at 2px 2px, #f0f0f0 1px, transparent 0);
  background-size: 40px 40px;
  padding: 1rem;
  position: relative;
  overflow-x: hidden;
}

/* Perspective Container */
.auth-perspective-container {
  width: 100%;
  max-width: 520px;
  perspective: 2000px;
  z-index: 10;
  margin: auto;
}

/* Flip Card Wrapper */
.auth-flip-card {
  position: relative;
  width: 100%;
  height: 720px; /* Base height for desktop */
  transition: transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
  transform-style: preserve-3d;
}

/* Flipped State */
.auth-flip-card.flipped {
  transform: rotateY(180deg);
}

/* Shared Card Face Styles */
.card-face {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  border-radius: 32px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: 
    0 10px 15px -3px rgba(0, 0, 0, 0.04),
    0 20px 40px -10px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.form-scroll-container {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  scrollbar-width: thin;
}

/* Front Side specifics */
.front-side {
  z-index: 2;
}

/* Back Side specifics */
.back-side {
  transform: rotateY(180deg);
  z-index: 1;
}

/* Decorative Background Blobs */
.bg-blur-circle {
  position: absolute;
  width: 40vw;
  height: 40vw;
  max-width: 500px;
  max-height: 500px;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.3;
  z-index: 1;
}

.top-right {
  top: -10%;
  right: -5%;
  background-color: #e0e7ff;
}

.bottom-left {
  bottom: -10%;
  left: -5%;
  background-color: #fef3c7;
}

/* Custom Scrollbar */
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}

/* Responsiveness */
@media (max-width: 768px) {
  .auth-perspective-container {
    max-width: 480px;
  }
  .auth-flip-card {
    height: 680px;
  }
}

@media (max-width: 640px) {
  .auth-page-wrapper {
    padding: 0.75rem;
    align-items: flex-start; /* Better for long forms on small mobile */
  }
  .auth-perspective-container {
    max-width: 100%;
    margin-top: 1rem;
  }
  .auth-flip-card {
    height: calc(100vh - 3.5rem);
    min-height: 600px;
  }
  .card-face {
    border-radius: 24px;
  }
  .bg-blur-circle {
    width: 60vw;
    height: 60vw;
    filter: blur(60px);
  }
}

@media (max-width: 380px) {
  .auth-flip-card {
    height: calc(100vh - 2rem);
    min-height: 550px;
  }
  .card-face {
    border-radius: 20px;
  }
}

@media (max-height: 700px) and (min-width: 641px) {
  .auth-flip-card {
    height: 580px;
  }
}

</style>
