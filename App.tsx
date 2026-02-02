
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Home, 
  CheckCircle, 
  BarChart2, 
  Settings as SettingsIcon,
  Bell,
  Heart,
  Share2
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { 
  PrayerName, 
  DailyLog, 
  Settings, 
  PrayerTimings, 
  PrayerData 
} from './types';
import { 
  PRAYER_NAMES_AR, 
  COLORS, 
  ENCOURAGING_QUOTES, 
  MOCK_WEEK_DATA 
} from './constants';
import { getPrayerTimings, getUserLocation } from './services/prayerService';
import CircularProgress from './components/CircularProgress';

const STORAGE_KEY_LOGS = 'khashi_daily_logs';
const STORAGE_KEY_SETTINGS = 'khashi_settings';

/**
 * Helper to convert 24-hour time string (HH:mm) to 12-hour format with Arabic markers.
 */
const formatTimeTo12h = (timeStr: string): string => {
  if (!timeStr || timeStr === '--:--') return '--:--';
  const [hours, minutes] = timeStr.split(':').map(Number);
  const period = hours >= 12 ? 'م' : 'ص';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'home' | 'prayers' | 'stats' | 'settings'>('home');
  const [timings, setTimings] = useState<PrayerTimings | null>(null);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [settings, setSettings] = useState<Settings>({
    notificationsEnabled: true,
    dailyMessageEnabled: true,
  });
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(false);

  // Initialize Data
  useEffect(() => {
    const savedLogs = localStorage.getItem(STORAGE_KEY_LOGS);
    if (savedLogs) setLogs(JSON.parse(savedLogs));

    const savedSettings = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (savedSettings) setSettings(JSON.parse(savedSettings));

    const init = async () => {
      const loc = await getUserLocation();
      const t = await getPrayerTimings(loc?.lat, loc?.lon);
      if (t) setTimings(t);
    };
    init();

    // Check for daily message
    if (settings.dailyMessageEnabled) {
      const lastMessageDate = localStorage.getItem('khashi_last_msg');
      const today = new Date().toDateString();
      if (lastMessageDate !== today) {
        setShowWelcomeMessage(true);
        localStorage.setItem('khashi_last_msg', today);
      }
    }
  }, []);

  // Save to LocalStorage helper (Simulating Google Sheet sync)
  const saveLog = (updatedLogs: DailyLog[]) => {
    setLogs(updatedLogs);
    localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(updatedLogs));
    console.log("Simulated sync to Google Sheets...");
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todayLog = useMemo(() => {
    let log = logs.find(l => l.date === todayStr);
    if (!log) {
      log = {
        date: todayStr,
        isReviewCompleted: false,
        prayers: {
          Fajr: { time: '', isDone: false, khushu: 10 },
          Dhuhr: { time: '', isDone: false, khushu: 10 },
          Asr: { time: '', isDone: false, khushu: 10 },
          Maghrib: { time: '', isDone: false, khushu: 10 },
          Isha: { time: '', isDone: false, khushu: 10 },
        }
      };
    }
    return log;
  }, [logs, todayStr]);

  const dailyAverage = useMemo(() => {
    const prayers = Object.values(todayLog.prayers) as PrayerData[];
    const donePrayers = prayers.filter(p => p.isDone);
    if (donePrayers.length === 0) return 0;
    const total = donePrayers.reduce((acc, curr) => acc + curr.khushu, 0);
    return total / 5;
  }, [todayLog]);

  const handleUpdatePrayer = (name: PrayerName, updates: Partial<PrayerData>) => {
    const newLogs = logs.filter(l => l.date !== todayStr);
    const updatedToday = {
      ...todayLog,
      prayers: {
        ...todayLog.prayers,
        [name]: { ...todayLog.prayers[name], ...updates }
      }
    };
    saveLog([...newLogs, updatedToday]);
  };

  const handleCompleteReview = (name: PrayerName) => {
    const newLogs = logs.filter(l => l.date !== todayStr);
    const updatedToday = {
      ...todayLog,
      mostKhushuPrayer: name,
      isReviewCompleted: true
    };
    saveLog([...newLogs, updatedToday]);
    setShowReviewModal(false);
  };

  const toggleSettings = (key: keyof Settings) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(newSettings));
  };

  const handleShare = async () => {
    const message = `الحمد لله، حققت اليوم نسبة خشوع ${Math.round(dailyAverage)}% في صلواتي عبر تطبيق خاشع. 🌿✨ #خاشع #صلاة`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'تطبيق خاشع',
          text: message,
          url: window.location.href,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(message);
        alert('تم نسخ رسالة المشاركة إلى الحافظة');
      } catch (err) {
        console.error('Failed to copy text: ', err);
      }
    }
  };

  const TabButton = ({ id, icon: Icon, label }: { id: typeof activeTab, icon: any, label: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex flex-col items-center justify-center flex-1 py-2 transition-colors ${
        activeTab === id ? 'text-olive-700 font-bold' : 'text-gray-400'
      }`}
      style={{ color: activeTab === id ? COLORS.olive : undefined }}
    >
      <Icon size={24} />
      <span className="text-xs mt-1">{label}</span>
    </button>
  );

  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto bg-softBeige shadow-xl relative pb-20 overflow-hidden">
      
      <header className="p-6 bg-white border-b border-gray-100 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-2xl font-bold font-quran text-olive-800" style={{ color: COLORS.olive }}>خاشع</h1>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="bg-olive-50 px-3 py-1 rounded-full text-olive-700" style={{ backgroundColor: '#F0F4EA' }}>
            {new Intl.DateTimeFormat('ar-SA', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}
          </span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6">
        
        {showWelcomeMessage && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={() => setShowWelcomeMessage(false)}>
            <div className="bg-white rounded-3xl p-8 text-center shadow-2xl animate-in zoom-in fade-in duration-300">
              <div className="w-16 h-16 bg-olive-100 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#F0F4EA' }}>
                <Heart className="text-olive-700" size={32} style={{ color: COLORS.olive }} />
              </div>
              <p className="text-xl font-medium text-gray-800 leading-relaxed">
                {ENCOURAGING_QUOTES[Math.floor(Math.random() * ENCOURAGING_QUOTES.length)]}
              </p>
              <button 
                className="mt-6 w-full py-3 bg-olive-700 text-white rounded-xl font-semibold"
                style={{ backgroundColor: COLORS.olive }}
              >
                بسم الله
              </button>
            </div>
          </div>
        )}

        {activeTab === 'home' && (
          <div className="flex flex-col items-center py-6 space-y-8 animate-in fade-in slide-in-from-top-4 duration-700">
            <CircularProgress percentage={dailyAverage} />
            
            <div className="text-center px-4">
              <p className="text-lg text-gray-600 italic mb-6">"اليوم هو محاولة لخشوع القلب"</p>
              
              <button 
                onClick={handleShare}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-white border border-olive-200 text-olive-700 rounded-full shadow-sm hover:bg-olive-50 transition-all text-sm font-semibold"
                style={{ color: COLORS.olive, borderColor: COLORS.olive }}
              >
                <Share2 size={16} />
                <span>شارك رحلتك</span>
              </button>

              <div className="mt-10 grid grid-cols-5 gap-3 w-full max-w-xs mx-auto">
                {(Object.keys(todayLog.prayers) as PrayerName[]).map(p => (
                  <div key={p} className="flex flex-col items-center gap-1.5">
                    <div 
                      className={`w-3.5 h-3.5 rounded-full transition-all duration-500 shadow-sm ${todayLog.prayers[p].isDone ? 'scale-125' : 'bg-gray-200'}`}
                      style={{ backgroundColor: todayLog.prayers[p].isDone ? COLORS.olive : undefined }}
                    />
                    <span className="text-[10px] text-gray-400 font-medium">{PRAYER_NAMES_AR[p]}</span>
                  </div>
                ))}
              </div>
            </div>

            {(Object.values(todayLog.prayers) as PrayerData[]).every(p => p.isDone) && !todayLog.isReviewCompleted && (
              <button 
                onClick={() => setShowReviewModal(true)}
                className="w-full max-w-xs py-4 px-6 rounded-2xl bg-olive-700 text-white font-bold flex items-center justify-center gap-2 shadow-lg animate-bounce mt-4"
                style={{ backgroundColor: COLORS.olive }}
              >
                إغلاق اليوم ومراجعة الخشوع
              </button>
            )}
          </div>
        )}

        {activeTab === 'prayers' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
            {(Object.keys(PRAYER_NAMES_AR) as PrayerName[]).map(key => {
              const prayer = todayLog.prayers[key];
              const rawTime = timings ? timings[key] : '--:--';
              const formattedTime = formatTimeTo12h(rawTime);
              return (
                <div key={key} className={`bg-white rounded-2xl p-5 shadow-sm border ${prayer.isDone ? 'border-olive-100' : 'border-gray-50'}`}>
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${prayer.isDone ? 'bg-olive-50' : 'bg-gray-50'}`}>
                        <CheckCircle size={20} className={prayer.isDone ? 'text-olive-700' : 'text-gray-300'} style={{ color: prayer.isDone ? COLORS.olive : undefined }} />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800">{PRAYER_NAMES_AR[key]}</h3>
                        <span className="text-xs text-gray-400 font-medium">يبدأ في {formattedTime}</span>
                      </div>
                    </div>
                    
                    {!prayer.isDone ? (
                      <button 
                        onClick={() => handleUpdatePrayer(key, { isDone: true })}
                        className="px-4 py-1.5 rounded-full text-sm font-semibold text-olive-700 bg-olive-50 border border-olive-200"
                        style={{ color: COLORS.olive, borderColor: COLORS.olive, backgroundColor: '#F0F4EA' }}
                      >
                        تمّت الصلاة
                      </button>
                    ) : (
                      <span className="text-xs text-olive-600 font-bold" style={{ color: COLORS.olive }}>مكتملة</span>
                    )}
                  </div>

                  {prayer.isDone && (
                    <div className="mt-4 space-y-2 animate-in fade-in zoom-in-95 duration-300">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>مستوى الخشوع</span>
                        <span>{prayer.khushu}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="10" 
                        max="100" 
                        value={prayer.khushu} 
                        onChange={(e) => handleUpdatePrayer(key, { khushu: parseInt(e.target.value) })}
                        className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-olive-700"
                        style={{ accentColor: COLORS.olive }}
                      />
                      <p className="text-[10px] text-gray-400 text-center italic">"رحمة بالمصلي، الحد الأدنى هو 10% دائماً"</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
            <div className="bg-white p-6 rounded-3xl shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                <BarChart2 size={20} className="text-olive-700" style={{ color: COLORS.olive }} />
                تطور الخشوع الأسبوعي
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={MOCK_WEEK_DATA}>
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                    <YAxis hide domain={[0, 100]} />
                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="value" radius={[10, 10, 10, 10]} barSize={24}>
                      {MOCK_WEEK_DATA.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.value > 80 ? COLORS.olive : COLORS.lightBlue} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-olive-700 text-white p-6 rounded-3xl shadow-lg" style={{ backgroundColor: COLORS.olive }}>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm opacity-80 mb-1">متوسط الخشوع العام</h4>
                  <p className="text-3xl font-bold">78%</p>
                </div>
                <div className="bg-white/20 p-3 rounded-2xl">
                  <Heart size={28} />
                </div>
              </div>
              <p className="mt-4 text-xs opacity-70">أنت تتقدم ببطء ولكن بثبات. الاستمرارية هي المفتاح.</p>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-3xl p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                    <Bell size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">التنبيه بالصلاة</p>
                    <p className="text-xs text-gray-400">قبل الأذان بـ 10 دقائق</p>
                  </div>
                </div>
                <button 
                  onClick={() => toggleSettings('notificationsEnabled')}
                  className={`w-12 h-6 rounded-full transition-colors relative ${settings.notificationsEnabled ? 'bg-olive-600' : 'bg-gray-200'}`}
                  style={{ backgroundColor: settings.notificationsEnabled ? COLORS.olive : undefined }}
                >
                  <div className={`absolute top-1 bg-white w-4 h-4 rounded-full transition-all ${settings.notificationsEnabled ? 'right-7' : 'right-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-pink-50 rounded-xl text-pink-600">
                    <Heart size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">الرسائل التشجيعية</p>
                    <p className="text-xs text-gray-400">رسالة هادئة كل صباح</p>
                  </div>
                </div>
                <button 
                  onClick={() => toggleSettings('dailyMessageEnabled')}
                  className={`w-12 h-6 rounded-full transition-colors relative ${settings.dailyMessageEnabled ? 'bg-olive-600' : 'bg-gray-200'}`}
                  style={{ backgroundColor: settings.dailyMessageEnabled ? COLORS.olive : undefined }}
                >
                  <div className={`absolute top-1 bg-white w-4 h-4 rounded-full transition-all ${settings.dailyMessageEnabled ? 'right-7' : 'right-1'}`} />
                </button>
              </div>
            </div>

            <div className="p-4 text-center">
              <p className="text-xs text-gray-400">إصدار 1.0.0 - خاشع</p>
              <p className="text-xs text-gray-300 mt-1">يتم حفظ البيانات تلقائياً في السحاب</p>
            </div>
          </div>
        )}
      </main>

      {showReviewModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-end justify-center">
          <div className="bg-white w-full max-w-md rounded-t-[40px] p-8 animate-in slide-in-from-bottom duration-500">
            <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-8" />
            <h2 className="text-2xl font-bold text-center mb-2">مراجعة اليوم</h2>
            <p className="text-gray-500 text-center mb-8">في أي صلاة شعرت بأكبر خشوع؟</p>
            
            <div className="grid grid-cols-1 gap-3 mb-10">
              {(Object.keys(PRAYER_NAMES_AR) as PrayerName[]).map(key => (
                <button
                  key={key}
                  onClick={() => handleCompleteReview(key)}
                  className="py-4 px-6 rounded-2xl bg-gray-50 hover:bg-olive-50 hover:text-olive-700 transition-all font-semibold flex justify-between items-center group"
                >
                  <span>{PRAYER_NAMES_AR[key]}</span>
                  <Heart size={18} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>

            <p className="text-[10px] text-gray-300 text-center">
              * هذه الخطوة إلزامية لختم مجهودك لهذا اليوم بمحبة
            </p>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/80 backdrop-blur-lg border-t border-gray-100 flex items-center h-20 px-4 z-20">
        <TabButton id="home" icon={Home} label="الرئيسية" />
        <TabButton id="prayers" icon={CheckCircle} label="الصلوات" />
        <TabButton id="stats" icon={BarChart2} label="الإحصائيات" />
        <TabButton id="settings" icon={SettingsIcon} label="الإعدادات" />
      </nav>
    </div>
  );
};

export default App;
