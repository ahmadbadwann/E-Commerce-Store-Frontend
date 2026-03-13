import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	LayoutGrid, Plus, Pencil, Trash2, X, Check,
	RefreshCw, Upload, AlertTriangle, Eye, EyeOff,
} from "lucide-react";
import { useCategoryStore } from "../stores/useCategoryStore";

// ─── helpers ────────────────────────────────────────────────────────────────
const makeSlug = (name) =>
	name.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^\w-]/g, "");

const inputCls =
	"w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500";

// ─── Category Form (used for both Create & Edit) ─────────────────────────────
const CategoryForm = ({ initial, onSubmit, onCancel, isLoading, title }) => {
	const [form, setForm] = useState(
		initial || { name: "", slug: "", imageUrl: "" }
	);
	const [preview, setPreview] = useState(initial?.imageUrl || "");
	const [slugLocked, setSlugLocked] = useState(!!initial);

	const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

	const handleName = (v) => {
		set("name", v);
		if (!slugLocked) set("slug", makeSlug(v));
	};

	const handleImage = (e) => {
		const file = e.target.files[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onloadend = () => {
			set("imageUrl", reader.result);
			setPreview(reader.result);
		};
		reader.readAsDataURL(file);
	};

	const handleSubmit = () => {
		if (!form.name.trim() || !form.imageUrl) return;
		onSubmit({ ...form, slug: form.slug || makeSlug(form.name) });
	};

	return (
		<motion.div
			className="bg-gray-750 border border-gray-700 rounded-xl p-5 space-y-4"
			initial={{ opacity: 0, y: -10 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -10 }}
		>
			<h3 className="text-emerald-400 font-semibold text-base">{title}</h3>

			{/* Name */}
			<div>
				<label className="text-xs text-gray-400 mb-1 block">Category Name *</label>
				<input
					className={inputCls}
					placeholder="e.g. T-Shirts"
					value={form.name}
					onChange={(e) => handleName(e.target.value)}
				/>
			</div>

			{/* Slug */}
			<div>
				<label className="text-xs text-gray-400 mb-1 flex items-center justify-between">
					<span>URL Slug *</span>
					<button
						type="button"
						className="text-emerald-400 text-xs hover:underline"
						onClick={() => setSlugLocked((v) => !v)}
					>
						{slugLocked ? "Unlock to edit" : "Lock"}
					</button>
				</label>
				<input
					className={inputCls + (slugLocked ? " opacity-60 cursor-not-allowed" : "")}
					placeholder="e.g. t-shirts"
					value={form.slug}
					readOnly={slugLocked}
					onChange={(e) => set("slug", e.target.value.toLowerCase().replace(/\s/g, "-"))}
				/>
				<p className="text-xs text-gray-500 mt-1">
					Used in URL: /category/<span className="text-emerald-400">{form.slug || "..."}</span>
				</p>
			</div>

			{/* Image */}
			<div>
				<label className="text-xs text-gray-400 mb-1 block">Category Image *</label>
				<div className="flex items-center gap-3">
					<label className="cursor-pointer flex items-center gap-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 text-gray-300 text-sm px-3 py-2 rounded-lg transition-colors">
						<Upload size={14} />
						{preview ? "Change Image" : "Upload Image"}
						<input type="file" className="sr-only" accept="image/*" onChange={handleImage} />
					</label>
					{preview && (
						<img
							src={preview}
							alt="preview"
							className="h-10 w-10 rounded-lg object-cover border border-gray-600"
						/>
					)}
				</div>
			</div>

			{/* Actions */}
			<div className="flex gap-3 pt-1">
				<button
					onClick={handleSubmit}
					disabled={isLoading || !form.name.trim() || !form.imageUrl}
					className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
				>
					{isLoading ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
					{title.startsWith("Edit") ? "Save Changes" : "Create Category"}
				</button>
				<button
					onClick={onCancel}
					className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm px-4 py-2 rounded-lg transition-colors"
				>
					<X size={14} /> Cancel
				</button>
			</div>
		</motion.div>
	);
};

// ─── Delete Confirm ───────────────────────────────────────────────────────────
const DeleteDialog = ({ category, onConfirm, onCancel, isLoading }) => (
	<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
		<motion.div
			className="absolute inset-0 bg-black/60 backdrop-blur-sm"
			initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
			onClick={onCancel}
		/>
		<motion.div
			className="relative z-10 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl p-6 w-full max-w-sm"
			initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
		>
			<div className="flex items-center justify-center w-12 h-12 bg-red-500/10 rounded-full mx-auto mb-4">
				<AlertTriangle className="text-red-400" size={24} />
			</div>
			<h3 className="text-white font-semibold text-center mb-1">Delete Category?</h3>
			<p className="text-gray-400 text-sm text-center mb-5">
				Delete <span className="text-white font-medium">"{category.name}"</span>? This won't delete the products inside it.
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

// ─── Main Component ───────────────────────────────────────────────────────────
const AdminCategories = () => {
	const { categories, isLoading, fetchAllCategoriesAdmin, createCategory, updateCategory, deleteCategory } =
		useCategoryStore();

	const [showCreateForm, setShowCreateForm] = useState(false);
	const [editingId, setEditingId] = useState(null);
	const [deletingCategory, setDeletingCategory] = useState(null);
	const [deleteLoading, setDeleteLoading] = useState(false);

	useEffect(() => {
		fetchAllCategoriesAdmin();
	}, [fetchAllCategoriesAdmin]);

	const handleCreate = async (data) => {
		try {
			await createCategory(data);
			setShowCreateForm(false);
		} catch { /* toast shown in store */ }
	};

	const handleUpdate = async (data) => {
		try {
			await updateCategory(editingId, data);
			setEditingId(null);
		} catch { /* toast shown in store */ }
	};

	const handleDelete = async () => {
		if (!deletingCategory) return;
		setDeleteLoading(true);
		await deleteCategory(deletingCategory._id);
		setDeleteLoading(false);
		setDeletingCategory(null);
	};

	const handleToggleActive = async (cat) => {
		await updateCategory(cat._id, { isActive: !cat.isActive });
	};

	return (
		<>
			<AnimatePresence>
				{deletingCategory && (
					<DeleteDialog
						category={deletingCategory}
						onConfirm={handleDelete}
						onCancel={() => !deleteLoading && setDeletingCategory(null)}
						isLoading={deleteLoading}
					/>
				)}
			</AnimatePresence>

			<motion.div
				className="space-y-5"
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.4 }}
			>
				{/* Header */}
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<LayoutGrid className="text-emerald-400" size={22} />
						<h2 className="text-xl font-semibold text-emerald-400">Categories</h2>
						<span className="text-sm text-gray-400 bg-gray-700 px-2 py-0.5 rounded-full">
							{categories.length}
						</span>
					</div>
					<button
						onClick={() => { setShowCreateForm((v) => !v); setEditingId(null); }}
						className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-4 py-2 rounded-lg transition-colors"
					>
						{showCreateForm ? <X size={15} /> : <Plus size={15} />}
						{showCreateForm ? "Cancel" : "Add Category"}
					</button>
				</div>

				{/* Create Form */}
				<AnimatePresence>
					{showCreateForm && (
						<CategoryForm
							title="New Category"
							onSubmit={handleCreate}
							onCancel={() => setShowCreateForm(false)}
							isLoading={isLoading}
						/>
					)}
				</AnimatePresence>

				{/* Loading */}
				{isLoading && categories.length === 0 && (
					<div className="flex justify-center py-16">
						<RefreshCw className="animate-spin text-emerald-400" size={28} />
					</div>
				)}

				{/* Empty */}
				{!isLoading && categories.length === 0 && !showCreateForm && (
					<div className="flex flex-col items-center py-16 text-gray-500">
						<LayoutGrid size={40} className="mb-3 opacity-30" />
						<p>No categories yet. Create one above.</p>
					</div>
				)}

				{/* Grid */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
					<AnimatePresence>
						{categories.map((cat) => (
							<motion.div
								key={cat._id}
								layout
								initial={{ opacity: 0, scale: 0.95 }}
								animate={{ opacity: 1, scale: 1 }}
								exit={{ opacity: 0, scale: 0.9 }}
								className={`bg-gray-800 border rounded-xl overflow-hidden ${
									cat.isActive ? "border-gray-700" : "border-gray-700 opacity-60"
								}`}
							>
								{/* Edit Form inline */}
								{editingId === cat._id ? (
									<div className="p-4">
										<CategoryForm
											title={`Edit "${cat.name}"`}
											initial={{ name: cat.name, slug: cat.slug, imageUrl: cat.imageUrl }}
											onSubmit={handleUpdate}
											onCancel={() => setEditingId(null)}
											isLoading={isLoading}
										/>
									</div>
								) : (
									<>
										{/* Image */}
										<div className="relative h-40 overflow-hidden">
											<img
												src={cat.imageUrl}
												alt={cat.name}
												className="w-full h-full object-cover"
											/>
											<div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent" />
											<div className="absolute bottom-0 left-0 right-0 p-3">
												<p className="text-white font-bold text-lg leading-tight">{cat.name}</p>
												<p className="text-gray-300 text-xs font-mono">/{cat.slug}</p>
											</div>
											{!cat.isActive && (
												<div className="absolute top-2 right-2 bg-red-500/80 text-white text-xs px-2 py-0.5 rounded-full">
													Hidden
												</div>
											)}
										</div>

										{/* Actions */}
										<div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-gray-700">
											{/* Toggle visibility */}
											<button
												onClick={() => handleToggleActive(cat)}
												title={cat.isActive ? "Hide from store" : "Show in store"}
												className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
													cat.isActive
														? "text-emerald-400 border-emerald-500/40 hover:bg-emerald-600 hover:text-white hover:border-emerald-600"
														: "text-gray-400 border-gray-600 hover:bg-gray-600 hover:text-white"
												}`}
											>
												{cat.isActive ? <Eye size={13} /> : <EyeOff size={13} />}
												{cat.isActive ? "Visible" : "Hidden"}
											</button>

											<div className="flex gap-2">
												{/* Edit */}
												<button
													onClick={() => { setEditingId(cat._id); setShowCreateForm(false); }}
													className="flex items-center gap-1.5 text-xs text-blue-400 border border-blue-500/40 hover:bg-blue-600 hover:text-white hover:border-blue-600 px-2.5 py-1.5 rounded-lg transition-colors"
												>
													<Pencil size={13} /> Edit
												</button>
												{/* Delete */}
												<button
													onClick={() => setDeletingCategory(cat)}
													className="flex items-center gap-1.5 text-xs text-red-400 border border-red-500/40 hover:bg-red-600 hover:text-white hover:border-red-600 px-2.5 py-1.5 rounded-lg transition-colors"
												>
													<Trash2 size={13} /> Delete
												</button>
											</div>
										</div>
									</>
								)}
							</motion.div>
						))}
					</AnimatePresence>
				</div>
			</motion.div>
		</>
	);
};

export default AdminCategories;
