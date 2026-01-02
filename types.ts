
export interface Event {
  time?: string;
  activity: string;
  note?: string;
  type?: 'transport' | 'food' | 'spot' | 'shopping' | 'checkin';
}

export interface DayPlan {
  day: number;
  date: string;
  title: string;
  events: Event[];
}

export interface TicketReminder {
  name: string;
  targetDate: string;
  bookingDate: string;
  details: string;
  important?: boolean;
}
