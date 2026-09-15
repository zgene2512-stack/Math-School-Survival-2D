import React from 'react';
import { Volume2, VolumeX, Maximize2, Minimize2, Keyboard, Trophy, Flame, Clock, GraduationCap } from 'lucide-react';
import { getDifficultyLevel } from '../utils/mathGenerator.js';

export const GameHUD = ({
  gameState,
  score,
  highScore,
  combo,
  maxCombo,
  enemiesDefeated,
  survivedTime,
  isMuted,
  onToggleMute,
  showKeypad,
  onToggleKeypad,
  isFullscreen,
  onToggleFullscreen,
  onStartGame,
}) => {
  const diff = getDifficultyLevel(score);

  // Format detik menjadi MM:SS
  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {/* Top Right Controls & Timer Bar */}
      <div className="absolute top-2 right-2 z-20 flex items-center gap-1.5 sm:gap-2">
        {/* Survival Timer di Kanan Atas */}
        <div
          id="hud-survival-timer"
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900/90 border border-amber-400/40 backdrop-blur text-amber-300 font-mono text-xs sm:text-sm font-bold shadow-md"
          title="Waktu Bertahan Hidup"
        >
          <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 animate-pulse" />
          <span>{formatTime(survivedTime)}</span>
        </div>

        {/* Level & Difficulty Badge (saat bermain) */}
        {gameState === 'PLAYING' && (
          <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-sky-400/40 backdrop-blur text-xs font-mono text-sky-300">
            <GraduationCap className="w-3.5 h-3.5 text-sky-400" />
            <span>{diff.label}</span>
          </div>
        )}

        {/* Keypad Toggle Button */}
        <button
          id="btn-toggle-keypad"
          type="button"
          onClick={onToggleKeypad}
          className={`p-2 rounded-lg border text-xs font-mono transition-colors cursor-pointer backdrop-blur ${
            showKeypad
              ? 'bg-sky-500/20 border-sky-400 text-sky-300'
              : 'bg-slate-900/80 border-slate-700 text-slate-400 hover:text-white'
          }`}
          title={showKeypad ? 'Sembunyikan Papan Angka' : 'Tampilkan Papan Angka'}
        >
          <Keyboard className="w-4 h-4" />
        </button>

        {/* Audio Mute/Unmute */}
        <button
          id="btn-toggle-sound"
          type="button"
          onClick={onToggleMute}
          className="p-2 rounded-lg bg-slate-900/80 border border-slate-700 text-slate-400 hover:text-sky-300 hover:border-sky-400/50 transition-colors cursor-pointer backdrop-blur"
          title={isMuted ? 'Nyalakan Suara' : 'Matikan Suara'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
        </button>

        {/* Fullscreen Button */}
        <button
          id="btn-toggle-fullscreen"
          type="button"
          onClick={onToggleFullscreen}
          className="p-2 rounded-lg bg-slate-900/80 border border-slate-700 text-slate-400 hover:text-sky-300 hover:border-sky-400/50 transition-colors cursor-pointer backdrop-blur"
          title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Start Screen Overlay (Tema Sekolah) */}
      {gameState === 'START' && (
        <div id="start-screen" className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/92 backdrop-blur-md p-6 text-center">
          <div className="relative mb-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 text-xs font-mono mb-2">
              <GraduationCap className="w-4 h-4" />
              <span>Simulasi Ujian Matematika Sekolah</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold uppercase tracking-wide text-white drop-shadow-md font-mono">
              Math School Survival
            </h1>
            <p className="text-sky-300 font-mono text-sm mt-1">
              Siswa Seragam Putih Abu-Abu vs Pertanyaan Bapak & Ibu Guru
            </p>
            <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-sky-400 to-transparent mt-3"></div>
          </div>

          <p className="text-slate-300 text-sm sm:text-base max-w-lg mt-2 leading-relaxed font-mono">
            Bapak dan Ibu Guru datang membawa soal matematika setiap <strong>5 detik</strong>.
            Ketik jawaban yang tepat sebelum mereka mencapai mejamu!
          </p>

          {/* Kartu Karakter & Aturan */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-4 max-w-xl w-full text-left font-mono">
            <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
              <div className="text-[11px] text-sky-400 font-bold">Karakter Utama</div>
              <div className="text-xs text-white mt-1">Siswa SMA</div>
              <div className="text-[10px] text-slate-400">Baju Putih Celana Abu</div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
              <div className="text-[11px] text-emerald-400 font-bold">Sasaran/Guru</div>
              <div className="text-xs text-white mt-1">Pak & Bu Guru</div>
              <div className="text-[10px] text-slate-400">Membawa Papan Soal</div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
              <div className="text-[11px] text-amber-400 font-bold">Interval Musuh</div>
              <div className="text-xs text-white mt-1">Tiap 5 Detik</div>
              <div className="text-[10px] text-slate-400">Muncul Terjadwal</div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
              <div className="text-[11px] text-purple-400 font-bold">Timer Survival</div>
              <div className="text-xs text-white mt-1">Kanan Atas</div>
              <div className="text-[10px] text-slate-400">Catat Rekor Waktu</div>
            </div>
          </div>

          {highScore > 0 && (
            <div className="flex items-center gap-2 mb-4 text-xs font-mono text-amber-300 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/30">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Skor Tertinggi: <strong>{highScore}</strong></span>
            </div>
          )}

          <button
            id="start-btn"
            type="button"
            onClick={onStartGame}
            className="px-8 py-3.5 text-base sm:text-lg font-bold font-mono text-slate-950 bg-gradient-to-r from-sky-400 to-teal-400 hover:brightness-110 rounded-xl cursor-pointer shadow-lg shadow-sky-500/30 transition-all duration-150 transform hover:scale-105 active:scale-95"
          >
            MULAI UJIAN
          </button>
        </div>
      )}

      {/* Game Over Screen Overlay */}
      {gameState === 'GAMEOVER' && (
        <div id="game-over-screen" className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/94 backdrop-blur-md p-6 text-center animate-in fade-in duration-200">
          <h1 className="text-4xl sm:text-6xl font-extrabold uppercase tracking-wide text-rose-500 drop-shadow-lg font-mono mb-2">
            WAKTU HABIS!
          </h1>
          <p className="text-slate-300 text-sm font-mono mb-4">
            Guru berhasil mencapai mejamu sebelum kamu menyelesaikan soal!
          </p>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 max-w-sm w-full mb-6 font-mono shadow-2xl">
            <div className="text-2xl font-bold text-white mb-1" id="final-score">
              Skor Ujian: <span className="text-sky-400">{score}</span>
            </div>
            <div className="text-sm text-amber-300 font-bold mb-3 flex items-center justify-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Bertahan: {formatTime(survivedTime)}</span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 block">Skor Terbaik</span>
                <span className="text-amber-400 font-bold">{Math.max(score, highScore)}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Max Combo</span>
                <span className="text-purple-400 font-bold flex items-center justify-center gap-1">
                  <Flame className="w-3 h-3 text-purple-400" />
                  {maxCombo}x
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Soal Terjawab</span>
                <span className="text-emerald-400 font-bold">{enemiesDefeated}</span>
              </div>
            </div>
          </div>

          <button
            id="restart-btn"
            type="button"
            onClick={onStartGame}
            className="px-8 py-3.5 text-base sm:text-lg font-bold font-mono text-slate-950 bg-gradient-to-r from-sky-400 to-teal-400 hover:brightness-110 rounded-xl cursor-pointer shadow-lg shadow-sky-500/30 transition-all duration-150 transform hover:scale-105 active:scale-95"
          >
            COBA LAGI
          </button>
        </div>
      )}
    </>
  );
};
