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
  ChevronRight
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
}

// --- Constants ---
const CATEGORIES = ["Arms & Biceps", "Legs", "Shoulders", "Abs", "Back"] as const;

const EXERCISES: Exercise[] = [
  { id: 'e1', name: 'Push-ups', category: 'Arms & Biceps', met: 8.0, baseReps: 10 },
  { id: 'e2', name: 'Diamond Push-ups', category: 'Arms & Biceps', met: 8.5, baseReps: 8 },
  { id: 'e3', name: 'Bicep Curls', category: 'Arms & Biceps', met: 4.0, baseReps: 15 },
  { id: 'e4', name: 'Squats', category: 'Legs', met: 5.0, baseReps: 15 },
  { id: 'e5', name: 'Lunges', category: 'Legs', met: 5.5, baseReps: 12 },
  { id: 'e6', name: 'Calf Raises', category: 'Legs', met: 3.5, baseReps: 20 },
  { id: 'e7', name: 'Shoulder Taps', category: 'Shoulders', met: 4.5, baseReps: 20 },
  { id: 'e8', name: 'Pike Push-ups', category: 'Shoulders', met: 6.0, baseReps: 8 },
  { id: 'e9', name: 'Crunches', category: 'Abs', met: 3.8, baseReps: 20 },
  { id: 'e10', name: 'Plank', category: 'Abs', met: 4.0, baseReps: 30 },
  { id: 'e11', name: 'Leg Raises', category: 'Abs', met: 4.0, baseReps: 12 },
  { id: 'e12', name: 'Superman', category: 'Back', met: 4.0, baseReps: 12 },
  { id: 'e13', name: 'Bird Dog', category: 'Back', met: 3.5, baseReps: 15 },
];

const INITIAL_USER_DATA: UserData = {
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
    secondary: 'bg-white/10 text-white backdrop-blur-[40px] hover:bg-white/20',
    outline: 'border border-white/20 text-white hover:bg-white/5',
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
      className="bg-white/5 border border-white/10 p-4 font-mono text-white squircle focus:border-nothing-accent outline-none transition-all focus:bg-white/10"
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

// --- Main App ---

export default function App() {
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

  const [view, setView] = useState<'onboarding' | 'dashboard' | 'workout' | 'settings' | 'summary'>(
    userData.onboarded ? 'dashboard' : 'onboarding'
  );

  const [lastStats, setLastStats] = useState<{ calories: number; duration: number } | null>(null);

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

  const getWorkoutForDay = useCallback((day: number) => {
    const intensity = 1 + (day - 1) * 0.05;
    return CATEGORIES.map(cat => {
      const catExercises = EXERCISES.filter(e => e.category === cat);
      const base = catExercises[day % catExercises.length];
      return { ...base, reps: Math.round(base.baseReps * intensity) };
    });
  }, []);

  const currentWorkout = useMemo(() => getWorkoutForDay(session.currentDay), [session.currentDay, getWorkoutForDay]);

  const calculateCalories = useCallback((met: number, durationSec: number) => {
    return (met * userData.weight * (durationSec / 3600));
  }, [userData.weight]);

  const startWorkout = (day: number) => {
    setSession({
      isActive: true,
      currentDay: day,
      currentExerciseIndex: 0,
      isResting: false,
      restTimeLeft: config.restDuration,
      startTime: Date.now(),
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
          <div className="grid grid-cols-2 gap-6">
            <Input label="Height (cm)" type="number" value={userData.height} onChange={v => setUserData(p => ({ ...p, height: Number(v) }))} />
            <Input label="Weight (kg)" type="number" value={userData.weight} onChange={v => setUserData(p => ({ ...p, weight: Number(v) }))} />
          </div>
          <Input label="Date of Birth" type="date" value={userData.dob} onChange={v => setUserData(p => ({ ...p, dob: v }))} />
          <div className="space-y-3">
            <label className="text-[10px] font-sans font-bold text-nothing-muted uppercase tracking-widest ml-1">Gender</label>
            <div className="grid grid-cols-3 gap-3">
              {(['male', 'female', 'other'] as Gender[]).map(g => (
                <button key={g} onClick={() => setUserData(p => ({ ...p, gender: g }))} className={cn("py-4 font-dot text-xs squircle border border-white/10 uppercase transition-all", userData.gender === g ? "bg-nothing-accent border-nothing-accent shadow-lg" : "bg-white/5 hover:bg-white/10")}>{g}</button>
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
          <h1 className="text-3xl text-nothing-accent font-dot">RED-CARDUH</h1>
          <p className="text-nothing-muted text-[10px] font-bold uppercase tracking-[0.4em]">30-Day Neural Grid</p>
        </div>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setView('settings')} className="p-4 glass-heavy squircle hover:bg-white/10 transition-all"><SettingsIcon size={22} /></motion.button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="flex items-center gap-6 border-l-4 border-l-nothing-accent">
          <div className="p-4 bg-nothing-accent/20 squircle"><Flame className="text-nothing-accent" size={28} /></div>
          <div><p className="text-[10px] font-bold text-nothing-muted uppercase tracking-widest">Streak</p><p className="text-3xl font-dot">{completedDays.length} DAYS</p></div>
        </Card>
        <Card className="flex items-center gap-6 border-l-4 border-l-white/20">
          <div className="p-4 bg-white/5 squircle"><Activity className="text-white/40" size={28} /></div>
          <div><p className="text-[10px] font-bold text-nothing-muted uppercase tracking-widest">Intensity</p><p className="text-3xl font-dot">{(1 + (completedDays.length * 0.05)).toFixed(2)}X</p></div>
        </Card>
        <Card className="flex items-center gap-6 border-l-4 border-l-white/20">
          <div className="p-4 bg-white/5 squircle"><Scale className="text-white/40" size={28} /></div>
          <div><p className="text-[10px] font-bold text-nothing-muted uppercase tracking-widest">Weight</p><p className="text-3xl font-dot">{userData.weight} KG</p></div>
        </Card>
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-center px-2">
          <h2 className="text-xs font-bold text-nothing-muted uppercase tracking-[0.3em]">Training Matrix</h2>
          <span className="text-[10px] font-mono text-nothing-accent">{Math.round((completedDays.length / 30) * 100)}% COMPLETE</span>
        </div>
        <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 gap-3">
          {Array.from({ length: 30 }).map((_, i) => {
            const day = i + 1;
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

  const WorkoutView = () => {
    const exercise = currentWorkout[session.currentExerciseIndex];
    if (session.isResting) {
      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="red-screen-depth flex-col gap-12">
          <motion.h1 animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1, repeat: Infinity }} className="text-8xl md:text-[12rem] font-dot text-white drop-shadow-2xl">REST</motion.h1>
          <div className="text-center space-y-4">
            <p className="text-5xl font-dot text-white">{session.restTimeLeft}S</p>
            <p className="text-xs font-sans font-bold text-white/60 uppercase tracking-[0.4em]">Next: {currentWorkout[session.currentExerciseIndex + 1]?.name}</p>
          </div>
          <Button variant="secondary" onClick={() => setSession(p => ({ ...p, restTimeLeft: 0 }))} className="bg-white/20 hover:bg-white/30">SKIP RECOVERY</Button>
        </motion.div>
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
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setView('dashboard')} className="flex items-center gap-3 text-nothing-muted hover:text-white transition-all font-sans font-bold text-[10px] uppercase tracking-widest"><ArrowLeft size={18} /> ABORT</motion.button>
          <div className="text-right space-y-1">
            <p className="text-[10px] font-bold text-nothing-muted uppercase tracking-widest">Protocol {session.currentDay}</p>
            <p className="text-sm font-dot text-nothing-accent">PHASE {session.currentExerciseIndex + 1}</p>
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

        <footer className="py-12">
          <Button className="w-full text-2xl py-8 shadow-2xl" onClick={nextExercise}>COMPLETE PHASE</Button>
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
    <div className="min-h-screen p-8 max-w-3xl mx-auto space-y-12 relative">
      <LiquidBackground />
      <header className="flex items-center gap-6">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setView('dashboard')} className="p-4 glass-heavy squircle"><ArrowLeft size={22} /></motion.button>
        <h1 className="text-3xl font-dot">SETTINGS</h1>
      </header>
      <div className="space-y-10">
        <section className="space-y-6">
          <h2 className="text-xs font-bold text-nothing-muted uppercase tracking-[0.3em] ml-2">Session Parameters</h2>
          <Card className="space-y-10">
            <div className="space-y-4">
              <div className="flex justify-between items-end px-1">
                <label className="text-[10px] font-bold text-nothing-muted uppercase tracking-widest">Target Duration</label>
                <span className="text-xl font-dot text-nothing-accent">{config.sessionDuration}M</span>
              </div>
              <input type="range" min="10" max="120" step="5" value={config.sessionDuration} onChange={e => setConfig(p => ({ ...p, sessionDuration: Number(e.target.value) }))} className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-nothing-accent" />
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-end px-1">
                <label className="text-[10px] font-bold text-nothing-muted uppercase tracking-widest">Recovery Window</label>
                <span className="text-xl font-dot text-nothing-accent">{config.restDuration}S</span>
              </div>
              <input type="range" min="10" max="90" step="5" value={config.restDuration} onChange={e => setConfig(p => ({ ...p, restDuration: Number(e.target.value) }))} className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-nothing-accent" />
            </div>
          </Card>
        </section>
        <section className="space-y-6">
          <h2 className="text-xs font-bold text-nothing-muted uppercase tracking-[0.3em] ml-2">Biometric Sync</h2>
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
        {view === 'workout' && <WorkoutView key="workout" />}
        {view === 'settings' && <SettingsView key="settings" />}
        {view === 'summary' && <SummaryView key="summary" />}
      </AnimatePresence>

      {(view === 'dashboard' || view === 'settings') && (
        <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 glass-heavy p-3 flex gap-4 z-40 border-2 border-white/5 shadow-2xl">
          <button onClick={() => setView('dashboard')} className={cn("p-4 squircle transition-all flex items-center gap-3", view === 'dashboard' ? "bg-nothing-accent text-white shadow-lg" : "text-nothing-muted hover:bg-white/5")}>
            <Calendar size={20} />
            {view === 'dashboard' && <span className="text-[10px] font-bold uppercase tracking-widest">Grid</span>}
          </button>
          <button onClick={() => setView('settings')} className={cn("p-4 squircle transition-all flex items-center gap-3", view === 'settings' ? "bg-nothing-accent text-white shadow-lg" : "text-nothing-muted hover:bg-white/5")}>
            <User size={20} />
            {view === 'settings' && <span className="text-[10px] font-bold uppercase tracking-widest">Profile</span>}
          </button>
        </nav>
      )}
    </div>
  );
}

