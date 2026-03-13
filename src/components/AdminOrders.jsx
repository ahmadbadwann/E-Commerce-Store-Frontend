import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, RefreshCw, AlertCircle, Trash2, X, AlertTriangle, ChevronDown } from "lucide-react";
import axios from "../lib/axios";
import toast from "react-hot-toast";

const STATUS_COLORS = {
	New: "bg-blue-500 text-white",
	Processing: "bg-yellow-500 text-white",
	Shipped: "bg-purple-500 text-white",
	Delivered: "bg-emerald-500 text-white",
	Cancelled: "bg-red-500 text-white",
};

const ALL_STATUSES = ["New", "Processing", "Shipped", "Delivered", "Cancelled"];

// ── Delete Confirmation Dialog ───────────────────────────────────────────────
const DeleteConfirmDialog = ({ order, onConfirm, onCancel, isDeleting }) => (
	<div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
		<motion.div
			className='absolute inset-0 bg-black/60 backdrop-blur-sm'
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			onClick={onCancel}
		/>
		<motion.div
			className='relative z-10 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl p-6 w-full max-w-md'
			initial={{ opacity: 0, scale: 0.9, y: 20 }}
			animate={{ opacity: 1, scale: 1, y: 0 }}
			exit={{ opacity: 0, scale: 0.9, y: 20 }}
			transition={{ type: "spring", duration: 0.4 }}
		>
			<button onClick={onCancel} className='absolute top-4 right-4 text-gray-400 hover:text-white transition-colors'>
				<X size={18} />
			</button>
			<div className='flex items-center justify-center w-14 h-14 bg-red-500/10 rounded-full mx-auto mb-4'>
				<AlertTriangle className='text-red-400' size={28} />
			</div>
			<h3 className='text-lg font-semibold text-white text-center mb-1'>Delete Order?</h3>
			<p className='text-gray-400 text-sm text-center mb-5'>
				Are you sure you want to permanently delete order{" "}
				<span className='text-emerald-400 font-mono font-semibold'>{order.orderId}</span> for{" "}
				<span className='text-white font-medium'>{order.customerName}</span>?
				<br />
				<span className='text-red-400 text-xs mt-1 block'>This action cannot be undone.</span>
			</p>
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
						<><RefreshCw size={14} className='animate-spin' /> Deleting...</>
					) : (
						<><Trash2 size={14} /> Delete</>
					)}
				</button>
			</div>
		</motion.div>
	</div>
);

// ── Status Dropdown ───────────────────────────────────────────────────────────
const StatusDropdown = ({ orderId, currentStatus, onStatusChange, updatingId }) => {
	const [open, setOpen] = useState(false);
	const isUpdating = updatingId === orderId;

	return (
		<div className='relative'>
			<button
				onClick={() => setOpen((v) => !v)}
				disabled={isUpdating}
				className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all
					${STATUS_COLORS[currentStatus] || "bg-gray-600 text-white"}
					${isUpdating ? "opacity-60 cursor-not-allowed" : "hover:opacity-80 cursor-pointer"}`}
			>
				{isUpdating ? <RefreshCw size={10} className='animate-spin' /> : null}
				{currentStatus}
				<ChevronDown size={12} />
			</button>

			<AnimatePresence>
				{open && (
					<motion.div
						className='absolute z-30 mt-1 left-0 bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden min-w-[140px]'
						initial={{ opacity: 0, y: -6 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -6 }}
						transition={{ duration: 0.15 }}
					>
						{ALL_STATUSES.map((status) => (
							<button
								key={status}
								onClick={() => {
									setOpen(false);
									if (status !== currentStatus) onStatusChange(orderId, status);
								}}
								className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors
									${status === currentStatus
										? "bg-gray-700 text-white cursor-default"
										: "text-gray-300 hover:bg-gray-700 hover:text-white"
									}`}
							>
								<span className={`inline-block w-2 h-2 rounded-full mr-2 ${STATUS_COLORS[status]?.split(" ")[0]}`} />
								{status}
							</button>
						))}
					</motion.div>
				)}
			</AnimatePresence>

			{open && <div className='fixed inset-0 z-20' onClick={() => setOpen(false)} />}
		</div>
	);
};

// ── Main Component ────────────────────────────────────────────────────────────
const AdminOrders = () => {
	const [orders, setOrders] = useState([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(null);
	const [orderToDelete, setOrderToDelete] = useState(null);
	const [isDeleting, setIsDeleting] = useState(false);
	const [updatingId, setUpdatingId] = useState(null);
	const [filterStatus, setFilterStatus] = useState("All");

	const fetchOrders = async () => {
		setIsLoading(true);
		setError(null);
		try {
			const response = await axios.get("/orders");
			setOrders(response.data);
		} catch (err) {
			setError(err.response?.data?.message || "Failed to load orders");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => { fetchOrders(); }, []);

	const handleStatusChange = async (orderId, newStatus) => {
		setUpdatingId(orderId);
		try {
			await axios.patch(`/orders/${orderId}/status`, { status: newStatus });
			setOrders((prev) =>
				prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o))
			);
			toast.success(`Status updated to ${newStatus}`);
		} catch (err) {
			toast.error(err.response?.data?.message || "Failed to update status");
		} finally {
			setUpdatingId(null);
		}
	};

	const handleDeleteConfirm = async () => {
		if (!orderToDelete) return;
		setIsDeleting(true);
		try {
			await axios.delete(`/orders/${orderToDelete._id}`);
			setOrders((prev) => prev.filter((o) => o._id !== orderToDelete._id));
			toast.success(`Order ${orderToDelete.orderId} deleted`);
			setOrderToDelete(null);
		} catch (err) {
			toast.error(err.response?.data?.message || "Failed to delete order");
		} finally {
			setIsDeleting(false);
		}
	};

	const formatDate = (dateStr) => {
		const d = new Date(dateStr);
		return d.toLocaleDateString("en-GB", {
			day: "2-digit", month: "short", year: "numeric",
			hour: "2-digit", minute: "2-digit",
		});
	};

	const filteredOrders = filterStatus === "All"
		? orders
		: orders.filter((o) => o.status === filterStatus);

	// Stats summary
	const stats = ALL_STATUSES.reduce((acc, s) => {
		acc[s] = orders.filter((o) => o.status === s).length;
		return acc;
	}, {});

	return (
		<>
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

			{/* Status Summary Cards */}
			<div className='grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6'>
				{ALL_STATUSES.map((s) => (
					<motion.button
						key={s}
						onClick={() => setFilterStatus(filterStatus === s ? "All" : s)}
						className={`rounded-lg p-3 text-center border transition-all ${
							filterStatus === s
								? "border-emerald-500 bg-emerald-500/10"
								: "border-gray-700 bg-gray-800 hover:border-gray-600"
						}`}
						whileHover={{ scale: 1.02 }}
						whileTap={{ scale: 0.98 }}
					>
						<p className='text-2xl font-bold text-white'>{stats[s]}</p>
						<p className='text-xs text-gray-400 mt-1'>{s}</p>
					</motion.button>
				))}
			</div>

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
							{filteredOrders.length}
						</span>
					</div>
					<div className='flex items-center gap-3'>
						{filterStatus !== "All" && (
							<button
								onClick={() => setFilterStatus("All")}
								className='text-xs text-gray-400 hover:text-white bg-gray-700 px-2 py-1 rounded-lg transition-colors'
							>
								Clear filter
							</button>
						)}
						<button
							onClick={fetchOrders}
							disabled={isLoading}
							className='flex items-center gap-2 text-sm text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50'
						>
							<RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
							Refresh
						</button>
					</div>
				</div>

				{isLoading && (
					<div className='flex items-center justify-center py-16'>
						<RefreshCw className='animate-spin text-emerald-400' size={28} />
						<span className='ml-3 text-gray-400'>Loading orders...</span>
					</div>
				)}

				{error && !isLoading && (
					<div className='flex items-center justify-center gap-3 py-16 text-red-400'>
						<AlertCircle size={22} /><span>{error}</span>
					</div>
				)}

				{!isLoading && !error && filteredOrders.length === 0 && (
					<div className='flex flex-col items-center justify-center py-16 text-gray-500'>
						<ShoppingCart size={40} className='mb-3 opacity-40' />
						<p>{filterStatus !== "All" ? `No ${filterStatus} orders.` : "No orders yet."}</p>
					</div>
				)}

				{!isLoading && !error && filteredOrders.length > 0 && (
					<div className='overflow-x-auto'>
						<table className='min-w-full divide-y divide-gray-700'>
							<thead className='bg-gray-700'>
								<tr>
									{["Order ID", "Customer", "Phone", "Total", "Status", "Date", ""].map((h, i) => (
										<th key={i} className='px-5 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider'>
											{h}
										</th>
									))}
								</tr>
							</thead>
							<tbody className='bg-gray-800 divide-y divide-gray-700'>
								<AnimatePresence>
									{filteredOrders.map((order) => (
										<motion.tr
											key={order._id}
											initial={{ opacity: 0 }}
											animate={{ opacity: 1 }}
											exit={{ opacity: 0, x: -20 }}
											className='hover:bg-gray-700/40 transition-colors'
										>
											<td className='px-5 py-4'>
												<span className='font-mono text-sm text-emerald-400'>{order.orderId}</span>
											</td>
											<td className='px-5 py-4 text-white'>{order.customerName}</td>
											<td className='px-5 py-4 text-gray-300 text-sm'>{order.phone}</td>
											<td className='px-5 py-4 text-emerald-400 font-semibold'>
												${order.totalAmount.toFixed(2)}
											</td>
											<td className='px-5 py-4'>
												<StatusDropdown
													orderId={order._id}
													currentStatus={order.status}
													onStatusChange={handleStatusChange}
													updatingId={updatingId}
												/>
											</td>
											<td className='px-5 py-4 text-gray-400 text-sm whitespace-nowrap'>
												{formatDate(order.createdAt)}
											</td>
											<td className='px-5 py-4'>
												<button
													onClick={() => setOrderToDelete(order)}
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
