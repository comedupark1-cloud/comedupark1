import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { 
  Play, 
  RotateCcw, 
  ArrowRight, 
  HelpCircle, 
  AlertTriangle, 
  CheckCircle, 
  Sparkles, 
  Eye, 
  Lock,
  ArrowDown
} from 'lucide-react';
import { sound } from '../utils/sound';

interface SequentialSearchProps {
  onCompleteStage: () => void;
  onNextStage: () => void;
  progress: number;
  onUpdateProgress: (newProgress: number) => void;
}

interface CardItem {
  id: number;
  value: number;
  isOpen: boolean;
  isTarget: boolean;
  isCurrentCheck?: boolean;
}

export const SequentialSearch: React.FC<SequentialSearchProps> = ({
  onCompleteStage,
  onNextStage,
  progress,
  onUpdateProgress,
}) => {
  // 모드: 'concept' (개념 설명) vs 'practice' (실습)
  const [activeTab, setActiveTab] = useState<'concept' | 'practice'>('concept');

  // --- 개념 시뮬레이션 상태 ---
  const demoList = [47, 12, 88, 35, 61, 29, 74, 53];
  const demoTarget = 61; // 인덱스 4
  const [demoStep, setDemoStep] = useState<number>(-1);
  const [isDemoRunning, setIsDemoRunning] = useState<boolean>(false);

  // --- 실습 상태 ---
  const [currentProblemNum, setCurrentProblemNum] = useState<number>(Math.max(1, progress + 1));
  const [cards, setCards] = useState<CardItem[]>([]);
  const [targetValue, setTargetValue] = useState<number>(0);
  const [expectedIndex, setExpectedIndex] = useState<number>(0);
  const [attempts, setAttempts] = useState<number>(0);
  const [wrongClickedIndex, setWrongClickedIndex] = useState<number | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'info' | 'error' | 'success' }>({
    text: '가장 왼쪽(0번) 첫 번째 카드부터 순서대로 열어보세요!',
    type: 'info',
  });
  const [isProblemSolved, setIsProblemSolved] = useState<boolean>(false);
  const [showNextStageModal, setShowNextStageModal] = useState<boolean>(false);

  // 문제 생성 함수
  const generateProblem = useCallback(() => {
    // 1~99 사이의 중복 없는 8개 랜덤 숫자 생성 (정렬되지 않음)
    const numbers = new Set<number>();
    while (numbers.size < 8) {
      numbers.add(Math.floor(Math.random() * 90) + 10);
    }
    const arr = Array.from(numbers);
    
    // 8개 중 하나를 목표로 무작위 지정 (되도록 1~7번 사이로 하여 순차 탐색의 묘미 제공)
    const targetIdx = Math.floor(Math.random() * 6) + 2; // 최소 2번 이상은 탐색하도록
    const chosenTarget = arr[targetIdx];

    const cardItems: CardItem[] = arr.map((val, idx) => ({
      id: idx,
      value: val,
      isOpen: false,
      isTarget: val === chosenTarget,
    }));

    setCards(cardItems);
    setTargetValue(chosenTarget);
    setExpectedIndex(0);
    setAttempts(0);
    setWrongClickedIndex(null);
    setIsProblemSolved(false);
    setFeedbackMessage({
      text: `목표 숫자 [ ${chosenTarget} ]을(를) 찾으세요! 맨 왼쪽 카드부터 하나씩 열어보세요.`,
      type: 'info',
    });
  }, []);

  // 초기 문제 생성
  useEffect(() => {
    generateProblem();
  }, [generateProblem]);

  // 개념 시뮬레이션 타이머
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isDemoRunning) {
      timer = setTimeout(() => {
        if (demoStep < demoList.length - 1) {
          const nextStep = demoStep + 1;
          setDemoStep(nextStep);
          sound.playCardFlip();
          if (demoList[nextStep] === demoTarget) {
            setIsDemoRunning(false);
            sound.playCorrect();
          }
        } else {
          setIsDemoRunning(false);
        }
      }, 900);
    }
    return () => clearTimeout(timer);
  }, [isDemoRunning, demoStep, demoTarget, demoList]);

  // 카드 클릭 핸들러 (실습)
  const handleCardClick = (clickedIndex: number) => {
    if (isProblemSolved) return;

    // 이미 열린 카드인 경우 무시
    if (cards[clickedIndex].isOpen) return;

    // 규칙 판정: 반드시 가장 왼쪽부터 순서대로 열어야 함!
    if (clickedIndex !== expectedIndex) {
      // 규칙 위반! 중간 카드를 먼저 누름
      sound.playError();
      setWrongClickedIndex(clickedIndex);
      setFeedbackMessage({
        text: `🚨 앗! 순차 탐색은 반드시 첫 번째(왼쪽) 카드부터 차례대로 확인해야 해요! 규칙을 지켜 새 문제로 다시 시작합니다.`,
        type: 'error',
      });

      // 1.2초 후 유사 문제 즉시 재생성
      setTimeout(() => {
        generateProblem();
        setFeedbackMessage({
          text: `새로운 카드가 세팅되었어요! 이번엔 맨 왼쪽 0번부터 차례대로 열어보세요.`,
          type: 'info',
        });
      }, 1400);
      return;
    }

    // 정상 순서대로 클릭함
    sound.playCardFlip();
    const newCards = [...cards];
    newCards[clickedIndex].isOpen = true;
    setCards(newCards);
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    const openedValue = newCards[clickedIndex].value;

    if (openedValue === targetValue) {
      // 목표 발견! 정답!
      sound.playCorrect();
      setIsProblemSolved(true);
      const newSolvedCount = Math.max(progress, currentProblemNum);
      onUpdateProgress(newSolvedCount);

      if (currentProblemNum >= 5) {
        // 5문제 모두 클리어!
        onCompleteStage();
        setTimeout(() => {
          sound.playFanfare();
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
          setShowNextStageModal(true);
        }, 500);
      } else {
        setFeedbackMessage({
          text: `🎉 대성공! ${newAttempts}번째 확인에서 목표 숫자 [ ${targetValue} ]를 찾았습니다!`,
          type: 'success',
        });
      }
    } else {
      // 목표가 아님 -> 다음 인덱스로 진행
      setExpectedIndex(clickedIndex + 1);
      setFeedbackMessage({
        text: `🔍 [${openedValue}]는 목표(${targetValue})가 아니에요. 다음 카드를 열어보세요!`,
        type: 'info',
      });
    }
  };

  // 다음 문제로 넘어가기
  const handleNextProblem = () => {
    sound.playClick();
    if (currentProblemNum < 5) {
      setCurrentProblemNum((prev) => prev + 1);
      generateProblem();
    }
  };

  return (
    <div className="space-y-6">
      {/* 탭 전환 (개념 배우기 vs 실습 도전) */}
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
                <span>알고리즘 기초 #1</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-amber-950">
                순차 탐색 (Sequential Search)이란?
              </h2>
              <p className="text-sm text-amber-900/80 mt-1">
                데이터를 맨 앞부터 끝까지 <strong>하나씩 차례대로</strong> 비교하며 원하는 값을 찾는 가장 직관적인 방법!
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

          {/* 핵심 메시지 배너 */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 sm:p-5 rounded-2xl border-l-4 border-amber-500 flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div>
              <h4 className="font-extrabold text-amber-950 text-sm sm:text-base">
                핵심 원리: &quot;데이터가 정렬되어 있지 않을 때, 처음부터 하나씩 찾아야 해요!&quot;
              </h4>
              <p className="text-xs sm:text-sm text-amber-900/80 mt-1">
                숫자들이 순서 없이 마구 섞여 있는 경우, 어떤 숫자가 어디에 숨어 있는지 알 방법이 없기 때문에
                맨 처음 데이터부터 마지막 데이터까지 순서대로 열어볼 수밖에 없어요.
              </p>
            </div>
          </div>

          {/* 미니 시각적 시뮬레이터 */}
          <div className="bg-amber-50/70 p-5 rounded-2xl border border-amber-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="font-extrabold text-amber-950 text-sm flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-amber-600" />
                  순차 탐색 움직임 시뮬레이션
                </h3>
                <p className="text-xs text-amber-800">
                  목표 숫자 <strong>[{demoTarget}]</strong>을 찾기 위해 0번부터 하나씩 검사하는 과정을 확인해보세요.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    sound.playClick();
                    setDemoStep(-1);
                    setIsDemoRunning(true);
                  }}
                  disabled={isDemoRunning}
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-sm"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>{demoStep === -1 ? '자동 시뮬레이션 시작' : '다시 재생'}</span>
                </button>
                <button
                  onClick={() => {
                    sound.playClick();
                    setIsDemoRunning(false);
                    setDemoStep(-1);
                  }}
                  className="p-1.5 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded-xl"
                  title="초기화"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 카드 데모 8장 */}
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {demoList.map((val, idx) => {
                const isCurrent = demoStep === idx;
                const isPast = demoStep > idx;
                const isFound = isPast && val === demoTarget;

                return (
                  <div key={idx} className="flex flex-col items-center">
                    <span className="text-[11px] font-bold text-amber-700/80 mb-1">
                      인덱스 {idx}
                    </span>
                    <div
                      className={`w-full aspect-[3/4] rounded-xl border-2 flex flex-col items-center justify-center font-black transition-all duration-300 ${
                        isFound
                          ? 'bg-emerald-500 border-emerald-600 text-white shadow-lg scale-105'
                          : isCurrent
                          ? 'bg-amber-400 border-amber-600 text-amber-950 shadow-md scale-105 ring-4 ring-amber-300 animate-pulse'
                          : isPast
                          ? 'bg-amber-100 border-amber-300 text-amber-800 opacity-60'
                          : 'bg-white border-amber-200 text-amber-900'
                      }`}
                    >
                      {demoStep >= idx ? (
                        <>
                          <span className="text-lg">{val}</span>
                          <span className="text-[10px] mt-1 font-bold">
                            {val === demoTarget ? '🎯 발견!' : '❌ 불일치'}
                          </span>
                        </>
                      ) : (
                        <div className="flex flex-col items-center text-amber-300">
                          <Lock className="w-4 h-4" />
                          <span className="text-[10px] mt-1">?</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 시뮬레이션 상태 텍스트 */}
            <div className="mt-4 p-3 bg-white rounded-xl border border-amber-200 text-xs font-bold text-center text-amber-900">
              {demoStep === -1 ? (
                '▶ [자동 시뮬레이션 시작] 버튼을 눌러보세요!'
              ) : demoStep < demoList.length && demoList[demoStep] === demoTarget ? (
                <span className="text-emerald-700 font-extrabold">
                  🎉 인덱스 {demoStep}번째에서 목표 값 {demoTarget}을(를) 찾았습니다! (총 {demoStep + 1}회 비교)
                </span>
              ) : (
                <span>
                  🔍 인덱스 {demoStep}번 카드 확인 중: {demoList[demoStep]} vs 목표 {demoTarget} (일치하지 않음)
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================== [실습 인터랙션 섹션] ===================== */}
      {activeTab === 'practice' && (
        <div className="bg-white rounded-3xl p-5 sm:p-8 border-2 border-amber-200 shadow-sm space-y-6">
          {/* 상단 문제 상태 및 목표 제시 */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-amber-50 p-4 rounded-2xl border border-amber-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-white text-xs font-black">
                  문제 {currentProblemNum} / 5
                </span>
                <span className="text-xs font-extrabold text-amber-800">
                  순차 탐색 실전 훈련
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-sm font-bold text-amber-950">수사 목표:</span>
                <span className="text-2xl sm:text-3xl font-black text-amber-700 tracking-tight bg-white px-3 py-0.5 rounded-xl border-2 border-amber-400 shadow-sm">
                  {targetValue}
                </span>
                <span className="text-xs text-amber-800">를 찾아라!</span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-bold text-amber-900">
              <div className="text-right">
                <span className="text-stone-500 block text-[11px]">확인 횟수</span>
                <span className="text-lg font-black text-amber-950">{attempts} 회</span>
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
                <span>재배치</span>
              </button>
            </div>
          </div>

          {/* 피드백 알림 배너 */}
          <div
            className={`p-3.5 rounded-2xl border text-xs sm:text-sm font-extrabold flex items-center gap-2.5 transition-all ${
              feedbackMessage.type === 'error'
                ? 'bg-rose-50 border-rose-300 text-rose-800 animate-shake'
                : feedbackMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            {feedbackMessage.type === 'error' && <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />}
            {feedbackMessage.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />}
            {feedbackMessage.type === 'info' && <Eye className="w-5 h-5 text-amber-600 shrink-0" />}
            <span>{feedbackMessage.text}</span>
          </div>

          {/* 8장의 카드 영역 */}
          <div>
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-xs font-extrabold text-stone-500">
                👇 가장 왼쪽 첫 번째 카드부터 순서대로 눌러 열어보세요!
              </span>
              <span className="text-xs font-bold text-amber-700">
                다음 열 차례: <span className="underline decoration-amber-400 font-black">{expectedIndex}번</span> 카드
              </span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5 sm:gap-3">
              {cards.map((card, idx) => {
                const isNextExpected = idx === expectedIndex && !isProblemSolved;
                const isWrong = wrongClickedIndex === idx;

                return (
                  <div key={card.id} className="flex flex-col items-center">
                    {/* 카드 인덱스 라벨 & 인디케이터 */}
                    <div className="flex items-center gap-1 mb-1.5">
                      <span className="text-[11px] font-black text-stone-500">
                        {idx}번
                      </span>
                      {isNextExpected && (
                        <ArrowDown className="w-3 h-3 text-amber-600 animate-bounce" />
                      )}
                    </div>

                    {/* 카드 버튼 */}
                    <button
                      onClick={() => handleCardClick(idx)}
                      disabled={card.isOpen || isProblemSolved}
                      className={`w-full aspect-[3/4] rounded-2xl border-2 transition-all duration-300 flex flex-col items-center justify-center relative shadow-sm ${
                        card.isOpen
                          ? card.isTarget
                            ? 'bg-emerald-500 border-emerald-600 text-white shadow-lg ring-4 ring-emerald-300 scale-105'
                            : 'bg-stone-100 border-stone-300 text-stone-600'
                          : isWrong
                          ? 'bg-rose-100 border-rose-500 animate-shake'
                          : isNextExpected
                          ? 'bg-gradient-to-b from-amber-300 to-amber-400 border-amber-500 hover:scale-105 cursor-pointer shadow-md ring-2 ring-amber-400/50'
                          : 'bg-amber-100/80 border-amber-300 hover:bg-amber-200 text-amber-900 cursor-pointer'
                      }`}
                    >
                      {card.isOpen ? (
                        <div className="flex flex-col items-center">
                          <span className="text-xl sm:text-2xl font-black">{card.value}</span>
                          <span className="text-[10px] font-bold mt-1">
                            {card.isTarget ? '🎯 정답!' : 'X'}
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center text-amber-900">
                          <span className="text-xl">🕵️</span>
                          <span className="text-[11px] font-black mt-1">열기</span>
                        </div>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 성공 시 다음 문제 / 다음 단계 버튼 */}
          {isProblemSolved && (
            <div className="bg-emerald-50 p-5 rounded-2xl border-2 border-emerald-300 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in">
              <div className="flex items-center gap-3 text-center sm:text-left">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center text-2xl shrink-0">
                  🎉
                </div>
                <div>
                  <h4 className="font-black text-emerald-950 text-base">
                    문제 {currentProblemNum} 해결 완료!
                  </h4>
                  <p className="text-xs text-emerald-800">
                    첫 번째부터 차례대로 {attempts}번 확인하여 목표 {targetValue}을(를) 찾아냈습니다.
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
                  <span>2단계: 이진 탐색으로 이동!</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* 5문제 완료 모달 */}
      {showNextStageModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 sm:p-8 border-4 border-amber-300 shadow-2xl text-center space-y-5 animate-scale-up">
            <div className="w-20 h-20 rounded-full bg-amber-100 mx-auto flex items-center justify-center text-4xl shadow-inner">
              🏆
            </div>
            <div>
              <span className="text-xs font-black text-amber-600 uppercase tracking-widest">
                STAGE 1 CLEAR
              </span>
              <h3 className="text-2xl font-black text-amber-950 mt-1">
                순차 탐색 실습 마스터!
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 mt-2">
                정렬되지 않은 데이터에서 첫 번째부터 차례대로 하나씩 열어보며 5문제를 모두 멋지게 해결했어요!
              </p>
            </div>

            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs font-extrabold text-amber-900">
              ⚡ 다음 단계: 반씩 버려서 훨씬 빠른 <strong>&quot;이진 탐색&quot;</strong>을 배울 준비가 되셨나요?
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
                <span>2단계 바로가기</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
