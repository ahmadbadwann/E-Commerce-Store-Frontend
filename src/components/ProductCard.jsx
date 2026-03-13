import toast from "react-hot-toast";
import { ShoppingCart, Loader } from "lucide-react";
import { useUserStore } from "../stores/useUserStore";
import { useCartStore } from "../stores/useCartStore";
import { Link } from "react-router-dom";

const ProductCard = ({ product }) => {
	const { user } = useUserStore();
	const { addToCart, loadingItems } = useCartStore();
	const isLoading = loadingItems[product._id];

	const handleAddToCart = (e) => {
		e.preventDefault();
		if (!user) {
			toast.error("Please login to add products to cart", { id: "login" });
			return;
		}
		addToCart(product);
	};

	return (
		<Link to={`/product/${product._id}`} className='flex w-full relative flex-col overflow-hidden rounded-lg border border-gray-700 shadow-lg hover:border-emerald-500/50 transition-colors duration-200'>
			<div className='relative mx-3 mt-3 flex overflow-hidden rounded-xl bg-gray-800'>
				<img className='object-contain w-full h-60' src={product.image} alt='product image' />
				<div className='absolute inset-0 bg-black bg-opacity-20' />
			</div>

			<div className='mt-4 px-5 pb-5'>
				<h5 className='text-xl font-semibold tracking-tight text-white'>{product.name}</h5>
				<div className='mt-2 mb-5 flex items-center justify-between'>
					<p>
						<span className='text-3xl font-bold text-emerald-400'>${product.price}</span>
					</p>
				</div>
				<button
					className='flex items-center justify-center rounded-lg bg-emerald-600 px-5 py-2.5 text-center text-sm font-medium
					text-white hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-300
					disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200'
					onClick={handleAddToCart}
					disabled={isLoading}
				>
					{isLoading
						? <><Loader size={22} className='mr-2 animate-spin' /> Adding...</>
						: <><ShoppingCart size={22} className='mr-2' /> Add to cart</>
					}
				</button>
			</div>
		</Link>
	);
};
export default ProductCard;
