import { useState, useEffect } from 'react';
import { ArrowRight, Zap, Smartphone, TrendingUp, Star, Menu, X } from 'react-feather';

export default function Marketing() {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [scrolled, setScrolled] = useState(false);

	useEffect(() => {
		const handleScroll = () => {
			setScrolled(window.scrollY > 50);
		};
		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	}, []);

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950">
			{/* Navigation */}
			<nav
				className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
					scrolled
						? 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg shadow-lg'
						: 'bg-transparent'
				}`}
			>
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between items-center h-16 md:h-20">
						<div className="flex items-center space-x-2">
							<div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
								<Zap className="w-5 h-5 md:w-6 md:h-6 text-white" />
							</div>
							<span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
								MagikVibez
							</span>
						</div>

						{/* Desktop Menu */}
						<div className="hidden md:flex items-center space-x-8">
							<a href="#features" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
								Features
							</a>
							<a href="#services" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
								Services
							</a>
							<a href="#testimonials" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
								Testimonials
							</a>
							<button className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full hover:shadow-lg hover:scale-105 transition-all duration-300">
								Get Started
							</button>
						</div>

						{/* Mobile Menu Button */}
						<button
							onClick={() => setIsMenuOpen(!isMenuOpen)}
							className="md:hidden p-2 text-gray-700 dark:text-gray-300"
						>
							{isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
						</button>
					</div>

					{/* Mobile Menu */}
					{isMenuOpen && (
						<div className="md:hidden pb-4 space-y-3 animate-fade-in">
							<a
								href="#features"
								className="block py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
								onClick={() => setIsMenuOpen(false)}
							>
								Features
							</a>
							<a
								href="#services"
								className="block py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
								onClick={() => setIsMenuOpen(false)}
							>
								Services
							</a>
							<a
								href="#testimonials"
								className="block py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
								onClick={() => setIsMenuOpen(false)}
							>
								Testimonials
							</a>
							<button className="w-full px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full hover:shadow-lg transition-all duration-300">
								Get Started
							</button>
						</div>
					)}
				</div>
			</nav>

			{/* Hero Section */}
			<section className="relative pt-24 md:pt-32 pb-16 md:pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
				<div className="absolute inset-0 overflow-hidden">
					<div className="absolute top-1/4 -left-32 w-64 h-64 md:w-96 md:h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
					<div className="absolute bottom-1/4 -right-32 w-64 h-64 md:w-96 md:h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
				</div>

				<div className="max-w-7xl mx-auto relative z-10">
					<div className="text-center space-y-6 md:space-y-8">
						<div className="inline-flex items-center px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-700 dark:text-blue-300 text-sm md:text-base animate-fade-in">
							<Zap className="w-4 h-4 mr-2" />
							Innovation meets simplicity
						</div>

						<h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white leading-tight animate-slide-up">
							Transform Your
							<br />
							<span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
								Digital Experience
							</span>
						</h1>

						<p className="text-lg sm:text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto animate-slide-up delay-200">
							Build amazing web applications with cutting-edge technology and beautiful design
						</p>

						<div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up delay-300">
							<button className="group w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center justify-center">
								<span className="font-semibold">Start Building</span>
								<ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
							</button>
							<button className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-full border border-gray-200 dark:border-slate-700 hover:shadow-xl hover:scale-105 transition-all duration-300">
								Watch Demo
							</button>
						</div>

						<div className="pt-8 md:pt-12 animate-fade-in delay-500">
							<div className="relative max-w-5xl mx-auto">
								<div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur-2xl opacity-20"></div>
								<div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-2 border border-gray-200 dark:border-slate-700">
									<div className="aspect-video bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-xl flex items-center justify-center">
										<div className="text-center space-y-4">
											<div className="w-16 h-16 md:w-20 md:h-20 mx-auto bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
												<Smartphone className="w-8 h-8 md:w-10 md:h-10 text-white" />
											</div>
											<p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">
												Mobile-First Design
											</p>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section id="features" className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-900/50">
				<div className="max-w-7xl mx-auto">
					<div className="text-center mb-12 md:mb-16">
						<h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
							Powerful Features
						</h2>
						<p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
							Everything you need to create stunning digital experiences
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
						{[
							{
								icon: <Smartphone className="w-6 h-6 md:w-7 md:h-7" />,
								title: 'Mobile Optimized',
								description: 'Perfectly responsive design that looks great on any device',
								color: 'from-blue-500 to-cyan-500',
							},
							{
								icon: <Zap className="w-6 h-6 md:w-7 md:h-7" />,
								title: 'Lightning Fast',
								description: 'Optimized performance for instant loading and smooth interactions',
								color: 'from-indigo-500 to-purple-500',
							},
							{
								icon: <TrendingUp className="w-6 h-6 md:w-7 md:h-7" />,
								title: 'Growth Focused',
								description: 'Built-in analytics and tools to help your business scale',
								color: 'from-purple-500 to-pink-500',
							},
							{
								icon: <Star className="w-6 h-6 md:w-7 md:h-7" />,
								title: 'Premium Quality',
								description: 'Professional-grade components and attention to detail',
								color: 'from-pink-500 to-rose-500',
							},
							{
								icon: <Zap className="w-6 h-6 md:w-7 md:h-7" />,
								title: 'Easy Integration',
								description: 'Seamlessly connect with your favorite tools and services',
								color: 'from-orange-500 to-red-500',
							},
							{
								icon: <Star className="w-6 h-6 md:w-7 md:h-7" />,
								title: '24/7 Support',
								description: 'Always here to help you succeed with dedicated support',
								color: 'from-green-500 to-emerald-500',
							},
						].map((feature, index) => (
							<div
								key={index}
								className="group p-6 md:p-8 bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
							>
								<div
									className={`w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300`}
								>
									{feature.icon}
								</div>
								<h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-2 md:mb-3">
									{feature.title}
								</h3>
								<p className="text-gray-600 dark:text-gray-300 text-sm md:text-base">
									{feature.description}
								</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Services Section */}
			<section id="services" className="py-16 md:py-24 px-4 sm:px-6 lg:px-8">
				<div className="max-w-7xl mx-auto">
					<div className="text-center mb-12 md:mb-16">
						<h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
							What We Offer
						</h2>
						<p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
							Comprehensive solutions for all your digital needs
						</p>
					</div>

					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
						{[
							{
								title: 'Web Development',
								description:
									'Custom web applications built with modern frameworks and best practices for optimal performance',
								features: ['React & Next.js', 'TypeScript', 'Responsive Design', 'API Integration'],
							},
							{
								title: 'Mobile Development',
								description:
									'Native and cross-platform mobile apps that deliver exceptional user experiences',
								features: ['iOS & Android', 'React Native', 'Push Notifications', 'Offline Support'],
							},
							{
								title: 'UI/UX Design',
								description:
									'Beautiful, intuitive interfaces designed with your users in mind',
								features: ['User Research', 'Wireframing', 'Prototyping', 'Design Systems'],
							},
							{
								title: 'Cloud Solutions',
								description:
									'Scalable cloud infrastructure and deployment strategies for growing businesses',
								features: ['AWS & Azure', 'CI/CD Pipelines', 'Auto Scaling', 'Security'],
							},
						].map((service, index) => (
							<div
								key={index}
								className="p-6 md:p-8 bg-gradient-to-br from-white to-blue-50 dark:from-slate-800 dark:to-indigo-900/20 rounded-2xl border border-gray-200 dark:border-slate-700 hover:shadow-2xl transition-all duration-300"
							>
								<h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3 md:mb-4">
									{service.title}
								</h3>
								<p className="text-gray-600 dark:text-gray-300 mb-4 md:mb-6 text-sm md:text-base">
									{service.description}
								</p>
								<div className="grid grid-cols-2 gap-2 md:gap-3">
									{service.features.map((feature, featureIndex) => (
										<div
											key={featureIndex}
											className="flex items-center text-sm md:text-base text-gray-700 dark:text-gray-300"
										>
											<div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 mr-2"></div>
											{feature}
										</div>
									))}
								</div>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Testimonials Section */}
			<section id="testimonials" className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-900/50">
				<div className="max-w-7xl mx-auto">
					<div className="text-center mb-12 md:mb-16">
						<h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
							What Our Clients Say
						</h2>
						<p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
							Trusted by businesses around the world
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
						{[
							{
								name: 'Sarah Johnson',
								role: 'CEO, TechStart',
								content:
									'Working with this team has been incredible. They delivered a beautiful, functional product that exceeded our expectations.',
								rating: 5,
							},
							{
								name: 'Michael Chen',
								role: 'Product Manager, InnovateCo',
								content:
									'The attention to detail and mobile optimization is outstanding. Our users love the new experience.',
								rating: 5,
							},
							{
								name: 'Emily Rodriguez',
								role: 'Founder, GrowthLabs',
								content:
									'Fast, professional, and always available. They turned our vision into reality in record time.',
								rating: 5,
							},
						].map((testimonial, index) => (
							<div
								key={index}
								className="p-6 md:p-8 bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300"
							>
								<div className="flex mb-4">
									{[...Array(testimonial.rating)].map((_, starIndex) => (
										<Star
											key={starIndex}
											className="w-4 h-4 md:w-5 md:h-5 text-yellow-400 fill-yellow-400"
										/>
									))}
								</div>
								<p className="text-gray-600 dark:text-gray-300 mb-4 md:mb-6 text-sm md:text-base">
									"{testimonial.content}"
								</p>
								<div>
									<p className="font-bold text-gray-900 dark:text-white text-sm md:text-base">
										{testimonial.name}
									</p>
									<p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm">
										{testimonial.role}
									</p>
								</div>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8">
				<div className="max-w-4xl mx-auto">
					<div className="relative overflow-hidden rounded-3xl">
						<div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"></div>
						<div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
						<div className="relative p-8 md:p-16 text-center">
							<h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 md:mb-6">
								Ready to Get Started?
							</h2>
							<p className="text-lg md:text-xl text-blue-100 mb-6 md:mb-8 max-w-2xl mx-auto">
								Join thousands of satisfied customers and transform your digital presence today
							</p>
							<div className="flex flex-col sm:flex-row gap-4 justify-center">
								<button className="group px-8 py-4 bg-white text-blue-600 rounded-full font-semibold hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center justify-center">
									<span>Start Free Trial</span>
									<ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
								</button>
								<button className="px-8 py-4 bg-transparent text-white rounded-full border-2 border-white hover:bg-white/10 transition-all duration-300">
									Contact Sales
								</button>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className="py-8 md:py-12 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800">
				<div className="max-w-7xl mx-auto text-center">
					<div className="flex items-center justify-center space-x-2 mb-4">
						<div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
							<Zap className="w-5 h-5 text-white" />
						</div>
						<span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
							MagikVibez
						</span>
					</div>
					<p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">
						© 2025 MagikVibez. All rights reserved.
					</p>
				</div>
			</footer>

			<style>{`
				@keyframes fade-in {
					from {
						opacity: 0;
					}
					to {
						opacity: 1;
					}
				}

				@keyframes slide-up {
					from {
						opacity: 0;
						transform: translateY(30px);
					}
					to {
						opacity: 1;
						transform: translateY(0);
					}
				}

				.animate-fade-in {
					animation: fade-in 0.6s ease-out forwards;
				}

				.animate-slide-up {
					animation: slide-up 0.8s ease-out forwards;
				}

				.delay-200 {
					animation-delay: 0.2s;
					opacity: 0;
				}

				.delay-300 {
					animation-delay: 0.3s;
					opacity: 0;
				}

				.delay-500 {
					animation-delay: 0.5s;
					opacity: 0;
				}

				.delay-1000 {
					animation-delay: 1s;
				}
			`}</style>
		</div>
	);
}
