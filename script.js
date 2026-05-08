/* =============================================
   친칠라 고치 - 게임 로직 (script.js)
   ============================================= */

// ---- 상수 정의 ----

const STAGE_NAMES = ['알', '유아', '어린이', '청년'];

const EVOLVE_THRESHOLDS = {
  알: 20,
  유아: 60,
  어린이: 120,
  청년: 200,
};

const SPEECH_POOL = {
  평온:   ['오늘도 평화로운 하루야~', '냠냠 맛있는 거 줘요!', '쉬고 싶다...', '놀아줘~!'],
  행복:   ['너무 행복해요! 🎵', '야호! 최고야!', '꺄아~ 좋아~!', '당신이 최고예요 💕'],
  슬픔:   ['배고파요... 😢', '혼자 있기 싫어요...', '쓸쓸하다...', '위로해줘요...'],
  배고픔: ['배고파요 배고파요!', '밥 주세요!! 🍎', '꼬르륵 꼬르륵...', '먹을 거 주세요~'],
  피곤함: ['피곤해... 졸려...', 'Zz... 자고 싶어요...', '눈이 감겨요...', '쉬게 해주세요...'],
  병듦:   ['으으... 아파요...', '열이 나요... 🤒', '치료해줘요...', '콜록콜록...'],
};

const JOB_DEFINITIONS = [
  {
    id: 'scholar',
    name: '🎓 학자 친칠라',
    emoji: '🐭🎓',
    farewell: '책 속에는 무한한 세계가 있어요. 저는 지식의 바다를 항해할게요!',
    check: (s) => s.intel >= 70 && s.intel === Math.max(s.intel, s.stamina, s.social, s.affection, s.happiness),
  },
  {
    id: 'explorer',
    name: '🗺️ 탐험가 친칠라',
    emoji: '🐹🗺️',
    farewell: '넓은 세상을 모험할 거예요! 언제나 응원해줘서 고마워요~',
    check: (s) => s.stamina >= 70 && s.stamina === Math.max(s.intel, s.stamina, s.social, s.affection, s.happiness),
  },
  {
    id: 'idol',
    name: '🌟 아이돌 친칠라',
    emoji: '🐰🌟',
    farewell: '여러분~ 저를 사랑해줘서 감사해요! 무대에서 빛날게요!',
    check: (s) => s.social >= 70 && s.social === Math.max(s.intel, s.stamina, s.social, s.affection, s.happiness),
  },
  {
    id: 'healer',
    name: '💖 힐러 친칠라',
    emoji: '🐭💖',
    farewell: '사랑으로 세상을 치유할게요. 당신의 따뜻함이 저를 키워줬어요.',
    check: (s) => s.affection >= 70 && s.affection === Math.max(s.intel, s.stamina, s.social, s.affection, s.happiness),
  },
  {
    id: 'athlete',
    name: '🏅 운동선수 친칠라',
    emoji: '🐹🏅',
    farewell: '전국대회 우승이 목표예요! 응원해줘서 정말 고마워요!',
    check: (s) => s.stamina >= 65 && s.health >= 65,
  },
  {
    id: 'pastry',
    name: '🍰 파티시에 친칠라',
    emoji: '🐰🍰',
    farewell: '행복한 케이크를 구울게요! 늘 함께해줘서 감사해요~',
    check: (s) => s.happiness >= 65 && s.social >= 65,
  },
  {
    id: 'guardian',
    name: '🛡️ 마을 수호자 친칠라',
    emoji: '🐭🛡️',
    farewell: '균형 잡힌 삶을 배웠어요. 마을을 지키는 수호자가 될게요!',
    check: (s) => {
      const vals = [s.intel, s.stamina, s.social, s.affection, s.health, s.happiness];
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      return vals.every((v) => Math.abs(v - avg) < 20);
    },
  },
];

// ---- 게임 상태 초기화 ----

function createInitialState() {
  return {
    stage: '알',
    status: '평온',
    day: 1,
    growth:    0,
    hunger:    20,
    happiness: 50,
    fatigue:   10,
    health:    80,
    affection: 10,
    intel:     0,
    stamina:   0,
    social:    0,
    lastSaved: Date.now(),
    isDead: false,
    isIndependent: false,
  };
}

let state = loadState();

// ---- localStorage ----

function saveState() {
  state.lastSaved = Date.now();
  localStorage.setItem('chinchillaState', JSON.stringify(state));
}

function loadState() {
  try {
    const raw = localStorage.getItem('chinchillaState');
    if (raw) {
      const loaded = JSON.parse(raw);
      const elapsed = Math.min((Date.now() - loaded.lastSaved) / 1000, 600);
      loaded.hunger    = clamp(loaded.hunger    + elapsed * 0.05, 0, 100);
      loaded.fatigue   = clamp(loaded.fatigue   + elapsed * 0.03, 0, 100);
      loaded.happiness = clamp(loaded.happiness - elapsed * 0.02, 0, 100);
      return loaded;
    }
  } catch (e) {
    console.warn('저장 데이터 로드 실패, 초기화합니다.', e);
  }
  return createInitialState();
}

// ---- 유틸 ----

function clamp(val, min, max) { return Math.min(Math.max(val, min), max); }
function randInt(min, max)    { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr)            { return arr[Math.floor(Math.random() * arr.length)]; }

// ---- 상태 업데이트 ----

function changeState(patches) {
  Object.assign(state, patches);
  const CAPPED = ['hunger','happiness','fatigue','health','affection','intel','stamina','social'];
  CAPPED.forEach((k) => { if (state[k] !== undefined) state[k] = clamp(state[k], 0, 100); });
  state.growth = Math.max(state.growth, 0);
  saveState();
  render();
}

// ---- 액션 처리 ----

function doAction(type) {
  if (state.isDead || state.isIndependent) return;

  let patches = {};
  let msg = '';

  switch (type) {
    case 'feed':
      patches = { hunger: state.hunger - 25, growth: state.growth + 3, stamina: state.stamina + 2 };
      msg = '냠냠~ 맛있어요! 🍎';
      break;
    case 'play':
      patches = { happiness: state.happiness + 15, social: state.social + 5, fatigue: state.fatigue + 10, growth: state.growth + 4 };
      msg = '야호! 너무 재밌어요! 🎮';
      break;
    case 'sleep':
      patches = { fatigue: state.fatigue - 30, health: state.health + 10, growth: state.growth + 1 };
      msg = 'Zz... 잘 잤어요~ 😴';
      break;
    case 'study':
      patches = { intel: state.intel + 8, fatigue: state.fatigue + 12, growth: state.growth + 4 };
      msg = '공부 열심히 했어요! 📚';
      break;
    case 'pet':
      patches = { affection: state.affection + 10, happiness: state.happiness + 8, growth: state.growth + 1 };
      msg = '기분 좋아요~ 💕';
      break;
    case 'heal':
      if (state.status !== '병듦') return;
      patches = { health: state.health + 30, status: '평온' };
      msg = '다 나았어요! 💊';
      break;
    default:
      return;
  }

  changeState(patches);
  showSpeech(msg);
  showToast(msg);
}

// ---- 진화 ----

function evolve() {
  const idx = STAGE_NAMES.indexOf(state.stage);
  if (idx < 0 || idx >= STAGE_NAMES.length - 1) return;

  const nextStage = STAGE_NAMES[idx + 1];
  const overlay = document.getElementById('evolve-overlay');
  const evolveText = document.getElementById('evolve-text');
  overlay.classList.remove('hidden');
  evolveText.textContent = `${nextStage}(으)로 진화 중... ✨`;

  setTimeout(() => {
    overlay.classList.add('hidden');
    changeState({ stage: nextStage, status: '행복' });
    showSpeech(`${nextStage}이(가) 되었어요! 🎉`);
    showToast(`✨ ${nextStage}(으)로 진화했어요!`);
  }, 2000);
}

// ---- 독립 ----

function goIndependent() {
  if (state.stage !== '청년' || state.growth < EVOLVE_THRESHOLDS['청년']) return;
  const job = determineJob();
  state.isIndependent = true;
  saveState();
  showEndingScreen(job);
}

function determineJob() {
  for (const def of JOB_DEFINITIONS) {
    if (def.check(state)) return def;
  }
  return JOB_DEFINITIONS.find((d) => d.id === 'guardian') || JOB_DEFINITIONS[0];
}

function showEndingScreen(job) {
  document.getElementById('ending-char').textContent    = job.emoji;
  document.getElementById('ending-job').textContent     = job.name;
  document.getElementById('ending-summary').innerHTML   =
    `지능 ${state.intel} / 체력 ${state.stamina} / 사교성 ${state.social}<br>` +
    `애정도 ${state.affection} / 행복도 ${state.happiness}`;
  document.getElementById('ending-message').textContent = `"${job.farewell}"`;
  document.getElementById('ending-screen').classList.remove('hidden');
  document.getElementById('char-area').style.visibility = 'hidden';
}

// ---- 다시 시작 ----

function restartGame() {
  localStorage.removeItem('chinchillaState');
  state = createInitialState();
  document.getElementById('ending-screen').classList.add('hidden');
  document.getElementById('char-area').style.visibility = 'visible';
  saveState();
  render();
  showToast('새로운 친칠라를 만났어요! 🥚');
}

function confirmReset() {
  if (confirm('정말로 초기화할까요? 모든 데이터가 사라져요!')) {
    restartGame();
  }
}

// ---- 세부 능력치 오버레이 ----

function openDetailStats() {
  document.getElementById('detail-stats-overlay').classList.remove('hidden');
}

function closeDetailStats() {
  document.getElementById('detail-stats-overlay').classList.add('hidden');
}

// ---- 랜덤 이벤트 ----

function tickRandomEvent() {
  if (state.isDead || state.isIndependent) return;

  changeState({
    hunger:    state.hunger    + randInt(1, 3),
    fatigue:   state.fatigue   + randInt(0, 2),
    happiness: state.happiness + randInt(-2, 1),
    day: state.day + (Math.random() < 0.05 ? 1 : 0),
  });

  updateStatus();
}

function updateStatus() {
  const s = state;
  const sickChance =
    (s.hunger  > 70 ? 15 : 0) +
    (s.fatigue > 80 ? 15 : 0) +
    (s.health  < 30 ? 20 : 0);

  if (Math.random() * 100 < sickChance) {
    changeState({ status: '병듦', health: s.health - 5 });
    showSpeech(pick(SPEECH_POOL['병듦']));
    return;
  }

  if (s.status === '병듦') return;

  let newStatus = '평온';
  if      (s.hunger   > 65)  newStatus = '배고픔';
  else if (s.fatigue  > 70)  newStatus = '피곤함';
  else if (s.happiness > 75) newStatus = '행복';
  else if (s.happiness < 25) newStatus = '슬픔';

  if (newStatus !== s.status) {
    changeState({ status: newStatus });
    showSpeech(pick(SPEECH_POOL[newStatus] || SPEECH_POOL['평온']));
  }
}

// ---- 말풍선 ----

function showSpeech(text) {
  document.getElementById('speech-bubble').textContent = text;
}

// ---- 토스트 ----

function showToast(msg) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'opacity 0.4s';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 400);
  }, 1800);
}

// ---- 렌더링 ----

function render() {
  if (state.isIndependent) return;
  renderCharacter();
  renderStats();
  renderTopBar();
  renderButtons();
}

const STAGE_IMAGES = {
  알:    'assets/image/egg.png',
  유아:  'assets/image/baby.png',
  어린이: 'assets/image/child.png',
  청년:  'assets/image/adult.png',
};

const STAGE_CSS_CLASS = {
  알:    'stage-egg',
  유아:  'stage-baby',
  어린이: 'stage-child',
  청년:  'stage-adult',
};

function renderCharacter() {
  const img = document.getElementById('chinchilla-img');

  const statusClass = {
    행복:   'state-happy',
    슬픔:   'state-sad',
    배고픔: 'state-sad',
    피곤함: 'state-tired',
    병듦:   'state-sick',
  }[state.status] || '';

  const newSrc = STAGE_IMAGES[state.stage] || 'egg.png';
  if (img.src !== newSrc && !img.src.endsWith(newSrc)) {
    img.src = newSrc;
  }

  const stageClass = STAGE_CSS_CLASS[state.stage] || 'stage-egg';
  img.className = ['chinchilla-img', stageClass, statusClass].filter(Boolean).join(' ');

  // 말풍선 초기 텍스트
  const bubble = document.getElementById('speech-bubble');
  if (!bubble.textContent) {
    bubble.textContent = pick(SPEECH_POOL[state.status] || SPEECH_POOL['평온']);
  }
}

function renderStats() {
  const MAX_GROWTH = EVOLVE_THRESHOLDS[state.stage] || 200;

  const allStats = [
    { key: 'growth',    max: MAX_GROWTH },
    { key: 'hunger',    max: 100 },
    { key: 'happiness', max: 100 },
    { key: 'fatigue',   max: 100 },
    { key: 'health',    max: 100 },
    { key: 'affection', max: 100 },
    { key: 'intel',     max: 100 },
    { key: 'stamina',   max: 100 },
    { key: 'social',    max: 100 },
  ];

  allStats.forEach(({ key, max }) => {
    const val = state[key] || 0;
    const pct = Math.min((val / max) * 100, 100);
    const bar = document.getElementById(`bar-${key}`);
    const valEl = document.getElementById(`val-${key}`);
    if (bar)   bar.style.width = pct + '%';
    if (valEl) valEl.textContent = Math.round(val);
  });
}

function renderTopBar() {
  document.getElementById('stage-label').textContent  = `${stageIcon(state.stage)} ${state.stage}`;
  document.getElementById('status-label').textContent = `${statusIcon(state.status)} ${state.status}`;
  document.getElementById('day-label').textContent    = `📅 ${state.day}일차`;
}

function renderButtons() {
  document.getElementById('btn-heal').disabled = state.status !== '병듦';

  const canEvolve = canEvolveNow();
  document.getElementById('btn-evolve').classList.toggle('hidden', !canEvolve);

  const canIndepend = state.stage === '청년' && state.growth >= EVOLVE_THRESHOLDS['청년'];
  document.getElementById('btn-independent').classList.toggle('hidden', !canIndepend);
}

function canEvolveNow() {
  const idx = STAGE_NAMES.indexOf(state.stage);
  if (idx < 0 || idx >= STAGE_NAMES.length - 1) return false;
  return state.growth >= EVOLVE_THRESHOLDS[state.stage];
}

function stageIcon(stage) {
  return { 알: '🥚', 유아: '🐭', 어린이: '🐹', 청년: '🐰' }[stage] || '🥚';
}

function statusIcon(status) {
  return { 평온: '😌', 행복: '😄', 슬픔: '😢', 배고픔: '🍎', 피곤함: '😴', 병듦: '🤒' }[status] || '😌';
}

// ---- 게임 루프 ----

setInterval(tickRandomEvent, 15000);
setInterval(() => { saveState(); render(); }, 3000);

// ---- 초기 실행 ----

render();
showSpeech(pick(SPEECH_POOL[state.status] || SPEECH_POOL['평온']));

if (state.isIndependent) {
  showEndingScreen(determineJob());
}
