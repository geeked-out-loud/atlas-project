'use client';

import { Home, Compass, Heart, Settings } from 'lucide-react';
import { useState } from 'react';

export default function Sidebar() {
  const [active, setActive] = useState('feed');

  const menuItems = [
    { id: 'feed', icon: Home, label: 'Personalized Feed' },
    { id: 'trending', icon: Compass, label: 'Trending' },
    { id: 'favorites', icon: Heart, label: 'Favourites' },
  ];

  return (
    <>
      <aside className="fixed left-0 top-0 h-screen w-16 flex-col items-center bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 z-40 hidden md:flex pt-24 pb-6">
        <div className="flex-1 flex flex-col gap-6 w-full px-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActive(item.id)}
              className={`p-3 rounded-xl transition-all duration-200 group relative flex justify-center ${
                active === item.id 
                  ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-500' 
                  : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-900 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
              title={item.label}
            >
              <item.icon size={24} strokeWidth={active === item.id ? 2.5 : 2} />
              
              <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                {item.label}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-auto w-full px-2">
          <button
            className="w-full p-3 rounded-xl text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-900 hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-200 flex justify-center group relative"
            title="Settings"
          >
            <Settings size={24} />
            <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
              Settings
            </span>
          </button>
        </div>
      </aside>

      <nav className="fixed bottom-0 left-0 w-full h-16 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 z-50 flex md:hidden justify-around items-center px-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActive(item.id)}
            className={`p-2 rounded-xl transition-all duration-200 flex flex-col items-center justify-center ${
              active === item.id 
                ? 'text-rose-500' 
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            <item.icon size={24} strokeWidth={active === item.id ? 2.5 : 2} />
            <span className="text-[10px] mt-1 font-medium">{item.label.split(' ')[0]}</span>
          </button>
        ))}
        <button
          className="p-2 rounded-xl text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-200 flex flex-col items-center justify-center"
        >
          <Settings size={24} />
          <span className="text-[10px] mt-1 font-medium">Settings</span>
        </button>
      </nav>
    </>
  );
}
