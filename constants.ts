
import { DayPlan, TicketReminder } from './types';

export const ITINERARY: DayPlan[] = [
  {
    day: 1,
    date: '2/24 (Mon)',
    title: '抵達東京：古都點燈',
    events: [
      { time: '16:15', activity: '落地成田機場 (NRT)', type: 'transport' },
      { time: '17:30', activity: '搭乘 Skyliner', note: '已註冊人臉辨識驗票', type: 'transport' },
      { time: '18:45', activity: '東橫INN 三之輪站前 Check-in', type: 'checkin' },
      { time: '20:00', activity: '淺草寺夜間點燈巡禮', type: 'spot' },
      { time: '21:00', activity: '晴空塔 Solamachi 逛街晚餐', type: 'shopping' }
    ]
  },
  {
    day: 2,
    date: '2/25 (Tue)',
    title: '藝術與地標：雲端展望',
    events: [
      { time: '10:00', activity: '啟用 Subway 72H 券', note: '三之輪站出發', type: 'transport' },
      { time: '11:00', activity: '築地市場早午餐', note: '海鮮與玉子燒', type: 'food' },
      { time: '12:30', activity: 'teamLab Planets (豐洲)', note: '需提前預約 (12:30 入場)', type: 'spot' },
      { time: '16:00', activity: '澀谷 SKY (夕陽場)', note: '最佳拍照時段', type: 'spot' },
      { time: '18:30', activity: '澀谷宮下公園 & 逛街', type: 'shopping' }
    ]
  },
  {
    day: 3,
    date: '2/26 (Wed)',
    title: '富士山經典：湖畔絕景',
    events: [
      { time: '07:50', activity: '銀座 GinzaNovo 集合', note: '富士山一日遊巴士', type: 'transport' },
      { time: '10:00', activity: '新倉山五重塔 & 日川時計店', type: 'spot' },
      { time: '13:00', activity: '忍野八海 & 天晴號遊船', type: 'spot' },
      { time: '19:00', activity: '銀座解散', type: 'transport' },
      { time: '19:30', activity: '銀座 Uniqlo/MUJI 旗艦店採買', type: 'shopping' }
    ]
  },
  {
    day: 4,
    date: '2/27 (Thu)',
    title: '潮流大採買：都會光影',
    events: [
      { time: '10:00', activity: '明治神宮參拜', note: '森之參道散步', type: 'spot' },
      { time: '12:00', activity: '原宿/裏原宿貓街', note: '潮流服飾、風格咖啡', type: 'shopping' },
      { time: '15:30', activity: '新宿 Lumine & 3D 貓咪', note: '東口廣場看大貓', type: 'spot' },
      { time: '18:30', activity: '惠比壽花園廣場', note: '38F 免費看東京鐵塔夜景', type: 'spot' }
    ]
  },
  {
    day: 5,
    date: '2/28 (Fri)',
    title: '最後巡禮：下町採購',
    events: [
      { time: '10:00', activity: '三之輪飯店退房', note: 'Subway 72H 券失效', type: 'checkin' },
      { time: '11:00', activity: '上野阿美橫丁最後補貨', note: '二木菓子、藥妝', type: 'shopping' },
      { time: '15:00', activity: '上野恩賜公園散策', type: 'spot' },
      { time: '16:40', activity: '上野站搭乘 Skyliner', type: 'transport' },
      { time: '19:00', activity: '成田機場起飛返台', type: 'transport' }
    ]
  }
];

export const TICKET_REMINDERS: TicketReminder[] = [
  {
    name: 'Shibuya Sky',
    targetDate: '2/25',
    bookingDate: '1/27 22:55 (TW)',
    details: '目標場次 16:00-16:20 (夕陽場最熱門)',
    important: true
  },
  {
    name: 'Skyliner',
    targetDate: '2/24, 2/28',
    bookingDate: '1/24',
    details: '預訂後務必註冊人臉辨識功能',
    important: false
  },
  {
    name: 'teamLab Planets',
    targetDate: '2/25 12:30',
    bookingDate: '已開放',
    details: '預約豐洲場次，需脫鞋進場',
    important: false
  },
  {
    name: '富士山一日遊',
    targetDate: '2/26',
    bookingDate: '提前預訂',
    details: '選擇「銀座出發、含遊船方案」',
    important: true
  }
];
