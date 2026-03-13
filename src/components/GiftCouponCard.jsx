import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Tag, X, CheckCircle, Loader } from "lucide-react";
import { useCartStore } from "../stores/useCartStore";

const GiftCouponCard = () => {
	const [inputCode, setInputCode] = useState("");
	const [isApplying, setIsApplying] = useState(false);

	const { coupon, isCouponApplied, applyCoupon, removeCoupon } = useCartStore();

	const handleApply = async () => {
		const code = inputCode.trim().toUpperCase();
		if (!code) return;
		setIsApplying(true);
		await applyCoupon(code);
		setIsApplying(false);
	};

	const handleRemove = () => {
		removeCoupon();
		setInputCode("");
	};

	const handleKeyDown = (e) => {
		if (e.key === "Enter") handleApply();
	};

	return (
		<motion.div
			className='rounded-lg border border-gray-700 bg-gray-800 p-4 shadow-sm sm:p-6 space-y-4'
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5, delay: 0.2 }}
		>
			{/* Title */}
			<div className='flex items-center gap-2 text-gray-300'>
				<Tag size={18} className='text-emerald-400' />
				<span className='text-sm font-medium'>Discount Coupon</span>
			</div>

			{/* Applied state */}
			<AnimatePresence mode='wait'>
				{isCouponApplied && coupon ? (
					<motion.div
						key='applied'
						initial={{ opacity: 0, y: -8 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -8 }}
						className='flex items-center justify-between bg-emerald-900/30 border border-emerald-600/40 rounded-lg px-4 py-3'
					>
						<div className='flex items-center gap-3'>
							<CheckCircle size={18} className='text-emerald-400 flex-shrink-0' />
							<div>
								<p className='text-white font-mono font-semibold text-sm'>{coupon.code}</p>
								<p className='text-emerald-400 text-xs'>{coupon.discountPercentage}% discount applied</p>
							</div>
						</div>
						<button
							onClick={handleRemove}
							className='text-gray-400 hover:text-red-400 transition-colors p-1 rounded'
							title='Remove coupon'
						>
							<X size={16} />
						</button>
					</motion.div>
				) : (
					<motion.div
						key='input'
						initial={{ opacity: 0, y: -8 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -8 }}
						className='flex gap-2'
					>
						<input
							type='text'
							placeholder='Enter coupon code'
							value={inputCode}
							onChange={(e) => setInputCode(e.target.value.toUpperCase())}
							onKeyDown={handleKeyDown}
							className='flex-1 rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-sm
							text-white placeholder-gray-400 uppercase tracking-widest
							focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500'
						/>
						<motion.button
							onClick={handleApply}
							disabled={isApplying || !inputCode.trim()}
							whileHover={{ scale: 1.03 }}
							whileTap={{ scale: 0.97 }}
							className='flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm
							font-medium text-white hover:bg-emerald-700 disabled:opacity-50 
							disabled:cursor-not-allowed transition-colors'
						>
							{isApplying ? (
								<Loader size={14} className='animate-spin' />
							) : (
								"Apply"
							)}
						</motion.button>
					</motion.div>
				)}
			</AnimatePresence>
		</motion.div>
	);
};

export default GiftCouponCard;
