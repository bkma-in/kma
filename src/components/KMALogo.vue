<script setup lang="ts">
interface Props {
  size?: number;
}

const props = withDefaults(defineProps<Props>(), {
  size: 120
});
</script>

<template>
  <div class="relative flex items-center justify-center" :style="{ width: props.size + 'px', height: props.size + 'px' }">
    <svg
      viewBox="0 0 400 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      class="w-full h-full"
    >
      <!-- Octagonal Outer Frame -->
      <path
        d="M200 20 L327.28 72.72 L380 200 L327.28 327.28 L200 380 L72.72 327.28 L20 200 L72.72 72.72 Z"
        stroke="black"
        stroke-width="12"
        fill="white"
      />
      
      <!-- Inner Circle -->
      <circle cx="200" cy="200" r="110" stroke="black" stroke-width="6" />
      
      <!-- Radiating Points -->
      <g v-for="angle in [0, 45, 90, 135, 180, 225, 270, 315]" :key="angle">
        <path
          d="M200 65 L225 105 L175 105 Z"
          fill="black"
          :transform="`rotate(${angle} 200 200)`"
        />
      </g>

      <!-- Association Text -->
      <foreignObject x="110" y="145" width="180" height="110">
        <div class="flex flex-col items-center justify-center h-full text-center leading-tight">
          <span class="font-bold text-[18px] uppercase tracking-tight text-black">Kerala</span>
          <span class="font-bold text-[18px] uppercase tracking-tight text-black">Mathematical</span>
          <span class="font-bold text-[18px] uppercase tracking-tight text-black">Association</span>
        </div>
      </foreignObject>
    </svg>
  </div>
</template>
