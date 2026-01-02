
import React from 'react';
import { TICKET_REMINDERS } from '../constants';
import { Bell, Calendar, Info, AlertTriangle } from 'lucide-react';

const Tickets: React.FC = () => {
  return (
    <section className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex items-center gap-3 mb-8 border-b-2 border-blue-100 pb-2">
        <Bell className="text-blue-500" size={24} />
        <h2 className="text-2xl font-semibold text-gray-800">重要購票提醒</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {TICKET_REMINDERS.map((ticket, idx) => (
          <div 
            key={idx} 
            className={`bg-white rounded-xl p-6 shadow-sm border transition-transform hover:scale-[1.02] ${
              ticket.important ? 'border-orange-200' : 'border-gray-100'
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-gray-800">{ticket.name}</h3>
              {ticket.important && (
                <span className="flex items-center gap-1 px-2 py-1 bg-orange-50 text-orange-600 text-xs font-bold rounded uppercase">
                  <AlertTriangle size={12} />
                  Important
                </span>
              )}
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Calendar size={16} className="text-blue-400" />
                <span>預約日: <span className="font-medium text-gray-800">{ticket.targetDate}</span></span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Bell size={16} className="text-pink-400" />
                <span>搶票日: <span className="font-medium text-pink-600">{ticket.bookingDate}</span></span>
              </div>
              <div className="flex items-start gap-3 text-sm text-gray-500 mt-2 bg-gray-50 p-3 rounded-lg italic">
                <Info size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <p>{ticket.details}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Tickets;
