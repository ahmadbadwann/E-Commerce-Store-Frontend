import { create } from "zustand";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";

// Debounce map to track pending requests per product
const pendingRequests = new Map();

export const useCartStore = create((set, get) => ({
	cart: [],
	coupon: null,
	total: 0,
	subtotal: 0,
	isCouponApplied: false,
	loadingItems: {}, // tracks which productIds are being added

	getMyCoupon: async () => {
		try {
			const response = await axios.get("/coupons");
			set({ coupon: response.data });
		} catch (error) {
			console.error("Error fetching coupon:", error);
		}
	},
	applyCoupon: async (code) => {
		try {
			const response = await axios.post("/coupons/validate", { code });
			set({ coupon: response.data, isCouponApplied: true });
			get().calculateTotals();
			toast.success("Coupon applied successfully");
		} catch (error) {
			toast.error(error.response?.data?.message || "Failed to apply coupon");
		}
	},
	removeCoupon: () => {
		set({ coupon: null, isCouponApplied: false });
		get().calculateTotals();
		toast.success("Coupon removed");
	},

	getCartItems: async () => {
		try {
			const res = await axios.get("/cart");
			set({ cart: res.data });
			get().calculateTotals();
		} catch (error) {
			set({ cart: [] });
			toast.error(error.response.data.message || "An error occurred");
		}
	},
	clearCart: async () => {
		set({ cart: [], coupon: null, total: 0, subtotal: 0 });
	},

	addToCart: async (product) => {
		const productId = product._id;

		// If already loading this product, ignore the click
		if (get().loadingItems[productId]) return;

		// If there's a pending debounce for this product, clear it
		if (pendingRequests.has(productId)) {
			clearTimeout(pendingRequests.get(productId));
		}

		// Mark as loading immediately
		set((state) => ({
			loadingItems: { ...state.loadingItems, [productId]: true },
		}));

		// Optimistically update UI right away
		set((prevState) => {
			const existingItem = prevState.cart.find((item) => item._id === productId);
			const newCart = existingItem
				? prevState.cart.map((item) =>
						item._id === productId ? { ...item, quantity: item.quantity + 1 } : item
				  )
				: [...prevState.cart, { ...product, quantity: 1 }];
			return { cart: newCart };
		});
		get().calculateTotals();

		// Debounce the actual API call by 400ms
		const timeoutId = setTimeout(async () => {
			try {
				await axios.post("/cart", { productId });
				toast.success("Product added to cart");
			} catch (error) {
				// Revert optimistic update on failure
				set((prevState) => {
					const existingItem = prevState.cart.find((item) => item._id === productId);
					if (!existingItem) return prevState;
					const newCart =
						existingItem.quantity <= 1
							? prevState.cart.filter((item) => item._id !== productId)
							: prevState.cart.map((item) =>
									item._id === productId ? { ...item, quantity: item.quantity - 1 } : item
							  );
					return { cart: newCart };
				});
				get().calculateTotals();
				toast.error(error.response?.data?.message || "An error occurred");
			} finally {
				set((state) => {
					const updated = { ...state.loadingItems };
					delete updated[productId];
					return { loadingItems: updated };
				});
				pendingRequests.delete(productId);
			}
		}, 400);

		pendingRequests.set(productId, timeoutId);
	},

	removeFromCart: async (productId) => {
		await axios.delete(`/cart`, { data: { productId } });
		set((prevState) => ({ cart: prevState.cart.filter((item) => item._id !== productId) }));
		get().calculateTotals();
	},
	updateQuantity: async (productId, quantity) => {
		if (quantity === 0) {
			get().removeFromCart(productId);
			return;
		}
		await axios.put(`/cart/${productId}`, { quantity });
		set((prevState) => ({
			cart: prevState.cart.map((item) => (item._id === productId ? { ...item, quantity } : item)),
		}));
		get().calculateTotals();
	},
	calculateTotals: () => {
		const { cart, coupon, isCouponApplied } = get();
		const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
		let total = subtotal;
		if (coupon && isCouponApplied) {
			const discount = subtotal * (coupon.discountPercentage / 100);
			total = subtotal - discount;
		}
		set({ subtotal, total });
	},
}));
