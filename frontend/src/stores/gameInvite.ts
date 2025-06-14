import { defineStore } from 'pinia';
import GameInviteService from '@/services/GameInviteService';
import axios, { AxiosError } from 'axios';
import type { IError } from '@/models/IError';
import { ref, computed } from 'vue';
import { useCurrentUserStore } from './currentUser';

export const useGameStore = defineStore('game', () => {
	const idMatch = ref('');
	const getIdMatch = computed(() => idMatch.value);
	const setIdMatch = (val:string) => { idMatch.value = val }
	const accepted = ref<any[]>([]); 
	const waiting = ref<any[]>([]);
	const thinking = ref<any[]>([]);
	const getAcceptef = computed(() => accepted.value);
	const getWaiting = computed(() => waiting.value);
	const getThinking = computed(() => thinking.value);
	const setAccepted = (val:any[]) => { accepted.value = val }
	const setWaiting = (val:any[]) => { waiting.value = val }
	const setThinking = (val:any[]) => { thinking.value = val }
	const renderer = ref(false);
	const getRenderer = computed(() => renderer.value);
	const setRenderer = (val:boolean) => { renderer.value = val }
	const updateInvite = async () => {
		const userId = useCurrentUserStore().userId;
		if (!userId) {
			console.log('No userId available for game invite update');
			return;
		}
		
		try {
			accepted.value = await GameInviteService.getAcceptedGameInvite();
			waiting.value = await GameInviteService.getWaitingGameInvite(userId);
			thinking.value = await GameInviteService.getThinkingGameInvite(userId);
		} catch (error) {
			console.log('Failed to update game invites:', error);
		}
	}
	
	const initStore = async (userId: string | null) => {
		// Only initialize if we have a valid userId
		if (!userId) {
			console.log('No userId provided to game store');
			return;
		}
		
		try {
			accepted.value = await GameInviteService.getAcceptedGameInvite();
			waiting.value = await GameInviteService.getWaitingGameInvite(userId);
			thinking.value = await GameInviteService.getThinkingGameInvite(userId);
		} catch (err) {
			const e = err as AxiosError<IError>;
			if (axios.isAxiosError(e)) {
				console.log('Failed to initialize game store:', e.response?.data);
				return e.response?.data;
			}
		}
	}

	return {
		accepted, waiting, thinking, renderer, getAcceptef, getWaiting, getThinking, setAccepted, setWaiting, setThinking, updateInvite,
		getRenderer, setRenderer, initStore, getIdMatch, setIdMatch
	}
});

