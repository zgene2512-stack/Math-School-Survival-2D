import { useEffect, useRef, useState, useCallback } from 'react';
import { generateMathProblem, getDifficultyLevel } from './utils/mathGenerator.js';
import { sound } from './utils/audio.js';
import { CyberKeypad } from './components/CyberKeypad.jsx';
import { GameHUD } from './components/GameHUD.jsx';

export default function App() {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  // React state untuk tampilan antarmuka
  const [gameState, setGameState] = useState('START');
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [enemiesDefeated, setEnemiesDefeated] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showKeypad, setShowKeypad] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [survivedTime, setSurvivedTime] = useState(0);

  // References mutable untuk game loop 60 FPS tanpa re-render yang berat
  const gameStateRef = useRef('START');
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const maxComboRef = useRef(0);
  const enemiesDefeatedRef = useRef(0);
  const currentInputRef = useRef('');
  const lastTimeRef = useRef(0);
  const survivedTimeRef = useRef(0);

  // Waktu kemunculan guru/musuh diatur tepat per 5 detik sekali (5000 ms)
  const spawnTimerRef = useRef(0);
  const SPAWN_INTERVAL = 5000; // 5 Detik

  const shakeDurationRef = useRef(0);
  const shakeIntensityRef = useRef(0);
  const scrollOffsetRef = useRef(0);

  // Entitas dalam game
  const enemiesRef = useRef([]);
  const particlesRef = useRef([]);
  const popupsRef = useRef([]);
  const projectilesRef = useRef([]);

  // Load high score dari local storage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('school_math_survival_highscore');
      if (saved) {
        setHighScore(parseInt(saved, 10) || 0);
      }
    } catch {
      // Local storage fallback
    }
  }, []);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // Timer Survival per detik saat bermain
  useEffect(() => {
    let timerId = null;
    if (gameState === 'PLAYING') {
      timerId = setInterval(() => {
        survivedTimeRef.current += 1;
        setSurvivedTime(survivedTimeRef.current);
      }, 1000);
    }
    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [gameState]);

  // Efek getar layar
  const triggerShake = (duration, intensity) => {
    shakeDurationRef.current = duration;
    shakeIntensityRef.current = intensity;
  };

  // Efek konfeti / partikel nilai
  const createConfetti = (x, y, color) => {
    const colors = [color, '#38bdf8', '#f59e0b', '#10b981', '#ec4899', '#ffffff'];
    for (let i = 0; i < 24; i++) {
      particlesRef.current.push({
        x,
        y,
        size: Math.random() * 5 + 3,
        speedX: (Math.random() - 0.5) * 8,
        speedY: (Math.random() - 0.5) * 8 - 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        gravity: 0.18,
      });
    }
  };

  // Cek jawaban siswa terhadap guru terdekat
  const checkAnswer = useCallback(() => {
    if (gameStateRef.current !== 'PLAYING') return;
    const enemies = enemiesRef.current;
    const input = currentInputRef.current;

    if (enemies.length === 0 || input === '') return;

    // Cari guru terdekat dari meja siswa (koordinat x terkecil)
    let closestIndex = 0;
    let minX = enemies[0].x;

    for (let i = 1; i < enemies.length; i++) {
      if (enemies[i].x < minX) {
        minX = enemies[i].x;
        closestIndex = i;
      }
    }

    const targetEnemy = enemies[closestIndex];

    if (input === targetEnemy.answer) {
      // JAWABAN BENAR
      comboRef.current++;
      const currentCombo = comboRef.current;
      if (currentCombo > maxComboRef.current) {
        maxComboRef.current = currentCombo;
        setMaxCombo(currentCombo);
      }

      const gainedScore = 100 + currentCombo * 15;
      scoreRef.current += gainedScore;
      enemiesDefeatedRef.current++;

      setScore(scoreRef.current);
      setCombo(currentCombo);
      setEnemiesDefeated(enemiesDefeatedRef.current);

      // Lemparan kertas jawaban menuju guru
      projectilesRef.current.push({
        startX: 130,
        startY: 375,
        targetX: targetEnemy.x + targetEnemy.width / 2,
        targetY: targetEnemy.y + targetEnemy.height / 2,
        currentX: 130,
        currentY: 375,
        progress: 0,
        color: '#ffffff',
      });

      sound.playShoot();
      sound.playCorrect();
      if (currentCombo > 1) {
        sound.playCombo(currentCombo);
      }

      createConfetti(
        targetEnemy.x + targetEnemy.width / 2,
        targetEnemy.y + targetEnemy.height / 2,
        '#10b981'
      );

      popupsRef.current.push({
        text: `BENAR! +${gainedScore}${currentCombo > 1 ? ` (${currentCombo}x)` : ''}`,
        x: targetEnemy.x + targetEnemy.width / 2,
        y: targetEnemy.y - 15,
        alpha: 1,
        color: '#10b981',
      });

      triggerShake(6, 3);

      // Guru merasa puas dan pergi (hapus dari target)
      enemies.splice(closestIndex, 1);
    } else {
      // JAWABAN SALAH
      comboRef.current = 0;
      setCombo(0);

      sound.playError();
      triggerShake(14, 6);

      popupsRef.current.push({
        text: 'SALAH!',
        x: targetEnemy.x + targetEnemy.width / 2,
        y: targetEnemy.y - 15,
        alpha: 1,
        color: '#ef4444',
      });
    }

    currentInputRef.current = '';
  }, []);

  // Handle tombol digit
  const handleDigit = useCallback((digit) => {
    if (gameStateRef.current !== 'PLAYING') return;
    if (currentInputRef.current.length < 8) {
      currentInputRef.current += digit;
    }
  }, []);

  // Handle backspace
  const handleBackspace = useCallback(() => {
    if (gameStateRef.current !== 'PLAYING') return;
    currentInputRef.current = currentInputRef.current.slice(0, -1);
  }, []);

  // Mulai game baru
  const initGame = useCallback(() => {
    scoreRef.current = 0;
    comboRef.current = 0;
    maxComboRef.current = 0;
    enemiesDefeatedRef.current = 0;
    survivedTimeRef.current = 0;
    currentInputRef.current = '';
    enemiesRef.current = [];
    particlesRef.current = [];
    popupsRef.current = [];
    projectilesRef.current = [];
    spawnTimerRef.current = 4000; // Guru pertama datang cepat (1 detik pertama)
    shakeDurationRef.current = 0;
    lastTimeRef.current = performance.now();

    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setEnemiesDefeated(0);
    setSurvivedTime(0);
    setGameState('PLAYING');
    gameStateRef.current = 'PLAYING';
  }, []);

  const handleToggleMute = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // Keyboard handler global
  useEffect(() => {
    const onKeyDown = (e) => {
      if (gameStateRef.current !== 'PLAYING') {
        if (e.key === 'Enter' || e.key === ' ') {
          initGame();
        }
        return;
      }

      if (e.key >= '0' && e.key <= '9') {
        sound.playKeyBlip();
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        sound.playKeyBlip();
        handleBackspace();
      } else if (e.key === 'Enter') {
        checkAnswer();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleDigit, handleBackspace, checkAnswer, initGame]);

  // Main Canvas Render Loop (Tema Sekolah & Gambar Karakter Siswa + Guru)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId;
    let enemyIdCounter = 1;

    // Posisi Meja Siswa
    const student = {
      x: 75,
      y: 330,
      width: 50,
      height: 90,
    };

    const gameLoop = (timestamp) => {
      let deltaTime = timestamp - lastTimeRef.current;
      if (isNaN(deltaTime) || deltaTime > 100) deltaTime = 16.66;
      lastTimeRef.current = timestamp;

      // UPDATE PHASE
      if (gameStateRef.current === 'PLAYING') {
        if (shakeDurationRef.current > 0) {
          shakeDurationRef.current--;
        }

        // Animasi lantai berjalan pelan
        scrollOffsetRef.current = (scrollOffsetRef.current + 1.2) % 60;

        // Spawn Guru tepat setiap 5 Detik (5000 ms)
        spawnTimerRef.current += deltaTime;
        if (spawnTimerRef.current >= SPAWN_INTERVAL) {
          const problem = generateMathProblem(scoreRef.current);
          const isFemale = Math.random() > 0.5; // Guru Pria atau Wanita

          enemiesRef.current.push({
            id: enemyIdCounter++,
            x: canvas.width + 30,
            y: 320,
            width: 55,
            height: 100,
            speed: 0.95 + Math.random() * 0.3, // Kecepatan langkah santai namun pasti
            question: problem.question,
            answer: problem.answer,
            isFemale,
            walkCycle: 0,
          });

          spawnTimerRef.current = 0; // Reset ke 0, menghitung 5 detik berikutnya
        }

        // Update Guru
        for (let i = enemiesRef.current.length - 1; i >= 0; i--) {
          const enemy = enemiesRef.current[i];
          enemy.x -= enemy.speed * (deltaTime / 16);
          enemy.walkCycle = (enemy.walkCycle + 0.12) % (Math.PI * 2);

          // Jika guru menyentuh meja siswa -> GAME OVER
          if (enemy.x <= student.x + student.width + 10) {
            gameStateRef.current = 'GAMEOVER';
            setGameState('GAMEOVER');
            sound.playGameOver();

            const finalScore = scoreRef.current;
            setHighScore((prev) => {
              const newHigh = Math.max(prev, finalScore);
              try {
                localStorage.setItem('school_math_survival_highscore', newHigh.toString());
              } catch {}
              return newHigh;
            });
            break;
          }
        }

        // Update Lemparan Kertas Jawaban
        for (let i = projectilesRef.current.length - 1; i >= 0; i--) {
          const proj = projectilesRef.current[i];
          proj.progress += 0.08;
          proj.currentX = proj.startX + (proj.targetX - proj.startX) * proj.progress;
          // Efek parabola
          const arc = Math.sin(proj.progress * Math.PI) * 45;
          proj.currentY = proj.startY + (proj.targetY - proj.startY) * proj.progress - arc;

          if (proj.progress >= 1) {
            projectilesRef.current.splice(i, 1);
          }
        }

        // Update Partikel
        for (let i = particlesRef.current.length - 1; i >= 0; i--) {
          const p = particlesRef.current[i];
          p.x += p.speedX;
          p.y += p.speedY;
          p.speedY += p.gravity;
          p.alpha -= 0.024;
          if (p.alpha <= 0) particlesRef.current.splice(i, 1);
        }

        // Update Popups Text
        for (let i = popupsRef.current.length - 1; i >= 0; i--) {
          const pop = popupsRef.current[i];
          pop.y -= 1.0;
          pop.alpha -= 0.02;
          if (pop.alpha <= 0) popupsRef.current.splice(i, 1);
        }
      }

      // RENDER PHASE
      ctx.save();

      // Screen Shake
      if (shakeDurationRef.current > 0) {
        const intensity = shakeIntensityRef.current;
        const offsetX = (Math.random() - 0.5) * intensity;
        const offsetY = (Math.random() - 0.5) * intensity;
        ctx.translate(offsetX, offsetY);
      }

      // 1. LATAR BELAKANG KELAS SEKOLAH
      // Dinding kelas (warna krem kehijauan hangat khas ruang kelas)
      const wallGrad = ctx.createLinearGradient(0, 0, 0, 420);
      wallGrad.addColorStop(0, '#1a2736');
      wallGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = wallGrad;
      ctx.fillRect(0, 0, canvas.width, 420);

      // Papan Tulis Hijau Besar di Belakang Kelas
      ctx.fillStyle = '#78350f'; // Bingkai kayu papan tulis
      ctx.fillRect(180, 50, 540, 190);
      ctx.fillStyle = '#064e3b'; // Permukaan papan tulis hijau
      ctx.fillRect(190, 60, 520, 170);

      // Tulisan Kapur di Papan Tulis
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = '14px "Share Tech Mono", monospace';
      ctx.fillText('UJIAN MATEMATIKA - TAHUN AJARAN 2026', 220, 90);
      ctx.fillText('• Jawab cepat sebelum waktu habis!', 220, 120);
      ctx.fillText('• Interval Guru Datang: Setiap 5 Detik', 220, 145);

      // Jendela Kelas di Samping
      ctx.fillStyle = '#334155';
      ctx.fillRect(40, 60, 100, 150);
      ctx.fillStyle = '#38bdf8';
      ctx.globalAlpha = 0.25;
      ctx.fillRect(45, 65, 42, 65);
      ctx.fillRect(93, 65, 42, 65);
      ctx.fillRect(45, 135, 42, 70);
      ctx.fillRect(93, 135, 42, 70);
      ctx.globalAlpha = 1.0;

      // Garis Lantai Ruang Kelas (Lantai Ubin)
      const floorY = 420;
      ctx.fillStyle = '#334155';
      ctx.fillRect(0, floorY, canvas.width, canvas.height - floorY);

      // Garis ubin lantai bergeser
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      const tileStep = 60;
      const offset = scrollOffsetRef.current;
      for (let x = -offset; x < canvas.width; x += tileStep) {
        ctx.beginPath();
        ctx.moveTo(x, floorY);
        ctx.lineTo(x - 30, canvas.height);
        ctx.stroke();
      }

      // Garis pembatas lantai & dinding
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, floorY);
      ctx.lineTo(canvas.width, floorY);
      ctx.stroke();

      // 2. MENGGAMBAR KARAKTER: SISWA SERAGAM PUTIH CELANA ABU-ABU
      const sX = student.x;
      const sY = student.y;

      // Kursi Belajar Siswa
      ctx.fillStyle = '#92400e';
      ctx.fillRect(sX - 10, sY + 30, 8, 55); // Sandaran kursi
      ctx.fillRect(sX - 10, sY + 55, 30, 6);  // Alas duduk
      ctx.fillRect(sX - 5, sY + 61, 4, 25);   // Kaki kursi
      ctx.fillRect(sX + 15, sY + 61, 4, 25);

      // Celana Abu-Abu Siswa (SMA / Putih Abu-Abu)
      ctx.fillStyle = '#64748b'; // Abu-abu seragam khas SMA
      ctx.fillRect(sX + 6, sY + 50, 20, 20); // Paha duduk
      ctx.fillRect(sX + 22, sY + 52, 10, 30); // Kaki ke bawah

      // Sepatu Hitam Siswa
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(sX + 22, sY + 80, 16, 8);

      // Baju Seragam Putih Siswa
      ctx.fillStyle = '#f8fafc'; // Putih bersih
      ctx.fillRect(sX + 5, sY + 22, 22, 30);
      // Dasi abu-abu / saku seragam
      ctx.fillStyle = '#64748b';
      ctx.fillRect(sX + 14, sY + 24, 4, 16);

      // Tangan Siswa (di atas meja memegang pensil)
      ctx.fillStyle = '#fed7aa'; // Warna kulit
      ctx.fillRect(sX + 24, sY + 32, 16, 8);
      // Pensil
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(sX + 38, sY + 30, 3, 10);

      // Kepala & Rambut Siswa
      ctx.fillStyle = '#fed7aa'; // Kepala
      ctx.beginPath();
      ctx.arc(sX + 16, sY + 14, 11, 0, Math.PI * 2);
      ctx.fill();

      // Rambut Hitam Rapi Siswa
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(sX + 15, sY + 10, 11, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(sX + 5, sY + 9, 20, 4);

      // Meja Belajar Siswa Kayu
      ctx.fillStyle = '#b45309';
      ctx.fillRect(sX + 28, sY + 38, 38, 8); // Daun meja
      ctx.fillRect(sX + 32, sY + 46, 6, 40); // Kaki meja kiri
      ctx.fillRect(sX + 58, sY + 46, 6, 40); // Kaki meja kanan

      // Buku & Kertas Jawaban di atas meja
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(sX + 34, sY + 34, 18, 5);

      // 3. MENGGAMBAR PROYEKTIL: KERTAS JAWABAN MELUNCUR
      projectilesRef.current.forEach((proj) => {
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(proj.currentX, proj.currentY, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // 4. MENGGAMBAR SASARAN: GURU (BAPAK & IBU GURU)
      const enemies = enemiesRef.current;
      let closestIdx = -1;
      let minEnemyX = Infinity;

      for (let i = 0; i < enemies.length; i++) {
        if (enemies[i].x < minEnemyX) {
          minEnemyX = enemies[i].x;
          closestIdx = i;
        }
      }

      enemies.forEach((guru, index) => {
        const isTarget = index === closestIdx;
        const gX = guru.x;
        const gY = guru.y;
        const bob = Math.sin(guru.walkCycle) * 3; // Animasi langkah kaki guru

        ctx.save();

        if (guru.isFemale) {
          // --- IBU GURU ---
          // Rok Panjang / Celana Bahan Sopan
          ctx.fillStyle = '#0f766e'; // Rok toska tua elegan
          ctx.beginPath();
          ctx.moveTo(gX + 16, gY + 54);
          ctx.lineTo(gX + 40, gY + 54);
          ctx.lineTo(gX + 46, gY + 90);
          ctx.lineTo(gX + 10, gY + 90);
          ctx.closePath();
          ctx.fill();

          // Sepatu Hak Rapi
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(gX + 14, gY + 90, 10, 6);
          ctx.fillRect(gX + 32, gY + 90, 10, 6);

          // Baju Blazer / Batik Ibu Guru
          ctx.fillStyle = '#0d9488';
          ctx.fillRect(gX + 14, gY + 22 + bob, 28, 34);

          // Kepala & Rambut / Jilbab Rapi
          ctx.fillStyle = '#fed7aa'; // Muka
          ctx.beginPath();
          ctx.arc(gX + 28, gY + 12 + bob, 10, 0, Math.PI * 2);
          ctx.fill();

          // Rambut Sanggul / Kerudung
          ctx.fillStyle = '#475569';
          ctx.beginPath();
          ctx.arc(gX + 28, gY + 10 + bob, 11, Math.PI * 0.8, Math.PI * 2.2);
          ctx.fill();

          // Kacamata Baca Ibu Guru
          ctx.strokeStyle = '#e2e8f0';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(gX + 21, gY + 10 + bob, 6, 4);
          ctx.strokeRect(gX + 29, gY + 10 + bob, 6, 4);

          // Tangan Membawa Papan Ujian (Clipboard)
          ctx.fillStyle = '#78350f';
          ctx.fillRect(gX + 2, gY + 34 + bob, 14, 20);
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(gX + 4, gY + 36 + bob, 10, 16);
        } else {
          // --- BAPAK GURU ---
          // Celana Panjang Kain Hitam
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(gX + 16, gY + 56, 11, 35);
          ctx.fillRect(gX + 29, gY + 56, 11, 35);

          // Sepatu Pantofel
          ctx.fillStyle = '#09090b';
          ctx.fillRect(gX + 14, gY + 91, 14, 6);
          ctx.fillRect(gX + 28, gY + 91, 14, 6);

          // Kemeja Batik / Dinas Cokelat Rapi Bapak Guru
          ctx.fillStyle = '#92400e';
          ctx.fillRect(gX + 14, gY + 22 + bob, 28, 34);
          // Kerah kemeja
          ctx.fillStyle = '#fef3c7';
          ctx.beginPath();
          ctx.moveTo(gX + 24, gY + 22 + bob);
          ctx.lineTo(gX + 28, gY + 30 + bob);
          ctx.lineTo(gX + 32, gY + 22 + bob);
          ctx.fill();

          // Kepala & Rambut Bapak Guru
          ctx.fillStyle = '#fed7aa';
          ctx.beginPath();
          ctx.arc(gX + 28, gY + 12 + bob, 11, 0, Math.PI * 2);
          ctx.fill();

          // Rambut Hitam Rapi Belah Samping
          ctx.fillStyle = '#18181b';
          ctx.beginPath();
          ctx.arc(gX + 28, gY + 8 + bob, 11, Math.PI, Math.PI * 2);
          ctx.fill();

          // Kacamata Bapak Guru
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(gX + 21, gY + 11 + bob, 6, 4);
          ctx.strokeRect(gX + 29, gY + 11 + bob, 6, 4);

          // Membawa Penggaris Kayu / Buku Absen
          ctx.fillStyle = '#d97706';
          ctx.fillRect(gX + 4, gY + 32 + bob, 5, 30);
        }

        // Indikator Target Guru Terdekat
        if (isTarget) {
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 3]);
          ctx.strokeRect(gX - 6, gY - 6, guru.width + 12, guru.height + 12);
          ctx.setLineDash([]);

          // Tanda panah fokus di atas soal
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          const arrowX = gX + guru.width / 2;
          ctx.moveTo(arrowX, gY - 48);
          ctx.lineTo(arrowX - 6, gY - 56);
          ctx.lineTo(arrowX + 6, gY - 56);
          ctx.closePath();
          ctx.fill();
        }

        // Papan Soal Matematika di Atas Kepala Guru
        const boxWidth = 100;
        const boxHeight = 32;
        const boxX = gX + guru.width / 2 - boxWidth / 2;
        const boxY = gY - 42;

        // Background papan soal (seperti kertas ujian putih dengan border tajam)
        ctx.fillStyle = isTarget ? '#ffffff' : '#f1f5f9';
        ctx.strokeStyle = isTarget ? '#0284c7' : '#94a3b8';
        ctx.lineWidth = isTarget ? 2.5 : 1.5;
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 6);
        ctx.fill();
        ctx.stroke();

        // Label Peran Guru
        ctx.font = 'bold 9px "Share Tech Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = isTarget ? '#0284c7' : '#64748b';
        ctx.fillText(guru.isFemale ? 'BU GURU' : 'PAK GURU', gX + guru.width / 2, boxY + 9);

        // Soal Matematika
        ctx.font = 'bold 16px "Share Tech Mono", monospace';
        ctx.fillStyle = '#0f172a';
        ctx.fillText(guru.question, gX + guru.width / 2, boxY + 23);

        ctx.restore();
      });

      // 5. MENGGAMBAR PARTIKEL NILAI / KONFETI
      particlesRef.current.forEach((p) => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
        ctx.restore();
      });

      // 6. MENGGAMBAR POPUPS (BENAR / SALAH)
      popupsRef.current.forEach((pop) => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, pop.alpha);
        ctx.font = 'bold 20px "Share Tech Mono", monospace';
        ctx.fillStyle = pop.color;
        ctx.shadowColor = pop.color;
        ctx.shadowBlur = 8;
        ctx.textAlign = 'center';
        ctx.fillText(pop.text, pop.x, pop.y);
        ctx.restore();
      });

      // 7. HUD DI DALAM CANVAS (SKOR & INPUT BOX)
      if (gameStateRef.current === 'PLAYING') {
        // Skor Nilai Ujian
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px "Share Tech Mono", monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        ctx.fillText(`NILAI : ${scoreRef.current}`, 24, 25);

        if (comboRef.current > 0) {
          ctx.fillStyle = '#38bdf8';
          ctx.fillText(`KOMBO : ${comboRef.current}x 🔥`, 24, 50);
        } else {
          ctx.fillStyle = '#94a3b8';
          ctx.fillText('KOMBO : 0x', 24, 50);
        }

        // Kotak Input Jawaban di Tengah Atas
        const barWidth = 240;
        const barHeight = 44;
        const barX = canvas.width / 2 - barWidth / 2;
        const barY = 18;

        ctx.save();
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(barX, barY, barWidth, barHeight, 8);
        ctx.fill();
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 24px "Share Tech Mono", monospace';

        const inputStr = currentInputRef.current;
        if (inputStr) {
          ctx.fillStyle = '#38bdf8';
          ctx.fillText(inputStr, canvas.width / 2, barY + barHeight / 2 + 1);
        } else {
          ctx.fillStyle = '#64748b';
          ctx.font = 'bold 18px "Share Tech Mono", monospace';
          ctx.fillText('KETIK JAWABAN...', canvas.width / 2, barY + barHeight / 2 + 1);
        }
        ctx.restore();
      }

      ctx.restore();
      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-2 sm:p-4 font-mono select-none overflow-x-hidden">
      <div
        ref={containerRef}
        className="w-full max-w-[920px] flex flex-col items-center"
      >
        {/* Header Bar */}
        <div className="w-full flex items-center justify-between px-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8]"></span>
            <span className="text-xs sm:text-sm font-bold tracking-wider uppercase text-sky-300">
              Math School Survival 2D
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="hidden sm:inline">
              Input: <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-sky-300">0-9</kbd> + <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-sky-300">ENTER</kbd>
            </span>
            {highScore > 0 && (
              <span className="text-amber-400 font-bold">
                REKOR: {highScore}
              </span>
            )}
          </div>
        </div>

        {/* 900x500 Aspect Ratio Canvas Container */}
        <div
          id="game-container"
          className="relative w-full aspect-[900/500] max-h-[500px] border-2 border-slate-700 hover:border-sky-500 rounded-xl overflow-hidden bg-slate-900 shadow-2xl flex items-center justify-center transition-colors"
        >
          <canvas
            ref={canvasRef}
            id="gameCanvas"
            width={900}
            height={500}
            className="w-full h-full block"
          />

          {/* Overlays (Start Screen, Game Over, Top Right Timer & HUD) */}
          <GameHUD
            gameState={gameState}
            score={score}
            highScore={highScore}
            combo={combo}
            maxCombo={maxCombo}
            enemiesDefeated={enemiesDefeated}
            survivedTime={survivedTime}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            showKeypad={showKeypad}
            onToggleKeypad={() => setShowKeypad((prev) => !prev)}
            isFullscreen={isFullscreen}
            onToggleFullscreen={handleToggleFullscreen}
            onStartGame={initGame}
          />
        </div>

        {/* Keypad Sentuh / Mouse */}
        {showKeypad && (
          <div className="w-full mt-2 transition-all duration-200">
            <CyberKeypad
              onDigit={handleDigit}
              onBackspace={handleBackspace}
              onSubmit={checkAnswer}
              disabled={gameState !== 'PLAYING'}
            />
          </div>
        )}

        {/* Level Progression Bar */}
        {gameState === 'PLAYING' && (
          <div className="w-full max-w-md mt-2 px-2">
            <div className="flex justify-between items-center text-[11px] text-slate-400 font-mono mb-1">
              <span className="text-sky-300 font-semibold">
                {getDifficultyLevel(score).label}
              </span>
              <span>
                Target: {getDifficultyLevel(score).nextThreshold} pts
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-sky-400 to-emerald-400 transition-all duration-300"
                style={{ width: `${getDifficultyLevel(score).progressPercent}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
