/**
 * Pembuat soal matematika dinamis dengan 4 tingkat kesulitan:
 * - Level 1 (Skor 0 - 500): Perkalian dasar (2-9) & pembagian bulat
 * - Level 2 (Skor 501 - 1200): Perkalian puluhan (10-15) & pembagian
 * - Level 3 (Skor 1201 - 2500): Soal campuran 3 angka (misal: 3 × 4 + 5)
 * - Level 4 (Skor 2501+): Perpangkatan & operasi kompleks (misal: 4² + 7)
 */
export function generateMathProblem(currentScore) {
  let expr = '';
  let ans = 0;

  if (currentScore < 500) {
    if (Math.random() < 0.5) {
      const a = Math.floor(Math.random() * 8) + 2;
      const b = Math.floor(Math.random() * 8) + 2;
      expr = `${a} × ${b}`;
      ans = a * b;
    } else {
      const b = Math.floor(Math.random() * 8) + 2;
      const ansTemp = Math.floor(Math.random() * 8) + 2;
      const a = b * ansTemp;
      expr = `${a} ÷ ${b}`;
      ans = ansTemp;
    }
  } else if (currentScore < 1200) {
    const type = Math.random();
    if (type < 0.5) {
      const a = Math.floor(Math.random() * 12) + 3;
      const b = Math.floor(Math.random() * 10) + 2;
      expr = `${a} × ${b}`;
      ans = a * b;
    } else {
      const b = Math.floor(Math.random() * 10) + 2;
      const ansTemp = Math.floor(Math.random() * 12) + 2;
      const a = b * ansTemp;
      expr = `${a} ÷ ${b}`;
      ans = ansTemp;
    }
  } else if (currentScore < 2500) {
    const a = Math.floor(Math.random() * 10) + 2;
    const b = Math.floor(Math.random() * 5) + 2;
    const c = Math.floor(Math.random() * 15) + 1;
    if (Math.random() < 0.5) {
      expr = `${a} × ${b} + ${c}`;
      ans = a * b + c;
    } else {
      const divRes = a;
      const dividend = a * b;
      const subtractor = c < divRes ? c : Math.max(1, Math.floor(divRes / 2));
      expr = `${dividend} ÷ ${b} - ${subtractor}`;
      ans = divRes - subtractor;
    }
  } else {
    if (Math.random() < 0.5) {
      const base = Math.floor(Math.random() * 7) + 2;
      const add = Math.floor(Math.random() * 20) + 1;
      expr = `${base}² + ${add}`;
      ans = Math.pow(base, 2) + add;
    } else {
      const a = Math.floor(Math.random() * 6) + 2;
      const b = Math.floor(Math.random() * 5) + 2;
      const c = Math.floor(Math.random() * 10) + 1;
      expr = `${a} × ${b} - ${c}`;
      ans = a * b - c;
    }
  }

  return {
    question: expr,
    answer: ans.toString(),
  };
}

export function getDifficultyLevel(score) {
  if (score < 500) {
    return {
      level: 1,
      label: 'Kelas 1: Aritmatika Dasar (×, ÷)',
      nextThreshold: 500,
      progressPercent: Math.min(100, Math.floor((score / 500) * 100)),
    };
  } else if (score < 1200) {
    return {
      level: 2,
      label: 'Kelas 2: Angka Puluhan (×, ÷)',
      nextThreshold: 1200,
      progressPercent: Math.min(100, Math.floor(((score - 500) / 700) * 100)),
    };
  } else if (score < 2500) {
    return {
      level: 3,
      label: 'Kelas 3: Operasi Campuran (3 Angka)',
      nextThreshold: 2500,
      progressPercent: Math.min(100, Math.floor(((score - 1200) / 1300) * 100)),
    };
  } else {
    return {
      level: 4,
      label: 'Kelas Unggulan: Perpangkatan',
      nextThreshold: 5000,
      progressPercent: Math.min(100, Math.floor(((score - 2500) / 2500) * 100)),
    };
  }
}
