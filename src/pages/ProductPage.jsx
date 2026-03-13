import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShoppingCart, ArrowLeft, Tag, Star, CheckCircle, Package } from "lucide-react";
import axios from "../lib/axios";
import { useCartStore } from "../stores/useCartStore";
import { useUserStore } from "../stores/useUserStore";
import toast from "react-hot-toast";
import LoadingSpinner from "../components/LoadingSpinner";

const ProductPage = () => {
	const { id } = useParams();
	const navigate = useNavigate();
	const { user } = useUserStore();
	const { addToCart } = useCartStore();

	const [product, setProduct] = useState(null);
	const [relatedProducts, setRelatedProducts] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [quantity, setQuantity] = useState(1);
	const [addedToCart, setAddedToCart] = useState(false);

	useEffect(() => {
		const fetchProduct = async () => {
			setIsLoading(true);
			try {
				const res = await axios.get(`/products/${id}`);
				setProduct(res.data);

				// Fetch related products from same category
				const relRes = await axios.get(`/products/category/${res.data.category}`);
				setRelatedProducts(
					(relRes.data.products || []).filter((p) => p._id !== id).slice(0, 4)
				);
			} catch (err) {
				toast.error("Product not found");
				navigate("/");
			} finally {
				setIsLoading(false);
			}
		};
		fetchProduct();
	}, [id, navigate]);

	const handleAddToCart = () => {
		if (!user) {
			toast.error("Please login to add products to cart", { id: "login" });
			return;
		}
		for (let i = 0; i < quantity; i++) {
			addToCart(product);
		}
		setAddedToCart(true);
		setTimeout(() => setAddedToCart(false), 2000);
	};

	if (isLoading) return <LoadingSpinner />;
	if (!product) return null;

	return (
		<div className='min-h-screen'>
			<div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10'>

				{/* Breadcrumb */}
				<motion.div
					className='flex items-center gap-2 text-sm text-gray-400 mb-8'
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
				>
					<Link to='/' className='hover:text-emerald-400 transition-colors'>Home</Link>
					<span>/</span>
					<Link to={`/category/${product.category}`} className='hover:text-emerald-400 transition-colors capitalize'>
						{product.category}
					</Link>
					<span>/</span>
					<span className='text-white truncate max-w-[200px]'>{product.name}</span>
				</motion.div>

				{/* Back Button */}
				<motion.button
					onClick={() => navigate(-1)}
					className='flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors group'
					initial={{ opacity: 0, x: -10 }}
					animate={{ opacity: 1, x: 0 }}
				>
					<ArrowLeft size={18} className='group-hover:-translate-x-1 transition-transform' />
					Back
				</motion.button>

				{/* Main Product Section */}
				<div className='grid grid-cols-1 lg:grid-cols-2 gap-12'>

					{/* Product Image */}
					<motion.div
						className='relative'
						initial={{ opacity: 0, x: -30 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.5 }}
					>
						<div className='rounded-2xl overflow-hidden bg-gray-800 border border-gray-700'>
							<img
								src={product.image}
								alt={product.name}
								className='w-full object-contain max-h-[500px]'
							/>
						</div>
						{product.isFeatured && (
							<div className='absolute top-4 left-4 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1'>
								<Star size={12} fill='white' />
								Featured
							</div>
						)}
					</motion.div>

					{/* Product Info */}
					<motion.div
						className='flex flex-col justify-between'
						initial={{ opacity: 0, x: 30 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.5 }}
					>
						<div>
							{/* Category Badge */}
							<Link
								to={`/category/${product.category}`}
								className='inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-3 py-1 rounded-full mb-4 hover:bg-emerald-400/20 transition-colors capitalize'
							>
								<Tag size={12} />
								{product.category}
							</Link>

							{/* Name */}
							<h1 className='text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight'>
								{product.name}
							</h1>

							{/* Price */}
							<div className='flex items-baseline gap-3 mb-6'>
								<span className='text-4xl font-bold text-emerald-400'>
									${product.price.toFixed(2)}
								</span>
							</div>

							{/* Description */}
							<div className='mb-8'>
								<h3 className='text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2'>Description</h3>
								<p className='text-gray-300 leading-relaxed text-base'>{product.description}</p>
							</div>

							{/* Features */}
							<div className='grid grid-cols-2 gap-3 mb-8'>
								{[
									{ icon: Package, text: "Free Shipping" },
									{ icon: CheckCircle, text: "Quality Guaranteed" },
									{ icon: CheckCircle, text: "Easy Returns" },
									{ icon: CheckCircle, text: "Secure Payment" },
								].map(({ icon: Icon, text }) => (
									<div key={text} className='flex items-center gap-2 text-sm text-gray-400'>
										<Icon size={15} className='text-emerald-400 shrink-0' />
										{text}
									</div>
								))}
							</div>
						</div>

						{/* Quantity + Add to Cart */}
						<div className='space-y-4'>
							{/* Quantity Selector */}
							<div className='flex items-center gap-4'>
								<span className='text-sm text-gray-400 font-medium'>Quantity</span>
								<div className='flex items-center bg-gray-800 border border-gray-700 rounded-lg overflow-hidden'>
									<button
										onClick={() => setQuantity((q) => Math.max(1, q - 1))}
										className='px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 transition-colors text-lg font-bold'
									>
										−
									</button>
									<span className='px-5 py-2 text-white font-semibold min-w-[48px] text-center'>
										{quantity}
									</span>
									<button
										onClick={() => setQuantity((q) => q + 1)}
										className='px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 transition-colors text-lg font-bold'
									>
										+
									</button>
								</div>
							</div>

							{/* Add to Cart Button */}
							<motion.button
								onClick={handleAddToCart}
								className={`w-full flex items-center justify-center gap-3 py-4 rounded-xl text-base font-semibold transition-all duration-300
									${addedToCart
										? "bg-green-500 text-white"
										: "bg-emerald-600 hover:bg-emerald-500 text-white"
									}`}
								whileTap={{ scale: 0.97 }}
							>
								{addedToCart ? (
									<><CheckCircle size={20} /> Added to Cart!</>
								) : (
									<><ShoppingCart size={20} /> Add to Cart</>
								)}
							</motion.button>
						</div>
					</motion.div>
				</div>

				{/* Related Products */}
				{relatedProducts.length > 0 && (
					<motion.div
						className='mt-20'
						initial={{ opacity: 0, y: 30 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, delay: 0.3 }}
					>
						<h2 className='text-2xl font-bold text-white mb-6'>Related Products</h2>
						<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5'>
							{relatedProducts.map((p) => (
								<motion.div
									key={p._id}
									whileHover={{ y: -4 }}
									transition={{ duration: 0.2 }}
								>
									<Link to={`/product/${p._id}`}
										className='block bg-gray-800 border border-gray-700 rounded-xl overflow-hidden hover:border-emerald-500/50 transition-colors'>
										<div className='bg-gray-700 h-48 overflow-hidden'>
											<img
												src={p.image}
												alt={p.name}
												className='w-full h-full object-contain hover:scale-105 transition-transform duration-300'
											/>
										</div>
										<div className='p-4'>
											<h3 className='text-white font-medium truncate mb-1'>{p.name}</h3>
											<span className='text-emerald-400 font-bold'>${p.price.toFixed(2)}</span>
										</div>
									</Link>
								</motion.div>
							))}
						</div>
					</motion.div>
				)}

			</div>
		</div>
	);
};

export default ProductPage;
