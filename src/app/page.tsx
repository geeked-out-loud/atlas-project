'use client';

import Header from '@/components/layout/Header';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950">
      <Header />
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-12">
        <div className="text-center space-y-6">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-950 dark:text-gray-50">
            Welcome to <span className="text-rose-500">Atlas</span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Your personalized content dashboard is being built. Stay tuned for an amazing experience.
          </p>
        </div>
      </main>
    </div>
  );
}
