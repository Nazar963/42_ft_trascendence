<script setup lang="ts">
// import { useLoginStore } from '../stores/login';
import { onMounted, ref } from 'vue';
import AuthComponent from '@/components/auth/AuthComponent.vue';
import { useAuthStore } from '@/stores/auth';
import CardPong from '@/components/CardPong.vue';
const authStore = ref(useAuthStore());

// Only call online() from App.vue to avoid duplicate calls
// This prevents multiple components from setting online status
onMounted(() => {
  // No need to call AuthService.online() here since App.vue handles it
});

</script>

<template>
<AuthComponent v-if="!authStore.isLoggedIn"/>
<CardPong  v-if="authStore.isLoggedIn"/>
</template>
