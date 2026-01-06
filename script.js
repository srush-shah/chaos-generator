const stage = document.getElementById('stage');
const stageContent = document.getElementById('stage-content');
const buttons = document.querySelectorAll('.arcade');
const secretFooter = document.getElementById('secret-footer');
const secretButton = document.getElementById('secret-button');

const clickedActions = new Set();
let mediaPlaying = false;

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

function markClicked(action) {
  clickedActions.add(action);
  if (clickedActions.size === 5) {
    secretFooter.style.display = 'block';
  }
}

async function handleUnnecessary() {
  markClicked('unnecessary');
  const logs = [
    'initializing birthday_protocol_v1',
    'syncing ego_resilience',
    'loading premium_vibes',
    'calibrating chaos',
    'ready'
  ];

  setStageContent(`
    <div class="progress-bar"><span></span></div>
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
        `, 'fade');
      }, 400);
    }
  }, 400);
}

async function handleEmergency() {
  markClicked('emergency');
  setStageContent(`
    <p class="lead">WARNING: You are about to be mildly misjudged.</p>
    <p>RACE CONTROL: ${randomFrom(roastLines)}</p>
  `, 'fade');
}

async function handleSideQuest() {
  markClicked('sidequest');
  setStageContent(`
    <div class="quest-card fade">
      <span class="quest-badge">NEW QUEST</span>
      <h3 class="quest-title">New Quest Unlocked</h3>
      <p class="quest-subtitle">Be there without being asked</p>
      <p style="margin-top:12px;">Scenario: ${randomFrom(questScenarios)}</p>
      <p class="muted">Quest already completed.<br>You do this anyway.</p>
    </div>
  `);
}

async function handleDoNot() {
  markClicked('donot');
  setStageContent(`
    <div class="dialogue fade">
      ${randomFrom(dialogueLines)} <span class="cursor"></span>
    </div>
  `);
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
  el.style.width = '100%';
  el.style.borderRadius = '10px';
  el.style.display = 'block';
  el.style.objectFit = 'cover';
  el.style.maxHeight = '320px';
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

    setStageContent('');
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
  markClicked('broken');
}

function revealSecretWin() {
  setStageContent(`
    <p class="lead">Happy Birthday.</p>
    <p>I’m glad you exist.</p>
  `, 'fade');
}

buttons.forEach(btn => {
  btn.addEventListener('click', () => {
    const action = btn.dataset.action;
    if (mediaPlaying && action !== 'broken') {
      showBusy();
      return;
    }
    switch (action) {
      case 'unnecessary':
        handleUnnecessary();
        break;
      case 'emergency':
        handleEmergency();
        break;
      case 'sidequest':
        handleSideQuest();
        break;
      case 'donot':
        handleDoNot();
        break;
      case 'broken':
        showMediaSequence();
        break;
    }
  });
});

secretButton.addEventListener('click', revealSecretWin);

// preload media for smoother playback
['assets/video1.mp4', 'assets/video2.mp4', 'assets/sleeping.jpg'].forEach(src => {
  const tag = src.endsWith('.mp4') ? document.createElement('video') : document.createElement('img');
  tag.src = src;
  if (tag.tagName === 'VIDEO') {
    tag.muted = true;
    tag.preload = 'auto';
  }
});
