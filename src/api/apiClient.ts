import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import * as SecureStore from "expo-secure-store";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

// Keys used to persist tokens securely on the device
export const SECURE_STORE_KEYS = {
    ACCESS_TOKEN: "shattle_access_token",
    REFRESH_TOKEN: "shattle_refresh_token",
    USER: "shattle_user",
} as const;

// ─── Base axios instance ───────────────────────────────────────────────────
export const apiClient = axios.create({
    baseURL: `${API_BASE_URL}/api`,
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
    },
});

// ─── Request interceptor — attach Bearer token automatically ─────────────
apiClient.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        const token = await SecureStore.getItemAsync(SECURE_STORE_KEYS.ACCESS_TOKEN);
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error),
);

// ─── Response interceptor — auto-refresh on 403 (expired access token) ───
let isRefreshing = false;
type FailedRequest = {
    resolve: (token: string) => void;
    reject: (error: unknown) => void;
};
let failedQueue: FailedRequest[] = [];

function processQueue(error: unknown, token: string | null) {
    failedQueue.forEach((item) => {
        if (error) {
            item.reject(error);
        } else {
            item.resolve(token!);
        }
    });
    failedQueue = [];
}

apiClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Only attempt refresh on 403 and only once per request
        if (error.response?.status === 403 && !originalRequest._retry) {
            if (isRefreshing) {
                // Queue the request until the refresh resolves
                return new Promise<string>((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then((token) => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return apiClient(originalRequest);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const refreshToken = await SecureStore.getItemAsync(SECURE_STORE_KEYS.REFRESH_TOKEN);
                if (!refreshToken) throw new Error("No refresh token stored");

                const { data } = await axios.post(
                    `${API_BASE_URL}/api/auth/refresh`,
                    { refreshToken },
                );

                const newAccessToken: string = data.accessToken;
                const newRefreshToken: string = data.refreshToken;

                await SecureStore.setItemAsync(SECURE_STORE_KEYS.ACCESS_TOKEN, newAccessToken);
                await SecureStore.setItemAsync(SECURE_STORE_KEYS.REFRESH_TOKEN, newRefreshToken);

                apiClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
                processQueue(null, newAccessToken);

                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return apiClient(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                // Clear stored credentials so the app redirects to login
                await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.ACCESS_TOKEN);
                await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.REFRESH_TOKEN);
                await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.USER);
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    },
);

export default apiClient;