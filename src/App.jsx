import { useEffect, useRef, useState, useCallback } from 'react';
import { generateMathProblem } from './utils/mathGenerator.js';
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

    if (enemies.length === 0 || input === '' || input === '-') return;

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

  // Handle tombol digit (0-9)
  const handleDigit = useCallback((digit) => {
    if (gameStateRef.current !== 'PLAYING') return;
    if (currentInputRef.current.length < 8) {
      currentInputRef.current += digit;
    }
  }, []);

  // Handle tombol Minus (-) untuk input angka negatif seperti -10, -1, dll.
  const handleMinus = useCallback(() => {
    if (gameStateRef.current !== 'PLAYING') return;
    const current = currentInputRef.current;
    if (current.startsWith('-')) {
      // Jika sudah diawali minus, hapus tanda minus (toggle off)
      currentInputRef.current = current.slice(1);
    } else {
      // Sisipkan tanda minus di depan angka (toggle on)
      if (current.length < 8) {
        currentInputRef.current = '-' + current;
      }
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
    spawnTimerRef.current = 4000; // Guru pertama datang dalam 1 detik
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

  // Keyboard handler global (Mendukung tombol angka, minus '-', backspace, dan enter)
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
      } else if (e.key === '-' || e.key === 'Subtract') {
        sound.playKeyBlip();
        handleMinus();
      } else if (e.key === 'Backspace') {
        sound.playKeyBlip();
        handleBackspace();
      } else if (e.key === 'Enter') {
        checkAnswer();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleDigit, handleMinus, handleBackspace, checkAnswer, initGame]);

  // Main Canvas Render Loop (Tema Sekolah Lengkap & Papan Tulis To-Do List)
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
            speed: 0.95 + Math.random() * 0.3,
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
          // Efek parabola lemparan kertas
          const arc = Math.sin(proj.progress * Math.PI) * 45;
          proj.currentY = proj.startY + (proj.targetY - proj.startY) * proj.progress - arc;

          if (proj.progress >= 1) {
            projectilesRef.current.splice(i, 1);
          }
        }

        // Update Partikel Nilai
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

      // ==========================================
      // HIASAN-HIASAN KELAS AGAR TIDAK SEPI
      // ==========================================

      // A. Jendela Kelas di Samping Kiri (dengan pemandangan langit cerah dan awan)
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(36, 56, 108, 160);
      ctx.fillStyle = '#38bdf8';
      ctx.globalAlpha = 0.35;
      ctx.fillRect(42, 62, 44, 70);
      ctx.fillRect(94, 62, 44, 70);
      ctx.fillRect(42, 138, 44, 72);
      ctx.fillRect(94, 138, 44, 72);
      // Gorden jendela merah tua di samping
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = '#991b1b';
      ctx.beginPath();
      ctx.moveTo(34, 54);
      ctx.lineTo(46, 54);
      ctx.lineTo(40, 218);
      ctx.lineTo(34, 218);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(146, 54);
      ctx.lineTo(134, 54);
      ctx.lineTo(140, 218);
      ctx.lineTo(146, 218);
      ctx.fill();
      ctx.globalAlpha = 1.0;

      // B. Pigura Foto Presiden & Lambang Garuda di atas dinding kelas
      // Pigura Garuda di tengah atas
      ctx.fillStyle = '#78350f'; // Bingkai kayu emas
      ctx.fillRect(432, 12, 36, 32);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(435, 15, 30, 26);
      ctx.fillStyle = '#fef08a'; // Lambang burung Garuda
      ctx.beginPath();
      ctx.arc(450, 26, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#b91c1c';
      ctx.fillRect(447, 24, 6, 6);

      // Pigura Foto Pahlawan / Tokoh Kiri
      ctx.fillStyle = '#78350f';
      ctx.fillRect(375, 16, 28, 28);
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(378, 19, 22, 22);
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.arc(389, 29, 6, 0, Math.PI * 2);
      ctx.fill();

      // Pigura Foto Pahlawan / Tokoh Kanan
      ctx.fillStyle = '#78350f';
      ctx.fillRect(497, 16, 28, 28);
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(500, 19, 22, 22);
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.arc(511, 29, 6, 0, Math.PI * 2);
      ctx.fill();

      // C. Jam Dinding Bulat Sekolah di atas papan tulis sebelah kanan
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(675, 26, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      // Jarum jam
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(675, 26);
      ctx.lineTo(675, 17);
      ctx.moveTo(675, 26);
      ctx.lineTo(683, 26);
      ctx.stroke();

      // D. Banner / Bendera Segitiga Hiasan Kelas di Sepanjang Dinding Atas
      const bannerColors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'];
      for (let i = 0; i < 9; i++) {
        const bx = 160 + i * 65;
        ctx.fillStyle = bannerColors[i % bannerColors.length];
        ctx.beginPath();
        ctx.moveTo(bx, 2);
        ctx.lineTo(bx + 30, 2);
        ctx.lineTo(bx + 15, 18);
        ctx.closePath();
        ctx.fill();
      }

      // E. Speaker Pengumuman Sekolah di pojok kanan atas
      ctx.fillStyle = '#475569';
      ctx.fillRect(835, 18, 38, 24);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(839, 22, 30, 16);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(844, 25, 20, 2);
      ctx.fillRect(844, 29, 20, 2);
      ctx.fillRect(844, 33, 20, 2);

      // F. Lemari Buku / Rak Piagam Kelas di Samping Kanan
      ctx.fillStyle = '#78350f'; // Lemari kayu
      ctx.fillRect(735, 75, 130, 160);
      ctx.fillStyle = '#451a03'; // Dalam lemari
      ctx.fillRect(740, 80, 120, 45); // Rak 1
      ctx.fillRect(740, 132, 120, 45); // Rak 2
      ctx.fillRect(740, 184, 120, 46); // Rak 3

      // Buku-buku warna-warni di rak 1
      const bookColors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];
      for (let b = 0; b < 7; b++) {
        ctx.fillStyle = bookColors[b % bookColors.length];
        ctx.fillRect(744 + b * 9, 88, 7, 34);
      }
      // Globe mini di rak 1 sebelah kanan
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(835, 102, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Piala emas di rak 2
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(760, 142);
      ctx.lineTo(780, 142);
      ctx.lineTo(775, 160);
      ctx.lineTo(765, 160);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(768, 160, 4, 8);
      ctx.fillRect(764, 168, 12, 4);

      // Buku-buku tebal & berkas di rak 3
      for (let b = 0; b < 8; b++) {
        ctx.fillStyle = bookColors[(b + 2) % bookColors.length];
        ctx.fillRect(744 + b * 10, 192, 8, 34);
      }

      // Pot Tanaman Hias Hijau di lantai dekat rak buku
      ctx.fillStyle = '#92400e'; // Pot tanah liat
      ctx.beginPath();
      ctx.moveTo(740, 395);
      ctx.lineTo(770, 395);
      ctx.lineTo(764, 420);
      ctx.lineTo(746, 420);
      ctx.closePath();
      ctx.fill();
      // Daun tanaman hijau segar
      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      ctx.arc(755, 388, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(744, 392, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(766, 392, 10, 0, Math.PI * 2);
      ctx.fill();

      // G. Tempat Sampah & Sapu di Dekat Pintu/Sudut Kanan
      ctx.fillStyle = '#64748b'; // Tempat sampah
      ctx.fillRect(840, 390, 24, 30);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(837, 387, 30, 4);

      // ==========================================
      // PAPAN TULIS HIJAU BESAR DENGAN TO-DO LIST SETIAP KELAS
      // ==========================================
      const currentScore = scoreRef.current;
      let activeLevel = 1;
      if (currentScore < 500) activeLevel = 1;
      else if (currentScore < 1200) activeLevel = 2;
      else if (currentScore < 2500) activeLevel = 3;
      else activeLevel = 4;

      ctx.fillStyle = '#78350f'; // Bingkai kayu papan tulis
      ctx.fillRect(175, 46, 545, 195);
      ctx.fillStyle = '#064e3b'; // Permukaan papan tulis hijau
      ctx.fillRect(185, 56, 525, 175);

      // Tempat Kapur & Penghapus di bawah papan tulis
      ctx.fillStyle = '#92400e';
      ctx.fillRect(230, 231, 140, 7);
      ctx.fillStyle = '#f8fafc'; // Kapur putih
      ctx.fillRect(240, 228, 12, 3);
      ctx.fillStyle = '#fef08a'; // Kapur kuning
      ctx.fillRect(256, 228, 12, 3);
      ctx.fillStyle = '#475569'; // Penghapus kayu
      ctx.fillRect(280, 226, 28, 5);

      // Judul Papan Tulis (Kapur Putih)
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px "Share Tech Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText('📋 TO-DO LIST UJIAN KELAS (TARGET KURIKULUM)', 200, 75);

      // Garis kapur pembatas
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(200, 83);
      ctx.lineTo(690, 83);
      ctx.stroke();

      // Daftar To-Do List untuk Setiap Kelas
      const todoItems = [
        {
          lvl: 1,
          name: 'KELAS 1',
          desc: 'Perkalian, pembagian & pengurangan minus dasar',
          target: 'Skor 0 - 500',
          completed: currentScore >= 500,
          current: activeLevel === 1,
        },
        {
          lvl: 2,
          name: 'KELAS 2',
          desc: 'Puluhan, operasi negatif campuran (misal: 14 - 25)',
          target: 'Skor 501 - 1200',
          completed: currentScore >= 1200,
          current: activeLevel === 2,
        },
        {
          lvl: 3,
          name: 'KELAS 3',
          desc: 'Soal kurung variasi: 3 × 1 + (2 + 1), kurung minus',
          target: 'Skor 1201 - 2500',
          completed: currentScore >= 2500,
          current: activeLevel === 3,
        },
        {
          lvl: 4,
          name: 'KELAS 4 (UNGGULAN)',
          desc: 'Perpangkatan & kurung kompleks: a² + (b - c)',
          target: 'Skor 2501+',
          completed: false,
          current: activeLevel === 4,
        },
      ];

      todoItems.forEach((item, idx) => {
        const itemY = 104 + idx * 29;

        // Indikator Box / Status
        if (item.completed) {
          // Centang hijau selesai
          ctx.fillStyle = '#34d399';
          ctx.font = 'bold 13px "Share Tech Mono", monospace';
          ctx.fillText('✓', 200, itemY);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        } else if (item.current) {
          // Sedang aktif: icon panah berkedip
          ctx.fillStyle = '#38bdf8';
          ctx.font = 'bold 13px "Share Tech Mono", monospace';
          ctx.fillText('▶', 200, itemY);
          ctx.fillStyle = '#fef08a'; // Teks kapur kuning mencolok untuk kelas aktif
        } else {
          // Belum tercapai
          ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
          ctx.font = 'bold 12px "Share Tech Mono", monospace';
          ctx.fillText('○', 200, itemY);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        }

        // Teks Nama Kelas & Status
        ctx.font = item.current ? 'bold 12px "Share Tech Mono", monospace' : '11px "Share Tech Mono", monospace';
        ctx.fillText(`[${item.name}]`, 218, itemY);

        // Deskripsi Variasi Soal
        ctx.font = '11px "Share Tech Mono", monospace';
        ctx.fillText(item.desc, 335, itemY);

        // Target Skor
        ctx.font = '10px "Share Tech Mono", monospace';
        ctx.textAlign = 'right';
        ctx.fillText(item.completed ? 'SELESAI' : item.target, 690, itemY);
        ctx.textAlign = 'left';
      });

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
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(proj.currentX, proj.currentY, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // 4. MENGGAMBAR BAPAK & IBU GURU (PEMBAWA SOAL MATEMATIKA)
      const enemies = enemiesRef.current;
      let closestIdx = 0;
      let minX = 9999;
      for (let i = 0; i < enemies.length; i++) {
        if (enemies[i].x < minX) {
          minX = enemies[i].x;
          closestIdx = i;
        }
      }

      enemies.forEach((guru, idx) => {
        ctx.save();
        const isTarget = idx === closestIdx;
        const gX = guru.x;
        const gY = guru.y;
        const bob = Math.sin(guru.walkCycle) * 3;

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

          // Kemeja Batik Cokelat Rapi Bapak Guru
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
          ctx.moveTo(arrowX, gY - 50);
          ctx.lineTo(arrowX - 6, gY - 58);
          ctx.lineTo(arrowX + 6, gY - 58);
          ctx.closePath();
          ctx.fill();
        }

        // Papan Soal Matematika di Atas Kepala Guru (Lebar responsif untuk soal tanda kurung & rumus panjang)
        const qLength = guru.question.length;
        const boxWidth = Math.max(110, qLength * 10 + 20);
        const boxHeight = 34;
        const boxX = gX + guru.width / 2 - boxWidth / 2;
        const boxY = gY - 44;

        // Background papan soal
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
        ctx.fillText(guru.isFemale ? 'BU GURU' : 'PAK GURU', gX + guru.width / 2, boxY + 10);

        // Soal Matematika (Ukuran font dinamis menyesuaikan panjang teks rumus)
        const fontSize = qLength > 14 ? 13 : qLength > 10 ? 14 : 16;
        ctx.font = `bold ${fontSize}px "Share Tech Mono", monospace`;
        ctx.fillStyle = '#0f172a';
        ctx.fillText(guru.question, gX + guru.width / 2, boxY + 25);

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

      // 7. HUD DI DALAM CANVAS: NILAI, KOMBO, & WAKTU DI BAWAH KOMBO
      if (gameStateRef.current === 'PLAYING') {
        // A. Skor Nilai Ujian
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px "Share Tech Mono", monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(`NILAI : ${scoreRef.current}`, 24, 22);

        // B. Kombo Beruntun
        if (comboRef.current > 0) {
          ctx.fillStyle = '#38bdf8';
          ctx.fillText(`KOMBO : ${comboRef.current}x 🔥`, 24, 46);
        } else {
          ctx.fillStyle = '#94a3b8';
          ctx.fillText('KOMBO : 0x', 24, 46);
        }

        // C. WAKTU BERTAHAN TEPAT DI BAWAH KOMBO
        const totalSecs = survivedTimeRef.current;
        const mins = Math.floor(totalSecs / 60).toString().padStart(2, '0');
        const secs = (totalSecs % 60).toString().padStart(2, '0');
        ctx.fillStyle = '#f59e0b'; // Warna amber cerah
        ctx.fillText(`WAKTU : ${mins}:${secs} ⏱`, 24, 70);

        // D. Kotak Input Jawaban di Tengah Atas
        const barWidth = 240;
        const barHeight = 44;
        const barX = canvas.width / 2 - barWidth / 2;
        const barY = 14;

        ctx.save();
        ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
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
          ctx.fillStyle = inputStr.startsWith('-') ? '#f59e0b' : '#38bdf8';
          ctx.fillText(inputStr, canvas.width / 2, barY + barHeight / 2 + 1);
        } else {
          ctx.fillStyle = '#64748b';
          ctx.font = 'bold 16px "Share Tech Mono", monospace';
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
              Input: <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-sky-300">0-9</kbd>, <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-300">-</kbd> + <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-emerald-300">ENTER</kbd>
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

          {/* Overlays (Start Screen, Game Over, Top Right Sound/Fullscreen Buttons) */}
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

        {/* Keypad Sentuh / Mouse (Termasuk tombol Minus '-') */}
        {showKeypad && (
          <div className="w-full mt-2 transition-all duration-200">
            <CyberKeypad
              onDigit={handleDigit}
              onMinus={handleMinus}
              onBackspace={handleBackspace}
              onSubmit={checkAnswer}
              disabled={gameState !== 'PLAYING'}
            />
          </div>
        )}
      </div>
    </div>
  );
}
