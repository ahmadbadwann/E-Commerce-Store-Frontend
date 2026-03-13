import { useEffect } from "react";
import CategoryItem from "../components/CategoryItem";
import { useProductStore } from "../stores/useProductStore";
import { useCategoryStore } from "../stores/useCategoryStore";
import FeaturedProducts from "../components/FeaturedProducts";

const HomePage = () => {
	const { fetchFeaturedProducts, products, isLoading } = useProductStore();
	const { categories, fetchCategories } = useCategoryStore();

	useEffect(() => {
		fetchFeaturedProducts();
		fetchCategories();
	}, [fetchFeaturedProducts, fetchCategories]);

	// Map DB category to the shape CategoryItem expects
	const mappedCategories = categories.map((cat) => ({
		href: `/${cat.slug}`,
		name: cat.name,
		imageUrl: cat.imageUrl,
	}));

	return (
		<div className='relative min-h-screen text-white overflow-hidden'>
			<div className='relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16'>
				<h1 className='text-center text-5xl sm:text-6xl font-bold text-emerald-400 mb-4'>
					Explore Our Categories
				</h1>
				<p className='text-center text-xl text-gray-300 mb-12'>
					Discover the latest trends in eco-friendly fashion
				</p>

				<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
					{mappedCategories.map((category) => (
						<CategoryItem category={category} key={category.href} />
					))}
				</div>

				{!isLoading && products.length > 0 && <FeaturedProducts featuredProducts={products} />}
			</div>
		</div>
	);
};
export default HomePage;
