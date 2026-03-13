import { ShoppingCart, UserPlus, LogIn, LogOut, Lock, Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { useUserStore } from "../stores/useUserStore";
import { useCartStore } from "../stores/useCartStore";
import { useEffect, useRef, useState } from "react";
import axios from "../lib/axios";
import { motion, AnimatePresence } from "framer-motion";

// ── Notification Bell (Admin only) ───────────────────────────────────────────
const NotificationBell = () => {
	const [notifications, setNotifications] = useState([]);
	const [open, setOpen] = useState(false);
	const [seen, setSeen] = useState(() => {
		try { return JSON.parse(localStorage.getItem("seen_order_ids") || "[]"); }
		catch { return []; }
	});
	const ref = useRef(null);

	const fetchNewOrders = async () => {
		try {
			const res = await axios.get("/orders");
			// Show last 5 orders as notifications
			const latest = res.data.slice(0, 5).map((o) => ({
				id: o._id,
				orderId: o.orderId,
				customer: o.customerName,
				amount: o.totalAmount,
				status: o.status,
				time: o.createdAt,
			}));
			setNotifications(latest);
		} catch (err) {
			// silent
		}
	};

	useEffect(() => {
		fetchNewOrders();
		const interval = setInterval(fetchNewOrders, 30000); // poll every 30s
		return () => clearInterval(interval);
	}, []);

	// Close on outside click
	useEffect(() => {
		const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, []);

	const unseenCount = notifications.filter((n) => !seen.includes(n.id)).length;

	const markAllSeen = () => {
		const ids = notifications.map((n) => n.id);
		setSeen(ids);
		localStorage.setItem("seen_order_ids", JSON.stringify(ids));
	};

	const timeAgo = (dateStr) => {
		const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
		if (diff < 60) return `${diff}s ago`;
		if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
		if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
		return `${Math.floor(diff / 86400)}d ago`;
	};

	return (
		<div className='relative' ref={ref}>
			<button
				onClick={() => { setOpen((v) => !v); if (!open) markAllSeen(); }}
				className='relative p-2 text-gray-300 hover:text-white transition-colors'
				title='Notifications'
			>
				<Bell size={20} />
				{unseenCount > 0 && (
					<motion.span
						initial={{ scale: 0 }}
						animate={{ scale: 1 }}
						className='absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center'
					>
						{unseenCount}
					</motion.span>
				)}
			</button>

			<AnimatePresence>
				{open && (
					<motion.div
						initial={{ opacity: 0, y: -8, scale: 0.95 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: -8, scale: 0.95 }}
						transition={{ duration: 0.15 }}
						className='absolute right-0 mt-2 w-80 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden'
					>
						<div className='flex items-center justify-between px-4 py-3 border-b border-gray-700'>
							<h3 className='text-sm font-semibold text-white'>Recent Orders</h3>
							<button onClick={fetchNewOrders} className='text-xs text-emerald-400 hover:text-emerald-300 transition-colors'>
								Refresh
							</button>
						</div>

						{notifications.length === 0 ? (
							<div className='px-4 py-8 text-center text-gray-500 text-sm'>No recent orders</div>
						) : (
							<div className='max-h-72 overflow-y-auto'>
								{notifications.map((n) => (
									<div key={n.id} className='px-4 py-3 border-b border-gray-800 hover:bg-gray-800 transition-colors'>
										<div className='flex items-start justify-between gap-2'>
											<div>
												<p className='text-sm font-medium text-white'>{n.customer}</p>
												<p className='text-xs text-emerald-400 font-mono'>{n.orderId}</p>
											</div>
											<div className='text-right shrink-0'>
												<p className='text-sm font-semibold text-emerald-400'>${n.amount.toFixed(2)}</p>
												<p className='text-xs text-gray-500'>{timeAgo(n.time)}</p>
											</div>
										</div>
										<span className={`mt-1.5 inline-block text-xs px-2 py-0.5 rounded-full font-medium
											${n.status === "New" ? "bg-blue-500/20 text-blue-400" :
											  n.status === "Delivered" ? "bg-emerald-500/20 text-emerald-400" :
											  "bg-gray-700 text-gray-300"}`}>
											{n.status}
										</span>
									</div>
								))}
							</div>
						)}

						<div className='px-4 py-3 border-t border-gray-700'>
							<Link
								to='/secret-dashboard'
								onClick={() => setOpen(false)}
								className='text-xs text-emerald-400 hover:text-emerald-300 transition-colors'
							>
								View all orders →
							</Link>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
};

// ── Main Navbar ───────────────────────────────────────────────────────────────
const Navbar = () => {
	const { user, logout } = useUserStore();
	const isAdmin = user?.role === "admin";
	const { cart } = useCartStore();

	return (
		<header className='fixed top-0 left-0 w-full bg-gray-900 bg-opacity-90 backdrop-blur-md shadow-lg z-40 transition-all duration-300 border-b border-emerald-800'>
			<div className='container mx-auto px-4 py-3'>
				<div className='flex flex-wrap justify-between items-center'>
					<Link to='/' className='text-2xl font-bold text-emerald-400 items-center space-x-2 flex'>
						E-Commerce
					</Link>

					<nav className='flex flex-wrap items-center gap-4'>
						<Link to={"/"} className='text-gray-300 hover:text-emerald-400 transition duration-300 ease-in-out'>
							Home
						</Link>
						{user && (
							<Link to={"/cart"}
								className='relative group text-gray-300 hover:text-emerald-400 transition duration-300 ease-in-out'>
								<ShoppingCart className='inline-block mr-1 group-hover:text-emerald-400' size={20} />
								<span className='hidden sm:inline'>Cart</span>
								{cart.length > 0 && (
									<span className='absolute -top-2 -left-2 bg-emerald-500 text-white rounded-full px-2 py-0.5 text-xs group-hover:bg-emerald-400 transition duration-300 ease-in-out'>
										{cart.length}
									</span>
								)}
							</Link>
						)}
						{isAdmin && (
							<>
								<NotificationBell />
								<Link
									className='bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-1 rounded-md font-medium transition duration-300 ease-in-out flex items-center'
									to={"/secret-dashboard"}
								>
									<Lock className='inline-block mr-1' size={18} />
									<span className='hidden sm:inline'>Dashboard</span>
								</Link>
							</>
						)}
						{user ? (
							<button
								className='bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-md flex items-center transition duration-300 ease-in-out'
								onClick={logout}
							>
								<LogOut size={18} />
								<span className='hidden sm:inline ml-2'>Log Out</span>
							</button>
						) : (
							<>
								<Link to={"/signup"}
									className='bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-md flex items-center transition duration-300 ease-in-out'>
									<UserPlus className='mr-2' size={18} />
									Sign Up
								</Link>
								<Link to={"/login"}
									className='bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-md flex items-center transition duration-300 ease-in-out'>
									<LogIn className='mr-2' size={18} />
									Login
								</Link>
							</>
						)}
					</nav>
				</div>
			</div>
		</header>
	);
};
export default Navbar;
