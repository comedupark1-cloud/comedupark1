import React, { useState } from 'react';
import { Header, StageId } from './components/Header';
import { SequentialSearch } from './components/SequentialSearch';
import { BinarySearch } from './components/BinarySearch';
import { ComparisonBattle } from './components/ComparisonBattle';
import { sound } from './utils/sound';

export default function App() {
  const [currentStage, setCurrentStage] = useState<StageId>('sequential');
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // 단계별 해금 여부
  const [unlockedStages, setUnlockedStages] = useState<Record<StageId, boolean>>({
    sequential: true,
    binary: false,
    battle: false,
  });

  // 단계별 문제 풀이 진행 상황
  const [stageProgress, setStageProgress] = useState<{
    sequential: number;
    binary: number;
    battle: boolean;
  }>({
    sequential: 0,
    binary: 0,
    battle: false,
  });

  // 사운드 토글
  const handleToggleMute = () => {
    const nextMuted = sound.toggleMute();
    setIsMuted(nextMuted);
  };

  // 1단계(순차 탐색) 완료 처리
  const handleCompleteSequential = () => {
    setUnlockedStages((prev) => ({ ...prev, binary: true }));
  };

  // 2단계(이진 탐색) 완료 처리
  const handleCompleteBinary = () => {
    setUnlockedStages((prev) => ({ ...prev, battle: true }));
  };

  // 3단계(대결 및 퀴즈) 완료 처리
  const handleCompleteBattle = () => {
    setStageProgress((prev) => ({ ...prev, battle: true }));
  };

  // 전체 리셋
  const handleResetAll = () => {
    setCurrentStage('sequential');
    setUnlockedStages({
      sequential: true,
      binary: false,
      battle: false,
    });
    setStageProgress({
      sequential: 0,
      binary: 0,
      battle: false,
    });
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-900 flex flex-col font-sans selection:bg-amber-200">
      {/* 고정 상단 헤더 & 상태바 */}
      <Header
        currentStage={currentStage}
        onSelectStage={(stage) => setCurrentStage(stage)}
        unlockedStages={unlockedStages}
        stageProgress={stageProgress}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
      />

      {/* 메인 콘텐츠 영역 */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 sm:py-8">
        {currentStage === 'sequential' && (
          <SequentialSearch
            progress={stageProgress.sequential}
            onUpdateProgress={(p) => setStageProgress((prev) => ({ ...prev, sequential: p }))}
            onCompleteStage={handleCompleteSequential}
            onNextStage={() => {
              setUnlockedStages((prev) => ({ ...prev, binary: true }));
              setCurrentStage('binary');
            }}
          />
        )}

        {currentStage === 'binary' && (
          <BinarySearch
            progress={stageProgress.binary}
            onUpdateProgress={(p) => setStageProgress((prev) => ({ ...prev, binary: p }))}
            onCompleteStage={handleCompleteBinary}
            onNextStage={() => {
              setUnlockedStages((prev) => ({ ...prev, battle: true }));
              setCurrentStage('battle');
            }}
          />
        )}

        {currentStage === 'battle' && (
          <ComparisonBattle
            onCompleteBattle={handleCompleteBattle}
            onResetAll={handleResetAll}
          />
        )}
      </main>

      {/* 푸터 */}
      <footer className="mt-auto border-t border-amber-200/80 bg-amber-50/60 py-6 text-center text-xs text-amber-900/70">
        <div className="max-w-4xl mx-auto px-4 space-y-1">
          <p className="font-extrabold text-amber-950">
            🕵️ 알고리즘 탐정단 (Algorithm Detective LAB)
          </p>
          <p>
            중학교 정보 교육과정: 탐색 알고리즘(순차 탐색과 이진 탐색)의 이해 및 성능 비교
          </p>
          <p className="text-[11px] text-stone-400 pt-1">
            Web Audio API 내장 효과음 &amp; 반응형 인터랙티브 학습 플랫폼
          </p>
        </div>
      </footer>
    </div>
  );
}
