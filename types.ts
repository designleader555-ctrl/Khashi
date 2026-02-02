
export type PrayerName = 'Fajr' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha';

export interface PrayerData {
  time: string;
  isDone: boolean;
  khushu: number; // 0-100
}

export interface DailyLog {
  date: string; // ISO string YYYY-MM-DD
  prayers: Record<PrayerName, PrayerData>;
  mostKhushuPrayer?: PrayerName;
  isReviewCompleted: boolean;
}

export interface Settings {
  notificationsEnabled: boolean;
  dailyMessageEnabled: boolean;
}

export interface PrayerTimings {
  Fajr: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}
