
import React from 'react';
import { ITINERARY } from '../constants';
import { MapPin, Clock, Train, ShoppingBag, Utensils, Home } from 'lucide-react';

interface TimelineProps {
  activeDay: number;
  onDayChange: (day: number) => void;
}

const Timeline: React.FC<TimelineProps> = ({ activeDay, onDayChange }) => {
  const currentPlan = ITINERARY.find(p => p.day === activeDay);

  const getIcon = (type?: string) => {
    switch (type) {
      case 'transport': return <Train size={18} className="text-blue-500" />;
      case 'food': return <Utensils size={18} className="text-orange-500" />;
      case 'shopping': return <ShoppingBag size={18} className="text-pink-500" />;
      case 'checkin': return <Home size={18} className="text-green-600" />;
      default: return <MapPin size={18} className="text-gray-500" />;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      {/* Day Selector */}
      <div className="flex overflow-x-auto pb-4 mb-8 scrollbar-hide space-x-2">
        {ITINERARY.map((plan) => (
          <button
            key={plan.day}
            onClick={() => onDayChange(plan.day)}
            className={`flex-shrink-0 px-6 py-2 rounded-full border transition-all duration-300 ${
              activeDay === plan.day
                ? 'bg-blue-900 text-white border-blue-900 shadow-md'
                : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300'
            }`}
          >
            <span className="text-sm font-medium">Day {plan.day}</span>
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-2xl p-6 md:p-10 shadow-sm border border-gray-100">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{currentPlan?.title}</h2>
          <p className="text-gray-400 font-light tracking-widest uppercase">{currentPlan?.date}</p>
        </div>

        <div className="relative border-l-2 border-gray-100 ml-4 pl-8 space-y-12">
          {currentPlan?.events.map((event, idx) => (
            <div key={idx} className="relative">
              {/* Dot */}
              <div className="absolute -left-[41px] mt-1.5 w-4 h-4 rounded-full bg-white border-2 border-blue-400 z-10" />
              
              <div className="flex flex-col md:flex-row md:items-start md:gap-4">
                {event.time && (
                  <div className="flex items-center gap-1.5 text-gray-400 mb-1 md:mb-0 md:w-20 flex-shrink-0">
                    <Clock size={14} />
                    <span className="text-sm font-medium">{event.time}</span>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex-shrink-0">{getIcon(event.type)}</div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-800 leading-tight">
                      {event.activity}
                    </h3>
                    {event.note && (
                      <p className="text-sm text-gray-500 mt-1 font-light italic">
                        {event.note}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Timeline;
