import { motion } from "framer-motion";
import { useCartStore } from "../stores/useCartStore";
import { Link } from "react-router-dom";
import { MoveRight, MessageCircle, Loader } from "lucide-react";
import { useState } from "react";
import axios from "../lib/axios";
import toast from "react-hot-toast";

const OrderSummary = () => {
	const { total, subtotal, coupon, isCouponApplied, cart, clearCart } = useCartStore();

	const [name, setName] = useState("");
	const [phone, setPhone] = useState("");
	const [address, setAddress] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const savings = subtotal - total;
	const formattedSubtotal = subtotal.toFixed(2);
	const formattedTotal = total.toFixed(2);
	const formattedSavings = savings.toFixed(2);

	// The WhatsApp number that will receive the orders
	const WHATSAPP_NUMBER = "970566548430";

	const handleWhatsAppOrder = async () => {
		if (!name.trim() || !phone.trim() || !address.trim()) {
			toast.error("Please fill in all fields (name, phone, address)");
			return;
		}

		if (cart.length === 0) {
			toast.error("Your cart is empty");
			return;
		}

		setIsLoading(true);

		try {
			// 1. Save the order in MongoDB
			const response = await axios.post("/orders", {
				name: name.trim(),
				phone: phone.trim(),
				address: address.trim(),
				cart,
				total: parseFloat(formattedTotal),
			});

			const order = response.data;

			// 2. Build the WhatsApp message
			let message = `🛒 *New Order*%0A`;
			message += `━━━━━━━━━━━━━━━━━━━━%0A`;
			message += `🔖 *Order ID:* ${order.orderId}%0A`;
			message += `👤 *Customer:* ${order.customerName}%0A`;
			message += `📞 *Phone:* ${order.phone}%0A`;
			message += `📍 *Address:* ${order.address}%0A`;
			message += `━━━━━━━━━━━━━━━━━━━━%0A`;
			message += `📦 *Products:*%0A`;

			order.products.forEach((item, index) => {
				message += `%0A${index + 1}. *${item.name}*%0A`;
				message += `   • Qty: ${item.quantity}%0A`;
				message += `   • Price: $${item.price.toFixed(2)}%0A`;
				if (item.image) {
					message += `   • Image: ${item.image}%0A`;
				}
			});

			message += `━━━━━━━━━━━━━━━━━━━━%0A`;
			message += `💰 *Total: $${order.totalAmount.toFixed(2)}*%0A`;
			message += `━━━━━━━━━━━━━━━━━━━━`;

			// 3. Open WhatsApp
			const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
			window.location.href = url;

			// 4. Clear the cart and reset form
			await clearCart();
			setName("");
			setPhone("");
			setAddress("");

			toast.success(`Order ${order.orderId} placed successfully!`);
		} catch (error) {
			console.error("Error placing order:", error);
			toast.error(error.response?.data?.message || "Failed to place order. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<motion.div
			className='space-y-4 rounded-lg border border-gray-700 bg-gray-800 p-4 shadow-sm sm:p-6'
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
		>
			<p className='text-xl font-semibold text-emerald-400'>Order Summary</p>

			{/* Customer info fields */}
			<div className='space-y-3'>
				<div>
					<label className='block text-sm text-gray-400 mb-1'>Full Name</label>
					<input
						type='text'
						placeholder='Enter your full name'
						value={name}
						onChange={(e) => setName(e.target.value)}
						className='w-full rounded-lg bg-gray-700 border border-gray-600 p-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500'
					/>
				</div>

				<div>
					<label className='block text-sm text-gray-400 mb-1'>Phone Number</label>
					<input
						type='tel'
						placeholder='e.g. +970599000000'
						value={phone}
						onChange={(e) => setPhone(e.target.value)}
						className='w-full rounded-lg bg-gray-700 border border-gray-600 p-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500'
					/>
				</div>

				<div>
					<label className='block text-sm text-gray-400 mb-1'>Delivery Address</label>
					<textarea
						rows={2}
						placeholder='Street, City, Country'
						value={address}
						onChange={(e) => setAddress(e.target.value)}
						className='w-full rounded-lg bg-gray-700 border border-gray-600 p-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none'
					/>
				</div>
			</div>

			{/* Price breakdown */}
			<div className='space-y-2'>
				<dl className='flex justify-between'>
					<dt className='text-gray-300'>Original price</dt>
					<dd className='text-white'>${formattedSubtotal}</dd>
				</dl>

				{savings > 0 && (
					<dl className='flex justify-between'>
						<dt className='text-gray-300'>Savings</dt>
						<dd className='text-emerald-400'>-${formattedSavings}</dd>
					</dl>
				)}

				{coupon && isCouponApplied && (
					<dl className='flex justify-between'>
						<dt className='text-gray-300'>Coupon ({coupon.code})</dt>
						<dd className='text-emerald-400'>-{coupon.discountPercentage}%</dd>
					</dl>
				)}

				<dl className='flex justify-between border-t border-gray-600 pt-2'>
					<dt className='text-white font-bold'>Total</dt>
					<dd className='text-emerald-400 font-bold'>${formattedTotal}</dd>
				</dl>
			</div>

			{/* WhatsApp order button */}
			<motion.button
				className='flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-white font-semibold hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors'
				whileHover={{ scale: isLoading ? 1 : 1.02 }}
				whileTap={{ scale: isLoading ? 1 : 0.98 }}
				onClick={handleWhatsAppOrder}
				disabled={isLoading}
			>
				{isLoading ? (
					<>
						<Loader size={18} className='animate-spin' />
						Placing Order...
					</>
				) : (
					<>
						<MessageCircle size={18} />
						Order via WhatsApp
					</>
				)}
			</motion.button>

			<div className='flex items-center justify-center gap-2'>
				<span className='text-gray-400 text-sm'>or</span>
				<Link
					to='/'
					className='inline-flex items-center gap-1 text-sm text-emerald-400 underline hover:text-emerald-300'
				>
					Continue Shopping
					<MoveRight size={14} />
				</Link>
			</div>
		</motion.div>
	);
};

export default OrderSummary;
