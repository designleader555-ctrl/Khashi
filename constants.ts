
import { PrayerName } from './types';

export const COLORS = {
  olive: '#556B2F',
  beige: '#F5F5DC',
  lightBlue: '#ADD8E6',
  darkOlive: '#3E4E22',
  softBeige: '#FDFBF7'
};

export const PRAYER_NAMES_AR: Record<PrayerName, string> = {
  Fajr: 'الفجر',
  Dhuhr: 'الظهر',
  Asr: 'العصر',
  Maghrib: 'المغرب',
  Isha: 'العشاء'
};

export const ENCOURAGING_QUOTES = [
  "اليوم هو محاولة لخشوع القلب",
  "استمر، كل يوم خطوة للأمام",
  "الخشوع رحلة، وليس وجهة نهائية",
  "قليلٌ دائم خيرٌ من كثيرٍ منقطع",
  "صلاتك هي صلتك بالله، فاجعلها هادئة"
];

export const MOCK_WEEK_DATA = [
  { day: 'السبت', value: 65 },
  { day: 'الأحد', value: 72 },
  { day: 'الاثنين', value: 68 },
  { day: 'الثلاثاء', value: 85 },
  { day: 'الأربعاء', value: 78 },
  { day: 'الخميس', value: 90 },
  { day: 'الجمعة', value: 95 },
];
