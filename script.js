const stage = document.getElementById('stage');
const stageContent = document.getElementById('stage-content');
const buttons = document.querySelectorAll('.arcade');
const secretFooter = document.getElementById('secret-footer');
const secretButton = document.getElementById('secret-button');
const winOverlay = document.getElementById('win-overlay');
const confettiContainer = document.getElementById('confetti');
const launchOverlay = document.getElementById('launch-overlay');
const launchCount = document.getElementById('launch-count');
const launchGo = document.getElementById('launch-go');
const launchCar = document.getElementById('launch-car');

const completedActions = new Set();
let mediaPlaying = false;
let audioCtx;
let musicGain;
let sfxGain;
let musicInterval;
let musicStarted = false;
let currentTrack = 'game';
let happyTimeout;
let confettiInterval;

const emergencyPenalties = [
  'RACE CONTROL: 5s penalty for pretending you’re chill.',
  'RACE CONTROL: Unsafe levels of fake calm detected.',
  'RACE CONTROL: You said “it’s fine” like you meant it.',
  'RACE CONTROL: Excessive competence. Others now depend on you.',
  'RACE CONTROL: Helping again. Take a hydration lap.',
  'RACE CONTROL: Dramatic reaction loading…',
  'RACE CONTROL: Emotional buffering in progress.',
  'RACE CONTROL: Grid slot revoked for suspicious composure.',
  'RACE CONTROL: Debrief scheduled for that sigh.',
  'RACE CONTROL: Five-place drop for over-functioning.'
];

const questTitles = [
  'SIDE QUEST UNLOCKED',
  'BONUS MISSION',
  'NPC REQUEST',
  'UNNECESSARY HEROISM DETECTED'
];

const questScenarios = [
  'Carry someone’s entire life update at 2 AM.',
  'Fix a problem you didn’t cause.',
  'Explain something to someone who will ignore it.',
  'Send one meme that stabilizes the situation.',
  'Pretend you’re studying. Argue instead.',
  'Give advice so good it becomes your fault.'
];

const questRewards = [
  'Reward: +50 Aura',
  'Reward: Legendary Meme Drop',
  'Reward: +1 Emotional Damage Resistance (temporary)',
  'Reward: +5 Rizz (accidental)',
  'Reward: Respect (silent)'
];

const questStatuses = [
  'Status: Completed before accepting.',
  'Status: Autocompleted.',
  'Status: Somehow this is your job now.'
];

const flirtOpeners = [
  'Look at me and don’t look away.',
  'Hold position. This is now a briefing.',
  'Eyes on me, no pit exits.',
  'Stop pretending we’re not doing this.',
  'Focus. I’m about to mean this too much.'
];

const flirtCommitments = [
  'I pick you like a championship strategy.',
  'You’re the only lap I’m willing to rerun.',
  'I’d ghost the grid if you asked.',
  'You’re the plan, the backup plan, and the contingency.',
  'I would sign the contract without reading it.'
];

const flirtReceipts = [
  'Proof? I’d learn your chaos like telemetry.',
  'I’d track every micro-expression like race data.',
  'I’d reroute every plan to align with you.',
  'I’d defend your bad ideas like podium points.',
  'I’d memorize your timing like a start light.'
];

const flirtDenials = [
  'None of this counts. You didn’t hear it.',
  'Delete the recording. This never happened.',
  'We will deny this in the debrief.',
  'Cancel the telemetry. I wasn’t here.',
  'Close the pit wall chat. You imagined it.'
];

const flirtMeterLabels = ['concerning', 'unstable', 'irreversible'];

const roastLines = [
  'You budget emotions like fuel and still overheat.',
  'You keep the brakes on and then wonder why everything smokes.',
  'Your “it’s fine” sounds like a red flag waived politely.',
  'You rehearse detachment and then sprint toward the chaos.',
  'You stay composed until someone needs saving. Then you overclock.',
  'You treat intensity like a hobby and call it balance.',
  'You joke like you’re not serious and you’re very serious.'
];

const captions = [
  'Studying (conceptually).',
  'Peak productivity.',
  'Absolutely focused individual.',
  'No thoughts. Just commitment.'
];

function setStageContent(html, extraClasses = '') {
  stageContent.className = `stage-content ${extraClasses}`.trim();
  stageContent.innerHTML = html;
}

function showBusy() {
  setStageContent('<p class="busy">BUSY… TRY AGAIN</p>');
}

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function markComplete(action) {
  completedActions.add(action);
  if (completedActions.size === 5) {
    secretFooter.classList.add('show');
  }
}

function ensureAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    musicGain = audioCtx.createGain();
    musicGain.gain.value = 0.14;
    sfxGain = audioCtx.createGain();
    sfxGain.gain.value = 0.28;
    musicGain.connect(audioCtx.destination);
    sfxGain.connect(audioCtx.destination);
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  if (!musicStarted) {
    if (currentTrack === 'happy') {
      playHappySong();
    } else {
      resumeGameTrack();
    }
    musicStarted = true;
  }
}

function playClick() {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'triangle';
  osc.frequency.value = 560;
  gain.gain.setValueAtTime(0.18, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.12);
  osc.connect(gain).connect(sfxGain);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.14);
}

function playClap() {
  if (!audioCtx) return;
  const duration = 0.35;
  const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * duration, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  }
  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;
  const bandpass = audioCtx.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.value = 1800;
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.22, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
  noise.connect(bandpass).connect(gain).connect(sfxGain);
  noise.start();
  noise.stop(audioCtx.currentTime + duration);
}

function startClapMoment(duration = 2200) {
  if (!audioCtx) return;
  const previousTrack = currentTrack;
  stopMusicLoop();
  currentTrack = 'clap';
  musicStarted = false;
  const fire = (remaining) => {
    playClap();
    if (remaining > 1) setTimeout(() => fire(remaining - 1), 260);
  };
  fire(7);
  setTimeout(() => {
    if (currentTrack !== 'clap') return;
    if (previousTrack === 'game') {
      resumeGameTrack();
      musicStarted = true;
      currentTrack = 'game';
    } else if (previousTrack === 'happy') {
      playHappySong();
      musicStarted = true;
      currentTrack = 'happy';
    }
  }, duration);
}

function playMusicNote(freq) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'square';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
  gain.gain.linearRampToValueAtTime(0.18, audioCtx.currentTime + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.35);
  osc.connect(gain).connect(musicGain);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.4);
}

function startMusicLoop() {
  stopMusicLoop();
  const melody = [392, 440, 523.25, 587.33, 523.25, 440, 392, 330];
  let step = 0;
  musicInterval = setInterval(() => {
    const freq = melody[step % melody.length];
    playMusicNote(freq);
    step++;
  }, 380);
}

function playHappySong() {
  stopMusicLoop();
  currentTrack = 'happy';
  const song = [
    { freq: 392, dur: 320 },
    { freq: 392, dur: 320 },
    { freq: 440, dur: 520 },
    { freq: 392, dur: 520 },
    { freq: 523.25, dur: 520 },
    { freq: 494, dur: 820 },
    { freq: 392, dur: 320 },
    { freq: 392, dur: 320 },
    { freq: 440, dur: 520 },
    { freq: 392, dur: 520 },
    { freq: 587.33, dur: 520 },
    { freq: 523.25, dur: 920 }
  ];

  let idx = 0;
  const loopSong = () => {
    if (currentTrack !== 'happy') return;
    const note = song[idx % song.length];
    playMusicNote(note.freq);
    idx++;
    happyTimeout = setTimeout(loopSong, note.dur + 40);
  };
  loopSong();
}

function stopMusicLoop() {
  if (musicInterval) clearInterval(musicInterval);
  if (happyTimeout) clearTimeout(happyTimeout);
  musicInterval = null;
  happyTimeout = null;
}

function resumeGameTrack() {
  currentTrack = 'game';
  startMusicLoop();
}

async function handleUnnecessary() {
  return new Promise(resolve => {
    const progressSpan = '<div class="progress-bar"><span></span></div>';
    const logs = [
      'initializing birthday_protocol_v1',
      'syncing ego_resilience',
      'loading premium_vibes',
      'calibrating chaos',
      'ready'
    ];

    setStageContent(`
      ${progressSpan}
      <div class="log-lines" id="log-lines"></div>
    `);

    const logContainer = document.getElementById('log-lines');
    let index = 0;

    const interval = setInterval(() => {
      if (index < logs.length) {
        logContainer.innerHTML += `> ${logs[index]}<br>`;
        index++;
        logContainer.scrollTop = logContainer.scrollHeight;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setStageContent(`
            <p class="lead">RESULT: You deserve cake.</p>
            <p>STATUS: confirmed.</p>
            <span class="approved-stamp">APPROVED</span>
            <div class="cake-wrap">
              <div class="cake">
                <div class="layer bottom"></div>
                <div class="layer middle"></div>
                <div class="layer top">
                  <div class="icing"></div>
                  <div class="candle"></div>
                  <div class="flame"></div>
                </div>
              </div>
            </div>
          `, 'fade');
          startClapMoment();
          setTimeout(() => resolve('unnecessary'), 2400);
        }, 400);
      }
    }, 400);
  });
}

async function handleEmergency() {
  setStageContent(`
    <div class="race-alert fade">
      <p class="lead">WARNING: Race Control is reviewing your behavior.</p>
      <p class="muted">Penalty feed armed.</p>
      <p class="alert-line">${randomFrom(emergencyPenalties)}</p>
    </div>
  `);
  return 'emergency';
}

async function handleSideQuest() {
  const title = randomFrom(questTitles);
  const scenario = randomFrom(questScenarios);
  const reward = randomFrom(questRewards);
  const status = randomFrom(questStatuses);

  setStageContent(`
    <div class="quest-card fade">
      <span class="quest-badge">${title}</span>
      <h3 class="quest-title">${title}</h3>
      <p class="quest-subtitle">Scenario: ${scenario}</p>
      <p class="quest-reward">${reward}</p>
      <p class="quest-status">${status}</p>
    </div>
  `);
  return 'sidequest';
}

let doNotTab = 'flirt';

function renderDoNotShell() {
  setStageContent(`
    <div class="dialogue-shell fade">
      <div class="tab-row">
        <button class="tab ${doNotTab === 'flirt' ? 'active' : ''}" data-tab="flirt">FLIRT</button>
        <button class="tab ${doNotTab === 'roast' ? 'active' : ''}" data-tab="roast">ROAST</button>
        <div class="hud-chips">
          <span>EXIT: REMOVED</span>
          <span>RISK: HIGH</span>
          <span>MODE: DIALOGUE</span>
        </div>
      </div>
      <div class="dialogue-body" id="do-not-body"></div>
    </div>
  `);

  const tabs = stageContent.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const newTab = tab.dataset.tab;
      if (newTab === doNotTab) return;
      doNotTab = newTab;
      renderDoNotShell();
      runDoNotCycle();
    });
  });
}

function runFlirtCycle() {
  const body = document.getElementById('do-not-body');
  if (!body) return;
  body.innerHTML = '';

  const meterVal = Math.floor(Math.random() * 30) + 70;
  const meterLabel = randomFrom(flirtMeterLabels);
  const lines = [
    randomFrom(flirtOpeners),
    randomFrom(flirtCommitments),
    randomFrom(flirtReceipts),
    randomFrom(flirtDenials)
  ];

  const meter = document.createElement('div');
  meter.className = 'commitment-meter';
  meter.innerHTML = `
    <div class="meter-bar"><span style="width:${meterVal}%"></span></div>
    <div class="meter-label">Commitment: ${meterVal}% — ${meterLabel}</div>
  `;

  const beatWrap = document.createElement('div');
  beatWrap.className = 'beat-wrap';

  lines.forEach((line, idx) => {
    const p = document.createElement('p');
    p.className = 'beat-line';
    p.textContent = line;
    beatWrap.appendChild(p);
    setTimeout(() => p.classList.add('show'), idx * 260 + 80);
  });

  body.appendChild(meter);
  body.appendChild(beatWrap);

  const hud = document.createElement('div');
  hud.className = 'mini-hud';
  hud.innerHTML = '<span>COMMITMENT METER</span><span>EXIT: LOCKED</span><span>RISK: HIGH</span>';
  body.appendChild(hud);
}

function runRoastCycle() {
  const body = document.getElementById('do-not-body');
  if (!body) return;
  body.innerHTML = '';

  const line = randomFrom(roastLines);
  body.innerHTML = `
    <div class="roast-block">
      <div class="roast-chip">MODE: ROAST</div>
      <p class="beat-line show">${line}</p>
      <div class="mini-hud"><span>SHIELDS: LOW</span><span>DEBRIEF: DISABLED</span><span>SPICE: MAX</span></div>
    </div>
  `;
}

function runDoNotCycle() {
  if (doNotTab === 'flirt') {
    runFlirtCycle();
  } else {
    runRoastCycle();
  }
}

async function handleDoNot() {
  renderDoNotShell();
  runDoNotCycle();
  return 'donot';
}

function createMediaElement(type, src) {
  let el;
  if (type === 'video') {
    el = document.createElement('video');
    el.src = src;
    el.muted = true;
    el.autoplay = true;
    el.loop = false;
    el.playsInline = true;
    el.preload = 'auto';
  } else {
    el = document.createElement('img');
    el.src = src;
    el.alt = 'Resting';
  }
  el.className = 'media-item';
  return el;
}

function overlayTemplate(caption) {
  return `
    <div class="media-overlay">
      <div class="overlay-top">
        <span class="rec">REC</span>
        <span class="live">LIVE</span>
      </div>
      <div class="overlay-caption">${caption}</div>
    </div>
  `;
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function startConfettiLoop() {
  if (!confettiContainer) return;
  confettiContainer.innerHTML = '';
  const colors = ['#24f2ff', '#ff3c7f', '#ffc300', '#7bffb5', '#ffffff'];
  const spawn = () => {
    const pieces = 30;
    for (let i = 0; i < pieces; i++) {
      const piece = document.createElement('span');
      piece.className = 'confetti-piece';
      piece.style.background = colors[i % colors.length];
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.animationDelay = `${Math.random() * 0.8}s`;
      piece.style.transform = `translateY(-120px) rotateZ(${Math.random() * 180}deg)`;
      piece.style.width = `${8 + Math.random() * 10}px`;
      piece.style.height = `${14 + Math.random() * 18}px`;
      confettiContainer.appendChild(piece);
    }
    setTimeout(() => { confettiContainer.innerHTML = ''; }, 2600);
  };
  spawn();
  clearInterval(confettiInterval);
  confettiInterval = setInterval(spawn, 1400);
}

async function showMediaSequence() {
  if (mediaPlaying) return;
  mediaPlaying = true;
  const button = document.querySelector('[data-action="broken"]');
  button.disabled = true;
  stage.classList.add('glitch');
  await delay(480);
  stage.classList.remove('glitch');

  const sequence = [
    { type: 'video', src: 'assets/video1.mp4' },
    { type: 'video', src: 'assets/video2.mp4' },
    { type: 'image', src: 'assets/sleeping.jpg' }
  ];

  for (const item of sequence) {
    const caption = randomFrom(captions);
    const mediaEl = createMediaElement(item.type === 'video' ? 'video' : 'image', item.src);
    const wrapper = document.createElement('div');
    wrapper.style.position = 'relative';
    wrapper.className = 'fade';
    wrapper.appendChild(mediaEl);
    wrapper.insertAdjacentHTML('beforeend', overlayTemplate(caption));

    setStageContent('', 'wide-media');
    stageContent.appendChild(wrapper);

    if (item.type === 'video') {
      try { await mediaEl.play(); } catch (e) { /* autoplay safe */ }
      const duration = Math.min((mediaEl.duration || 3.5) * 1000, 3500);
      await delay(duration);
    } else {
      await delay(3000);
    }
    wrapper.classList.remove('fade');
  }

  setStageContent('<p class="lead">DIAGNOSIS: functioning. Mostly.</p>', 'fade');
  button.disabled = false;
  mediaPlaying = false;
  return 'broken';
}

function revealSecretWin() {
  document.body.classList.add('blurred');
  secretFooter.classList.remove('show');
  winOverlay.classList.add('show');
  stopMusicLoop();
  playHappySong();
  musicStarted = true;
  setStageContent(`
    <p class="lead">Happy Birthday.</p>
    <p>I’m glad you exist.</p>
  `, 'fade');
  startConfettiLoop();
}

buttons.forEach(btn => {
  btn.addEventListener('click', async () => {
    ensureAudio();
    playClick();
    const action = btn.dataset.action;
    if (mediaPlaying && action !== 'broken') {
      showBusy();
      return;
    }
    let key;
    switch (action) {
      case 'unnecessary':
        key = await handleUnnecessary();
        break;
      case 'emergency':
        key = await handleEmergency();
        break;
      case 'sidequest':
        key = await handleSideQuest();
        break;
      case 'donot':
        key = await handleDoNot();
        break;
      case 'broken':
        key = await showMediaSequence();
        break;
    }
    if (key) markComplete(key);
  });
});

secretButton.addEventListener('click', revealSecretWin);

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    stopMusicLoop();
    musicStarted = false;
  } else if (!document.hidden && audioCtx && !musicStarted) {
    if (currentTrack === 'happy') {
      playHappySong();
    } else {
      resumeGameTrack();
    }
    musicStarted = true;
  }
});

// preload media for smoother playback
['assets/video1.mp4', 'assets/video2.mp4', 'assets/sleeping.jpg'].forEach(src => {
  const tag = src.endsWith('.mp4') ? document.createElement('video') : document.createElement('img');
  tag.src = src;
  if (tag.tagName === 'VIDEO') {
    tag.muted = true;
    tag.preload = 'auto';
  }
});

function startLaunch() {
  if (!launchOverlay) return;
  document.body.classList.add('prelaunch');
  launchGo.classList.remove('show');
  launchCar.classList.remove('run');

  const targetIST = Date.UTC(2026, 0, 7, 18, 30, 0); // 12:00 AM IST Jan 8 is 18:30 UTC Jan 7

  const formatRemaining = (ms) => {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const pad = (n) => n.toString().padStart(2, '0');
    return `${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  };

  let ticker;
  let launched = false;

  const fireLaunch = () => {
    if (launched) return;
    launched = true;
    clearInterval(ticker);
    launchCount.textContent = '';
    launchGo.classList.add('show');
    launchCar.classList.add('run');
  };

  const updateCountdown = () => {
    const now = Date.now();
    const remaining = targetIST - now;
    if (remaining <= 0) {
      fireLaunch();
    } else {
      launchCount.textContent = formatRemaining(remaining);
    }
  };

  updateCountdown();
  ticker = setInterval(updateCountdown, 1000);

  launchCar.addEventListener('animationend', () => {
    launchOverlay.classList.add('hide');
    document.body.classList.remove('prelaunch');
    setTimeout(() => launchOverlay.remove(), 400);
  }, { once: true });
}

startLaunch();
