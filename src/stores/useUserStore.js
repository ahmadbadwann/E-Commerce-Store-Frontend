import { create } from "zustand";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";

export const useUserStore = create((set, get) => ({
	user: null,
	loading: false,
	checkingAuth: true,

	signup: async ({ name, email, password, confirmPassword }) => {
		set({ loading: true });

		if (password !== confirmPassword) {
			set({ loading: false });
			return toast.error("Passwords do not match");
		}

		try {
			const res = await axios.post("/auth/signup", { name, email, password });
			// Save tokens to localStorage so they persist on mobile
			localStorage.setItem("accessToken", res.data.accessToken);
			localStorage.setItem("refreshToken", res.data.refreshToken);
			set({ user: res.data, loading: false });
		} catch (error) {
			set({ loading: false });
			toast.error(error.response?.data?.message || "An error occurred");
		}
	},

	login: async (email, password) => {
		set({ loading: true });

		try {
			const res = await axios.post("/auth/login", { email, password });
			// Save tokens to localStorage so they persist on mobile
			localStorage.setItem("accessToken", res.data.accessToken);
			localStorage.setItem("refreshToken", res.data.refreshToken);
			set({ user: res.data, loading: false });
		} catch (error) {
			set({ loading: false });
			toast.error(error.response?.data?.message || "An error occurred");
		}
	},

	logout: async () => {
		try {
			const refreshToken = localStorage.getItem("refreshToken");
			await axios.post("/auth/logout", { refreshToken });
			localStorage.removeItem("accessToken");
			localStorage.removeItem("refreshToken");
			set({ user: null });
		} catch (error) {
			toast.error(error.response?.data?.message || "An error occurred during logout");
		}
	},

	checkAuth: async () => {
		set({ checkingAuth: true });
		const token = localStorage.getItem("accessToken");
		if (!token) {
			set({ checkingAuth: false, user: null });
			return;
		}
		try {
			const response = await axios.get("/auth/profile");
			set({ user: response.data, checkingAuth: false });
		} catch (error) {
			// Try refreshing if 401
			if (error.response?.status === 401) {
				try {
					await get().refreshToken();
					const response = await axios.get("/auth/profile");
					set({ user: response.data, checkingAuth: false });
				} catch {
					localStorage.removeItem("accessToken");
					localStorage.removeItem("refreshToken");
					set({ checkingAuth: false, user: null });
				}
			} else {
				set({ checkingAuth: false, user: null });
			}
		}
	},

	refreshToken: async () => {
		if (get().checkingAuth) return;
		set({ checkingAuth: true });
		try {
			const token = localStorage.getItem("refreshToken");
			if (!token) throw new Error("No refresh token");

			const response = await axios.post("/auth/refresh-token", { refreshToken: token });
			localStorage.setItem("accessToken", response.data.accessToken);
			set({ checkingAuth: false });
			return response.data;
		} catch (error) {
			localStorage.removeItem("accessToken");
			localStorage.removeItem("refreshToken");
			set({ user: null, checkingAuth: false });
			throw error;
		}
	},
}));

// Axios interceptor for automatic token refresh on 401
let refreshPromise = null;

axios.interceptors.response.use(
	(response) => response,
	async (error) => {
		const originalRequest = error.config;
		if (error.response?.status === 401 && !originalRequest._retry) {
			originalRequest._retry = true;

			try {
				if (refreshPromise) {
					await refreshPromise;
					return axios(originalRequest);
				}

				refreshPromise = useUserStore.getState().refreshToken();
				await refreshPromise;
				refreshPromise = null;

				return axios(originalRequest);
			} catch (refreshError) {
				useUserStore.getState().logout();
				return Promise.reject(refreshError);
			}
		}
		return Promise.reject(error);
	}
);
