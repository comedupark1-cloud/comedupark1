import React from 'react';
import { Search, Compass, Swords, Volume2, VolumeX, Sparkles, CheckCircle2 } from 'lucide-react';
import { sound } from '../utils/sound';

export type StageId = 'sequential' | 'binary' | 'battle';

interface HeaderProps {
  currentStage: StageId;
  onSelectStage: (stage: StageId) => void;
  unlockedStages: Record<StageId, boolean>;
  stageProgress: {
    sequential: number; // 0 ~ 5
    binary: number;     // 0 ~ 5
    battle: boolean;    // 완료 여부
  };
  isMuted: boolean;
  onToggleMute: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentStage,
  onSelectStage,
  unlockedStages,
  stageProgress,
  isMuted,
  onToggleMute,
}) => {
  const stages: { id: StageId; stepNum: string; title: string; icon: React.ReactNode; desc: string }[] = [
    {
      id: 'sequential',
      stepNum: '1단계',
      title: '순차 탐색',
      icon: <Search className="w-5 h-5" />,
      desc: '처음부터 하나씩 차례로!',
    },
    {
      id: 'binary',
      stepNum: '2단계',
      title: '이진 탐색',
      icon: <Compass className="w-5 h-5" />,
      desc: '반씩 쪼개며 초고속 탐색!',
    },
    {
      id: 'battle',
      stepNum: '3단계',
      title: '탐색 대결 & 퀴즈',
      icon: <Swords className="w-5 h-5" />,
      desc: '직접 대결하고 마스터 달성!',
    },
  ];

  return (
    <header className="sticky top-0 z-50 bg-amber-50/95 backdrop-blur-md border-b-2 border-amber-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3">
        {/* Top bar with Branding & Mute */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-white shadow-md shadow-amber-300/40">
              <span className="text-xl">🕵️‍♂️</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg md:text-xl font-extrabold text-amber-950 tracking-tight flex items-center gap-1.5">
                  알고리즘 탐정단
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 border border-amber-300">
                    중학 코딩 LAB
                  </span>
                </h1>
              </div>
              <p className="text-xs text-amber-800/80 hidden sm:block">
                카드를 열며 배우는 순차 탐색과 이진 탐색의 모든 것!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onToggleMute();
                sound.playClick();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                isMuted
                  ? 'bg-stone-200 text-stone-600 border-stone-300 hover:bg-stone-300'
                  : 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200 shadow-sm'
              }`}
              title={isMuted ? '소리 켜기' : '소리 끄기'}
              aria-label="Sound Toggle"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-amber-600" />}
              <span>{isMuted ? '음소거' : '효과음 ON'}</span>
            </button>
          </div>
        </div>

        {/* 3-Stage Stepper Bar */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {stages.map((st) => {
            const isActive = currentStage === st.id;
            const isUnlocked = unlockedStages[st.id];
            const isCompleted =
              st.id === 'sequential'
                ? stageProgress.sequential >= 5
                : st.id === 'binary'
                ? stageProgress.binary >= 5
                : stageProgress.battle;

            return (
              <button
                key={st.id}
                disabled={!isUnlocked}
                onClick={() => {
                  if (isUnlocked) {
                    sound.playClick();
                    onSelectStage(st.id);
                  }
                }}
                className={`relative text-left p-2.5 sm:p-3 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                  isActive
                    ? 'bg-white border-amber-500 shadow-md ring-2 ring-amber-400/30'
                    : isUnlocked
                    ? 'bg-amber-100/70 border-amber-200 hover:bg-amber-100/90 text-amber-900 cursor-pointer'
                    : 'bg-stone-100 border-stone-200 text-stone-400 cursor-not-allowed opacity-60'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black ${
                        isActive
                          ? 'bg-amber-500 text-white'
                          : isCompleted
                          ? 'bg-emerald-500 text-white'
                          : isUnlocked
                          ? 'bg-amber-200 text-amber-900'
                          : 'bg-stone-200 text-stone-500'
                      }`}
                    >
                      {st.id === 'sequential' ? '1' : st.id === 'binary' ? '2' : '3'}
                    </span>
                    <span className="text-xs font-extrabold hidden sm:inline text-amber-900/80">
                      {st.stepNum}
                    </span>
                  </div>

                  {isCompleted ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span className="hidden md:inline">완료</span>
                    </span>
                  ) : st.id !== 'battle' ? (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-950">
                      {st.id === 'sequential' ? stageProgress.sequential : stageProgress.binary} / 5
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-amber-700 flex items-center gap-0.5">
                      <Sparkles className="w-3 h-3" />
                      대결
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className={`${isActive ? 'text-amber-600' : 'text-stone-500'}`}>
                    {st.icon}
                  </div>
                  <span className={`text-xs sm:text-sm font-bold truncate ${isActive ? 'text-amber-950' : ''}`}>
                    {st.title}
                  </span>
                </div>

                {/* Progress bar inside card */}
                {st.id !== 'battle' ? (
                  <div className="w-full bg-stone-200 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isCompleted ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                      style={{
                        width: `${((st.id === 'sequential' ? stageProgress.sequential : stageProgress.binary) / 5) * 100}%`,
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-full bg-stone-200 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        stageProgress.battle ? 'bg-emerald-500 w-full' : 'bg-amber-500 w-0'
                      }`}
                    />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
