/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Dumbbell, 
  Calendar, 
  User, 
  Settings as SettingsIcon, 
  Play, 
  CheckCircle2, 
  ArrowLeft,
  Flame,
  Activity,
  Scale,
  Clock,
  ChevronRight,
  ChevronLeft,
  SkipForward,
  Sun,
  Moon
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utilities ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
type Gender = 'male' | 'female' | 'other';

interface UserData {
  name: string;
  height: number;
  weight: number;
  dob: string;
  gender: Gender;
  onboarded: boolean;
}

interface WorkoutConfig {
  sessionDuration: number;
  restDuration: number;
}

interface Exercise {
  id: string;
  name: string;
  category: string;
  met: number;
  baseReps: number;
}

interface SessionState {
  isActive: boolean;
  currentDay: number;
  currentExerciseIndex: number;
  isResting: boolean;
  restTimeLeft: number;
  startTime: number | null;
  focusCategory?: string;
}

// --- Constants ---
const CATEGORIES = ["Arms & Biceps", "Legs", "Shoulders", "Abs", "Back"] as const;

const EXERCISES: Exercise[] = [
  // Arms & Biceps
  { id: 'e1', name: 'Push-ups', category: 'Arms & Biceps', met: 8.0, baseReps: 10 },
  { id: 'e2', name: 'Diamond Push-ups', category: 'Arms & Biceps', met: 8.5, baseReps: 8 },
  { id: 'e3', name: 'Bicep Curls', category: 'Arms & Biceps', met: 4.0, baseReps: 15 },
  { id: 'e14', name: 'Tricep Dips', category: 'Arms & Biceps', met: 5.0, baseReps: 12 },
  { id: 'e15', name: 'Hammer Curls', category: 'Arms & Biceps', met: 4.0, baseReps: 15 },
  
  // Legs
  { id: 'e4', name: 'Squats', category: 'Legs', met: 5.0, baseReps: 15 },
  { id: 'e5', name: 'Lunges', category: 'Legs', met: 5.5, baseReps: 12 },
  { id: 'e6', name: 'Calf Raises', category: 'Legs', met: 3.5, baseReps: 20 },
  { id: 'e16', name: 'Bulgarian Split Squats', category: 'Legs', met: 6.0, baseReps: 10 },
  { id: 'e17', name: 'Glute Bridges', category: 'Legs', met: 4.0, baseReps: 15 },
  
  // Shoulders
  { id: 'e7', name: 'Shoulder Taps', category: 'Shoulders', met: 4.5, baseReps: 20 },
  { id: 'e8', name: 'Pike Push-ups', category: 'Shoulders', met: 6.0, baseReps: 8 },
  { id: 'e18', name: 'Lateral Raises', category: 'Shoulders', met: 4.0, baseReps: 12 },
  { id: 'e19', name: 'Front Raises', category: 'Shoulders', met: 4.0, baseReps: 12 },
  
  // Abs
  { id: 'e9', name: 'Crunches', category: 'Abs', met: 3.8, baseReps: 20 },
  { id: 'e10', name: 'Plank', category: 'Abs', met: 4.0, baseReps: 30 },
  { id: 'e11', name: 'Leg Raises', category: 'Abs', met: 4.0, baseReps: 12 },
  { id: 'e20', name: 'Russian Twists', category: 'Abs', met: 4.5, baseReps: 20 },
  { id: 'e21', name: 'Mountain Climbers', category: 'Abs', met: 8.0, baseReps: 30 },
  
  // Back
  { id: 'e12', name: 'Superman', category: 'Back', met: 4.0, baseReps: 12 },
  { id: 'e13', name: 'Bird Dog', category: 'Back', met: 3.5, baseReps: 15 },
  { id: 'e22', name: 'Reverse Flys', category: 'Back', met: 4.0, baseReps: 12 },
  { id: 'e23', name: 'Cat-Cow', category: 'Back', met: 2.5, baseReps: 10 },
];

const INITIAL_USER_DATA: UserData = {
  name: '',
  height: 175,
  weight: 70,
  dob: '1995-01-01',
  gender: 'male',
  onboarded: false,
};

const INITIAL_CONFIG: WorkoutConfig = {
  sessionDuration: 30,
  restDuration: 30,
};

const SPRING = { type: "spring", stiffness: 300, damping: 30 };

// --- Components ---

const Button = ({ 
  children, 
  onClick, 
  className, 
  variant = 'primary',
  disabled = false 
}: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  disabled?: boolean;
}) => {
  const variants = {
    primary: 'bg-nothing-accent text-white hover:bg-red-600 shadow-[0_0_20px_rgba(255,0,0,0.3)]',
    secondary: 'glass-heavy bg-white/5 text-nothing-text hover:bg-nothing-text/10',
    outline: 'border border-nothing-text/20 text-nothing-text hover:bg-nothing-text/5',
    danger: 'bg-red-900/40 text-red-500 border border-red-500/30 hover:bg-red-900/60',
  };

  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      transition={SPRING}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'px-8 py-4 font-dot uppercase tracking-[0.2em] squircle transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm',
        variants[variant],
        className
      )}
    >
      {children}
    </motion.button>
  );
};

const Card = ({ children, className, noPadding = false }: { children: React.ReactNode; className?: string; noPadding?: boolean }) => (
  <div className={cn('glass-heavy', noPadding ? '' : 'p-8', className)}>
    {children}
  </div>
);

const Input = ({ 
  label, 
  type = 'text', 
  value, 
  onChange, 
  className 
}: { 
  label: string; 
  type?: string; 
  value: string | number; 
  onChange: (val: any) => void;
  className?: string;
}) => (
  <div className={cn('flex flex-col gap-3', className)}>
    <label className="text-[10px] font-sans font-semibold text-nothing-muted uppercase tracking-widest ml-1">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="glass-heavy bg-white/5 p-4 font-mono text-nothing-text squircle border-white/5 focus:border-nothing-accent/50 outline-none transition-all focus:bg-white/10"
    />
  </div>
);

const DynamicIsland = ({ children, isActive }: { children: React.ReactNode; isActive: boolean }) => (
  <motion.div
    initial={false}
    animate={{ 
      width: isActive ? 'auto' : 120,
      height: isActive ? 48 : 32,
      opacity: isActive ? 1 : 0,
      y: isActive ? 20 : -100
    }}
    className="fixed top-0 left-1/2 -translate-x-1/2 dynamic-island z-50 overflow-hidden whitespace-nowrap"
  >
    {children}
  </motion.div>
);

const LiquidBackground = () => (
  <div className="liquid-bg">
    <div className="liquid-blob blob-1" />
    <div className="liquid-blob blob-2" />
    <div className="liquid-blob blob-3" />
  </div>
);

const ThemeSwitcher = ({ 
  theme, 
  setTheme, 
  colorTheme, 
  setColorTheme 
}: { 
  theme: 'dark' | 'light'; 
  setTheme: React.Dispatch<React.SetStateAction<'dark' | 'light'>>;
  colorTheme: string;
  setColorTheme: React.Dispatch<React.SetStateAction<string>>;
}) => {
  const colors = [
    { id: 'red', class: 'bg-red-500' },
    { id: 'blue', class: 'bg-blue-500' },
    { id: 'green', class: 'bg-green-500' },
    { id: 'amber', class: 'bg-amber-500' },
    { id: 'violet', class: 'bg-violet-500' },
  ];

  return (
    <div className="glass-heavy p-2 flex items-center gap-4 border shadow-xl">
      <div className="flex gap-1.5 px-2">
        {colors.map(c => (
          <button
            key={c.id}
            onClick={() => setColorTheme(c.id)}
            className={cn(
              "w-5 h-5 rounded-full transition-all border-2",
              c.class,
              colorTheme === c.id ? "border-white scale-110 shadow-lg" : "border-transparent opacity-60 hover:opacity-100"
            )}
          />
        ))}
      </div>
      <div className="w-px h-6 bg-white/10" />
      <button
        onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
        className="p-2 hover:bg-white/10 rounded-full transition-colors text-nothing-text"
      >
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('redcarduh_theme');
    return (saved as 'dark' | 'light') || 'dark';
  });

  const [colorTheme, setColorTheme] = useState<string>(() => {
    return localStorage.getItem('redcarduh_color_theme') || 'red';
  });

  useEffect(() => {
    localStorage.setItem('redcarduh_theme', theme);
    localStorage.setItem('redcarduh_color_theme', colorTheme);
    
    const root = document.documentElement;
    
    // Light/Dark
    if (theme === 'light') {
      root.classList.add('light');
    } else {
      root.classList.remove('light');
    }

    // Color Theme
    root.classList.forEach(cls => {
      if (cls.startsWith('theme-')) root.classList.remove(cls);
    });
    root.classList.add(`theme-${colorTheme}`);
  }, [theme, colorTheme]);

  const [userData, setUserData] = useState<UserData>(() => {
    const saved = localStorage.getItem('redcarduh_user');
    return saved ? JSON.parse(saved) : INITIAL_USER_DATA;
  });

  const [config, setConfig] = useState<WorkoutConfig>(() => {
    const saved = localStorage.getItem('redcarduh_config');
    return saved ? JSON.parse(saved) : INITIAL_CONFIG;
  });

  const [completedDays, setCompletedDays] = useState<number[]>(() => {
    const saved = localStorage.getItem('redcarduh_completed');
    return saved ? JSON.parse(saved) : [];
  });

  const [view, setView] = useState<'onboarding' | 'dashboard' | 'workout' | 'settings' | 'summary' | 'progress'>(
    userData.onboarded ? 'dashboard' : 'onboarding'
  );

  const [lastStats, setLastStats] = useState<{ calories: number; duration: number } | null>(null);

  const currentPhase = useMemo(() => Math.floor((completedDays.length) / 30) + 1, [completedDays]);
  const phaseDayOffset = useMemo(() => (currentPhase - 1) * 30, [currentPhase]);
  const phaseProgress = useMemo(() => (completedDays.filter(d => d > phaseDayOffset && d <= phaseDayOffset + 30).length), [completedDays, phaseDayOffset]);

  const [session, setSession] = useState<SessionState>({
    isActive: false,
    currentDay: 1,
    currentExerciseIndex: 0,
    isResting: false,
    restTimeLeft: config.restDuration,
    startTime: null,
  });

  // Persistence
  useEffect(() => localStorage.setItem('redcarduh_user', JSON.stringify(userData)), [userData]);
  useEffect(() => localStorage.setItem('redcarduh_config', JSON.stringify(config)), [config]);
  useEffect(() => localStorage.setItem('redcarduh_completed', JSON.stringify(completedDays)), [completedDays]);

  const getWorkoutForDay = useCallback((day: number, focusCategory?: string) => {
    const intensity = 1 + (day - 1) * 0.05;
    
    if (focusCategory) {
      const catExercises = EXERCISES.filter(e => e.category === focusCategory);
      return catExercises.map(base => ({ ...base, reps: Math.round(base.baseReps * intensity) }));
    }

    return CATEGORIES.map(cat => {
      const catExercises = EXERCISES.filter(e => e.category === cat);
      const base = catExercises[day % catExercises.length];
      return { ...base, reps: Math.round(base.baseReps * intensity) };
    });
  }, []);

  const currentWorkout = useMemo(() => getWorkoutForDay(session.currentDay, session.focusCategory), [session.currentDay, session.focusCategory, getWorkoutForDay]);

  const calculateCalories = useCallback((met: number, durationSec: number) => {
    return (met * userData.weight * (durationSec / 3600));
  }, [userData.weight]);

  const startWorkout = (day: number, focusCategory?: string) => {
    setSession({
      isActive: true,
      currentDay: day,
      currentExerciseIndex: 0,
      isResting: false,
      restTimeLeft: config.restDuration,
      startTime: Date.now(),
      focusCategory
    });
    setView('workout');
  };

  const nextExercise = () => {
    if (session.currentExerciseIndex < currentWorkout.length - 1) {
      setSession(prev => ({ ...prev, isResting: true, restTimeLeft: config.restDuration }));
    } else {
      const durationMin = Math.floor((Date.now() - (session.startTime || Date.now())) / 60000);
      const totalCals = currentWorkout.reduce((acc, ex) => acc + calculateCalories(ex.met, 60), 0);
      setLastStats({ calories: Math.round(totalCals), duration: durationMin });
      setCompletedDays(prev => [...new Set([...prev, session.currentDay])]);
      setView('summary');
      setSession(prev => ({ ...prev, isActive: false }));
    }
  };

  const skipToNextExercise = () => {
    if (session.currentExerciseIndex < currentWorkout.length - 1) {
      setSession(prev => ({ ...prev, isResting: false, currentExerciseIndex: prev.currentExerciseIndex + 1 }));
    }
  };

  const previousExercise = () => {
    if (session.currentExerciseIndex > 0) {
      setSession(prev => ({ ...prev, isResting: false, currentExerciseIndex: prev.currentExerciseIndex - 1 }));
    }
  };

  useEffect(() => {
    let timer: any;
    if (session.isActive && session.isResting && session.restTimeLeft > 0) {
      timer = setInterval(() => setSession(prev => ({ ...prev, restTimeLeft: prev.restTimeLeft - 1 })), 1000);
    } else if (session.restTimeLeft === 0 && session.isResting) {
      setSession(prev => ({ ...prev, isResting: false, currentExerciseIndex: prev.currentExerciseIndex + 1 }));
    }
    return () => clearInterval(timer);
  }, [session.isActive, session.isResting, session.restTimeLeft]);

  // --- Views ---

  const OnboardingView = () => (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 relative">
      <LiquidBackground />
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={SPRING} className="w-full max-w-md space-y-10">
        <div className="text-center space-y-3">
          <h1 className="text-5xl text-nothing-accent font-dot tracking-tighter">RED-CARDUH</h1>
          <p className="text-nothing-muted font-sans text-xs font-bold uppercase tracking-[0.3em]">Identity Protocol 2.0</p>
        </div>
        <Card className="space-y-8">
          <Input label="Protocol Name" type="text" value={userData.name} onChange={v => setUserData(p => ({ ...p, name: v }))} />
          <div className="grid grid-cols-2 gap-6">
            <Input label="Height (cm)" type="number" value={userData.height} onChange={v => setUserData(p => ({ ...p, height: Number(v) }))} />
            <Input label="Weight (kg)" type="number" value={userData.weight} onChange={v => setUserData(p => ({ ...p, weight: Number(v) }))} />
          </div>
          <Input label="Date of Birth" type="date" value={userData.dob} onChange={v => setUserData(p => ({ ...p, dob: v }))} />
          <div className="space-y-3">
            <label className="text-[10px] font-sans font-bold text-nothing-muted uppercase tracking-widest ml-1">Gender</label>
            <div className="grid grid-cols-3 gap-3">
              {(['male', 'female', 'other'] as Gender[]).map(g => (
                <button 
                  key={g} 
                  onClick={() => setUserData(p => ({ ...p, gender: g }))} 
                  className={cn(
                    "py-4 font-dot text-xs squircle border transition-all glass-heavy uppercase", 
                    userData.gender === g 
                      ? "bg-nothing-accent border-nothing-accent shadow-lg text-white" 
                      : "bg-white/5 border-white/5 hover:bg-white/10"
                  )}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
          <Button className="w-full" onClick={() => { setUserData(p => ({ ...p, onboarded: true })); setView('dashboard'); }}>Initialize Grid</Button>
        </Card>
      </motion.div>
    </div>
  );

  const DashboardView = () => (
    <div className="min-h-screen p-8 pb-32 max-w-5xl mx-auto space-y-12 relative">
      <LiquidBackground />
      <header className="flex justify-between items-end">
        <div className="space-y-1">
          <p className="text-nothing-accent font-dot text-sm mb-1">WELCOME, {userData.name || 'OPERATOR'}</p>
          <h1 className="text-3xl text-nothing-accent font-dot">RED-CARDUH</h1>
          <p className="text-nothing-muted text-[10px] font-bold uppercase tracking-[0.4em]">Phase {currentPhase}: Neural Grid</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="flex items-center gap-6 border-l-4 border-l-nothing-accent">
          <div className="p-4 bg-nothing-accent/20 squircle"><Flame className="text-nothing-accent" size={28} /></div>
          <div><p className="text-[10px] font-bold text-nothing-muted uppercase tracking-widest">Streak</p><p className="text-3xl font-dot">{completedDays.length} DAYS</p></div>
        </Card>
        <Card className="flex items-center gap-6 border-l-4 border-l-nothing-text/20">
          <div className="p-4 bg-nothing-text/5 squircle"><Activity className="text-nothing-text/40" size={28} /></div>
          <div><p className="text-[10px] font-bold text-nothing-muted uppercase tracking-widest">Intensity</p><p className="text-3xl font-dot">{(1 + (completedDays.length * 0.05)).toFixed(2)}X</p></div>
        </Card>
        <Card className="flex items-center gap-6 border-l-4 border-l-nothing-text/20">
          <div className="p-4 bg-nothing-text/5 squircle"><Scale className="text-nothing-text/40" size={28} /></div>
          <div><p className="text-[10px] font-bold text-nothing-muted uppercase tracking-widest">Weight</p><p className="text-3xl font-dot">{userData.weight} KG</p></div>
        </Card>
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-center px-2">
          <h2 className="text-xs font-bold text-nothing-muted uppercase tracking-[0.3em]">Progress Tracker</h2>
          <span className="text-[10px] font-mono text-nothing-accent">{phaseProgress}/30 DAYS (PHASE {currentPhase})</span>
        </div>
        <Card className="p-1 overflow-hidden">
          <div className="h-4 w-full bg-white/5 squircle overflow-hidden relative">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${(phaseProgress / 30) * 100}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="absolute inset-y-0 left-0 bg-nothing-accent shadow-[0_0_20px_rgba(255,0,0,0.5)]"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[8px] font-bold text-white mix-blend-difference uppercase tracking-widest">
                Phase {currentPhase} Synchronization: {Math.round((phaseProgress / 30) * 100)}%
              </span>
            </div>
          </div>
        </Card>
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-center px-2">
          <h2 className="text-xs font-bold text-nothing-muted uppercase tracking-[0.3em]">Targeted Days</h2>
          <span className="text-[10px] font-mono text-nothing-muted">Neural Focus</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {CATEGORIES.map(cat => (
            <motion.button
              key={cat}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => startWorkout(completedDays.length + 1, cat)}
              className="glass-heavy p-6 flex flex-col items-center gap-4 group hover:bg-nothing-accent/10 transition-colors"
            >
              <div className="w-12 h-12 bg-nothing-accent/20 squircle flex items-center justify-center group-hover:bg-nothing-accent/40 transition-colors">
                {cat === 'Legs' && <Activity size={24} className="text-nothing-accent" />}
                {cat === 'Abs' && <Flame size={24} className="text-nothing-accent" />}
                {cat === 'Shoulders' && <Scale size={24} className="text-nothing-accent" />}
                {cat === 'Arms & Biceps' && <Dumbbell size={24} className="text-nothing-accent" />}
                {cat === 'Back' && <User size={24} className="text-nothing-accent" />}
              </div>
              <span className="text-[10px] font-dot text-center leading-tight">{cat.toUpperCase()}</span>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-center px-2">
          <h2 className="text-xs font-bold text-nothing-muted uppercase tracking-[0.3em]">Training Matrix</h2>
          <span className="text-[10px] font-mono text-nothing-accent">DAYS {phaseDayOffset + 1} - {phaseDayOffset + 30}</span>
        </div>
        <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 gap-3">
          {Array.from({ length: 30 }).map((_, i) => {
            const day = phaseDayOffset + i + 1;
            const isDone = completedDays.includes(day);
            const isNext = day === (completedDays.length > 0 ? Math.max(...completedDays) + 1 : 1);
            return (
              <motion.button key={day} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }} transition={SPRING} onClick={() => startWorkout(day)} className={cn("aspect-square flex flex-col items-center justify-center border-2 transition-all relative overflow-hidden squircle", isDone ? "bg-nothing-accent border-nothing-accent shadow-lg" : isNext ? "border-nothing-accent bg-nothing-accent/10" : "border-white/5 bg-white/5 hover:border-white/20")}>
                <span className="text-sm font-dot">{day}</span>
                {isDone && <CheckCircle2 size={14} className="mt-1" />}
                {!isDone && !isNext && day > (completedDays.length + 1) && <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center"><span className="text-[8px] font-bold opacity-30 tracking-tighter">LOCKED</span></div>}
              </motion.button>
            );
          })}
        </div>
      </div>

      <Card className="bg-nothing-accent/10 border-nothing-accent/30 p-10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="space-y-3 text-center md:text-left">
            <h3 className="text-xl font-dot">NEXT PROTOCOL</h3>
            <p className="text-sm text-nothing-muted font-sans font-medium">Day {completedDays.length + 1}: Progressive intensity scaling active.</p>
          </div>
          <Button onClick={() => startWorkout(completedDays.length + 1)} className="w-full md:w-auto">RESUME SESSION <Play size={16} className="inline ml-2 fill-current" /></Button>
        </div>
      </Card>
    </div>
  );

  const ProgressView = () => (
    <div className="min-h-screen p-8 pb-32 max-w-5xl mx-auto space-y-12 relative">
      <LiquidBackground />
      <header className="flex justify-between items-end">
        <div className="space-y-1">
          <h1 className="text-3xl font-dot">PROGRESS</h1>
          <p className="text-nothing-muted text-[10px] font-bold uppercase tracking-[0.4em]">Biometric Analytics</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="space-y-6">
          <h3 className="text-sm font-dot text-nothing-accent">COMPLETION RATE</h3>
          <div className="relative h-48 flex items-center justify-center">
            <svg className="w-40 h-40 transform -rotate-90">
              <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
              <motion.circle 
                cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" 
                strokeDasharray={440} 
                initial={{ strokeDashoffset: 440 }}
                animate={{ strokeDashoffset: 440 - (440 * (phaseProgress / 30)) }}
                transition={{ duration: 2, ease: "easeOut" }}
                className="text-nothing-accent" 
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-dot">{Math.round((phaseProgress / 30) * 100)}%</span>
              <span className="text-[8px] font-bold text-nothing-muted uppercase">Phase {currentPhase}</span>
            </div>
          </div>
          <div className="pt-4 border-t border-white/5">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-nothing-muted">
              <span>Total Protocols</span>
              <span>{completedDays.length}</span>
            </div>
          </div>
        </Card>

        <Card className="space-y-6">
          <h3 className="text-sm font-dot text-nothing-accent">CHECKPOINTS</h3>
          <div className="space-y-4 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
            {Array.from({ length: currentPhase - 1 }).map((_, i) => (
              <div key={i} className="flex justify-between items-center p-4 bg-nothing-accent/10 squircle border border-nothing-accent/20">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-nothing-accent/20 rounded-full flex items-center justify-center"><CheckCircle2 size={14} className="text-nothing-accent" /></div>
                  <span className="text-xs font-bold uppercase tracking-widest">Checkpoint {i + 1}</span>
                </div>
                <span className="text-[10px] font-mono text-nothing-accent">DAYS {(i * 30) + 1} - {(i + 1) * 30}</span>
              </div>
            ))}
            {currentPhase === 1 && (
              <p className="text-xs text-nothing-muted italic">No checkpoints reached yet. Complete 30 days to unlock.</p>
            )}
          </div>
        </Card>
      </div>

      <Card className="border-l-4 border-l-nothing-accent">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-nothing-accent/20 squircle"><Scale className="text-nothing-accent" size={24} /></div>
          <div className="flex-1">
            <p className="text-[10px] font-bold text-nothing-muted uppercase tracking-widest">Current Weight</p>
            <p className="text-2xl font-dot">{userData.weight} KG</p>
          </div>
          <Button variant="outline" className="text-[10px] py-2 px-4" onClick={() => setView('settings')}>Update</Button>
        </div>
      </Card>

      <div className="space-y-6">
        <h3 className="text-sm font-dot text-nothing-accent px-2">RECENT ACTIVITY</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[...completedDays].reverse().slice(0, 6).map(day => (
            <div key={day}>
              <Card className="flex justify-between items-center p-4 bg-white/5 border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-nothing-accent/20 rounded-full flex items-center justify-center"><CheckCircle2 size={14} className="text-nothing-accent" /></div>
                  <span className="text-xs font-bold uppercase tracking-widest">Protocol {day}</span>
                </div>
                <span className="text-[10px] font-mono text-nothing-muted">DONE</span>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const WorkoutView = () => {
    const exercise = currentWorkout[session.currentExerciseIndex];
    if (session.isResting) {
      return (
        <div className="red-screen-depth flex-col gap-12">
          <h1 className="text-8xl md:text-[12rem] font-dot text-white drop-shadow-2xl">REST</h1>
          <div className="text-center space-y-4">
            <p className="text-5xl font-dot text-white">{session.restTimeLeft}S</p>
            <p className="text-xs font-sans font-bold text-white/60 uppercase tracking-[0.4em]">Next: {currentWorkout[session.currentExerciseIndex + 1]?.name}</p>
          </div>
          <Button variant="secondary" onClick={() => setSession(p => ({ ...p, restTimeLeft: 0 }))} className="bg-nothing-text/10 hover:bg-nothing-text/20 flex items-center gap-2">
            SKIP RECOVERY <SkipForward size={16} />
          </Button>
        </div>
      );
    }

    return (
      <div className="min-h-screen p-8 flex flex-col max-w-3xl mx-auto relative">
        <LiquidBackground />
        <DynamicIsland isActive={session.isActive}>
          <div className="flex items-center gap-3 px-2">
            <div className="w-2 h-2 bg-nothing-accent rounded-full animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Live MET: {exercise.met}</span>
            <div className="w-px h-4 bg-white/20 mx-1" />
            <Clock size={14} className="text-nothing-accent" />
            <span className="text-[10px] font-mono">{(session.currentExerciseIndex + 1)}/{currentWorkout.length}</span>
          </div>
        </DynamicIsland>

        <header className="flex justify-between items-center mb-16 mt-12">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setView('dashboard')} className="flex items-center gap-3 text-nothing-muted hover:text-nothing-text transition-all font-sans font-bold text-[10px] uppercase tracking-widest"><ArrowLeft size={18} /> ABORT</motion.button>
          <div className="flex items-center gap-4">
            <div className="text-right space-y-1">
              <p className="text-[10px] font-bold text-nothing-muted uppercase tracking-widest">Protocol {session.currentDay}</p>
              <p className="text-sm font-dot text-nothing-accent">PHASE {session.currentExerciseIndex + 1}</p>
            </div>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                const newRest = prompt("Adjust Rest Duration (seconds):", config.restDuration.toString());
                if (newRest && !isNaN(Number(newRest))) {
                  setConfig(p => ({ ...p, restDuration: Number(newRest) }));
                }
              }}
              className="p-3 glass-heavy squircle text-nothing-muted hover:text-nothing-accent transition-colors"
              title="Adjust Rest"
            >
              <SettingsIcon size={16} />
            </motion.button>
          </div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center space-y-16 text-center">
          <motion.div key={exercise.id} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={SPRING} className="space-y-6">
            <p className="text-nothing-accent font-sans font-black tracking-[0.5em] text-[10px] uppercase">{exercise.category}</p>
            <h1 className="text-5xl md:text-8xl font-dot leading-none">{exercise.name}</h1>
            <div className="flex items-center justify-center gap-6 pt-4">
              <div className="glass-heavy px-10 py-6 squircle border-2 border-nothing-accent/20">
                <p className="text-6xl font-dot text-nothing-accent">{exercise.reps}</p>
                <p className="text-[10px] font-sans font-bold text-nothing-muted uppercase tracking-widest mt-2">Target Reps</p>
              </div>
            </div>
          </motion.div>

          <div className="w-64 h-64 glass-heavy squircle relative flex items-center justify-center border-2 border-white/5">
            <motion.div animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }} transition={{ duration: 3, repeat: Infinity }} className="absolute inset-0 border-2 border-nothing-accent/20 m-8 squircle" />
            <Dumbbell size={64} className="text-nothing-accent drop-shadow-[0_0_15px_rgba(255,0,0,0.5)]" />
          </div>
        </div>

        <footer className="py-12 flex items-center gap-4">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={previousExercise}
            disabled={session.currentExerciseIndex === 0}
            className={cn(
              "p-6 glass-heavy squircle transition-all",
              session.currentExerciseIndex === 0 ? "opacity-30 cursor-not-allowed" : "hover:bg-nothing-accent/10 text-nothing-text"
            )}
          >
            <ChevronLeft size={24} />
          </motion.button>
          
          <Button className="flex-1 text-2xl py-8 shadow-2xl" onClick={nextExercise}>
            COMPLETE PHASE
          </Button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={skipToNextExercise}
            disabled={session.currentExerciseIndex === currentWorkout.length - 1}
            className={cn(
              "p-6 glass-heavy squircle transition-all",
              session.currentExerciseIndex === currentWorkout.length - 1 ? "opacity-30 cursor-not-allowed" : "hover:bg-nothing-accent/10 text-nothing-text"
            )}
          >
            <ChevronRight size={24} />
          </motion.button>
        </footer>
      </div>
    );
  };

  const SummaryView = () => (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 relative">
      <LiquidBackground />
      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={SPRING} className="w-full max-w-md space-y-10 text-center">
        <div className="space-y-4">
          <div className="w-24 h-24 bg-nothing-accent/20 squircle mx-auto flex items-center justify-center border-2 border-nothing-accent/30"><CheckCircle2 size={48} className="text-nothing-accent" /></div>
          <h1 className="text-5xl font-dot">DAY {session.currentDay} COMPLETE</h1>
          <p className="text-nothing-muted font-sans font-bold text-xs uppercase tracking-[0.4em]">Neural Sync Successful</p>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <Card className="border-l-4 border-l-nothing-accent bg-nothing-accent/5">
            <p className="text-[10px] font-bold text-nothing-muted uppercase tracking-widest mb-2">Energy</p>
            <p className="text-3xl font-dot text-nothing-accent">{lastStats?.calories} KCAL</p>
          </Card>
          <Card className="border-l-4 border-l-white/20">
            <p className="text-[10px] font-bold text-nothing-muted uppercase tracking-widest mb-2">Time</p>
            <p className="text-3xl font-dot">{lastStats?.duration} MIN</p>
          </Card>
        </div>
        <Button className="w-full" onClick={() => setView('dashboard')}>RETURN TO GRID</Button>
      </motion.div>
    </div>
  );

  const SettingsView = () => (
    <div className="min-h-screen p-8 pb-32 max-w-3xl mx-auto space-y-12 relative">
      <LiquidBackground />
      <header className="flex justify-between items-end">
        <div className="space-y-1">
          <h1 className="text-3xl font-dot">SETTINGS</h1>
          <p className="text-nothing-muted text-[10px] font-bold uppercase tracking-[0.4em]">System Configuration</p>
        </div>
      </header>
      <div className="space-y-10">
        <section className="space-y-6">
          <h2 className="text-xs font-bold text-nothing-muted uppercase tracking-[0.3em] ml-2">THEME</h2>
          <ThemeSwitcher theme={theme} setTheme={setTheme} colorTheme={colorTheme} setColorTheme={setColorTheme} />
        </section>
        <section className="space-y-6">
          <h2 className="text-xs font-bold text-nothing-muted uppercase tracking-[0.3em] ml-2">NAME</h2>
          <Card className="space-y-6">
            <Input label="Name" type="text" value={userData.name} onChange={v => setUserData(p => ({ ...p, name: v }))} />
          </Card>
        </section>
        <section className="space-y-6">
          <h2 className="text-xs font-bold text-nothing-muted uppercase tracking-[0.3em] ml-2">TIMER</h2>
          <Card className="space-y-10">
            <div className="space-y-4">
              <div className="flex justify-between items-end px-1">
                <label className="text-[10px] font-bold text-nothing-muted uppercase tracking-widest">Session Duration</label>
                <span className="text-xl font-dot text-nothing-accent">{config.sessionDuration}M</span>
              </div>
              <input type="range" min="10" max="120" step="5" value={config.sessionDuration} onChange={e => setConfig(p => ({ ...p, sessionDuration: Number(e.target.value) }))} className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-nothing-accent" />
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-end px-1">
                <label className="text-[10px] font-bold text-nothing-muted uppercase tracking-widest">Rest Duration</label>
                <span className="text-xl font-dot text-nothing-accent">{config.restDuration}S</span>
              </div>
              <input type="range" min="10" max="90" step="5" value={config.restDuration} onChange={e => setConfig(p => ({ ...p, restDuration: Number(e.target.value) }))} className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-nothing-accent" />
            </div>
          </Card>
        </section>
        <section className="space-y-6">
          <h2 className="text-xs font-bold text-nothing-muted uppercase tracking-[0.3em] ml-2">SYNC</h2>
          <Card className="flex justify-between items-center bg-white/5">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-nothing-accent/20 squircle flex items-center justify-center border border-nothing-accent/30"><Activity size={24} className="text-nothing-accent" /></div>
              <div><p className="text-sm font-bold font-sans">Health Connect</p><p className="text-[10px] text-nothing-muted font-bold uppercase tracking-widest">Neural Link Active</p></div>
            </div>
            <div className="flex items-center gap-3 glass-heavy px-4 py-2 squircle border-green-500/20"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" /><span className="text-[10px] font-mono font-bold">SYNCED</span></div>
          </Card>
        </section>
        <section className="space-y-6 pt-6">
          <Button variant="danger" className="w-full py-6" onClick={() => { if (confirm('Wipe neural data? This cannot be undone.')) { localStorage.clear(); window.location.reload(); } }}>PURGE ALL DATA</Button>
        </section>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-nothing-bg text-nothing-text selection:bg-nothing-accent selection:text-white font-sans">
      <AnimatePresence mode="wait">
        {view === 'onboarding' && <OnboardingView key="onboarding" />}
        {view === 'dashboard' && <DashboardView key="dashboard" />}
        {view === 'progress' && <ProgressView key="progress" />}
        {view === 'workout' && <WorkoutView key="workout" />}
        {view === 'settings' && <SettingsView key="settings" />}
        {view === 'summary' && <SummaryView key="summary" />}
      </AnimatePresence>

      {(view === 'dashboard' || view === 'settings' || view === 'progress') && (
        <div className="fixed bottom-10 left-0 right-0 flex justify-center z-40 pointer-events-none">
          <nav className="glass-heavy p-2 flex gap-2 border shadow-2xl pointer-events-auto">
            {[
              { id: 'dashboard', icon: Dumbbell, label: 'Home' },
              { id: 'progress', icon: Activity, label: 'Progress' },
              { id: 'settings', icon: SettingsIcon, label: 'Settings' },
            ].map((tab) => {
              const isActive = view === tab.id;
              const Icon = tab.icon;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setView(tab.id as any)}
                  className={cn(
                    "relative p-4 squircle transition-all flex items-center gap-3 z-10",
                    isActive ? "text-white" : "text-nothing-muted hover:text-nothing-text/60"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-pill"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      className="absolute inset-0 bg-nothing-accent squircle -z-10 shadow-[0_0_20px_rgba(255,0,0,0.4)]"
                    />
                  )}
                  <Icon size={20} className={cn("transition-transform", isActive && "scale-110")} />
                  <AnimatePresence mode="popLayout">
                    {isActive && (
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="text-[10px] font-bold uppercase tracking-widest whitespace-nowrap"
                      >
                        {tab.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              );
            })}
          </nav>
        </div>
      )}
    </div>
  );
}

