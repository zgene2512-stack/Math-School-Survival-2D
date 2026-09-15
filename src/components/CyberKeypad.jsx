import React from 'react';
import { Delete, CornerDownLeft } from 'lucide-react';
import { sound } from '../utils/audio.js';

export const CyberKeypad = ({
  onDigit,
  onBackspace,
  onSubmit,
  disabled = false,
}) => {
  const handleKey = (digit) => {
    if (disabled) return;
    sound.playKeyBlip();
    onDigit(digit);
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

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  return (
    <div className="w-full max-w-md mx-auto select-none mt-2">
      <div className="grid grid-cols-3 gap-2">
        {keys.map((num) => (
          <button
            key={num}
            id={`btn-numpad-${num}`}
            type="button"
            disabled={disabled}
            onClick={() => handleKey(num)}
            className="h-12 sm:h-13 bg-[#1e293b] hover:bg-[#334155] active:bg-[#38bdf8] active:text-slate-900 border border-slate-700 hover:border-sky-400 rounded-lg text-sky-200 font-mono text-xl sm:text-2xl font-bold tracking-wider transition-all duration-75 flex items-center justify-center shadow-md hover:shadow-sky-500/20 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {num}
          </button>
        ))}

        {/* Backspace */}
        <button
          id="btn-numpad-backspace"
          type="button"
          disabled={disabled}
          onClick={handleBack}
          className="h-12 sm:h-13 bg-[#450a0a] hover:bg-[#7f1d1d] active:bg-rose-500 active:text-white border border-rose-900 hover:border-rose-400 rounded-lg text-rose-300 font-mono font-bold transition-all duration-75 flex items-center justify-center gap-1 shadow-md cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          title="Hapus / Backspace"
        >
          <Delete className="w-5 h-5" />
          <span className="text-xs uppercase font-mono tracking-widest hidden sm:inline">Del</span>
        </button>

        {/* Zero */}
        <button
          id="btn-numpad-0"
          type="button"
          disabled={disabled}
          onClick={() => handleKey('0')}
          className="h-12 sm:h-13 bg-[#1e293b] hover:bg-[#334155] active:bg-[#38bdf8] active:text-slate-900 border border-slate-700 hover:border-sky-400 rounded-lg text-sky-200 font-mono text-xl sm:text-2xl font-bold tracking-wider transition-all duration-75 flex items-center justify-center shadow-md hover:shadow-sky-500/20 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          0
        </button>

        {/* Enter / Submit Answer */}
        <button
          id="btn-numpad-enter"
          type="button"
          disabled={disabled}
          onClick={handleSubmit}
          className="h-12 sm:h-13 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:brightness-110 active:scale-95 border border-emerald-400 rounded-lg font-mono font-bold text-sm sm:text-base tracking-widest transition-all duration-75 flex items-center justify-center gap-1 shadow-lg shadow-emerald-500/30 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          title="Jawab / Enter"
        >
          <CornerDownLeft className="w-4 h-4 stroke-[3]" />
          <span className="uppercase tracking-wider">JAWAB</span>
        </button>
      </div>
    </div>
  );
};
