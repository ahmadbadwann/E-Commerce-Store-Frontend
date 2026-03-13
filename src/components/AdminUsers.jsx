import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, RefreshCw, AlertCircle, Trash2, X, AlertTriangle, Shield, User } from "lucide-react";
import axios from "../lib/axios";
import toast from "react-hot-toast";

const DeleteConfirmDialog = ({ user, onConfirm, onCancel, isDeleting }) => (
	<div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
		<motion.div
			className='absolute inset-0 bg-black/60 backdrop-blur-sm'
			initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
			onClick={onCancel}
		/>
		<motion.div
			className='relative z-10 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl p-6 w-full max-w-md'
			initial={{ opacity: 0, scale: 0.9, y: 20 }}
			animate={{ opacity: 1, scale: 1, y: 0 }}
			exit={{ opacity: 0, scale: 0.9, y: 20 }}
			transition={{ type: "spring", duration: 0.4 }}
		>
			<button onClick={onCancel} className='absolute top-4 right-4 text-gray-400 hover:text-white'>
				<X size={18} />
			</button>
			<div className='flex items-center justify-center w-14 h-14 bg-red-500/10 rounded-full mx-auto mb-4'>
				<AlertTriangle className='text-red-400' size={28} />
			</div>
			<h3 className='text-lg font-semibold text-white text-center mb-1'>Delete User?</h3>
			<p className='text-gray-400 text-sm text-center mb-5'>
				Are you sure you want to delete{" "}
				<span className='text-white font-medium'>{user.name}</span>?
				<br />
				<span className='text-red-400 text-xs mt-1 block'>This will also remove all their data.</span>
			</p>
			<div className='flex gap-3'>
				<button onClick={onCancel} disabled={isDeleting}
					className='flex-1 px-4 py-2.5 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors text-sm font-medium disabled:opacity-50'>
					Cancel
				</button>
				<button onClick={onConfirm} disabled={isDeleting}
					className='flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-60'>
					{isDeleting ? <><RefreshCw size={14} className='animate-spin' /> Deleting...</> : <><Trash2 size={14} /> Delete</>}
				</button>
			</div>
		</motion.div>
	</div>
);

const AdminUsers = () => {
	const [users, setUsers] = useState([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(null);
	const [userToDelete, setUserToDelete] = useState(null);
	const [isDeleting, setIsDeleting] = useState(false);
	const [search, setSearch] = useState("");

	const fetchUsers = async () => {
		setIsLoading(true);
		setError(null);
		try {
			const res = await axios.get("/auth/users");
			setUsers(res.data);
		} catch (err) {
			setError(err.response?.data?.message || "Failed to load users");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => { fetchUsers(); }, []);

	const handleDeleteConfirm = async () => {
		if (!userToDelete) return;
		setIsDeleting(true);
		try {
			await axios.delete(`/auth/users/${userToDelete._id}`);
			setUsers((prev) => prev.filter((u) => u._id !== userToDelete._id));
			toast.success(`User ${userToDelete.name} deleted`);
			setUserToDelete(null);
		} catch (err) {
			toast.error(err.response?.data?.message || "Failed to delete user");
		} finally {
			setIsDeleting(false);
		}
	};

	const formatDate = (d) => new Date(d).toLocaleDateString("en-GB", {
		day: "2-digit", month: "short", year: "numeric",
	});

	const filtered = users.filter((u) =>
		u.name.toLowerCase().includes(search.toLowerCase()) ||
		u.email.toLowerCase().includes(search.toLowerCase())
	);

	const admins = users.filter((u) => u.role === "admin").length;
	const customers = users.filter((u) => u.role === "customer").length;

	return (
		<>
			<AnimatePresence>
				{userToDelete && (
					<DeleteConfirmDialog
						user={userToDelete}
						onConfirm={handleDeleteConfirm}
						onCancel={() => !isDeleting && setUserToDelete(null)}
						isDeleting={isDeleting}
					/>
				)}
			</AnimatePresence>

			{/* Summary Cards */}
			<div className='grid grid-cols-3 gap-3 mb-6'>
				{[
					{ label: "Total Users", value: users.length, color: "text-white" },
					{ label: "Admins", value: admins, color: "text-emerald-400" },
					{ label: "Customers", value: customers, color: "text-blue-400" },
				].map((card) => (
					<div key={card.label} className='bg-gray-800 rounded-lg p-4 text-center border border-gray-700'>
						<p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
						<p className='text-xs text-gray-400 mt-1'>{card.label}</p>
					</div>
				))}
			</div>

			<motion.div
				className='bg-gray-800 shadow-lg rounded-lg overflow-hidden'
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
			>
				{/* Header */}
				<div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-6 py-4 border-b border-gray-700'>
					<div className='flex items-center gap-3'>
						<Users className='text-emerald-400' size={22} />
						<h2 className='text-xl font-semibold text-emerald-400'>All Users</h2>
						<span className='text-sm text-gray-400 bg-gray-700 px-2 py-0.5 rounded-full'>{filtered.length}</span>
					</div>
					<div className='flex items-center gap-2 w-full sm:w-auto'>
						<input
							type='text'
							placeholder='Search by name or email...'
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className='bg-gray-700 text-white text-sm px-3 py-1.5 rounded-lg border border-gray-600 focus:outline-none focus:border-emerald-500 w-full sm:w-56'
						/>
						<button
							onClick={fetchUsers}
							disabled={isLoading}
							className='flex items-center gap-2 text-sm text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50'
						>
							<RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
						</button>
					</div>
				</div>

				{isLoading && (
					<div className='flex items-center justify-center py-16'>
						<RefreshCw className='animate-spin text-emerald-400' size={28} />
						<span className='ml-3 text-gray-400'>Loading users...</span>
					</div>
				)}

				{error && !isLoading && (
					<div className='flex items-center justify-center gap-3 py-16 text-red-400'>
						<AlertCircle size={22} /><span>{error}</span>
					</div>
				)}

				{!isLoading && !error && filtered.length === 0 && (
					<div className='flex flex-col items-center justify-center py-16 text-gray-500'>
						<Users size={40} className='mb-3 opacity-40' />
						<p>{search ? "No users match your search." : "No users yet."}</p>
					</div>
				)}

				{!isLoading && !error && filtered.length > 0 && (
					<div className='overflow-x-auto'>
						<table className='min-w-full divide-y divide-gray-700'>
							<thead className='bg-gray-700'>
								<tr>
									{["User", "Email", "Role", "Joined", "Cart Items", ""].map((h, i) => (
										<th key={i} className='px-5 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider'>
											{h}
										</th>
									))}
								</tr>
							</thead>
							<tbody className='bg-gray-800 divide-y divide-gray-700'>
								<AnimatePresence>
									{filtered.map((u) => (
										<motion.tr
											key={u._id}
											initial={{ opacity: 0 }}
											animate={{ opacity: 1 }}
											exit={{ opacity: 0, x: -20 }}
											className='hover:bg-gray-700/40 transition-colors'
										>
											<td className='px-5 py-4'>
												<div className='flex items-center gap-3'>
													<div className='w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-sm font-bold'>
														{u.name.charAt(0).toUpperCase()}
													</div>
													<span className='text-white font-medium'>{u.name}</span>
												</div>
											</td>
											<td className='px-5 py-4 text-gray-300 text-sm'>{u.email}</td>
											<td className='px-5 py-4'>
												<span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold w-fit
													${u.role === "admin" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-blue-500/20 text-blue-400 border border-blue-500/30"}`}>
													{u.role === "admin" ? <Shield size={11} /> : <User size={11} />}
													{u.role}
												</span>
											</td>
											<td className='px-5 py-4 text-gray-400 text-sm'>{formatDate(u.createdAt)}</td>
											<td className='px-5 py-4 text-gray-300 text-sm'>{u.cartItems?.length || 0}</td>
											<td className='px-5 py-4'>
												{u.role !== "admin" && (
													<button
														onClick={() => setUserToDelete(u)}
														className='flex items-center gap-1.5 text-xs text-red-400 hover:text-white hover:bg-red-600 border border-red-500/40 hover:border-red-600 px-2.5 py-1.5 rounded-lg transition-all duration-200'
													>
														<Trash2 size={13} /> Delete
													</button>
												)}
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

export default AdminUsers;
