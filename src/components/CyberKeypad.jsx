import React from 'react';
import { Delete, CornerDownLeft, Minus } from 'lucide-react';
import { sound } from '../utils/audio.js';

export const CyberKeypad = ({
  onDigit,
  onMinus,
  onBackspace,
  onSubmit,
  disabled = false,
}) => {
  const handleKey = (digit) => {
    if (disabled) return;
    sound.playKeyBlip();
    onDigit(digit);
  };

  const handleMinus = () => {
    if (disabled) return;
    sound.playKeyBlip();
    onMinus();
  };

  const handleBack = () => {
    if (disabled) return;
    sound.playKeyBlip();
    onBackspace();
  };

  const handleSubmit = () => {
    if (disabled) return;
    onSubmit();
  };

  return (
    <div className="w-full max-w-md mx-auto select-none mt-2">
      {/* 4 Baris Keypad dengan tombol Minus (-) */}
      <div className="grid grid-cols-3 gap-2">
        {/* Row 1: 1, 2, 3 */}
        {['1', '2', '3'].map((num) => (
          <button
            key={num}
            id={`btn-numpad-${num}`}
            type="button"
            disabled={disabled}
            onClick={() => handleKey(num)}
            className="h-11 sm:h-12 bg-[#1e293b] hover:bg-[#334155] active:bg-[#38bdf8] active:text-slate-900 border border-slate-700 hover:border-sky-400 rounded-lg text-sky-200 font-mono text-xl sm:text-2xl font-bold tracking-wider transition-all duration-75 flex items-center justify-center shadow-md hover:shadow-sky-500/20 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {num}
          </button>
        ))}

        {/* Row 2: 4, 5, 6 */}
        {['4', '5', '6'].map((num) => (
          <button
            key={num}
            id={`btn-numpad-${num}`}
            type="button"
            disabled={disabled}
            onClick={() => handleKey(num)}
            className="h-11 sm:h-12 bg-[#1e293b] hover:bg-[#334155] active:bg-[#38bdf8] active:text-slate-900 border border-slate-700 hover:border-sky-400 rounded-lg text-sky-200 font-mono text-xl sm:text-2xl font-bold tracking-wider transition-all duration-75 flex items-center justify-center shadow-md hover:shadow-sky-500/20 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {num}
          </button>
        ))}

        {/* Row 3: 7, 8, 9 */}
        {['7', '8', '9'].map((num) => (
          <button
            key={num}
            id={`btn-numpad-${num}`}
            type="button"
            disabled={disabled}
            onClick={() => handleKey(num)}
            className="h-11 sm:h-12 bg-[#1e293b] hover:bg-[#334155] active:bg-[#38bdf8] active:text-slate-900 border border-slate-700 hover:border-sky-400 rounded-lg text-sky-200 font-mono text-xl sm:text-2xl font-bold tracking-wider transition-all duration-75 flex items-center justify-center shadow-md hover:shadow-sky-500/20 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {num}
          </button>
        ))}

        {/* Row 4: Minus (-), 0, Backspace */}
        <button
          id="btn-numpad-minus"
          type="button"
          disabled={disabled}
          onClick={handleMinus}
          className="h-11 sm:h-12 bg-[#1e293b] hover:bg-[#334155] active:bg-amber-400 active:text-slate-900 border border-slate-700 hover:border-amber-400 rounded-lg text-amber-300 font-mono text-2xl font-bold transition-all duration-75 flex items-center justify-center gap-1 shadow-md hover:shadow-amber-500/20 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          title="Tanda Minus (-)"
        >
          <Minus className="w-6 h-6 stroke-[3]" />
        </button>

        <button
          id="btn-numpad-0"
          type="button"
          disabled={disabled}
          onClick={() => handleKey('0')}
          className="h-11 sm:h-12 bg-[#1e293b] hover:bg-[#334155] active:bg-[#38bdf8] active:text-slate-900 border border-slate-700 hover:border-sky-400 rounded-lg text-sky-200 font-mono text-xl sm:text-2xl font-bold tracking-wider transition-all duration-75 flex items-center justify-center shadow-md hover:shadow-sky-500/20 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          0
        </button>

        <button
          id="btn-numpad-backspace"
          type="button"
          disabled={disabled}
          onClick={handleBack}
          className="h-11 sm:h-12 bg-[#450a0a] hover:bg-[#7f1d1d] active:bg-rose-500 active:text-white border border-rose-900 hover:border-rose-400 rounded-lg text-rose-300 font-mono font-bold transition-all duration-75 flex items-center justify-center gap-1 shadow-md cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          title="Hapus / Backspace"
        >
          <Delete className="w-5 h-5" />
          <span className="text-xs uppercase font-mono tracking-widest hidden sm:inline">Del</span>
        </button>
      </div>

      {/* Row 5: Tombol JAWAB (Full Width di bawah numpad untuk kemudahan menekan) */}
      <div className="mt-2">
        <button
          id="btn-numpad-enter"
          type="button"
          disabled={disabled}
          onClick={handleSubmit}
          className="w-full h-11 sm:h-12 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:brightness-110 active:scale-[0.99] border border-emerald-400 rounded-lg font-mono font-bold text-sm sm:text-base tracking-widest transition-all duration-75 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          title="Jawab / Enter"
        >
          <CornerDownLeft className="w-4 h-4 stroke-[3]" />
          <span className="uppercase tracking-wider">KIRIM JAWABAN (ENTER)</span>
        </button>
      </div>
    </div>
  );
};
