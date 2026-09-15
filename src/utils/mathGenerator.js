/**
 * Pembuat soal matematika dinamis dengan berbagai variasi soal per tingkatan kelas:
 * - Kelas 1 (Skor 0 - 500):
 *     * Perkalian dasar: a × b
 *     * Pembagian bulat: a ÷ b
 *     * Pengurangan yang menghasilkan minus: a - b (misal: 3 - 7 = -4, 4 - 10 = -6)
 * - Kelas 2 (Skor 501 - 1200):
 *     * Perkalian puluhan: 12 × 5
 *     * Operasi minus lebih besar: 15 - 28 = -13, 20 - 45 = -25
 *     * Campuran 3 angka dasar: 4 × 2 - 12 = -4
 * - Kelas 3 (Skor 1201 - 2500):
 *     * Soal kurung bervariasi: 3 × 1 + (2 + 1) = 6
 *     * Soal kurung minus: 2 × (3 - 8) = -10
 *     * Soal kurung ganda: (4 + 2) × (5 - 3)
 *     * Campuran operasi: 15 - (3 × 4 + 7) = -4
 * - Kelas 4 (Skor 2501+):
 *     * Perpangkatan & kurung: 2³ + (4 - 1) × 3
 *     * Perpangkatan minus: 3² - 20 = -11, 4² - 3³ = -11
 *     * Operasi kurung kompleks: (2² + 3) × 2 - 18 = -4
 */
export function generateMathProblem(currentScore) {
  let expr = '';
  let ans = 0;

  if (currentScore < 500) {
    // KELAS 1: Perkalian, Pembagian, dan Pengurangan Hasil Minus Sederhana
    const roll = Math.random();
    if (roll < 0.35) {
      // Perkalian dasar
      const a = Math.floor(Math.random() * 8) + 2;
      const b = Math.floor(Math.random() * 8) + 2;
      expr = `${a} × ${b}`;
      ans = a * b;
    } else if (roll < 0.65) {
      // Pembagian bulat
      const b = Math.floor(Math.random() * 8) + 2;
      const ansTemp = Math.floor(Math.random() * 8) + 2;
      const a = b * ansTemp;
      expr = `${a} ÷ ${b}`;
      ans = ansTemp;
    } else {
      // Pengurangan yang menghasilkan angka MINUS (misal: 2 - 7 = -5)
      const a = Math.floor(Math.random() * 8) + 1; // 1..8
      const diff = Math.floor(Math.random() * 8) + 2; // selisih 2..9
      const b = a + diff;
      expr = `${a} - ${b}`;
      ans = a - b; // Negatif: -2 s/d -9
    }
  } else if (currentScore < 1200) {
    // KELAS 2: Angka Puluhan, Campuran, dan Hasil Minus Menengah
    const roll = Math.random();
    if (roll < 0.3) {
      // Perkalian puluhan
      const a = Math.floor(Math.random() * 11) + 4; // 4..14
      const b = Math.floor(Math.random() * 8) + 2;
      expr = `${a} × ${b}`;
      ans = a * b;
    } else if (roll < 0.55) {
      // Pembagian puluhan
      const b = Math.floor(Math.random() * 9) + 2;
      const ansTemp = Math.floor(Math.random() * 12) + 2;
      const a = b * ansTemp;
      expr = `${a} ÷ ${b}`;
      ans = ansTemp;
    } else if (roll < 0.75) {
      // Pengurangan minus puluhan (misal: 14 - 25 = -11)
      const a = Math.floor(Math.random() * 20) + 5;
      const diff = Math.floor(Math.random() * 15) + 3;
      const b = a + diff;
      expr = `${a} - ${b}`;
      ans = a - b;
    } else {
      // Campuran 3 angka yang menghasilkan minus: a * b - c (misal: 3 * 2 - 11 = -5)
      const a = Math.floor(Math.random() * 5) + 2;
      const b = Math.floor(Math.random() * 4) + 2;
      const mult = a * b;
      const diff = Math.floor(Math.random() * 8) + 2;
      const c = mult + diff;
      expr = `${a} × ${b} - ${c}`;
      ans = mult - c; // Negatif
    }
  } else if (currentScore < 2500) {
    // KELAS 3: Soal Tanda Kurung Seperti 3 × 1 + (2 + 1), kurung minus, dll.
    const roll = Math.random();
    if (roll < 0.35) {
      // Format permintaan user: a × b + (c + d)
      const a = Math.floor(Math.random() * 5) + 1;
      const b = Math.floor(Math.random() * 4) + 1;
      const c = Math.floor(Math.random() * 6) + 1;
      const d = Math.floor(Math.random() * 5) + 1;
      expr = `${a} × ${b} + (${c} + ${d})`;
      ans = a * b + (c + d);
    } else if (roll < 0.6) {
      // Format kurung minus: a × (b - c)
      const a = Math.floor(Math.random() * 5) + 2;
      const b = Math.floor(Math.random() * 5) + 1;
      const diff = Math.floor(Math.random() * 6) + 2;
      const c = b + diff; // b - c bernilai minus
      expr = `${a} × (${b} - ${c})`;
      ans = a * (b - c);
    } else if (roll < 0.8) {
      // Format kurung ganda: (a + b) × (c - d)
      const a = Math.floor(Math.random() * 4) + 1;
      const b = Math.floor(Math.random() * 4) + 1;
      const c = Math.floor(Math.random() * 6) + 2;
      const d = Math.floor(Math.random() * 5) + 1;
      expr = `(${a} + ${b}) × (${c} - ${d})`;
      ans = (a + b) * (c - d);
    } else {
      // Format kurung campuran: a - (b × c + d) yang menghasilkan minus
      const a = Math.floor(Math.random() * 10) + 2;
      const b = Math.floor(Math.random() * 4) + 2;
      const c = Math.floor(Math.random() * 4) + 1;
      const d = Math.floor(Math.random() * 6) + 2;
      expr = `${a} - (${b} × ${c} + ${d})`;
      ans = a - (b * c + d);
    }
  } else {
    // KELAS 4: Perpangkatan, Kurung Kompleks & Operasi Minus Lanjut
    const roll = Math.random();
    if (roll < 0.35) {
      // Pangkat + kurung: a² + (b - c)
      const a = Math.floor(Math.random() * 6) + 2;
      const b = Math.floor(Math.random() * 8) + 2;
      const c = Math.floor(Math.random() * 6) + 1;
      expr = `${a}² + (${b} - ${c})`;
      ans = Math.pow(a, 2) + (b - c);
    } else if (roll < 0.65) {
      // Pangkat minus: a² - b
      const a = Math.floor(Math.random() * 6) + 2; // 2..7 -> a² 4..49
      const aSq = Math.pow(a, 2);
      const diff = Math.floor(Math.random() * 15) + 3;
      const b = aSq + diff;
      expr = `${a}² - ${b}`;
      ans = aSq - b; // Negatif
    } else {
      // Operasi kurung kompleks berantai: (a² - b) × c + d
      const a = Math.floor(Math.random() * 5) + 2; // 2..6
      const b = Math.floor(Math.random() * 5) + 1;
      const c = Math.floor(Math.random() * 4) + 2;
      const d = Math.floor(Math.random() * 8) + 1;
      expr = `(${a}² - ${b}) × ${c} + ${d}`;
      ans = (Math.pow(a, 2) - b) * c + d;
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
      label: 'Kelas 1: Aritmatika & Negatif',
      nextThreshold: 500,
      progressPercent: Math.min(100, Math.floor((score / 500) * 100)),
    };
  } else if (score < 1200) {
    return {
      level: 2,
      label: 'Kelas 2: Puluhan & Minus Campuran',
      nextThreshold: 1200,
      progressPercent: Math.min(100, Math.floor(((score - 500) / 700) * 100)),
    };
  } else if (score < 2500) {
    return {
      level: 3,
      label: 'Kelas 3: Tanda Kurung & Multi-Operasi',
      nextThreshold: 2500,
      progressPercent: Math.min(100, Math.floor(((score - 1200) / 1300) * 100)),
    };
  } else {
    return {
      level: 4,
      label: 'Kelas Unggulan: Perpangkatan & Kurung Kompleks',
      nextThreshold: 5000,
      progressPercent: Math.min(100, Math.floor(((score - 2500) / 2500) * 100)),
    };
  }
}
