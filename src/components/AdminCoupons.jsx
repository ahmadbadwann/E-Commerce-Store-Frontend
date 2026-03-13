import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	Tag, Plus, Trash2, X, Check, RefreshCw,
	AlertTriangle, ToggleLeft, ToggleRight, Globe, User,
} from "lucide-react";
import axios from "../lib/axios";
import toast from "react-hot-toast";

// ─── helpers ────────────────────────────────────────────────────────────────
const inputCls =
	"w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500";

const formatDate = (d) =>
	new Date(d).toLocaleDateString("en-GB", {
		day: "2-digit", month: "short", year: "numeric",
	});

const isExpired = (d) => new Date(d) < new Date();

// ─── Create Form ─────────────────────────────────────────────────────────────
const CreateCouponForm = ({ onCreated, onCancel, isLoading }) => {
	const [form, setForm] = useState({
		code: "",
		discountPercentage: "",
		expirationDate: "",
		userId: "",
	});

	const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

	const handleSubmit = () => {
		if (!form.code.trim() || !form.discountPercentage || !form.expirationDate) {
			toast.error("Please fill in all required fields");
			return;
		}
		onCreated({
			...form,
			code: form.code.trim().toUpperCase(),
			discountPercentage: Number(form.discountPercentage),
			userId: form.userId.trim() || undefined,
		});
	};

	return (
		<motion.div
			className="bg-gray-700/50 border border-gray-600 rounded-xl p-5 space-y-4"
			initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
		>
			<h3 className="text-emerald-400 font-semibold">New Coupon</h3>

			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div>
					<label className="text-xs text-gray-400 mb-1 block">Code *</label>
					<input className={inputCls} placeholder="e.g. SAVE20"
						value={form.code} onChange={(e) => set("code", e.target.value.toUpperCase())} />
				</div>
				<div>
					<label className="text-xs text-gray-400 mb-1 block">Discount % *</label>
					<input className={inputCls} type="number" min="1" max="100" placeholder="e.g. 20"
						value={form.discountPercentage} onChange={(e) => set("discountPercentage", e.target.value)} />
				</div>
				<div>
					<label className="text-xs text-gray-400 mb-1 block">Expiration Date *</label>
					<input className={inputCls} type="date"
						value={form.expirationDate} onChange={(e) => set("expirationDate", e.target.value)} />
				</div>
				<div>
					<label className="text-xs text-gray-400 mb-1 flex items-center gap-1">
						<span>User ID</span>
						<span className="text-gray-500">(leave empty = global)</span>
					</label>
					<input className={inputCls} placeholder="MongoDB ObjectId (optional)"
						value={form.userId} onChange={(e) => set("userId", e.target.value)} />
				</div>
			</div>

			<div className="flex gap-3 pt-1">
				<button onClick={handleSubmit} disabled={isLoading}
					className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-50">
					{isLoading ? <RefreshCw size={13} className="animate-spin" /> : <Check size={13} />}
					Create
				</button>
				<button onClick={onCancel}
					className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm px-4 py-2 rounded-lg transition-colors">
					<X size={13} /> Cancel
				</button>
			</div>
		</motion.div>
	);
};

// ─── Delete Dialog ───────────────────────────────────────────────────────────
const DeleteDialog = ({ coupon, onConfirm, onCancel, isLoading }) => (
	<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
		<motion.div className="absolute inset-0 bg-black/60 backdrop-blur-sm"
			initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
			onClick={onCancel} />
		<motion.div className="relative z-10 bg-gray-800 border border-gray-700 rounded-xl p-6 w-full max-w-sm shadow-2xl"
			initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
			<div className="flex justify-center mb-4">
				<div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center">
					<AlertTriangle className="text-red-400" size={22} />
				</div>
			</div>
			<h3 className="text-white font-semibold text-center mb-1">Delete Coupon?</h3>
			<p className="text-gray-400 text-sm text-center mb-5">
				Permanently delete coupon <span className="text-white font-mono font-semibold">{coupon.code}</span>?
			</p>
			<div className="flex gap-3">
				<button onClick={onCancel} disabled={isLoading}
					className="flex-1 py-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 text-sm transition-colors disabled:opacity-50">
					Cancel
				</button>
				<button onClick={onConfirm} disabled={isLoading}
					className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 text-sm transition-colors disabled:opacity-60">
					{isLoading ? <RefreshCw size={13} className="animate-spin" /> : <Trash2 size={13} />}
					Delete
				</button>
			</div>
		</motion.div>
	</div>
);

// ─── Main ────────────────────────────────────────────────────────────────────
const AdminCoupons = () => {
	const [coupons, setCoupons] = useState([]);
	const [isLoading, setIsLoading] = useState(false);
	const [showCreate, setShowCreate] = useState(false);
	const [creating, setCreating] = useState(false);
	const [deletingCoupon, setDeletingCoupon] = useState(null);
	const [deleteLoading, setDeleteLoading] = useState(false);

	const fetchCoupons = async () => {
		setIsLoading(true);
		try {
			const res = await axios.get("/coupons/all");
			setCoupons(res.data);
		} catch (err) {
			toast.error(err.response?.data?.message || "Failed to load coupons");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => { fetchCoupons(); }, []);

	const handleCreate = async (data) => {
		setCreating(true);
		try {
			const res = await axios.post("/coupons/admin", data);
			setCoupons((prev) => [res.data, ...prev]);
			toast.success(`Coupon "${res.data.code}" created`);
			setShowCreate(false);
		} catch (err) {
			toast.error(err.response?.data?.message || "Failed to create coupon");
		} finally {
			setCreating(false);
		}
	};

	const handleToggle = async (coupon) => {
		try {
			const res = await axios.put(`/coupons/admin/${coupon._id}`, { isActive: !coupon.isActive });
			setCoupons((prev) => prev.map((c) => (c._id === coupon._id ? res.data : c)));
			toast.success(`Coupon ${res.data.isActive ? "activated" : "deactivated"}`);
		} catch (err) {
			toast.error(err.response?.data?.message || "Failed to update coupon");
		}
	};

	const handleDelete = async () => {
		if (!deletingCoupon) return;
		setDeleteLoading(true);
		try {
			await axios.delete(`/coupons/admin/${deletingCoupon._id}`);
			setCoupons((prev) => prev.filter((c) => c._id !== deletingCoupon._id));
			toast.success(`Coupon "${deletingCoupon.code}" deleted`);
			setDeletingCoupon(null);
		} catch (err) {
			toast.error(err.response?.data?.message || "Failed to delete coupon");
		} finally {
			setDeleteLoading(false);
		}
	};

	return (
		<>
			<AnimatePresence>
				{deletingCoupon && (
					<DeleteDialog coupon={deletingCoupon}
						onConfirm={handleDelete}
						onCancel={() => !deleteLoading && setDeletingCoupon(null)}
						isLoading={deleteLoading} />
				)}
			</AnimatePresence>

			<motion.div className="space-y-5"
				initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

				{/* Header */}
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<Tag className="text-emerald-400" size={22} />
						<h2 className="text-xl font-semibold text-emerald-400">Coupons</h2>
						<span className="text-sm text-gray-400 bg-gray-700 px-2 py-0.5 rounded-full">
							{coupons.length}
						</span>
					</div>
					<button onClick={() => setShowCreate((v) => !v)}
						className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-4 py-2 rounded-lg transition-colors">
						{showCreate ? <X size={15} /> : <Plus size={15} />}
						{showCreate ? "Cancel" : "New Coupon"}
					</button>
				</div>

				{/* Create form */}
				<AnimatePresence>
					{showCreate && (
						<CreateCouponForm onCreated={handleCreate} onCancel={() => setShowCreate(false)} isLoading={creating} />
					)}
				</AnimatePresence>

				{/* Loading */}
				{isLoading && (
					<div className="flex justify-center py-16">
						<RefreshCw className="animate-spin text-emerald-400" size={28} />
					</div>
				)}

				{/* Empty */}
				{!isLoading && coupons.length === 0 && !showCreate && (
					<div className="flex flex-col items-center py-16 text-gray-500">
						<Tag size={40} className="mb-3 opacity-30" />
						<p>No coupons yet.</p>
					</div>
				)}

				{/* Table */}
				{!isLoading && coupons.length > 0 && (
					<div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
						<div className="overflow-x-auto">
							<table className="min-w-full divide-y divide-gray-700">
								<thead className="bg-gray-700">
									<tr>
										{["Code", "Discount", "Expires", "Type", "Status", "Actions"].map((h) => (
											<th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
												{h}
											</th>
										))}
									</tr>
								</thead>
								<tbody className="divide-y divide-gray-700">
									<AnimatePresence>
										{coupons.map((c) => (
											<motion.tr key={c._id}
												initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -20 }}
												className="hover:bg-gray-700/40 transition-colors">
												{/* Code */}
												<td className="px-5 py-4">
													<span className="font-mono font-bold text-emerald-400">{c.code}</span>
												</td>
												{/* Discount */}
												<td className="px-5 py-4">
													<span className="text-white font-semibold">{c.discountPercentage}%</span>
												</td>
												{/* Expiry */}
												<td className="px-5 py-4">
													<span className={`text-sm ${isExpired(c.expirationDate) ? "text-red-400" : "text-gray-300"}`}>
														{formatDate(c.expirationDate)}
														{isExpired(c.expirationDate) && <span className="ml-1 text-xs">(expired)</span>}
													</span>
												</td>
												{/* Type */}
												<td className="px-5 py-4">
													{c.userId ? (
														<span className="flex items-center gap-1 text-xs text-blue-400">
															<User size={12} /> Personal
														</span>
													) : (
														<span className="flex items-center gap-1 text-xs text-purple-400">
															<Globe size={12} /> Global
														</span>
													)}
												</td>
												{/* Status */}
												<td className="px-5 py-4">
													<button onClick={() => handleToggle(c)}
														className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors ${
															c.isActive
																? "text-emerald-400 border-emerald-500/40 hover:bg-emerald-600 hover:text-white"
																: "text-gray-400 border-gray-600 hover:bg-gray-600 hover:text-white"
														}`}>
														{c.isActive
															? <><ToggleRight size={14} /> Active</>
															: <><ToggleLeft size={14} /> Inactive</>}
													</button>
												</td>
												{/* Actions */}
												<td className="px-5 py-4">
													<button onClick={() => setDeletingCoupon(c)}
														className="flex items-center gap-1.5 text-xs text-red-400 border border-red-500/40 hover:bg-red-600 hover:text-white hover:border-red-600 px-2.5 py-1.5 rounded-lg transition-colors">
														<Trash2 size={13} /> Delete
													</button>
												</td>
											</motion.tr>
										))}
									</AnimatePresence>
								</tbody>
							</table>
						</div>
					</div>
				)}
			</motion.div>
		</>
	);
};

export default AdminCoupons;
