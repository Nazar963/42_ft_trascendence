<script setup lang="ts">
import { RouterView } from 'vue-router'
import NavBar from './components/NavBar.vue';
import { useGameStore } from './stores/gameInvite';
import { useAuthStore } from './stores/auth';
import { useCurrentUserStore } from './stores/currentUser';
import { ref, onBeforeMount, onMounted} from 'vue';
import AuthService from './services/AuthService';
import { useFriendStore } from './stores/friend';

const gameStore = ref(useGameStore());
const authStore = ref(useAuthStore());
const userStore = ref(useCurrentUserStore());
const friendStore = ref(useFriendStore());

onBeforeMount( async () => {
  if (userStore.value.userId)
    await userStore.value.initStore(null, null);
});

onMounted(async () => {
  window.addEventListener("beforeunload", unload);
  
  // Call online() - our improved AuthService will handle all edge cases
  try {
    await AuthService.online();
  } catch (error) {
    console.error("Failed to set online status:", error);
  }
  
  setInterval(async () => {
    // Only make API calls if user is properly authenticated
    if (userStore.value.userId && authStore.value.isLoggedIn && authStore.value.token){
      try {
        await gameStore.value.initStore(userStore.value.userId)
        await friendStore.value.initStore(userStore.value.userId)
      } catch (error) {
        console.log('Failed to update stores:', error);
        // If stores fail to update due to auth issues, don't spam the logs
      }
    }
  }, 3000);
});

function unload() {
  console.log("unload");
  // Our improved AuthService will handle authentication checks internally
  AuthService.offline();
}




</script>

<template>
	<NavBar v-if="authStore.isLoggedIn"/>
	<RouterView />
</template>
