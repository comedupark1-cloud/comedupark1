import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { 
  Compass, 
  ArrowRight, 
  Sparkles, 
  AlertCircle, 
  CheckCircle, 
  RotateCcw, 
  ArrowDown, 
  HelpCircle,
  TrendingDown,
  TrendingUp,
  Target,
  SlidersHorizontal
} from 'lucide-react';
import { sound } from '../utils/sound';

interface BinarySearchProps {
  onCompleteStage: () => void;
  onNextStage: () => void;
  progress: number;
  onUpdateProgress: (newProgress: number) => void;
}

interface BinaryCardItem {
  index: number;
  value: number;
  isOpen: boolean;
  isEliminated: boolean; // 탐색 범위에서 제외되어 흐려진 상태
  isTarget: boolean;
}

export const BinarySearch: React.FC<BinarySearchProps> = ({
  onCompleteStage,
  onNextStage,
  progress,
  onUpdateProgress,
}) => {
  const [activeTab, setActiveTab] = useState<'concept' | 'practice'>('concept');

  // --- 개념 데모 시뮬레이션 상태 ---
  // 15개 정렬된 예시 데이터
  const demoList = [11, 15, 23, 29, 34, 42, 48, 55, 63, 71, 77, 82, 89, 93, 99];
  const demoTarget = 77;
  const [demoLow, setDemoLow] = useState<number>(0);
  const [demoHigh, setDemoHigh] = useState<number>(14);
  const [demoStepNum, setDemoStepNum] = useState<number>(0);
  const [demoHistory, setDemoHistory] = useState<string[]>([]);
  const [demoFound, setDemoFound] = useState<boolean>(false);

  // --- 실습 상태 ---
  const [currentProblemNum, setCurrentProblemNum] = useState<number>(Math.max(1, progress + 1));
  const [cards, setCards] = useState<BinaryCardItem[]>([]);
  const [targetValue, setTargetValue] = useState<number>(0);
  const [low, setLow] = useState<number>(0);
  const [high, setHigh] = useState<number>(14);
  const [attempts, setAttempts] = useState<number>(0);
  const [isProblemSolved, setIsProblemSolved] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ text: string; type: 'info' | 'up' | 'down' | 'success' | 'warn' }>({
    text: '현재 남은 카드의 한가운데(Mid) 카드를 선택해 보세요!',
    type: 'info',
  });
  const [showNextStageModal, setShowNextStageModal] = useState<boolean>(false);

  // 실습 문제 생성 (15장 오름차순 정렬)
  const generateProblem = useCallback(() => {
    // 10 ~ 99 사이의 15개 고유 숫자를 오름차순 정렬
    const set = new Set<number>();
    while (set.size < 15) {
      set.add(Math.floor(Math.random() * 88) + 10);
    }
    const sorted = Array.from(set).sort((a, b) => a - b);

    // 15개 중 하나를 목표값으로 선택 (단, 첫 시도에 바로 안 맞게 양쪽 분기 경험 유도)
    const candidates = [2, 3, 5, 8, 9, 11, 12];
    const targetIdx = candidates[Math.floor(Math.random() * candidates.length)];
    const chosenTarget = sorted[targetIdx];

    const newCards: BinaryCardItem[] = sorted.map((val, idx) => ({
      index: idx,
      value: val,
      isOpen: false,
      isEliminated: false,
      isTarget: val === chosenTarget,
    }));

    setCards(newCards);
    setTargetValue(chosenTarget);
    setLow(0);
    setHigh(14);
    setAttempts(0);
    setIsProblemSolved(false);
    setFeedback({
      text: `목표 숫자 [ ${chosenTarget} ]을(를) 찾으세요! 현재 범위의 정중앙 카드를 확인해 보세요.`,
      type: 'info',
    });
  }, []);

  useEffect(() => {
    generateProblem();
  }, [generateProblem]);

  // 계산된 중간 인덱스
  const currentMid = Math.floor((low + high) / 2);

  // 개념 데모 다음 단계 진행
  const stepDemo = () => {
    sound.playClick();
    if (demoFound || demoLow > demoHigh) return;

    const mid = Math.floor((demoLow + demoHigh) / 2);
    const midVal = demoList[mid];
    const nextStep = demoStepNum + 1;
    setDemoStepNum(nextStep);

    if (midVal === demoTarget) {
      setDemoFound(true);
      sound.playCorrect();
      setDemoHistory((prev) => [
        ...prev,
        `${nextStep}회차: 인덱스 ${mid}번(${midVal}) 확인 ➔ 목표(${demoTarget})와 일치! 탐색 성공!`,
      ]);
    } else if (midVal < demoTarget) {
      sound.playEliminate();
      setDemoHistory((prev) => [
        ...prev,
        `${nextStep}회차: 인덱스 ${mid}번(${midVal}) 확인 ➔ 목표(${demoTarget})보다 작음! 왼쪽 절반(0~${mid}) 탈락`,
      ]);
      setDemoLow(mid + 1);
    } else {
      sound.playEliminate();
      setDemoHistory((prev) => [
        ...prev,
        `${nextStep}회차: 인덱스 ${mid}번(${midVal}) 확인 ➔ 목표(${demoTarget})보다 큼! 오른쪽 절반(${mid}~14) 탈락`,
      ]);
      setDemoHigh(mid - 1);
    }
  };

  const resetDemo = () => {
    sound.playClick();
    setDemoLow(0);
    setDemoHigh(14);
    setDemoStepNum(0);
    setDemoHistory([]);
    setDemoFound(false);
  };

  // 실습 카드 클릭
  const handleCardClick = (clickedIndex: number) => {
    if (isProblemSolved) return;

    // 유효 범위 밖(이미 탈락한 카드) 클릭 시
    if (clickedIndex < low || clickedIndex > high) {
      sound.playError();
      setFeedback({
        text: `⚠️ 이 카드는 이미 탐색 범위에서 제외되었어요! 밝게 표시된 활성 범위 [${low}번 ~ ${high}번] 안에서 찾아주세요.`,
        type: 'warn',
      });
      return;
    }

    // 중간 카드(Mid)가 아닌 경우 부드러운 가이드 안내
    if (clickedIndex !== currentMid) {
      sound.playError();
      setFeedback({
        text: `💡 이진 탐색은 항상 남은 범위의 '가운데(중간) 카드'인 [ ${currentMid}번 ]을 열어야 절반씩 정확히 줄일 수 있어요!`,
        type: 'warn',
      });
      return;
    }

    // 올바른 중간 카드 클릭!
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    const openedCard = cards[clickedIndex];
    const openedVal = openedCard.value;

    const newCards = [...cards];
    newCards[clickedIndex].isOpen = true;

    if (openedVal === targetValue) {
      // 정답 발견!
      sound.playCorrect();
      setIsProblemSolved(true);
      setCards(newCards);
      setFeedback({
        text: `🎉 정답입니다! 단 ${newAttempts}번의 확인 만에 목표 숫자 [ ${targetValue} ]를 찾아냈습니다!`,
        type: 'success',
      });

      const newSolvedCount = Math.max(progress, currentProblemNum);
      onUpdateProgress(newSolvedCount);

      if (currentProblemNum >= 5) {
        onCompleteStage();
        setTimeout(() => {
          sound.playFanfare();
          confetti({
            particleCount: 110,
            spread: 80,
            origin: { y: 0.6 },
          });
          setShowNextStageModal(true);
        }, 500);
      }
    } else if (openedVal < targetValue) {
      // 열린 값이 목표보다 작음 (UP) -> 왼쪽 절반 버리기
      sound.playEliminate();
      for (let i = low; i <= clickedIndex; i++) {
        newCards[i].isEliminated = true;
      }
      setCards(newCards);
      setLow(clickedIndex + 1);
      setFeedback({
        text: `🔺 열린 값(${openedVal})이 목표(${targetValue})보다 작습니다! (UP) 더 작은 왼쪽 절반(${low}~${clickedIndex}번)을 모두 버렸습니다!`,
        type: 'up',
      });
    } else {
      // 열린 값이 목표보다 큼 (DOWN) -> 오른쪽 절반 버리기
      sound.playEliminate();
      for (let i = clickedIndex; i <= high; i++) {
        newCards[i].isEliminated = true;
      }
      setCards(newCards);
      setHigh(clickedIndex - 1);
      setFeedback({
        text: `🔻 열린 값(${openedVal})이 목표(${targetValue})보다 큽니다! (DOWN) 더 큰 오른쪽 절반(${clickedIndex}~${high}번)을 모두 버렸습니다!`,
        type: 'down',
      });
    }
  };

  // 다음 문제 진행
  const handleNextProblem = () => {
    sound.playClick();
    if (currentProblemNum < 5) {
      setCurrentProblemNum((prev) => prev + 1);
      generateProblem();
    }
  };

  return (
    <div className="space-y-6">
      {/* 탭 전환 */}
      <div className="flex bg-amber-200/50 p-1.5 rounded-2xl max-w-md mx-auto border border-amber-300">
        <button
          onClick={() => {
            sound.playClick();
            setActiveTab('concept');
          }}
          className={`flex-1 py-2 px-4 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'concept'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-amber-900 hover:text-amber-950'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          개념 배우기 & 시뮬레이션
        </button>
        <button
          onClick={() => {
            sound.playClick();
            setActiveTab('practice');
          }}
          className={`flex-1 py-2 px-4 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'practice'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-amber-900 hover:text-amber-950'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          실습 도전 (5문제)
        </button>
      </div>

      {/* ===================== [개념 설명 섹션] ===================== */}
      {activeTab === 'concept' && (
        <div className="bg-white rounded-3xl p-5 sm:p-8 border-2 border-amber-200 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-amber-100">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold mb-2">
                <span>알고리즘 핵심 #2</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-amber-950">
                이진 탐색 (Binary Search)이란?
              </h2>
              <p className="text-sm text-amber-900/80 mt-1">
                친구들과 하는 <strong>&apos;업앤다운(Up & Down)&apos; 게임</strong>처럼 가운데를 확인하고 매번 절반씩 날려버리는 초고속 탐색법!
              </p>
            </div>

            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('practice');
              }}
              className="w-full md:w-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-black text-sm shadow-md hover:from-amber-600 hover:to-amber-700 transition-all flex items-center justify-center gap-2"
            >
              <span>실습 시작하기 (5문제)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* 필수 전제조건 배너 (매우 강조!) */}
          <div className="bg-gradient-to-r from-rose-50 to-orange-50 p-4 sm:p-5 rounded-2xl border-2 border-rose-300 shadow-sm flex items-start gap-3">
            <span className="text-3xl">⚠️</span>
            <div>
              <h4 className="font-black text-rose-950 text-sm sm:text-base flex items-center gap-2">
                <span>이진 탐색의 절대 규칙:</span>
                <span className="bg-rose-600 text-white px-2.5 py-0.5 rounded-lg text-xs font-black">
                  필수 전제조건
                </span>
              </h4>
              <p className="text-xs sm:text-sm text-rose-900 font-bold mt-1">
                &quot;반드시 데이터가 작은 순서대로 크기순 정렬(Sorting)되어 있어야만 사용할 수 있습니다!&quot;
              </p>
              <p className="text-xs text-rose-800/90 mt-1">
                정렬되어 있지 않다면 가운데 값이 더 크다고 해서 목표값이 왼쪽에 있다는 보장이 없기 때문이에요.
              </p>
            </div>
          </div>

          {/* 업앤다운 비유 설명 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200">
              <span className="text-xs font-extrabold text-amber-600 block mb-1">STEP 1</span>
              <h5 className="font-extrabold text-amber-950 text-sm">가운데(Mid) 찍기</h5>
              <p className="text-xs text-stone-600 mt-1">
                탐색 범위의 정중앙 카드를 확인합니다. 1~15라면 8번째 카드를 확인해요.
              </p>
            </div>

            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200">
              <span className="text-xs font-extrabold text-amber-600 block mb-1">STEP 2</span>
              <h5 className="font-extrabold text-amber-950 text-sm">목표값과 비교 (UP / DOWN)</h5>
              <p className="text-xs text-stone-600 mt-1">
                가운데 값이 목표보다 작으면 오른쪽(UP), 크면 왼쪽(DOWN)에 있다는 것을 확신할 수 있어요.
              </p>
            </div>

            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200">
              <span className="text-xs font-extrabold text-amber-600 block mb-1">STEP 3</span>
              <h5 className="font-extrabold text-amber-950 text-sm">절반을 한 번에 버리기!</h5>
              <p className="text-xs text-stone-600 mt-1">
                불필요한 절반 데이터를 단 한 번에 버리므로 순식간에 정답에 도달합니다.
              </p>
            </div>
          </div>

          {/* 인터랙티브 개념 시뮬레이션 */}
          <div className="bg-amber-50/70 p-5 rounded-2xl border border-amber-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="font-extrabold text-amber-950 text-sm flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-amber-600" />
                  정렬된 15개 데이터에서 [ {demoTarget} ] 찾기 시뮬레이션
                </h3>
                <p className="text-xs text-amber-800">
                  아래 [다음 단계 진행] 버튼을 누를 때마다 어떻게 절반씩 사라지는지 확인해보세요.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={stepDemo}
                  disabled={demoFound}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-black rounded-xl flex items-center gap-1.5 shadow-sm"
                >
                  <span>{demoFound ? '탐색 완료!' : '다음 단계 진행 (1턴씩)'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={resetDemo}
                  className="p-2 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded-xl"
                  title="초기화"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 15개 카드 시각화 */}
            <div className="grid grid-cols-5 sm:grid-cols-15 gap-1.5">
              {demoList.map((val, idx) => {
                const isOutOfRange = idx < demoLow || idx > demoHigh;
                const isMid = !demoFound && idx === Math.floor((demoLow + demoHigh) / 2);
                const isAnswer = demoFound && val === demoTarget;

                return (
                  <div key={idx} className="flex flex-col items-center">
                    <span className="text-[10px] font-bold text-amber-800/80 mb-0.5">
                      {idx}
                    </span>
                    <div
                      className={`w-full aspect-[2/3] rounded-xl border flex flex-col items-center justify-center text-xs font-black transition-all ${
                        isAnswer
                          ? 'bg-emerald-500 border-emerald-600 text-white shadow-lg ring-2 ring-emerald-300 scale-105'
                          : isOutOfRange
                          ? 'bg-stone-200/60 border-stone-300 text-stone-400 opacity-40 line-through'
                          : isMid
                          ? 'bg-amber-400 border-amber-600 text-amber-950 ring-2 ring-amber-400 animate-pulse font-extrabold'
                          : 'bg-white border-amber-300 text-amber-900'
                      }`}
                    >
                      <span>{val}</span>
                      {isMid && <span className="text-[9px] text-amber-900 font-bold">Mid</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 시뮬레이션 히스토리 로그 */}
            <div className="mt-4 bg-white p-3 rounded-xl border border-amber-200 space-y-1">
              <span className="text-[11px] font-extrabold text-amber-800 block">
                진행 과정 로그:
              </span>
              {demoHistory.length === 0 ? (
                <p className="text-xs text-stone-400">
                  [다음 단계 진행] 버튼을 눌러 이진 탐색을 한 번에 한 턴씩 실행해 보세요!
                </p>
              ) : (
                demoHistory.map((log, i) => (
                  <div key={i} className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span>{log}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================== [실습 인터랙션 섹션] ===================== */}
      {activeTab === 'practice' && (
        <div className="bg-white rounded-3xl p-5 sm:p-8 border-2 border-amber-200 shadow-sm space-y-6">
          {/* 상단 문제 정보 헤더 */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-amber-50 p-4 rounded-2xl border border-amber-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-white text-xs font-black">
                  문제 {currentProblemNum} / 5
                </span>
                <span className="text-xs font-extrabold text-amber-800">
                  이진 탐색 실전 훈련
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                  오름차순 정렬 완료
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-sm font-bold text-amber-950">수사 목표:</span>
                <span className="text-2xl sm:text-3xl font-black text-amber-700 tracking-tight bg-white px-3 py-0.5 rounded-xl border-2 border-amber-400 shadow-sm">
                  {targetValue}
                </span>
                <span className="text-xs text-amber-800">를 최소 횟수로 찾아라!</span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-bold text-amber-900">
              <div className="text-right">
                <span className="text-stone-500 block text-[11px]">확인 횟수</span>
                <span className="text-lg font-black text-amber-950">{attempts} 회</span>
              </div>
              <div className="text-right">
                <span className="text-stone-500 block text-[11px]">남은 후보 카드</span>
                <span className="text-lg font-black text-amber-700">
                  {Math.max(0, high - low + 1)} 장
                </span>
              </div>
              <button
                onClick={() => {
                  sound.playClick();
                  generateProblem();
                }}
                className="px-3 py-2 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded-xl flex items-center gap-1"
                title="새 문제로 다시 섞기"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>재도전</span>
              </button>
            </div>
          </div>

          {/* 피드백 알림 배너 */}
          <div
            className={`p-3.5 rounded-2xl border text-xs sm:text-sm font-extrabold flex items-center gap-2.5 transition-all ${
              feedback.type === 'up'
                ? 'bg-blue-50 border-blue-300 text-blue-900'
                : feedback.type === 'down'
                ? 'bg-orange-50 border-orange-300 text-orange-900'
                : feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : feedback.type === 'warn'
                ? 'bg-rose-50 border-rose-300 text-rose-800 animate-shake'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            {feedback.type === 'up' && <TrendingUp className="w-5 h-5 text-blue-600 shrink-0" />}
            {feedback.type === 'down' && <TrendingDown className="w-5 h-5 text-orange-600 shrink-0" />}
            {feedback.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />}
            {feedback.type === 'warn' && <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
            {feedback.type === 'info' && <Target className="w-5 h-5 text-amber-600 shrink-0" />}
            <span>{feedback.text}</span>
          </div>

          {/* 탐색 범위 안내 가이드라인 */}
          <div className="flex items-center justify-between px-2 text-xs font-extrabold text-amber-950">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>
                현재 유효 탐색 범위: [{low}번 ~ {high}번 카드]
              </span>
            </div>
            {!isProblemSolved && (
              <div className="flex items-center gap-1 text-amber-700 bg-amber-100 px-2.5 py-1 rounded-lg">
                <Target className="w-3.5 h-3.5" />
                <span>
                  추천할 중간 카드: <strong>{currentMid}번</strong>
                </span>
              </div>
            )}
          </div>

          {/* 15장의 카드 인터랙션 영역 */}
          <div>
            <div className="grid grid-cols-5 sm:grid-cols-15 gap-1.5 sm:gap-2">
              {cards.map((card, idx) => {
                const isOutOfRange = idx < low || idx > high;
                const isMid = !isProblemSolved && idx === currentMid;

                return (
                  <div key={card.index} className="flex flex-col items-center">
                    {/* 인덱스 라벨 및 Mid 화살표 */}
                    <div className="flex items-center gap-0.5 mb-1">
                      <span className="text-[10px] font-black text-stone-500">
                        {idx}
                      </span>
                      {isMid && (
                        <ArrowDown className="w-3 h-3 text-amber-600 animate-bounce" />
                      )}
                    </div>

                    {/* 카드 본체 */}
                    <button
                      onClick={() => handleCardClick(idx)}
                      disabled={card.isEliminated || card.isOpen || isProblemSolved}
                      className={`w-full aspect-[2/3] rounded-xl border-2 transition-all duration-300 flex flex-col items-center justify-center relative shadow-sm ${
                        card.isOpen
                          ? card.isTarget
                            ? 'bg-emerald-500 border-emerald-600 text-white shadow-lg ring-4 ring-emerald-300 scale-105'
                            : 'bg-stone-100 border-stone-300 text-stone-700'
                          : card.isEliminated || isOutOfRange
                          ? 'bg-stone-200/50 border-stone-300 text-stone-300 opacity-30 cursor-not-allowed line-through backdrop-blur-sm'
                          : isMid
                          ? 'bg-gradient-to-b from-amber-300 to-amber-400 border-amber-600 hover:scale-105 cursor-pointer shadow-md ring-2 ring-amber-400/70 font-extrabold'
                          : 'bg-amber-100/90 border-amber-300 hover:bg-amber-200 text-amber-900 cursor-pointer'
                      }`}
                    >
                      {card.isOpen ? (
                        <div className="flex flex-col items-center">
                          <span className="text-base sm:text-lg font-black">{card.value}</span>
                          <span className="text-[9px] font-bold">
                            {card.isTarget ? '🎯 정답' : card.value < targetValue ? 'UP 🔺' : 'DOWN 🔻'}
                          </span>
                        </div>
                      ) : card.isEliminated || isOutOfRange ? (
                        <span className="text-[10px] text-stone-400 font-bold">제외</span>
                      ) : (
                        <div className="flex flex-col items-center text-amber-950">
                          <span className="text-sm">❓</span>
                          {isMid && (
                            <span className="text-[9px] font-black text-amber-900 mt-0.5">
                              Mid
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 문제 해결 시 다음 문제/다음 단계 */}
          {isProblemSolved && (
            <div className="bg-emerald-50 p-5 rounded-2xl border-2 border-emerald-300 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in">
              <div className="flex items-center gap-3 text-center sm:text-left">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center text-2xl shrink-0">
                  🎯
                </div>
                <div>
                  <h4 className="font-black text-emerald-950 text-base">
                    문제 {currentProblemNum} 해결 완료!
                  </h4>
                  <p className="text-xs text-emerald-800">
                    15장의 카드 중에서 절반씩 줄여가며 <strong>단 {attempts}번</strong> 만에 목표 {targetValue}을(를) 찾았습니다!
                  </p>
                </div>
              </div>

              {currentProblemNum < 5 ? (
                <button
                  onClick={handleNextProblem}
                  className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-all"
                >
                  <span>다음 문제 도전 ({currentProblemNum + 1}/5)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => {
                    sound.playClick();
                    onNextStage();
                  }}
                  className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>3단계: 비교 대결로 이동!</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* 5문제 클리어 모달 */}
      {showNextStageModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 sm:p-8 border-4 border-amber-300 shadow-2xl text-center space-y-5 animate-scale-up">
            <div className="w-20 h-20 rounded-full bg-amber-100 mx-auto flex items-center justify-center text-4xl shadow-inner">
              🧭
            </div>
            <div>
              <span className="text-xs font-black text-amber-600 uppercase tracking-widest">
                STAGE 2 CLEAR
              </span>
              <h3 className="text-2xl font-black text-amber-950 mt-1">
                이진 탐색 실습 마스터!
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 mt-2">
                정렬된 데이터에서 중간값을 기준으로 절반씩 버리는 원리를 완벽하게 마스터했어요!
              </p>
            </div>

            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs font-extrabold text-amber-900">
              ⚔️ 이제 대망의 3단계에서 <strong>순차 탐색 vs 이진 탐색의 100개 데이터 속도 대결</strong>을 펼쳐볼까요?
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowNextStageModal(false)}
                className="flex-1 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl"
              >
                닫기
              </button>
              <button
                onClick={() => {
                  setShowNextStageModal(false);
                  sound.playClick();
                  onNextStage();
                }}
                className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5"
              >
                <span>3단계 대결 바로가기</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
