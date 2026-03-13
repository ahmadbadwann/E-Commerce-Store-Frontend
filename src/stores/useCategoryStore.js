import { create } from "zustand";
import toast from "react-hot-toast";
import axios from "../lib/axios";

export const useCategoryStore = create((set, get) => ({
	categories: [],
	isLoading: false,

	fetchCategories: async () => {
		set({ isLoading: true });
		try {
			const res = await axios.get("/categories");
			set({ categories: res.data, isLoading: false });
		} catch (error) {
			set({ isLoading: false });
			toast.error(error.response?.data?.message || "Failed to fetch categories");
		}
	},

	fetchAllCategoriesAdmin: async () => {
		set({ isLoading: true });
		try {
			const res = await axios.get("/categories/all");
			set({ categories: res.data, isLoading: false });
		} catch (error) {
			set({ isLoading: false });
			toast.error(error.response?.data?.message || "Failed to fetch categories");
		}
	},

	createCategory: async (data) => {
		set({ isLoading: true });
		try {
			const res = await axios.post("/categories", data);
			set((state) => ({
				categories: [res.data, ...state.categories],
				isLoading: false,
			}));
			toast.success("Category created successfully");
			return res.data;
		} catch (error) {
			set({ isLoading: false });
			toast.error(error.response?.data?.message || "Failed to create category");
			throw error;
		}
	},

	updateCategory: async (id, data) => {
		set({ isLoading: true });
		try {
			const res = await axios.put(`/categories/${id}`, data);
			set((state) => ({
				categories: state.categories.map((c) => (c._id === id ? res.data : c)),
				isLoading: false,
			}));
			toast.success("Category updated successfully");
			return res.data;
		} catch (error) {
			set({ isLoading: false });
			toast.error(error.response?.data?.message || "Failed to update category");
			throw error;
		}
	},

	deleteCategory: async (id) => {
		set({ isLoading: true });
		try {
			const res = await axios.delete(`/categories/${id}`);
			set((state) => ({
				categories: state.categories.filter((c) => c._id !== id),
				isLoading: false,
			}));
			toast.success(`Category "${res.data.name}" deleted`);
		} catch (error) {
			set({ isLoading: false });
			toast.error(error.response?.data?.message || "Failed to delete category");
		}
	},
}));
