import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import axios from "../lib/axios";
import { Users, Package, ShoppingCart, DollarSign, TrendingUp } from "lucide-react";
import {
	LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
	Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const AnalyticsTab = () => {
	const [analyticsData, setAnalyticsData] = useState({
		users: 0, products: 0, totalSales: 0, totalRevenue: 0,
	});
	const [isLoading, setIsLoading] = useState(true);
	const [dailySalesData, setDailySalesData] = useState([]);
	const [chartType, setChartType] = useState("line"); // "line" | "bar"

	useEffect(() => {
		const fetchAnalyticsData = async () => {
			try {
				const response = await axios.get("/analytics");
				setAnalyticsData(response.data.analyticsData);
				setDailySalesData(response.data.dailySalesData);
			} catch (error) {
				console.error("Error fetching analytics data:", error);
			} finally {
				setIsLoading(false);
			}
		};
		fetchAnalyticsData();
	}, []);

	if (isLoading) {
		return (
			<div className='flex flex-col gap-6 animate-pulse'>
				<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
					{[...Array(4)].map((_, i) => (
						<div key={i} className='bg-gray-800 rounded-lg h-32' />
					))}
				</div>
				<div className='bg-gray-800 rounded-lg h-96' />
			</div>
		);
	}

	// Calculate revenue growth (last day vs previous day)
	const lastTwo = dailySalesData.slice(-2);
	const revenueGrowth = lastTwo.length === 2 && lastTwo[0].revenue > 0
		? (((lastTwo[1].revenue - lastTwo[0].revenue) / lastTwo[0].revenue) * 100).toFixed(1)
		: null;

	const CustomTooltip = ({ active, payload, label }) => {
		if (active && payload && payload.length) {
			return (
				<div className='bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl'>
					<p className='text-gray-400 text-xs mb-2'>{label}</p>
					{payload.map((p) => (
						<p key={p.name} className='text-sm font-semibold' style={{ color: p.color }}>
							{p.name}: {p.name === "Revenue" ? `$${p.value.toLocaleString()}` : p.value}
						</p>
					))}
				</div>
			);
		}
		return null;
	};

	return (
		<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
			{/* Stats Cards */}
			<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
				<AnalyticsCard title='Total Users' value={analyticsData.users.toLocaleString()} icon={Users} color='from-emerald-500 to-teal-700' />
				<AnalyticsCard title='Total Products' value={analyticsData.products.toLocaleString()} icon={Package} color='from-emerald-500 to-green-700' />
				<AnalyticsCard title='Total Sales' value={analyticsData.totalSales.toLocaleString()} icon={ShoppingCart} color='from-emerald-500 to-cyan-700' />
				<AnalyticsCard title='Total Revenue' value={`$${analyticsData.totalRevenue.toLocaleString()}`} icon={DollarSign} color='from-emerald-500 to-lime-700' />
			</div>

			{/* Revenue Growth Badge */}
			{revenueGrowth !== null && (
				<motion.div
					className={`flex items-center gap-2 mb-4 px-4 py-2 rounded-lg w-fit text-sm font-medium
						${parseFloat(revenueGrowth) >= 0 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}
					initial={{ opacity: 0, x: -10 }}
					animate={{ opacity: 1, x: 0 }}
				>
					<TrendingUp size={16} />
					Revenue {parseFloat(revenueGrowth) >= 0 ? "+" : ""}{revenueGrowth}% vs yesterday
				</motion.div>
			)}

			{/* Chart */}
			<motion.div
				className='bg-gray-800/60 rounded-lg p-6 shadow-lg'
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, delay: 0.25 }}
			>
				{/* Chart Header */}
				<div className='flex items-center justify-between mb-6'>
					<h3 className='text-white font-semibold text-lg'>Sales & Revenue (Last 7 Days)</h3>
					<div className='flex items-center gap-1 bg-gray-700 rounded-lg p-1'>
						<button
							onClick={() => setChartType("line")}
							className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
								chartType === "line" ? "bg-emerald-600 text-white" : "text-gray-400 hover:text-white"
							}`}
						>
							Line
						</button>
						<button
							onClick={() => setChartType("bar")}
							className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
								chartType === "bar" ? "bg-emerald-600 text-white" : "text-gray-400 hover:text-white"
							}`}
						>
							Bar
						</button>
					</div>
				</div>

				<ResponsiveContainer width='100%' height={380}>
					{chartType === "line" ? (
						<LineChart data={dailySalesData}>
							<CartesianGrid strokeDasharray='3 3' stroke='#374151' />
							<XAxis dataKey='name' stroke='#9CA3AF' tick={{ fontSize: 12 }} />
							<YAxis yAxisId='left' stroke='#9CA3AF' tick={{ fontSize: 12 }} />
							<YAxis yAxisId='right' orientation='right' stroke='#9CA3AF' tick={{ fontSize: 12 }} />
							<Tooltip content={<CustomTooltip />} />
							<Legend wrapperStyle={{ color: "#9CA3AF", fontSize: "13px" }} />
							<Line yAxisId='left' type='monotone' dataKey='sales' stroke='#10B981' strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 7 }} name='Sales' />
							<Line yAxisId='right' type='monotone' dataKey='revenue' stroke='#3B82F6' strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 7 }} name='Revenue' />
						</LineChart>
					) : (
						<BarChart data={dailySalesData}>
							<CartesianGrid strokeDasharray='3 3' stroke='#374151' />
							<XAxis dataKey='name' stroke='#9CA3AF' tick={{ fontSize: 12 }} />
							<YAxis yAxisId='left' stroke='#9CA3AF' tick={{ fontSize: 12 }} />
							<YAxis yAxisId='right' orientation='right' stroke='#9CA3AF' tick={{ fontSize: 12 }} />
							<Tooltip content={<CustomTooltip />} />
							<Legend wrapperStyle={{ color: "#9CA3AF", fontSize: "13px" }} />
							<Bar yAxisId='left' dataKey='sales' fill='#10B981' radius={[4, 4, 0, 0]} name='Sales' opacity={0.9} />
							<Bar yAxisId='right' dataKey='revenue' fill='#3B82F6' radius={[4, 4, 0, 0]} name='Revenue' opacity={0.9} />
						</BarChart>
					)}
				</ResponsiveContainer>
			</motion.div>
		</div>
	);
};
export default AnalyticsTab;

const AnalyticsCard = ({ title, value, icon: Icon, color }) => (
	<motion.div
		className={`bg-gray-800 rounded-lg p-6 shadow-lg overflow-hidden relative ${color}`}
		initial={{ opacity: 0, y: 20 }}
		animate={{ opacity: 1, y: 0 }}
		transition={{ duration: 0.5 }}
		whileHover={{ scale: 1.02 }}
	>
		<div className='flex justify-between items-center'>
			<div className='z-10'>
				<p className='text-emerald-300 text-sm mb-1 font-semibold'>{title}</p>
				<h3 className='text-white text-3xl font-bold'>{value}</h3>
			</div>
		</div>
		<div className='absolute inset-0 bg-gradient-to-br from-emerald-600 to-emerald-900 opacity-30' />
		<div className='absolute -bottom-4 -right-4 text-emerald-800 opacity-50'>
			<Icon className='h-32 w-32' />
		</div>
	</motion.div>
);
