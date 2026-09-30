"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const CELL_COUNT = 9;
const ROUND_SECONDS = 30;
type GameState = "idle" | "playing" | "paused" | "finished";

function randomCell(previous: number) {
  let next = Math.floor(Math.random() * CELL_COUNT);
  while (next === previous) next = Math.floor(Math.random() * CELL_COUNT);
  return next;
}

export default function Home() {
  const [gameState, setGameState] = useState<GameState>("idle");
  const [activeCell, setActiveCell] = useState(-1);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [soundOn, setSoundOn] = useState(true);
  const [bestScore, setBestScore] = useState(0);
  const [flashCell, setFlashCell] = useState(-1);
  const audioRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem("neon-reflex-best");
    if (stored) setBestScore(Number(stored) || 0);
  }, []);

  const playTone = useCallback((frequency: number) => {
    if (!soundOn) return;
    const AudioContextClass = window.AudioContext ||
      (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const context = audioRef.current ?? new AudioContextClass();
    audioRef.current = context;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.08, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.12);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.12);
  }, [soundOn]);

  const finishGame = useCallback(() => {
    setGameState("finished");
    setActiveCell(-1);
    setBestScore((currentBest) => {
      const nextBest = Math.max(currentBest, score);
      window.localStorage.setItem("neon-reflex-best", String(nextBest));
      return nextBest;
    });
  }, [score]);

  useEffect(() => {
    if (gameState !== "playing") return;
    const timer = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [gameState]);

  useEffect(() => {
    if (gameState === "playing" && timeLeft === 0) finishGame();
  }, [finishGame, gameState, timeLeft]);

  useEffect(() => {
    if (gameState !== "playing") return;
    const delay = Math.max(360, 850 - combo * 24);
    const targetTimer = window.setTimeout(() => {
      setCombo(0);
      setActiveCell((current) => randomCell(current));
    }, delay);
    return () => window.clearTimeout(targetTimer);
  }, [activeCell, combo, gameState]);

  const startGame = useCallback(() => {
    setScore(0);
    setCombo(0);
    setTimeLeft(ROUND_SECONDS);
    setActiveCell(randomCell(-1));
    setGameState("playing");
  }, []);

  const hitCell = useCallback((index: number) => {
    if (gameState !== "playing" || index !== activeCell) return;
    const nextCombo = combo + 1;
    const earned = 10 + Math.min(nextCombo - 1, 10) * 2;
    setScore((current) => current + earned);
    setCombo(nextCombo);
    setFlashCell(index);
    window.setTimeout(() => setFlashCell(-1), 160);
    setActiveCell((current) => randomCell(current));
    playTone(520 + Math.min(nextCombo, 12) * 28);
  }, [activeCell, combo, gameState, playTone]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key >= "1" && event.key <= "9") hitCell(Number(event.key) - 1);
      if (event.code === "Space") {
        event.preventDefault();
        if (gameState === "idle" || gameState === "finished") startGame();
        else setGameState((current) => current === "playing" ? "paused" : "playing");
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [gameState, hitCell, startGame]);

  const togglePause = () => {
    if (gameState === "playing") setGameState("paused");
    else if (gameState === "paused") setGameState("playing");
  };

  return (
    <main className="game-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <header className="topbar">
        <a className="brand" href="#game" aria-label="霓虹反应首页">
          <span className="brand-mark" aria-hidden="true">✦</span><span>霓虹反应</span>
        </a>
        <button className="icon-button" type="button" onClick={() => setSoundOn((value) => !value)} aria-label={soundOn ? "关闭声音" : "开启声音"} title={soundOn ? "关闭声音" : "开启声音"}>
          {soundOn ? "♪" : "×"}
        </button>
      </header>

      <section className="game-layout" id="game">
        <div className="intro">
          <p className="eyebrow">30 秒反应挑战</p>
          <h1>看到光，<br /><span>就按下去。</span></h1>
          <p className="lede">追上随机亮起的光点，连续命中会加速，也会获得更高分数。</p>
          <div className="best-record"><span>个人最佳</span><strong>{Math.max(bestScore, score)}</strong><small>分</small></div>
        </div>

        <div className="play-area">
          <div className="scorebar" aria-live="polite">
            <div className="stat"><span>得分</span><strong>{score.toString().padStart(3, "0")}</strong></div>
            <div className={`combo-pill ${combo >= 3 ? "is-hot" : ""}`}><span>连击</span><strong>× {combo}</strong></div>
            <div className="stat stat-right"><span>剩余</span><strong>{timeLeft}<small>秒</small></strong></div>
          </div>

          <div className="board-wrap">
            <div className="board" aria-label="九宫格反应区">
              {Array.from({ length: CELL_COUNT }, (_, index) => (
                <button className={`cell ${activeCell === index && gameState === "playing" ? "is-active" : ""} ${flashCell === index ? "is-hit" : ""}`} key={index} type="button" onPointerDown={() => hitCell(index)} aria-label={`位置 ${index + 1}${activeCell === index ? "，目标" : ""}`}>
                  <span className="key-hint">{index + 1}</span><span className="target" aria-hidden="true"><i /></span>
                </button>
              ))}
            </div>

            {gameState !== "playing" && (
              <div className="game-overlay">
                <div className="overlay-symbol" aria-hidden="true">{gameState === "finished" ? "✓" : gameState === "paused" ? "Ⅱ" : "✦"}</div>
                <h2>{gameState === "finished" ? "挑战完成" : gameState === "paused" ? "已暂停" : "准备好了吗？"}</h2>
                <p>{gameState === "finished" ? `你拿到了 ${score} 分` : gameState === "paused" ? "休息一下，光点会等你" : "点击光点，或按对应数字键"}</p>
                {gameState === "paused" ? (
                  <button className="primary-button" type="button" onClick={togglePause}>继续游戏</button>
                ) : (
                  <button className="primary-button" type="button" onClick={startGame}>{gameState === "finished" ? "再玩一次" : "开始挑战"}</button>
                )}
              </div>
            )}
          </div>

          <div className="controls">
            <button className="secondary-button" type="button" onClick={gameState === "idle" || gameState === "finished" ? startGame : togglePause}>
              <span aria-hidden="true">{gameState === "playing" ? "Ⅱ" : "▶"}</span>{gameState === "playing" ? "暂停" : gameState === "paused" ? "继续" : "新游戏"}
            </button>
            <p><kbd>1</kbd>–<kbd>9</kbd> 命中目标 <span>·</span> <kbd>空格</kbd> 暂停</p>
          </div>
        </div>
      </section>
      <footer><span>保持专注</span><i /> <span>追逐光点</span></footer>
    </main>
  );
}
