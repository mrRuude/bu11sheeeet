// Register service worker if available
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
}

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const overlay = document.getElementById('overlay');
const startBtn = document.getElementById('start');

let W = 800, H = 600;
const wrap = document.getElementById('game-wrap');
function resize(){
    const rect = wrap.getBoundingClientRect();
    W = Math.max(100, Math.floor(rect.width));
    H = Math.max(100, Math.floor(rect.height));
    // handle device pixel ratio for crisp canvas
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
}
window.addEventListener('resize', resize);
resize();

// Input (left/right or pointer)
let left=false, right=false, pointerX=null;
window.addEventListener('keydown', e=>{ if(e.key==='ArrowLeft') left=true; if(e.key==='ArrowRight') right=true; });
window.addEventListener('keyup', e=>{ if(e.key==='ArrowLeft') left=false; if(e.key==='ArrowRight') right=false; });
canvas.addEventListener('mousemove', e=>{ const r = canvas.getBoundingClientRect(); pointerX = e.clientX - r.left; });
canvas.addEventListener('touchmove', e=>{ const r = canvas.getBoundingClientRect(); pointerX = e.touches[0].clientX - r.left; e.preventDefault(); }, {passive:false});

// Game state
let state = 'menu';
let score = 0, lives = 1;

// Rocket (starts near bottom; world moves down to simulate upward flight)
const rocket = { x: W/2, y: H - 80, vx:0, r:18 };

// Entities
let moons = [], coins = [], stars = [];
for(let i=0;i<100;i++) stars.push({x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.5+0.2,dy:Math.random()*0.4+0.2});

function spawnMoon(){
    const r = 30 + Math.random()*50;
    // spawn above the screen, move down
    moons.push({x: Math.random()*(W-40)+20, y: -r-20, r, speed: 1.2 + Math.random()*2.2});
}
function spawnCoin(){
    const r = 10;
    coins.push({x: Math.random()*(W-40)+20, y: -r-10, r, speed: 2 + Math.random()*1.5});
}

let frame = 0;

function reset(){
    score = 0; lives = 1; rocket.x = W/2; rocket.y = H - 70; rocket.vx = 0; moons=[]; coins=[]; frame=0;
    updateHUD();
}

function startGame(){ state='playing'; overlay.classList.add('hidden'); reset(); }
startBtn.addEventListener('click', startGame);

function updateHUD(){ scoreEl.textContent = 'Score: '+score; livesEl.textContent = 'Lives: '+lives; }

// Audio: simple coin pickup sound using WebAudio
let audioCtx = null;
function playCoinSound(volume){
    try{
        if(!audioCtx) audioCtx = new (window.AudioContext||window.webkitAudioContext)();
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.type = 'sine'; o.frequency.value = 880;
        g.gain.value = Math.max(0, Math.min(1, volume)) * 0.12;
        o.connect(g); g.connect(audioCtx.destination);
        const now = audioCtx.currentTime;
        g.gain.setValueAtTime(g.gain.value, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        o.start(now); o.stop(now + 0.2);
    }catch(e){}
}

function playCrashSound(volume){
    try{
        if(!audioCtx) audioCtx = new (window.AudioContext||window.webkitAudioContext)();
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.type = 'triangle'; o.frequency.value = 180;
        g.gain.value = Math.max(0, Math.min(1, volume)) * 0.18;
        o.connect(g); g.connect(audioCtx.destination);
        const now = audioCtx.currentTime;
        g.gain.setValueAtTime(g.gain.value, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
        o.start(now); o.stop(now + 0.28);
    }catch(e){}
}

const volumeEl = document.getElementById('volume');
function getVolume(){ return volumeEl ? parseFloat(volumeEl.value) : 0.5 }

function coll(a,b){ const dx=a.x-b.x, dy=a.y-b.y; return Math.hypot(dx,dy) < (a.r + b.r) * 0.9 }

function update(){
    if(state!=='playing') return;
    frame++;

    // spawn (frequency scales with frame)
    if(frame%120===0) spawnMoon();
    if(frame%90===0) spawnCoin();

    // stars (move down)
    for(const s of stars){ s.y += s.dy; if(s.y > H) s.y = 0; }

    // rocket horizontal control
    const targetX = pointerX !== null ? pointerX : (left? rocket.x-6 : right? rocket.x+6 : rocket.x);
    rocket.x += (targetX - rocket.x) * 0.14;
    // clamp
    rocket.x = Math.max(20, Math.min(W-20, rocket.x));

    // rocket ascends slowly from bottom to top
    if (rocket.y > H * 0.2) {
        rocket.y -= 0.35;
    }

    // update moons (move down)
    for(let i=moons.length-1;i>=0;i--){ const m=moons[i]; m.y += m.speed; if(m.y - m.r > H + 50) moons.splice(i,1);
        if(coll(rocket, m)) { // immediate destruction
            playCrashSound(getVolume());
            state = 'gameover';
            overlay.classList.remove('hidden');
            overlay.querySelector('#title').textContent='Game Over';
            overlay.querySelector('#subtitle').textContent='Score: '+score;
            overlay.querySelector('#start').textContent='Play Again';
            return;
        }
    }

    // update coins
    for(let i=coins.length-1;i>=0;i--){ const c=coins[i]; c.y += c.speed; if(c.y - c.r > H + 50) coins.splice(i,1);
        if(coll(rocket, c)) { coins.splice(i,1); score += 10; updateHUD(); playCoinSound(getVolume()); }
    }
}

function draw(){
    // clear
    ctx.fillStyle = '#011021'; ctx.fillRect(0,0,W,H);

    // stars
    for(const s of stars){ ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2); ctx.fill(); }

    // moons
    for(const m of moons){ ctx.fillStyle = '#dfe6ea'; ctx.beginPath(); ctx.arc(m.x,m.y,m.r,0,Math.PI*2); ctx.fill(); ctx.fillStyle='rgba(0,0,0,0.08)';
        // craters
        ctx.beginPath(); ctx.arc(m.x - m.r*0.3, m.y - m.r*0.2, m.r*0.22,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(m.x + m.r*0.25, m.y + m.r*0.15, m.r*0.16,0,Math.PI*2); ctx.fill(); }

    // coins
    for(const c of coins){ ctx.fillStyle='#ffd24a'; ctx.beginPath(); ctx.arc(c.x,c.y,c.r,0,Math.PI*2); ctx.fill(); ctx.strokeStyle='#c58b24'; ctx.lineWidth=2; ctx.stroke(); }
    // rocket (pointing up)
    ctx.save(); ctx.translate(rocket.x, rocket.y);
    // flame
    ctx.fillStyle='rgba(255,145,0,0.9)';
    ctx.beginPath(); ctx.moveTo(0,16); ctx.lineTo(-8,28); ctx.lineTo(8,28); ctx.closePath(); ctx.fill();
    // body
    ctx.fillStyle='#ff6b6b'; ctx.beginPath(); ctx.moveTo(0,-26); ctx.lineTo(-14,14); ctx.lineTo(14,14); ctx.closePath(); ctx.fill();
    ctx.strokeStyle='#ffffff'; ctx.lineWidth=2; ctx.stroke();
    // cockpit
    ctx.fillStyle='#222'; ctx.beginPath(); ctx.ellipse(0,0,8,10,0,0,Math.PI*2); ctx.fill();
    ctx.restore();

    // HUD handled by DOM
}

function loop(){ update(); draw(); requestAnimationFrame(loop); }
requestAnimationFrame(loop);

// allow starting by tapping overlay
overlay.addEventListener('click', e=>{ if(e.target.id==='start') return; });

// click overlay start also handled by startBtn

