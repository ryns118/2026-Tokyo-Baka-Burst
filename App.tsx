
import React, { useState } from 'react';
import Timeline from './components/Timeline';
import Tickets from './components/Tickets';
import { Plane, Building, Compass, Train } from 'lucide-react';

const App: React.FC = () => {
  const [activeDay, setActiveDay] = useState(1);

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Header */}
      <header className="relative h-[60vh] md:h-[70vh] w-full overflow-hidden flex items-center justify-center">
        <img 
          src="https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=2070&auto=format&fit=crop" 
          alt="Mount Fuji Winter View" 
          className="absolute inset-0 w-full h-full object-cover filter brightness-[0.75]"
        />
        <div className="relative z-10 text-center text-white px-4">
          <div className="mb-4 inline-block px-4 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold tracking-widest uppercase">
            Travel Guide 2026
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4 drop-shadow-lg tracking-tight">
            2026 東京冬日海陸空之旅
          </h1>
          <p className="text-lg md:text-xl font-light tracking-[0.3em] opacity-90">
            Tokyo Winter Journey: Land, Sea & Sky
          </p>
          <div className="mt-12 flex justify-center gap-8 text-sm font-medium tracking-wide">
            <span className="flex items-center gap-2">
              <Plane size={18} /> FEB 24 - FEB 28
            </span>
          </div>
        </div>
      </header>

      {/* Basic Info Section */}
      <div className="max-w-4xl mx-auto px-4 -mt-16 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-2xl shadow-xl flex items-center gap-5 border border-gray-50">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
              <Building size={24} />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Accommodation</p>
              <h3 className="font-bold text-gray-800">東橫INN 東京三之輪站前</h3>
              <p className="text-sm text-gray-500">近地鐵日比谷線三之輪站</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-xl flex items-center gap-5 border border-gray-50">
            <div className="w-12 h-12 bg-blue-900 text-white rounded-full flex items-center justify-center">
              <Train size={24} />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Transport</p>
              <h3 className="font-bold text-gray-800">Tokyo Subway 72H Pass</h3>
              <p className="text-sm text-gray-500">2/25 10:00 啟用 | 2/28 10:00 失效</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Tabs (Simplified) */}
      <main className="mt-12">
        <section className="mb-12">
          <div className="text-center mb-8">
            <Compass className="mx-auto text-blue-900 mb-4" size={32} />
            <h2 className="text-3xl font-bold text-gray-800">五日精選行程</h2>
            <div className="w-12 h-1 bg-blue-900 mx-auto mt-4 rounded-full" />
          </div>
          
          <Timeline activeDay={activeDay} onDayChange={setActiveDay} />
        </section>

        <Tickets />
      </main>

      {/* Footer */}
      <footer className="mt-20 py-12 border-t border-gray-200 text-center bg-white">
        <p className="text-gray-400 text-sm font-light tracking-widest">
          &copy; 2026 Tokyo Winter Travel Itinerary. All Rights Reserved.
        </p>
        <p className="text-xs text-gray-300 mt-2 italic">Minimalist Design inspired by Japanese Aesthetics</p>
      </footer>
    </div>
  );
};

export default App;
