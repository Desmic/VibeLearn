/* Relay Rescue opening: presentation only. Server state and assessment remain authoritative. */
'use strict';
(() => {
  const game = window.RescueGame;
  if (!game || game.__firstMinuteStory) return;

  const SEEN_KEY = 'vibelearn.relay-rescue.intro.v1';
  const scenes = [
    {
      kicker: 'THE VALLEY COURIER',
      title: 'Pip keeps the valley moving.',
      body: 'Every bridge repair begins with one job: carry the request to the workshop and bring the result back safely.'
    },
    {
      kicker: 'THE STORM',
      title: 'The order was sent. The reply vanished.',
      body: 'Pip requested one bridge gear. A storm cut the signal before Pip learned whether the workshop completed it.'
    },
    {
      kicker: 'THE DANGER',
      title: 'Retrying blindly can make two.',
      body: 'If the workshop already made the gear, a fresh request can create a duplicate. The problem is uncertainty — not simply failure.'
    },
    {
      kicker: 'YOUR MISSION',
      title: 'Recover the truth. Restore seven signals.',
      body: 'Inspect what Pip knows, what the workshop did, and the identity of the original job. Each restored signal gives you more recovery power.'
    },
    {
      kicker: 'THE REAL SYSTEM',
      title: 'Software faces the same missing-reply problem.',
      body: 'Jobs, payments, exports and APIs all face request → no reply → retry? Your goal is to make one intent lead to one safe result.'
    }
  ];

  let activeCleanup = () => {};
  const originalMap = game.map.bind(game);
  const originalRender = game.render.bind(game);
  const originalHide = game.hide.bind(game);

  const remembered = () => {
    try { return localStorage.getItem(SEEN_KEY) === 'seen'; }
    catch (_) { return false; }
  };
  const remember = () => {
    try { localStorage.setItem(SEEN_KEY, 'seen'); }
    catch (_) {}
  };
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  function ensureStyles() {
    if (document.querySelector('#rescue-intro-style')) return;
    const style = document.createElement('style');
    style.id = 'rescue-intro-style';
    style.textContent = `
      .rgi-overlay{position:absolute;z-index:70;left:0;right:0;top:76px;min-height:calc(100svh - 76px);padding:clamp(18px,4vw,46px);display:grid;place-items:center;background:radial-gradient(circle at 70% 18%,#31516a 0,#162c3c 34%,#0d1925 72%);overflow:hidden}
      .rgi-shell{width:min(1120px,100%);display:grid;grid-template-columns:minmax(0,1.25fr) minmax(280px,.75fr);gap:clamp(20px,4vw,46px);align-items:center}
      .rgi-visual{position:relative;min-height:480px;border:1px solid #557581;border-radius:24px;overflow:hidden;background:linear-gradient(#142740 0 58%,#29495d 58%);box-shadow:0 28px 80px #0008}
      .rgi-moon{position:absolute;right:10%;top:9%;width:58px;height:58px;border-radius:50%;background:#f1ebc9;box-shadow:0 0 55px #f1d99d55}
      .rgi-mountain{position:absolute;bottom:36%;width:48%;height:36%;background:#365b70;clip-path:polygon(0 100%,42% 15%,100% 100%)}
      .rgi-mountain.one{left:-4%}.rgi-mountain.two{left:28%;height:42%;background:#2c4c62}.rgi-mountain.three{right:-8%;background:#3b6272}
      .rgi-water{position:absolute;inset:auto 0 0;height:39%;background:linear-gradient(120deg,#4ba6a4,#1e6175)}
      .rgi-island{position:absolute;bottom:15%;width:34%;height:25%;background:#78a78a;clip-path:polygon(8% 28%,50% 0,94% 27%,82% 78%,46% 100%,14% 78%);filter:drop-shadow(0 18px 0 #193744)}
      .rgi-left{left:4%}.rgi-right{right:4%}
      .rgi-pip{position:absolute;left:20%;bottom:27%;width:70px;height:82px;z-index:5;transition:transform .55s ease}
      .rgi-pip:before{content:'';position:absolute;left:8px;top:0;width:54px;height:40px;border-radius:14px;background:#f0cb84;border-bottom:7px solid #d06f5b}
      .rgi-pip:after{content:'••';position:absolute;left:17px;top:8px;width:36px;height:21px;border-radius:8px;background:#153b4a;color:#b9eee0;text-align:center;line-height:16px;font-size:24px;letter-spacing:4px}
      .rgi-pip span{position:absolute;left:19px;top:43px;width:34px;height:29px;border-radius:7px;background:#dea962}.rgi-pip span:before,.rgi-pip span:after{content:'';position:absolute;bottom:-18px;width:8px;height:22px;background:#e3b568;border-radius:8px}.rgi-pip span:before{left:3px;rotate:12deg}.rgi-pip span:after{right:3px;rotate:-12deg}
      .rgi-workshop{position:absolute;right:13%;bottom:27%;width:120px;height:95px;z-index:4}.rgi-workshop:before{content:'';position:absolute;left:9px;bottom:0;width:100px;height:70px;background:#d5bc91;clip-path:polygon(0 25%,35% 0,100% 20%,100% 100%,0 100%)}.rgi-workshop:after{content:'';position:absolute;left:51px;bottom:15px;width:29px;height:34px;background:#244656;box-shadow:-36px -14px 0 -7px #f1cb7f}
      .rgi-route{position:absolute;left:30%;right:27%;bottom:34%;height:4px;border-top:3px dashed #d9b978;rotate:4deg;transform-origin:center}
      .rgi-message{position:absolute;z-index:6;left:31%;bottom:40%;width:34px;height:24px;background:#ffe3a1;border:2px solid #8a6845;border-radius:3px;transition:opacity .45s,transform .7s}.rgi-message:after{content:'';position:absolute;inset:2px;border-top:2px solid #98764c;transform:skewY(-25deg)}
      .rgi-storm{position:absolute;inset:0;z-index:8;pointer-events:none;opacity:0;transition:opacity .45s;background:linear-gradient(115deg,#0b1320bb,#192f44aa)}
      .rgi-storm:before{content:'ϟ';position:absolute;left:49%;top:8%;font:900 150px/1 Georgia,serif;color:#f6de8a;text-shadow:0 0 28px #ffe17c99;rotate:9deg}
      .rgi-risk{position:absolute;right:17%;bottom:27%;z-index:7;display:flex;gap:5px;opacity:0;transform:translateY(18px);transition:.5s}.rgi-gear{display:grid;place-items:center;width:48px;height:48px;border-radius:50%;background:#f2cf8b;color:#543e30;border:5px dotted #70533a;font-weight:900;font-size:22px}
      .rgi-warning{position:absolute;right:7%;top:18%;z-index:10;padding:9px 12px;border:1px solid #f09b77;background:#522f2bea;color:#ffd1bc;border-radius:9px;font-weight:800;font-size:.75rem;letter-spacing:.08em;opacity:0;transform:translateY(-8px);transition:.45s}
      .rgi-signals{position:absolute;left:9%;right:8%;top:8%;display:flex;justify-content:space-between;z-index:9}.rgi-signal{width:13px;height:13px;border-radius:50%;border:2px solid #71999a;background:#243d49;box-shadow:0 0 0 5px #122736}.rgi-signals .rgi-signal{transition:background .3s,box-shadow .3s}
      .rgi-code{position:absolute;z-index:12;inset:14% 8%;display:grid;place-items:center;opacity:0;transform:scale(.96);transition:.55s;background:#10202edc;border:1px solid #5e7c84;border-radius:18px}.rgi-code-line{display:flex;align-items:center;gap:12px;font:700 clamp(.74rem,2vw,1.02rem)/1.4 ui-monospace,monospace;color:#d8e8dd}.rgi-code-line b{padding:13px 16px;border:1px solid #75949b;background:#203d49;border-radius:9px;color:#f3d797}.rgi-code-line i{font-style:normal;color:#91bcb7}
      .rgi-overlay[data-step='0'] .rgi-message{animation:rgi-send 2.6s ease-in-out infinite}.rgi-overlay[data-step='1'] .rgi-storm{opacity:1}.rgi-overlay[data-step='1'] .rgi-message{opacity:0;transform:translate(150px,-95px) scale(.7)}
      .rgi-overlay[data-step='2'] .rgi-risk,.rgi-overlay[data-step='2'] .rgi-warning{opacity:1;transform:none}.rgi-overlay[data-step='2'] .rgi-pip{transform:translateX(8px) rotate(-4deg)}
      .rgi-overlay[data-step='3'] .rgi-signals .rgi-signal{background:#9ee6c9;box-shadow:0 0 17px #9ee6c9,0 0 0 5px #163742}.rgi-overlay[data-step='4'] .rgi-code{opacity:1;transform:none}.rgi-overlay[data-step='4'] .rgi-visual>*:not(.rgi-code):not(.rgi-signals){filter:saturate(.35) brightness(.65)}
      .rgi-copy{align-self:stretch;display:flex;flex-direction:column;justify-content:center;min-width:0}.rgi-kicker{color:#e4c17e;font-size:.68rem;font-weight:850;letter-spacing:.16em}.rgi-copy h2{font:700 clamp(2.15rem,4.7vw,4.6rem)/1.02 Georgia,serif;margin:13px 0 18px;color:#f5ead2;letter-spacing:-.035em}.rgi-copy p{font-size:clamp(.95rem,1.5vw,1.13rem);line-height:1.68;color:#c0d3d1;margin:0;max-width:540px}.rgi-story-progress{display:flex;gap:7px;margin:31px 0 20px}.rgi-story-progress span{height:5px;flex:1;max-width:58px;border-radius:8px;background:#38525c}.rgi-story-progress span.on{background:#e8c47e;box-shadow:0 0 14px #e8c47e66}.rgi-actions{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.rgi-actions button{min-width:150px}.rgi-actions .rgi-skip{background:none!important;border:0!important;color:#abc5c8!important;text-decoration:underline}.rgi-step-label{display:block;margin-top:15px;color:#779ca0;font-size:.68rem}
      .rgi-static{margin:18px 0 4px;border:1px solid #5b7c83;border-radius:14px;background:#182f3d;padding:18px}.rgi-static h2{font-size:1.35rem;margin:7px 0 12px}.rgi-static ol{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:9px;padding:0;list-style:none;counter-reset:rgi}.rgi-static li{counter-increment:rgi;padding:10px;border:1px solid #3f5f69;border-radius:9px;color:#c7d8d2;font-size:.72rem;line-height:1.45}.rgi-static li:before{content:counter(rgi);display:grid;place-items:center;width:25px;height:25px;border-radius:50%;background:#e0bd7b;color:#17333d;font-weight:900;margin-bottom:7px}.rgi-static p{font-size:.78rem!important;margin:0!important;max-width:none!important}.rgi-map-premise{display:inline-flex;align-items:center;gap:7px;margin-bottom:7px;color:#8fc6b6;font-size:.72rem;font-weight:750;letter-spacing:.04em}
      @keyframes rgi-send{0%{transform:translate(0,0);opacity:1}70%{transform:translate(250px,-10px);opacity:1}100%{transform:translate(300px,-35px);opacity:.15}}
      @media(max-width:800px){.rgi-overlay{top:64px;min-height:calc(100svh - 64px);padding:16px}.rgi-shell{grid-template-columns:1fr;gap:15px}.rgi-visual{min-height:300px;order:1}.rgi-copy{order:2}.rgi-copy h2{font-size:2.25rem;margin:8px 0 10px}.rgi-copy p{font-size:.89rem;line-height:1.55}.rgi-story-progress{margin:14px 0 12px}.rgi-actions button{min-width:0;flex:1}.rgi-code-line{gap:5px}.rgi-code-line b{padding:9px 8px}.rgi-static ol{grid-template-columns:1fr}.rgi-static{padding:14px}.rgi-pip{scale:.82}.rgi-workshop{scale:.82;transform-origin:bottom right}}
      @media(max-width:430px){.rgi-overlay{padding:10px}.rgi-visual{min-height:248px;border-radius:16px}.rgi-copy h2{font-size:1.84rem}.rgi-moon{width:42px;height:42px}.rgi-pip{left:15%}.rgi-workshop{right:8%}.rgi-code{inset:12% 4%}.rgi-code-line{font-size:.64rem}.rgi-step-label{margin-top:8px}}
      @media(prefers-reduced-motion:reduce){.rgi-overlay *{animation:none!important;transition:none!important}.rgi-static *{transition:none!important}}
    `;
    document.head.append(style);
  }

  function staticStory(root) {
    if (root.querySelector('#rgi-static')) return;
    const map = root.querySelector('.rg-map');
    if (!map) return;
    const box = document.createElement('section');
    box.id = 'rgi-static';
    box.className = 'rgi-static';
    box.setAttribute('aria-label', 'Opening story summary');
    box.innerHTML = `<span class="rg-eyebrow">THE MISSING DELIVERY</span><h2>Before you move: what happened in the storm</h2><ol>${scenes.map(s => `<li><strong>${s.title}</strong><br>${s.body}</li>`).join('')}</ol><p>Reduced motion is on, so the same story is shown without the animated sequence.</p>`;
    map.prepend(box);
  }

  function openIntro(root, launch, { replay = false } = {}) {
    activeCleanup();
    ensureStyles();
    const overlay = document.createElement('section');
    overlay.id = 'rgi-intro';
    overlay.className = 'rgi-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'rgi-title');
    overlay.tabIndex = -1;
    overlay.innerHTML = `
      <div class="rgi-shell">
        <div class="rgi-visual" aria-hidden="true">
          <div class="rgi-moon"></div><div class="rgi-mountain one"></div><div class="rgi-mountain two"></div><div class="rgi-mountain three"></div><div class="rgi-water"></div>
          <div class="rgi-island rgi-left"></div><div class="rgi-island rgi-right"></div><div class="rgi-route"></div>
          <div class="rgi-pip"><span></span></div><div class="rgi-workshop"></div><div class="rgi-message"></div><div class="rgi-storm"></div>
          <div class="rgi-risk"><span class="rgi-gear">1</span><span class="rgi-gear">2</span></div><div class="rgi-warning">DUPLICATE DELIVERY</div>
          <div class="rgi-signals">${Array.from({length:7},()=>'<i class="rgi-signal"></i>').join('')}</div>
          <div class="rgi-code"><div class="rgi-code-line"><b>request(job-01)</b><i>→</i><b>no reply</b><i>→</i><b>retry?</b></div></div>
        </div>
        <div class="rgi-copy">
          <span class="rgi-kicker"></span><h2 id="rgi-title"></h2><p id="rgi-body"></p>
          <div class="rgi-story-progress" aria-label="Opening story progress">${scenes.map(()=>'<span></span>').join('')}</div>
          <div class="rgi-actions"><button type="button" class="rg-primary" id="rgi-next">Next →</button><button type="button" class="rgi-skip" id="rgi-skip">Skip story</button></div>
          <small class="rgi-step-label" id="rgi-step-label"></small>
        </div>
      </div>`;
    root.append(overlay);
    let step = 0;
    let timer = 0;
    let closed = false;
    const clear = () => { if (timer) clearTimeout(timer); timer = 0; };
    const close = (focusLaunch = true) => {
      if (closed) return;
      closed = true;
      clear();
      remember();
      overlay.remove();
      if (focusLaunch) launch?.focus({preventScroll:true});
    };
    const update = () => {
      clear();
      overlay.dataset.step = String(step);
      overlay.querySelector('.rgi-kicker').textContent = scenes[step].kicker;
      overlay.querySelector('#rgi-title').textContent = scenes[step].title;
      overlay.querySelector('#rgi-body').textContent = scenes[step].body;
      overlay.querySelectorAll('.rgi-story-progress span').forEach((n,i)=>n.classList.toggle('on', i <= step));
      overlay.querySelector('#rgi-step-label').textContent = `Story beat ${step + 1} of ${scenes.length}${replay?' · replaying opening':''}`;
      const next = overlay.querySelector('#rgi-next');
      next.textContent = step === scenes.length - 1 ? 'Take control · restore Signal 1 →' : 'Next →';
      if (step < scenes.length - 1 && !reduced()) timer = setTimeout(() => { step += 1; update(); }, 3750);
    };
    overlay.querySelector('#rgi-next').addEventListener('click', () => {
      if (step === scenes.length - 1) {
        close(false);
        launch?.click();
      } else {
        step += 1;
        update();
      }
    });
    overlay.querySelector('#rgi-skip').addEventListener('click', () => close(true));
    overlay.addEventListener('keydown', event => {
      if (event.key === 'Escape') { event.preventDefault(); close(true); }
    });
    activeCleanup = () => close(false);
    update();
    overlay.focus({preventScroll:true});
  }

  function enhanceMap(missions, attempt) {
    ensureStyles();
    const root = document.querySelector('#rescue-game');
    if (!root) return;
    const cleared = missions.filter(m => m.status === 'cleared').length;
    const active = attempt?.status === 'draft';
    const launch = root.querySelector('#rg-launch');
    const brief = root.querySelector('.rg-map-brief');
    if (cleared === 0 && !active && brief && launch) {
      const eyebrow = brief.querySelector('.rg-eyebrow');
      const title = brief.querySelector('h1');
      const copy = brief.querySelector('p');
      if (eyebrow) eyebrow.textContent = 'THE MISSING DELIVERY';
      if (title) title.textContent = 'The storm hid one delivery reply.';
      if (copy) copy.textContent = 'Pip already sent one order for a bridge gear. The workshop may have acted, but its reply vanished. Retry blindly and the valley could receive two. Find out what happened and restore seven signals.';
      launch.innerHTML = 'Start Signal 1 <span>→</span>';
      const premise = document.createElement('span');
      premise.className = 'rgi-map-premise';
      premise.textContent = 'ONE INTENT → ONE SAFE RESULT';
      brief.insertBefore(premise, title);
    }

    const menu = root.querySelector('#rg-menu');
    if (menu && launch) {
      const replay = document.createElement('button');
      replay.type = 'button';
      replay.id = 'rg-replay-story';
      replay.textContent = 'Replay opening story';
      replay.addEventListener('click', () => openIntro(root, launch, {replay:true}));
      menu.insertBefore(replay, menu.firstChild);
    }

    if (cleared === 0 && !active && launch && !remembered()) {
      if (reduced()) staticStory(root);
      else openIntro(root, launch);
    }
  }

  game.map = (missions, attempt, handlers) => {
    activeCleanup();
    originalMap(missions, attempt, handlers);
    enhanceMap(missions, attempt);
  };
  game.render = (...args) => { activeCleanup(); return originalRender(...args); };
  game.hide = (...args) => { activeCleanup(); return originalHide(...args); };
  game.__firstMinuteStory = true;
})();
