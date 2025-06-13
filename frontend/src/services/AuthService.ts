import http from '@/http';
import { type ISignedIn } from '@/models/ISignedIn';
import { useAuthStore } from '@/stores/auth';

class AuthService {
  // local
  signInLocal(email: string, password: string, isEmail: boolean) {
    if (isEmail)
      return http.post('/auth/local/signin', { email: email, password });
    else
      return http.post('/auth/local/signin', { username: email, password });
  }
  signUpLocal(email: string, username:string, password: string) {
    return http.post<ISignedIn>('/auth/local/signup', { email, username, password });
  }
    /* --------------------------- for the jwt decode --------------------------- */
  decodePayload(token: string) {
	const payloadBase64Url = token.split('.')[1];
	const payloadBase64 = payloadBase64Url.replace(/-/g, '+').replace(/_/g, '/');
	const payloadJson = atob(payloadBase64);
	return JSON.parse(payloadJson);
  }

  // 42
  signInFortyTwo(params: string) {
    return http.get<ISignedIn>(`/auth/42/signin${params}`, {
    });
  }

  signInLocal2fa(emailcode: string, email: string, isEmail: boolean) {
    if (isEmail)
      return http.post('/auth/local/signin/2fa', {verificationCode: emailcode, email: email});
    else
      return http.post('/auth/local/signin/2fa', { verificationCode: emailcode, username: email });
  }

  change2fa() {
    return http.post('/user/change2fa');
  }

  // Track when the last online status update was called to prevent too many calls
  private lastOnlineUpdate = 0;
  private onlineUpdateInProgress = false;
  private isOnline = false;

  async online() {
    // If already online or an update is in progress, skip this call
    if (this.isOnline || this.onlineUpdateInProgress) {
      return;
    }

    // Implement a 5-second cooldown between status updates
    const now = Date.now();
    if (now - this.lastOnlineUpdate < 5000) {
      return;
    }

    this.onlineUpdateInProgress = true;
    this.lastOnlineUpdate = now;

    try {
      // Check if the user is authenticated (has a token) via store
      const authStore = useAuthStore();
      if (!authStore.token) {
        console.log('User not authenticated, skipping online status update');
        return;
      }

      await http.post('/user/online');
      this.isOnline = true;
    } catch (error) {
      console.error('Error setting online status:', error);
      // Don't throw the error to prevent cascading failures
    } finally {
      this.onlineUpdateInProgress = false;
    }
  }

  async offline() {
    if (!this.isOnline) {
      return;
    }
    
    try {
      const authStore = useAuthStore();
      if (!authStore.token) {
        return;
      }
      
      await http.post('/user/offline');
      this.isOnline = false;
    } catch (error) {
      console.error('Error setting offline status:', error);
      // Don't throw the error here as this might be called during page unload
    }
  }

  /** Get a new access_token. Must provide the refresh token */
  async refresh() {
    const response = await http.post('/auth/refresh');
	return response.data;
  }
  /** Will delete refresh token from db */
  logout() {
    return http.post('/auth/logout');
  }

  deleteAccount() {
    return http.delete('/users');
  }
}
export default new AuthService();
