import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Swords, 
  Play, 
  RotateCcw, 
  Award, 
  CheckCircle2, 
  HelpCircle, 
  XCircle, 
  Sparkles,
  Zap,
  Clock,
  BarChart3,
  User,
  Share2,
  Calendar
} from 'lucide-react';
import { sound } from '../utils/sound';

interface ComparisonBattleProps {
  onCompleteBattle: () => void;
  onResetAll: () => void;
}

export const ComparisonBattle: React.FC<ComparisonBattleProps> = ({
  onCompleteBattle,
  onResetAll,
}) => {
  // 모드: 'lab' (100개 대결 실험실) vs 'quiz' (3대 퀴즈) vs 'certificate' (수료증)
  const [activeTab, setActiveTab] = useState<'lab' | 'quiz' | 'certificate'>('lab');

  // 목표 값 (기본 85)
  const [targetNum, setTargetNum] = useState<number>(85);

  // 대결 실행 상태
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isBattleFinished, setIsBattleFinished] = useState<boolean>(false);

  // 순차 탐색 진행 상태
  const [seqCurrent, setSeqCurrent] = useState<number>(0);
  const [seqAttempts, setSeqAttempts] = useState<number>(0);
  const [seqFound, setSeqFound] = useState<boolean>(false);

  // 이진 탐색 진행 상태
  const [binLow, setBinLow] = useState<number>(1);
  const [binHigh, setBinHigh] = useState<number>(100);
  const [binCurrentMid, setBinCurrentMid] = useState<number>(0);
  const [binAttempts, setBinAttempts] = useState<number>(0);
  const [binHistory, setBinHistory] = useState<{ step: number; mid: number; res: string }[]>([]);
  const [binFound, setBinFound] = useState<boolean>(false);

  // 퀴즈 상태
  const quizList = [
    {
      id: 1,
      question: '데이터가 정렬되어 있고 양이 매우 많을 때, 훨씬 빠르고 효율적인 알고리즘은?',
      options: [
        { label: '순차 탐색 (Sequential Search)', isCorrect: false },
        { label: '이진 탐색 (Binary Search)', isCorrect: true },
        { label: '두 알고리즘의 속도는 항상 같다', isCorrect: false },
      ],
      explanation: '정답입니다! 이진 탐색은 매번 절반을 버리기 때문에 1,000,000개 데이터도 단 20번 만에 찾아냅니다.',
    },
    {
      id: 2,
      question: '이진 탐색을 사용하기 위해 "반드시" 필요한 핵심 전제조건은?',
      options: [
        { label: '데이터가 크기순으로 정렬(Sorting)되어 있어야 한다', isCorrect: true },
        { label: '데이터 개수가 짝수여야 한다', isCorrect: false },
        { label: '컴퓨터 사양이 매우 좋아야 한다', isCorrect: false },
      ],
      explanation: '정답입니다! 정렬되어 있지 않으면 중간값을 기준으로 크다/작다를 판정해 버릴 수 없기 때문입니다.',
    },
    {
      id: 3,
      question: '숫자들이 뒤죽박죽 섞여 정렬되어 있지 않을 때 유일하게 사용할 수 있는 알고리즘은?',
      options: [
        { label: '이진 탐색', isCorrect: false },
        { label: '순차 탐색', isCorrect: true },
        { label: '탐색이 불가능하여 에러 발생', isCorrect: false },
      ],
      explanation: '정답입니다! 무작위 데이터에서는 앞(0번)부터 하나씩 끝까지 찾아보는 순차 탐색을 써야 합니다.',
    },
  ];

  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [studentName, setStudentName] = useState<string>('알고리즘 명탐정');

  // 대결 시작
  const startBattle = () => {
    sound.playClick();
    setIsRunning(true);
    setIsBattleFinished(false);
    setSeqCurrent(0);
    setSeqAttempts(0);
    setSeqFound(false);

    setBinLow(1);
    setBinHigh(100);
    setBinAttempts(0);
    setBinHistory([]);
    setBinFound(false);
  };

  // 대결 리셋
  const resetBattle = () => {
    sound.playClick();
    setIsRunning(false);
    setIsBattleFinished(false);
    setSeqCurrent(0);
    setSeqAttempts(0);
    setSeqFound(false);

    setBinLow(1);
    setBinHigh(100);
    setBinCurrentMid(0);
    setBinAttempts(0);
    setBinHistory([]);
    setBinFound(false);
  };

  // 실시간 대결 타이머 인터벌
  useEffect(() => {
    if (!isRunning) return;

    let localLow = 1;
    let localHigh = 100;
    const binSteps: { step: number; mid: number; res: string }[] = [];
    let bAttempts = 0;

    // 이진 탐색 단계 미리 계산
    while (localLow <= localHigh) {
      bAttempts++;
      const mid = Math.floor((localLow + localHigh) / 2);
      if (mid === targetNum) {
        binSteps.push({ step: bAttempts, mid, res: '🎯 발견!' });
        break;
      } else if (mid < targetNum) {
        binSteps.push({ step: bAttempts, mid, res: 'UP 🔺' });
        localLow = mid + 1;
      } else {
        binSteps.push({ step: bAttempts, mid, res: 'DOWN 🔻' });
        localHigh = mid - 1;
      }
    }

    // 이진 탐색은 스텝별로 약 400ms 간격으로 표시
    let binStepIndex = 0;
    const binInterval = setInterval(() => {
      if (binStepIndex < binSteps.length) {
        const currentBin = binSteps[binStepIndex];
        setBinCurrentMid(currentBin.mid);
        setBinAttempts(currentBin.step);
        setBinHistory((prev) => [...prev, currentBin]);
        sound.playCardFlip();

        if (currentBin.mid === targetNum) {
          setBinFound(true);
          sound.playCorrect();
          clearInterval(binInterval);
        }
        binStepIndex++;
      } else {
        clearInterval(binInterval);
      }
    }, 450);

    // 순차 탐색은 40ms마다 1씩 증가
    let curr = 0;
    const seqInterval = setInterval(() => {
      curr++;
      setSeqCurrent(curr);
      setSeqAttempts(curr);

      if (curr >= targetNum) {
        setSeqFound(true);
        clearInterval(seqInterval);
        setIsRunning(false);
        setIsBattleFinished(true);
        setTimeout(() => {
          sound.playFanfare();
          confetti({
            particleCount: 90,
            spread: 70,
            origin: { y: 0.6 },
          });
        }, 300);
      }
    }, 45);

    return () => {
      clearInterval(binInterval);
      clearInterval(seqInterval);
    };
  }, [isRunning, targetNum]);

  // 퀴즈 답안 선택
  const handleSelectOption = (qId: number, optIdx: number) => {
    sound.playClick();
    setSelectedAnswers((prev) => ({ ...prev, [qId]: optIdx }));
  };

  // 퀴즈 제출
  const handleSubmitQuiz = () => {
    sound.playFanfare();
    setQuizSubmitted(true);
    onCompleteBattle();
    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.5 },
    });
  };

  const isAllQuizAnswered = Object.keys(selectedAnswers).length === 3;
  const correctQuizCount = quizList.filter(
    (q) => selectedAnswers[q.id] !== undefined && q.options[selectedAnswers[q.id]].isCorrect
  ).length;

  return (
    <div className="space-y-6">
      {/* 서브 탭 내비게이션 */}
      <div className="flex bg-amber-200/50 p-1.5 rounded-2xl max-w-lg mx-auto border border-amber-300">
        <button
          onClick={() => {
            sound.playClick();
            setActiveTab('lab');
          }}
          className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'lab'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-amber-900 hover:text-amber-950'
          }`}
        >
          <Swords className="w-4 h-4" />
          100개 데이터 대결
        </button>
        <button
          onClick={() => {
            sound.playClick();
            setActiveTab('quiz');
          }}
          className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'quiz'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-amber-900 hover:text-amber-950'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          결론 퀴즈 (3문항)
        </button>
        <button
          onClick={() => {
            sound.playClick();
            setActiveTab('certificate');
          }}
          className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'certificate'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-amber-900 hover:text-amber-950'
          }`}
        >
          <Award className="w-4 h-4" />
          수료 배지 & 증서
        </button>
      </div>

      {/* ===================== [1. 100개 데이터 대결 실험실] ===================== */}
      {activeTab === 'lab' && (
        <div className="bg-white rounded-3xl p-5 sm:p-8 border-2 border-amber-200 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-amber-100">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold mb-2">
                <span>알고리즘 배틀 실험실</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-amber-950 flex items-center gap-2">
                <span>1~100 정렬 데이터 대결</span>
                <span className="text-sm font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-lg border border-amber-300">
                  순차 탐색 vs 이진 탐색
                </span>
              </h2>
              <p className="text-sm text-amber-900/80 mt-1">
                같은 목표값을 찾을 때 두 알고리즘의 확인 횟수와 탐색 속도가 얼마나 극적으로 차이 나는지 눈으로 직접 비교해 보세요!
              </p>
            </div>

            {/* 목표값 설정 및 컨트롤 */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2 bg-amber-50 px-3 py-2 rounded-2xl border border-amber-200">
                <span className="text-xs font-bold text-amber-900">목표 숫자:</span>
                <select
                  value={targetNum}
                  disabled={isRunning}
                  onChange={(e) => setTargetNum(Number(e.target.value))}
                  className="bg-white border border-amber-300 rounded-lg px-2 py-1 text-sm font-black text-amber-950 shadow-inner"
                >
                  <option value={85}>85 (권장: 뒷번호)</option>
                  <option value={99}>99 (최악의 경우)</option>
                  <option value={50}>50 (중앙값)</option>
                  <option value={23}>23 (앞쪽 번호)</option>
                  <option value={72}>72</option>
                </select>
              </div>

              <button
                onClick={startBattle}
                disabled={isRunning}
                className="flex-1 md:flex-none px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 text-white font-black text-sm shadow-md flex items-center justify-center gap-2 transition-all"
              >
                <Play className="w-4 h-4" />
                <span>{isRunning ? '탐색 진행 중...' : '대결 시작!'}</span>
              </button>

              <button
                onClick={resetBattle}
                disabled={isRunning}
                className="p-3 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-2xl border border-stone-200"
                title="초기화"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 두 탐색의 대결 카드 레이아웃 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 1. 순차 탐색 카드 (거북이 탐정) */}
            <div className="bg-amber-50/60 rounded-3xl p-5 border-2 border-amber-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🐢</span>
                    <div>
                      <h3 className="font-extrabold text-amber-950 text-base">
                        순차 탐색 (Sequential)
                      </h3>
                      <span className="text-xs text-stone-500">
                        1번부터 하나씩 차례로 검색
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-black px-2.5 py-1 rounded-full bg-amber-200 text-amber-900">
                    O(N) 선형 시간
                  </span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-amber-200 space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-stone-500">현재 확인 중:</span>
                    <span className="text-2xl font-black text-amber-900">
                      {seqCurrent > 0 ? `${seqCurrent}번` : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-stone-500">누적 시도 횟수:</span>
                    <span className="text-3xl font-black text-amber-600">
                      {seqAttempts} 회
                    </span>
                  </div>
                </div>

                {/* 100개 미니 도트 그리드 */}
                <div className="mt-4">
                  <span className="text-[11px] font-bold text-stone-500 block mb-1.5">
                    1~100번 데이터 탐색 진행 현황:
                  </span>
                  <div className="grid grid-cols-20 gap-0.5 p-2 bg-white rounded-xl border border-amber-200">
                    {Array.from({ length: 100 }, (_, i) => i + 1).map((n) => {
                      const isVisited = n <= seqCurrent;
                      const isTarget = n === targetNum;
                      return (
                        <div
                          key={n}
                          className={`w-full aspect-square rounded-[2px] transition-colors ${
                            isTarget && isVisited
                              ? 'bg-emerald-500 ring-2 ring-emerald-300'
                              : isVisited
                              ? 'bg-amber-400'
                              : isTarget
                              ? 'bg-rose-400'
                              : 'bg-stone-100'
                          }`}
                          title={`${n}번`}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-amber-200/80">
                <span className="text-xs font-extrabold text-amber-900">
                  {seqFound ? (
                    <span className="text-emerald-700 flex items-center gap-1 font-black">
                      <CheckCircle2 className="w-4 h-4" />
                      탐색 성공! 총 {seqAttempts}번 확인 완료
                    </span>
                  ) : (
                    '대결 시작을 누르면 1번부터 차례대로 탐색합니다.'
                  )}
                </span>
              </div>
            </div>

            {/* 2. 이진 탐색 카드 (치타 탐정) */}
            <div className="bg-sky-50/60 rounded-3xl p-5 border-2 border-sky-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🐆</span>
                    <div>
                      <h3 className="font-extrabold text-sky-950 text-base">
                        이진 탐색 (Binary)
                      </h3>
                      <span className="text-xs text-stone-500">
                        중앙값을 찍고 매번 절반 버리기
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-black px-2.5 py-1 rounded-full bg-sky-200 text-sky-900">
                    O(log N) 로그 시간
                  </span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-sky-200 space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-stone-500">현재 확인 중:</span>
                    <span className="text-2xl font-black text-sky-900">
                      {binCurrentMid > 0 ? `${binCurrentMid}번 (Mid)` : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-stone-500">누적 시도 횟수:</span>
                    <span className="text-3xl font-black text-sky-600">
                      {binAttempts} 회
                    </span>
                  </div>
                </div>

                {/* 이진 탐색 스텝 히스토리 */}
                <div className="mt-4">
                  <span className="text-[11px] font-bold text-stone-500 block mb-1.5">
                    이진 탐색의 이동 경로:
                  </span>
                  <div className="bg-white p-2.5 rounded-xl border border-sky-200 min-h-[76px] space-y-1">
                    {binHistory.length === 0 ? (
                      <p className="text-xs text-stone-400">대결 시작 시 초고속 점프를 보여줍니다.</p>
                    ) : (
                      binHistory.map((h, i) => (
                        <div key={i} className="text-xs font-bold text-sky-900 flex items-center justify-between">
                          <span>
                            {h.step}회차: <strong>{h.mid}번</strong> 확인
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black ${
                              h.res.includes('발견')
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-sky-100 text-sky-800'
                            }`}
                          >
                            {h.res}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-sky-200/80">
                <span className="text-xs font-extrabold text-sky-900">
                  {binFound ? (
                    <span className="text-emerald-700 flex items-center gap-1 font-black">
                      <CheckCircle2 className="w-4 h-4" />
                      초고속 완료! 단 {binAttempts}번 만에 목표 도달
                    </span>
                  ) : (
                    '대결 시작을 누르면 절반씩 즉시 좁혀갑니다.'
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* 대결 결과 비교 막대그래프 */}
          {isBattleFinished && (
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-6 rounded-3xl border-2 border-amber-300 space-y-4 animate-scale-up">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-amber-600" />
                <h4 className="text-lg font-black text-amber-950">
                  결과 분석: 탐색 횟수 직관적 비교
                </h4>
              </div>

              <div className="space-y-3">
                {/* 순차 탐색 막대 */}
                <div>
                  <div className="flex justify-between text-xs font-bold text-amber-950 mb-1">
                    <span>🐢 순차 탐색: {seqAttempts}번 시도</span>
                    <span className="text-amber-700">100%</span>
                  </div>
                  <div className="w-full bg-stone-200 h-6 rounded-xl overflow-hidden p-0.5">
                    <div
                      className="bg-amber-500 h-full rounded-lg transition-all duration-700 flex items-center justify-end pr-2 text-white text-[11px] font-black"
                      style={{ width: '100%' }}
                    >
                      {seqAttempts}회
                    </div>
                  </div>
                </div>

                {/* 이진 탐색 막대 */}
                <div>
                  <div className="flex justify-between text-xs font-bold text-sky-950 mb-1">
                    <span>🐆 이진 탐색: {binAttempts}번 시도</span>
                    <span className="text-emerald-700 font-extrabold">
                      약 {Math.round(seqAttempts / Math.max(1, binAttempts))}배 더 빠름! ⚡
                    </span>
                  </div>
                  <div className="w-full bg-stone-200 h-6 rounded-xl overflow-hidden p-0.5">
                    <div
                      className="bg-sky-500 h-full rounded-lg transition-all duration-700 flex items-center justify-end pr-2 text-white text-[11px] font-black"
                      style={{ width: `${Math.max(8, (binAttempts / seqAttempts) * 100)}%` }}
                    >
                      {binAttempts}회
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-amber-200 text-xs sm:text-sm font-bold text-amber-950">
                🎯 <strong>핵심 요약:</strong> 순차 탐색은 목표가 뒤에 있을수록 엄청난 횟수({seqAttempts}회)를 검사해야 하지만,
                이진 탐색은 매번 절반을 덜어내므로 단 <strong>{binAttempts}회</strong> 만에 끝냈습니다!
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => {
                    sound.playClick();
                    setActiveTab('quiz');
                  }}
                  className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs sm:text-sm rounded-xl shadow-md flex items-center gap-2"
                >
                  <span>결론 도출 퀴즈 풀러 가기</span>
                  <Sparkles className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================== [2. 결론 도출 퀴즈 (3문항)] ===================== */}
      {activeTab === 'quiz' && (
        <div className="bg-white rounded-3xl p-5 sm:p-8 border-2 border-amber-200 shadow-sm space-y-6">
          <div className="pb-4 border-b border-amber-100">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold mb-2">
              <span>개념 확인 평가</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-amber-950">
              알고리즘 마스터 퀴즈 (3문항)
            </h2>
            <p className="text-sm text-amber-900/80 mt-1">
              지금까지 배운 순차 탐색과 이진 탐색의 핵심 원리를 퀴즈로 정리해 보세요!
            </p>
          </div>

          <div className="space-y-6">
            {quizList.map((q, qIndex) => {
              const selected = selectedAnswers[q.id];
              const isAnswered = selected !== undefined;

              return (
                <div
                  key={q.id}
                  className="bg-amber-50/50 p-5 rounded-2xl border border-amber-200 space-y-3"
                >
                  <div className="flex items-start gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-amber-500 text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                      Q{q.id}
                    </span>
                    <h3 className="text-sm sm:text-base font-extrabold text-amber-950">
                      {q.question}
                    </h3>
                  </div>

                  {/* 선택지 목록 */}
                  <div className="space-y-2 pl-8">
                    {q.options.map((opt, optIndex) => {
                      const isChosen = selected === optIndex;
                      const showResult = quizSubmitted;
                      const isCorrect = opt.isCorrect;

                      return (
                        <button
                          key={optIndex}
                          disabled={quizSubmitted}
                          onClick={() => handleSelectOption(q.id, optIndex)}
                          className={`w-full text-left p-3 rounded-xl border-2 transition-all flex items-center justify-between text-xs sm:text-sm font-bold ${
                            showResult
                              ? isCorrect
                                ? 'bg-emerald-100 border-emerald-500 text-emerald-950'
                                : isChosen
                                ? 'bg-rose-100 border-rose-500 text-rose-950'
                                : 'bg-white border-stone-200 text-stone-400 opacity-60'
                              : isChosen
                              ? 'bg-amber-200 border-amber-500 text-amber-950 shadow-sm'
                              : 'bg-white border-stone-200 hover:border-amber-300 text-stone-700'
                          }`}
                        >
                          <span>{opt.label}</span>
                          {showResult && isCorrect && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          )}
                          {showResult && isChosen && !isCorrect && (
                            <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* 제출 후 해설 */}
                  {quizSubmitted && (
                    <div className="mt-3 pl-8">
                      <div className="p-3 bg-white rounded-xl border border-amber-200 text-xs text-amber-950 font-bold">
                        💡 {q.explanation}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 퀴즈 제출 버튼 */}
          <div className="pt-4 border-t border-amber-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs font-bold text-amber-800">
              {quizSubmitted
                ? `결과: 3문항 중 ${correctQuizCount}문항 정답!`
                : isAllQuizAnswered
                ? '모든 문항을 선택하셨습니다. 제출하여 채점하세요!'
                : '3개 문항의 답을 모두 골라주세요.'}
            </span>

            {!quizSubmitted ? (
              <button
                onClick={handleSubmitQuiz}
                disabled={!isAllQuizAnswered}
                className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-40 text-white font-black text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>퀴즈 채점 및 수료증 받기</span>
                <Sparkles className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => {
                  sound.playClick();
                  setActiveTab('certificate');
                }}
                className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>🏆 마스터 배지 확인하기</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ===================== [3. 최종 수료 배지 및 증서] ===================== */}
      {activeTab === 'certificate' && (
        <div className="bg-white rounded-3xl p-5 sm:p-8 border-2 border-amber-200 shadow-sm space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-3">
            <div className="inline-flex p-4 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 shadow-lg text-4xl animate-bounce">
              🥇
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-amber-950">
              알고리즘 마스터 배지 수여
            </h2>
            <p className="text-xs sm:text-sm text-stone-600">
              순차 탐색과 이진 탐색의 핵심 원리를 완벽하게 이해하고 훈련을 수료했습니다!
            </p>
          </div>

          {/* 수료증 카드 */}
          <div className="max-w-xl mx-auto bg-gradient-to-br from-amber-100 via-amber-50 to-yellow-100 p-6 sm:p-8 rounded-3xl border-4 border-amber-400 shadow-xl relative overflow-hidden">
            {/* 배경 문양 */}
            <div className="absolute top-2 right-2 text-7xl opacity-10 pointer-events-none">
              🕵️‍♂️
            </div>

            <div className="relative z-10 space-y-5 text-center">
              <div className="flex items-center justify-center gap-2">
                <span className="text-xs font-black px-3 py-1 rounded-full bg-amber-500 text-white tracking-widest uppercase">
                  Official Certificate
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-amber-950">
                탐색 알고리즘 마스터 탐정 자격증
              </h3>

              {/* 학생 이름 입력 */}
              <div className="max-w-xs mx-auto">
                <label className="text-[11px] font-bold text-amber-800 block mb-1">
                  탐정 닉네임 / 이름:
                </label>
                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border-2 border-amber-300 shadow-inner">
                  <User className="w-4 h-4 text-amber-600 shrink-0" />
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="이름을 입력하세요"
                    className="w-full text-center font-black text-amber-950 text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-amber-300 text-xs font-bold text-amber-950 space-y-2 text-left">
                <p>
                  위 학생은 주니어 코딩 탐색 알고리즘 과정의 모든 미션을 성실히 완수하였음을 증명합니다.
                </p>
                <ul className="list-disc pl-4 space-y-1 text-stone-600 text-[11px]">
                  <li>1단계: 정렬되지 않은 데이터의 <strong>순차 탐색 5문제 클리어</strong></li>
                  <li>2단계: 정렬된 데이터의 <strong>이진 탐색(절반 분할) 5문제 클리어</strong></li>
                  <li>3단계: 100개 데이터 대결 실험 및 <strong>종합 퀴즈 마스터</strong></li>
                </ul>
              </div>

              <div className="flex items-center justify-between text-[11px] font-extrabold text-amber-800 pt-2 border-t border-amber-300">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>수여일: {new Date().toLocaleDateString('ko-KR')}</span>
                </div>
                <span className="text-amber-950">발급: 알고리즘 탐정 연구소</span>
              </div>
            </div>
          </div>

          {/* 다시 하기 및 공유 액션 */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <button
              onClick={() => {
                sound.playFanfare();
                confetti({
                  particleCount: 100,
                  spread: 80,
                  origin: { y: 0.5 },
                });
              }}
              className="w-full sm:w-auto px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs sm:text-sm rounded-xl shadow-md flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>축하 폭죽 다시 터뜨리기</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                onResetAll();
              }}
              className="w-full sm:w-auto px-6 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs sm:text-sm rounded-xl border border-stone-300 flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>처음부터 다시 복습하기</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
