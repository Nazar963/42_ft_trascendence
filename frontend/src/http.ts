import axios, { type AxiosInstance } from "axios";
import { useAuthStore } from "@/stores/auth";

// The backend api
const myApi: AxiosInstance = axios.create({
	baseURL: "/api",
	headers: {
    'Content-type': 'application/json'
	},
	withCredentials: true
});

myApi.interceptors.request.use(config => {
	const authStore = useAuthStore();
	
	// Only add Authorization header if we have tokens
	if (authStore.needsRefresh && authStore.refreshToken) {
		config.headers['Authorization'] = authStore.refreshBearer;
	} else if (authStore.token && !authStore.needsRefresh) {
		config.headers['Authorization'] = authStore.tokenBearer;
	}
	// If no tokens available, don't add Authorization header
	
	return config;
});

export const refreshAccessTokenFn = async () => {
	const authStore = useAuthStore();
	
	// Check if we have a refresh token before attempting refresh
	if (!authStore.refreshToken) {
		console.log('No refresh token available');
		authStore.clearApp();
		throw new Error('No refresh token available');
	}

	try {	  
		const response = await myApi.post('/auth/refresh');
  
		// Handle the response and update the access token
		authStore.token = response.data.accessToken;
		authStore.refreshToken = response.data.refreshToken;
		authStore.needsRefresh = false;
		return response;
	} catch (e) {
		// Handle error
		if (e)
			console.error("Error refreshing access token:", e);
		// Clear tokens if refresh fails
		authStore.clearApp();
		throw e;
	}
};  
  
	myApi.interceptors.response.use(
	(response) => {
		return response;
	},
	async (error) => {
		if (!error.response) {
			return Promise.reject(error);
		}

		const originalRequest = error.config;
		const errMessage = error.response?.data?.message || '';
		const authStore = useAuthStore();
		
		// Prevent infinite loop by checking if this is already a refresh request
		if (originalRequest.url?.includes('/auth/refresh')) {
			authStore.clearApp();
			return Promise.reject(error);
		}
		
		// Only attempt refresh if we have a refresh token and haven't already tried
		if (errMessage.includes('Unauthorized') && !originalRequest._retry && authStore.refreshToken) {
			authStore.needsRefresh = true;
			originalRequest._retry = true;
			try {
				await refreshAccessTokenFn();
				return myApi(originalRequest);
			} catch (refreshError) {
				// If refreshing token fails, log out user
				authStore.logout();
				return Promise.reject(refreshError);
			}
		}
		
		// If no refresh token available, just clear the app silently for 401s
		if (errMessage.includes('Unauthorized') && !authStore.refreshToken) {
			authStore.clearApp();
			return Promise.reject(error);
		}
		
		if (errMessage.includes('Access Denied')) {
			authStore.logout();
		}
		
		return Promise.reject(error);
	}
);	
export default myApi
