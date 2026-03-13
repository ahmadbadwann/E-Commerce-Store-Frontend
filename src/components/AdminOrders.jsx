import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, RefreshCw, AlertCircle, Trash2, X, AlertTriangle } from "lucide-react";
import axios from "../lib/axios";
import toast from "react-hot-toast";

const STATUS_COLORS = {
	New: "bg-blue-500 text-white",
	Processing: "bg-yellow-500 text-white",
	Shipped: "bg-purple-500 text-white",
	Delivered: "bg-emerald-500 text-white",
	Cancelled: "bg-red-500 text-white",
};

// ── Confirmation Dialog ──────────────────────────────────────────────────────
const DeleteConfirmDialog = ({ order, onConfirm, onCancel, isDeleting }) => (
	<div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
		{/* Backdrop */}
		<motion.div
			className='absolute inset-0 bg-black/60 backdrop-blur-sm'
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			onClick={onCancel}
		/>

		{/* Dialog */}
		<motion.div
			className='relative z-10 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl p-6 w-full max-w-md'
			initial={{ opacity: 0, scale: 0.9, y: 20 }}
			animate={{ opacity: 1, scale: 1, y: 0 }}
			exit={{ opacity: 0, scale: 0.9, y: 20 }}
			transition={{ type: "spring", duration: 0.4 }}
		>
			{/* Close button */}
			<button
				onClick={onCancel}
				className='absolute top-4 right-4 text-gray-400 hover:text-white transition-colors'
			>
				<X size={18} />
			</button>

			{/* Icon */}
			<div className='flex items-center justify-center w-14 h-14 bg-red-500/10 rounded-full mx-auto mb-4'>
				<AlertTriangle className='text-red-400' size={28} />
			</div>

			{/* Text */}
			<h3 className='text-lg font-semibold text-white text-center mb-1'>Delete Order?</h3>
			<p className='text-gray-400 text-sm text-center mb-5'>
				Are you sure you want to permanently delete order{" "}
				<span className='text-emerald-400 font-mono font-semibold'>{order.orderId}</span> for{" "}
				<span className='text-white font-medium'>{order.customerName}</span>?
				<br />
				<span className='text-red-400 text-xs mt-1 block'>This action cannot be undone.</span>
			</p>

			{/* Actions */}
			<div className='flex gap-3'>
				<button
					onClick={onCancel}
					disabled={isDeleting}
					className='flex-1 px-4 py-2.5 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors text-sm font-medium disabled:opacity-50'
				>
					Cancel
				</button>
				<button
					onClick={onConfirm}
					disabled={isDeleting}
					className='flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-60'
				>
					{isDeleting ? (
						<>
							<RefreshCw size={14} className='animate-spin' />
							Deleting...
						</>
					) : (
						<>
							<Trash2 size={14} />
							Delete
						</>
					)}
				</button>
			</div>
		</motion.div>
	</div>
);

// ── Main Component ────────────────────────────────────────────────────────────
const AdminOrders = () => {
	const [orders, setOrders] = useState([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(null);
	const [orderToDelete, setOrderToDelete] = useState(null); // order object | null
	const [isDeleting, setIsDeleting] = useState(false);

	const fetchOrders = async () => {
		setIsLoading(true);
		setError(null);
		try {
			const response = await axios.get("/orders");
			setOrders(response.data);
		} catch (err) {
			console.error("Error fetching orders:", err);
			setError(err.response?.data?.message || "Failed to load orders");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchOrders();
	}, []);

	const handleDeleteConfirm = async () => {
		if (!orderToDelete) return;
		setIsDeleting(true);
		try {
			await axios.delete(`/orders/${orderToDelete._id}`);
			setOrders((prev) => prev.filter((o) => o._id !== orderToDelete._id));
			toast.success(`Order ${orderToDelete.orderId} deleted`);
			setOrderToDelete(null);
		} catch (err) {
			console.error("Error deleting order:", err);
			toast.error(err.response?.data?.message || "Failed to delete order");
		} finally {
			setIsDeleting(false);
		}
	};

	const formatDate = (dateStr) => {
		const d = new Date(dateStr);
		return d.toLocaleDateString("en-GB", {
			day: "2-digit",
			month: "short",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	return (
		<>
			{/* Confirmation Dialog */}
			<AnimatePresence>
				{orderToDelete && (
					<DeleteConfirmDialog
						order={orderToDelete}
						onConfirm={handleDeleteConfirm}
						onCancel={() => !isDeleting && setOrderToDelete(null)}
						isDeleting={isDeleting}
					/>
				)}
			</AnimatePresence>

			<motion.div
				className='bg-gray-800 shadow-lg rounded-lg overflow-hidden'
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
			>
				{/* Header */}
				<div className='flex items-center justify-between px-6 py-4 border-b border-gray-700'>
					<div className='flex items-center gap-3'>
						<ShoppingCart className='text-emerald-400' size={22} />
						<h2 className='text-xl font-semibold text-emerald-400'>All Orders</h2>
						<span className='text-sm text-gray-400 bg-gray-700 px-2 py-0.5 rounded-full'>
							{orders.length}
						</span>
					</div>
					<button
						onClick={fetchOrders}
						disabled={isLoading}
						className='flex items-center gap-2 text-sm text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50'
					>
						<RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
						Refresh
					</button>
				</div>

				{/* Loading */}
				{isLoading && (
					<div className='flex items-center justify-center py-16'>
						<RefreshCw className='animate-spin text-emerald-400' size={28} />
						<span className='ml-3 text-gray-400'>Loading orders...</span>
					</div>
				)}

				{/* Error */}
				{error && !isLoading && (
					<div className='flex items-center justify-center gap-3 py-16 text-red-400'>
						<AlertCircle size={22} />
						<span>{error}</span>
					</div>
				)}

				{/* Empty */}
				{!isLoading && !error && orders.length === 0 && (
					<div className='flex flex-col items-center justify-center py-16 text-gray-500'>
						<ShoppingCart size={40} className='mb-3 opacity-40' />
						<p>No orders yet.</p>
					</div>
				)}

				{/* Table */}
				{!isLoading && !error && orders.length > 0 && (
					<div className='overflow-x-auto'>
						<table className='min-w-full divide-y divide-gray-700'>
							<thead className='bg-gray-700'>
								<tr>
									{["Order ID", "Customer", "Phone", "Total", "Status", "Date", ""].map(
										(h, i) => (
											<th
												key={i}
												className='px-5 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider'
											>
												{h}
											</th>
										)
									)}
								</tr>
							</thead>
							<tbody className='bg-gray-800 divide-y divide-gray-700'>
								<AnimatePresence>
									{orders.map((order) => (
										<motion.tr
											key={order._id}
											initial={{ opacity: 0 }}
											animate={{ opacity: 1 }}
											exit={{ opacity: 0, x: -20 }}
											className='hover:bg-gray-700/40 transition-colors'
										>
											<td className='px-5 py-4'>
												<span className='font-mono text-sm text-emerald-400'>
													{order.orderId}
												</span>
											</td>
											<td className='px-5 py-4 text-white'>{order.customerName}</td>
											<td className='px-5 py-4 text-gray-300 text-sm'>{order.phone}</td>
											<td className='px-5 py-4 text-emerald-400 font-semibold'>
												${order.totalAmount.toFixed(2)}
											</td>
											<td className='px-5 py-4'>
												<span
													className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
														STATUS_COLORS[order.status] || "bg-gray-600 text-white"
													}`}
												>
													{order.status}
												</span>
											</td>
											<td className='px-5 py-4 text-gray-400 text-sm whitespace-nowrap'>
												{formatDate(order.createdAt)}
											</td>
											{/* Delete button */}
											<td className='px-5 py-4'>
												<button
													onClick={() => setOrderToDelete(order)}
													title='Delete order'
													className='flex items-center gap-1.5 text-xs text-red-400 hover:text-white hover:bg-red-600 border border-red-500/40 hover:border-red-600 px-2.5 py-1.5 rounded-lg transition-all duration-200'
												>
													<Trash2 size={13} />
													Delete
												</button>
											</td>
										</motion.tr>
									))}
								</AnimatePresence>
							</tbody>
						</table>
					</div>
				)}
			</motion.div>
		</>
	);
};

export default AdminOrders;
