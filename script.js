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

const roastLines = [
  'You help everyone except yourself.',
  'You act unbothered with impressive consistency.',
  'You take responsibility for things you didn’t break.',
  'You’re calm until you’re not. Then you recover quickly.',
  'You show up even when rest would be smarter.'
];

const dialogueLines = [
  'Relax. This is not flirting.',
  'This interaction meant nothing. Remember it forever.',
  'I would tease you more, but you’d overthink it.',
  'You’re smiling. That was not the goal.'
];

const questScenarios = [
  'Friend stressed at 2am',
  'Someone lost in a new city',
  'Person pretending they’re fine'
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
    <p class="lead">WARNING: You are about to be mildly misjudged.</p>
    <p>RACE CONTROL: ${randomFrom(roastLines)}</p>
  `, 'fade');
  return 'emergency';
}

async function handleSideQuest() {
  setStageContent(`
    <div class="quest-card fade">
      <span class="quest-badge">NEW QUEST</span>
      <h3 class="quest-title">New Quest Unlocked</h3>
      <p class="quest-subtitle">Be there without being asked</p>
      <p style="margin-top:12px;">Scenario: ${randomFrom(questScenarios)}</p>
      <p class="muted">Quest already completed.<br>You do this anyway.</p>
    </div>
  `);
  return 'sidequest';
}

async function handleDoNot() {
  setStageContent(`
    <div class="dialogue fade">
      ${randomFrom(dialogueLines)} <span class="cursor"></span>
    </div>
  `);
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

  const targetIST = Date.UTC(2026, 0, 6, 12, 15, 0); // 5:45 PM IST is 12:15 UTC

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
