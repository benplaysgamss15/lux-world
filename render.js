// ── HELPERS ──
function rr(x,y,w,h,r,fill,stroke,sw){
    ctx.beginPath();
    ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);
    ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
    ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);
    ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);
    ctx.closePath();
    if(fill){ctx.fillStyle=fill;ctx.fill();}
    if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=sw||2;ctx.stroke();}
}
function btn(x,y,w,h,lbl,col,tcol,act,ic){
    const hov=G.mx>=x&&G.mx<=x+w&&G.my>=y&&G.my<=y+h;
    const c=hov?lighten(col,28):col;
    if(hov){ctx.shadowColor=col;ctx.shadowBlur=16;}
    rr(x,y,w,h,8,c,hov?'rgba(255,255,255,0.85)':null,2);
    ctx.shadowBlur=0;
    ctx.fillStyle=tcol||'#fff';
    ctx.font=`bold ${Math.max(11,Math.floor(h*0.36))}px Courier New`;
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText((ic?ic+' ':'')+lbl,x+w/2,y+h/2);
    G.btns.push({x,y,w,h,act});
}
function lighten(hex,a){
    try{
        const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b2=parseInt(hex.slice(5,7),16);
        return `rgb(${Math.min(255,r+a)},${Math.min(255,g+a)},${Math.min(255,b2+a)})`;
    }catch{return hex;}
}
function hpBar(x,y,w,h,cur,max,col,label){
    const pct=Math.max(0,cur/max);
    ctx.fillStyle='rgba(0,0,0,0.8)';ctx.fillRect(x,y,w,h);
    const gc=ctx.createLinearGradient(x,y,x+w*pct,y);
    gc.addColorStop(0,col);gc.addColorStop(1,lighten(col,40));
    ctx.fillStyle=gc;ctx.fillRect(x,y,w*pct,h);
    ctx.strokeStyle='rgba(255,255,255,0.3)';ctx.lineWidth=1;ctx.strokeRect(x,y,w,h);
    if(label){
        ctx.fillStyle='#fff';ctx.font=`bold ${Math.max(8,h-2)}px Courier New`;
        ctx.textAlign='center';ctx.textBaseline='middle';
        ctx.fillText(label,x+w/2,y+h/2);
    }
}
function getCol(c, size) {
    if(!c) return '#ffffff';
    if(c.startsWith('grad:')) {
        const pts = c.split(':');
        const g = ctx.createLinearGradient(-size, -size, size, size);
        g.addColorStop(0, pts[1]); g.addColorStop(1, pts[2]);
        return g;
    }
    return c;
}

// ── DINO DRAW ──
function drawDino(key,cx,cy,face,af,sc,alpha,oc){
    const d=DINOS[key];if(!d)return;
    ctx.save();
    ctx.globalAlpha=alpha!=null?alpha:1;
    ctx.translate(cx,cy);ctx.scale(face,1);
    const s=(sc||1)*(d.sz/20);
    const bob=Math.sin(af*0.18)*2.5;

    const cBody = oc && oc.body ? getCol(oc.body, 20*s) : d.col;
    const cLegs = oc && oc.legs ? getCol(oc.legs, 20*s) : d.acc;
    const cHead = oc && oc.head ? getCol(oc.head, 15*s) : d.col;
    const cNeck = oc && oc.neck ? getCol(oc.neck, 15*s) : d.col;
    const cTail = oc && oc.tail ? getCol(oc.tail, 20*s) : d.col;

    ctx.fillStyle='rgba(0,0,0,0.18)';ctx.beginPath();
    ctx.ellipse(0,d.sz*s*0.55+2,d.sz*s*0.65,5,0,0,Math.PI*2);ctx.fill();

    if(key==='megalodon' || key==='mosasaurus'){
        const isMosa = key==='mosasaurus';
        ctx.fillStyle=cBody;ctx.beginPath();ctx.ellipse(0,bob,(isMosa?40:46)*s,(isMosa?15:22)*s,0.2,0,Math.PI*2);ctx.fill();
        ctx.fillStyle=cLegs;ctx.beginPath();
        ctx.moveTo(5*s,-15*s+bob);ctx.lineTo(-10*s,5*s+bob);ctx.lineTo(20*s,5*s+bob);ctx.fill();
        ctx.fillStyle=cBody;ctx.beginPath();
        ctx.moveTo(-10*s,5*s+bob);ctx.lineTo(-35*s,(isMosa?10:20)*s+bob);ctx.lineTo(-5*s,18*s+bob);ctx.fill();
        if(!isMosa){
            ctx.beginPath();ctx.moveTo(-10*s,5*s+bob);ctx.lineTo(-35*s,-5*s+bob);ctx.lineTo(-5*s,3*s+bob);ctx.fill();
        }else{
            ctx.beginPath();ctx.moveTo(-35*s,10*s+bob);ctx.lineTo(-50*s,15*s+bob);ctx.lineTo(-45*s,0*s+bob);ctx.fill();
            ctx.fillStyle=cLegs; ctx.beginPath();ctx.ellipse(15*s,15*s+bob,8*s,4*s,0.5,0,Math.PI*2);ctx.fill();
            ctx.beginPath();ctx.ellipse(-10*s,12*s+bob,7*s,3*s,0.5,0,Math.PI*2);ctx.fill();
        }
        ctx.fillStyle='#ffee00';ctx.beginPath();ctx.arc(30*s,-5*s+bob,4*s,0,Math.PI*2);ctx.fill();
        ctx.fillStyle='#000';ctx.beginPath();ctx.arc(31*s,-5*s+bob,2*s,0,Math.PI*2);ctx.fill();
        ctx.fillStyle='#fff';
        for(let i=-3;i<=3;i++){ctx.beginPath();ctx.moveTo(i*8*s,12*s+bob);ctx.lineTo(i*8*s-3.5*s,20*s+bob);ctx.lineTo(i*8*s+3.5*s,20*s+bob);ctx.fill();}
        if(d.rarity==='Boss'){
            ctx.shadowColor='#ff3333';ctx.shadowBlur=30; ctx.strokeStyle='rgba(255,50,50,0.4)';ctx.lineWidth=3;
            ctx.beginPath();ctx.ellipse(0,bob,49*s,25*s,0.2,0,Math.PI*2);ctx.stroke();ctx.shadowBlur=0;
        }
    } else if(key==='pterodactyl' || key==='quetzalcoatlus'){
        const isQuetz = key==='quetzalcoatlus'; const flap=Math.sin(af*0.28)*14;
        ctx.fillStyle=cBody;ctx.beginPath();
        ctx.moveTo(-32*s,flap*s+bob);ctx.quadraticCurveTo(-42*s,12*s+bob,-16*s,16*s+bob);
        ctx.quadraticCurveTo(0,6*s+bob,16*s,16*s+bob); ctx.quadraticCurveTo(42*s,12*s+bob,32*s,flap*s+bob);
        ctx.quadraticCurveTo(0,-20*s+bob,-32*s,flap*s+bob);ctx.fill();
        ctx.fillStyle=cLegs;ctx.beginPath();ctx.ellipse(20*s,-6*s+bob,11*s,7*s,-0.3,0,Math.PI*2);ctx.fill();
        ctx.fillStyle='#d4a030';ctx.beginPath();
        ctx.moveTo(29*s,-6*s+bob);ctx.lineTo((isQuetz?50:42)*s,-3*s+bob);ctx.lineTo(29*s,0+bob);ctx.fill();
        ctx.fillStyle='#ff0';ctx.beginPath();ctx.arc(23*s,-8*s+bob,2.5*s,0,Math.PI*2);ctx.fill();
        ctx.fillStyle='#111';ctx.beginPath();ctx.arc(23*s,-8*s+bob,1.2*s,0,Math.PI*2);ctx.fill();
    } else {
        ctx.fillStyle=cBody;ctx.beginPath();ctx.ellipse(0,0+bob,21*s,13*s,0,0,Math.PI*2);ctx.fill();
        if(key==='brachiosaurus' || key==='diplodocus'){
            ctx.fillStyle=cNeck;ctx.beginPath();
            ctx.moveTo(3*s,-3*s+bob);ctx.quadraticCurveTo(20*s,-20*s+bob,15*s,-38*s+bob);
            ctx.lineTo(22*s,-38*s+bob);ctx.quadraticCurveTo(27*s,-20*s+bob,10*s,-3*s+bob);ctx.fill();
            ctx.fillStyle=cHead;ctx.beginPath();ctx.ellipse(18*s,-41*s+bob,8*s,5*s,-0.4,0,Math.PI*2);ctx.fill();
            ctx.fillStyle='#ffee00';ctx.beginPath();ctx.arc(23*s,-44*s+bob,2.5*s,0,Math.PI*2);ctx.fill();
            ctx.fillStyle='#111';ctx.beginPath();ctx.arc(23*s,-44*s+bob,1.2*s,0,Math.PI*2);ctx.fill();
        } else {
            ctx.fillStyle=cNeck;ctx.beginPath();ctx.ellipse(18*s,-8*s+bob,10*s,7*s,-0.35,0,Math.PI*2);ctx.fill();
            ctx.fillStyle=cHead;ctx.beginPath(); ctx.moveTo(26*s,-5*s+bob);ctx.lineTo(32*s,-9*s+bob);ctx.lineTo(32*s,-4*s+bob);ctx.fill();
            ctx.fillStyle=(key==='indominus')?'#ff0000':'#ffee00';ctx.beginPath();ctx.arc(22*s,-11*s+bob,2.5*s,0,Math.PI*2);ctx.fill();
            ctx.fillStyle='#111';ctx.beginPath();ctx.arc(22.5*s,-11*s+bob,1.2*s,0,Math.PI*2);ctx.fill();
        }
        ctx.fillStyle=cTail;ctx.beginPath();
        ctx.moveTo(-18*s,0+bob);ctx.quadraticCurveTo(-30*s,-6*s+bob,-42*s,4*s+bob); ctx.quadraticCurveTo(-30*s,12*s+bob,-18*s,9*s+bob);ctx.fill();
        ctx.fillStyle=cLegs; const la=Math.sin(af*0.22)*6;
        ctx.fillRect(-5*s,8*s+bob,5.5*s,(13+la)*s); ctx.fillRect(5*s,8*s+bob,5.5*s,(13-la)*s);
        if(d.sz>=28){ ctx.fillRect(-14*s,8*s+bob,5.5*s,(13-la)*s); ctx.fillRect(-24*s,8*s+bob,5.5*s,(13+la)*s); }
        if(['trex','carnotaurus','indoraptor','dilophosaurus','baryonyx','indominus','giganotosaurus'].includes(key)){
            ctx.fillStyle=cLegs; ctx.fillRect(10*s,-2*s+bob,3*s,8*s);ctx.fillRect(12*s,5*s+bob,4*s,3*s);
        }
        if(key==='stegosaurus'){
            ctx.fillStyle='#d09040'; for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(i*7*s,-5*s+bob);ctx.lineTo(i*7*s-3*s,-20*s+bob);ctx.lineTo(i*7*s+3*s,-20*s+bob);ctx.fill();}
            ctx.fillStyle='#aa3030';ctx.fillRect(-28*s,5*s+bob,4*s,4*s);ctx.fillRect(-32*s,3*s+bob,4*s,4*s);
        }
        if(key==='ankylosaurus'){ ctx.fillStyle='#aa8030';ctx.beginPath();ctx.ellipse(-45*s,6*s+bob,10*s,8*s,0,0,Math.PI*2);ctx.fill(); }
        if(key==='triceratops'){ ctx.fillStyle='#ccc'; ctx.fillRect(20*s,-14*s+bob,3*s,10*s);ctx.fillRect(15*s,-18*s+bob,3*s,14*s);ctx.fillRect(25*s,-10*s+bob,3*s,6*s); }
        if(key==='spinosaurus'){ ctx.fillStyle='#7090cc'; for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(i*7*s,-5*s+bob);ctx.lineTo(i*7*s-2*s,-28*s+bob);ctx.lineTo(i*7*s+2*s,-28*s+bob);ctx.fill();} }
        if(key==='dilophosaurus'){ ctx.fillStyle='#cc6020';ctx.beginPath();ctx.ellipse(18*s,-14*s+bob,8*s,4*s,0,0,Math.PI*2);ctx.fill(); }
        if(key==='parasaurolophus'){
            ctx.fillStyle='#cc6030';ctx.beginPath();
            ctx.moveTo(15*s,-10*s+bob);ctx.quadraticCurveTo(5*s,-30*s+bob,-10*s,-20*s+bob);
            ctx.lineTo(-8*s,-16*s+bob);ctx.quadraticCurveTo(7*s,-22*s+bob,16*s,-8*s+bob);ctx.fill();
        }
        if(key==='indoraptor' || key==='indominus'){
            if(key==='indoraptor'){
                ctx.fillStyle='rgba(180,0,255,0.3)';ctx.beginPath();ctx.ellipse(0,0+bob,20*s,12*s,0,0,Math.PI*2);ctx.fill();
                ctx.fillStyle='#ffff00'; for(let i=0;i<3;i++){ctx.fillRect((-6+i*6)*s,-6*s+bob,2.5*s,12*s);}
            }else{
                ctx.fillStyle=cLegs;
                for(let i=-2;i<=3;i++){ ctx.beginPath();ctx.moveTo(i*8*s,-10*s+bob); ctx.lineTo(i*8*s-4*s,-22*s+bob); ctx.lineTo(i*8*s+4*s,-22*s+bob);ctx.fill(); }
            }
        }
        if(key==='dimetrodon'){ ctx.fillStyle=cLegs;ctx.beginPath(); ctx.moveTo(-15*s,-5*s+bob);ctx.quadraticCurveTo(0,-30*s+bob,15*s,-5*s+bob);ctx.fill(); }
        if(key==='pachycephalosaurus'){ ctx.fillStyle='#e8c898';ctx.beginPath();ctx.ellipse(26*s,-13*s+bob,6*s,5*s,0,0,Math.PI*2);ctx.fill(); }
        if(key==='giganotosaurus'){ ctx.fillStyle=cLegs; for(let i=-2;i<=1;i++){ctx.fillRect((i*8)*s,-18*s+bob,4*s,8*s);} }
        
        if(d.rarity==='Legendary'){
            ctx.shadowColor=RARITY_COLOR.Legendary;ctx.shadowBlur=25; ctx.strokeStyle='rgba(255,170,0,0.5)';ctx.lineWidth=2;
            ctx.beginPath(); ctx.ellipse(0,0+bob,23*s,15*s,0,0,Math.PI*2);ctx.stroke();ctx.shadowBlur=0;
        }
        if(d.rarity==='Epic'){
            ctx.shadowColor=RARITY_COLOR.Epic;ctx.shadowBlur=18; ctx.strokeStyle='rgba(200,68,255,0.4)';ctx.lineWidth=1.5;
            ctx.beginPath(); ctx.ellipse(0,0+bob,23*s,15*s,0,0,Math.PI*2);ctx.stroke();ctx.shadowBlur=0;
        }
        if(d.rarity==='Boss' && key==='indominus'){
            ctx.shadowColor='#ff3333';ctx.shadowBlur=30; ctx.strokeStyle='rgba(255,50,50,0.5)';ctx.lineWidth=3;
            ctx.beginPath(); ctx.ellipse(0,0+bob,25*s,16*s,0,0,Math.PI*2);ctx.stroke();ctx.shadowBlur=0;
        }
    }
    ctx.restore();
}

function drawHat(type, cx, cy, sc){
    const s = sc || 1; ctx.save(); ctx.translate(cx, cy);
    if (!type || type === 'bucket') {
        ctx.save();ctx.translate(-11*s,-18*s);ctx.rotate(-0.35);
        const hg1=ctx.createLinearGradient(0,-20*s,0,0);hg1.addColorStop(0,'#00ffee');hg1.addColorStop(1,'#009999');
        ctx.fillStyle=hg1;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(-4*s,-22*s);ctx.lineTo(4*s,-22*s);ctx.closePath();ctx.fill();
        ctx.strokeStyle='rgba(0,255,220,0.5)';ctx.lineWidth=1*s;ctx.stroke();ctx.restore();
        ctx.save();ctx.translate(11*s,-18*s);ctx.rotate(0.35);
        const hg2=ctx.createLinearGradient(0,-20*s,0,0);hg2.addColorStop(0,'#00ffee');hg2.addColorStop(1,'#009999');
        ctx.fillStyle=hg2;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(-4*s,-22*s);ctx.lineTo(4*s,-22*s);ctx.closePath();ctx.fill();
        ctx.strokeStyle='rgba(0,255,220,0.5)';ctx.lineWidth=1*s;ctx.stroke();ctx.restore();
        ctx.fillStyle='#2a2e36';ctx.beginPath(); ctx.moveTo(-18*s,-18*s);ctx.lineTo(18*s,-18*s);ctx.lineTo(14*s,4*s);ctx.lineTo(-14*s,4*s);ctx.closePath();ctx.fill();
        const rimG=ctx.createLinearGradient(0,-22*s,0,-16*s);rimG.addColorStop(0,'#4a5060');rimG.addColorStop(1,'#1e2228');
        ctx.fillStyle=rimG;ctx.beginPath();ctx.ellipse(0,-18*s,20*s,4.5*s,0,0,Math.PI*2);ctx.fill(); ctx.strokeStyle='#555d6a';ctx.lineWidth=1.2*s;ctx.stroke();
        ctx.fillStyle='#1e2228';ctx.beginPath();ctx.ellipse(0,4*s,14.5*s,3.5*s,0,0,Math.PI*2);ctx.fill(); ctx.strokeStyle='#3a4050';ctx.lineWidth=1*s;ctx.stroke();
        ctx.strokeStyle='rgba(80,90,110,0.6)';ctx.lineWidth=1*s; for(let i=-1;i<=1;i++){ctx.beginPath();ctx.moveTo(i*7*s,-14*s);ctx.lineTo(i*6*s,2*s);ctx.stroke();}
        ctx.fillStyle='#c8a820';ctx.font=`bold ${9*s}px Courier New`; ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('AA',-1*s,-8*s);
    } else if (type === 'bacon') {
        ctx.fillStyle = '#cc6600'; ctx.beginPath(); ctx.ellipse(0, -8*s, 16*s, 10*s, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#e67300'; const spikes = [[-10,-20,-18,-2],[-2,-24,-8,4],[6,-22,12,0],[12,-18,18,6]];
        spikes.forEach(sp => { ctx.beginPath(); ctx.moveTo(sp[0]*s, sp[1]*s); ctx.quadraticCurveTo(sp[2]*s, sp[3]*s, (sp[2]-4)*s, (sp[3]+8)*s); ctx.lineTo(0, -5*s); ctx.fill(); });
        ctx.fillStyle = '#994d00'; const spikes2 = [[-14,-14,-22,5],[-6,-26,-14,-5],[2,-26,6,-5],[16,-12,22,8]];
        spikes2.forEach(sp => { ctx.beginPath(); ctx.moveTo(sp[0]*s, sp[1]*s); ctx.quadraticCurveTo(sp[2]*s, sp[3]*s, (sp[2]+4)*s, (sp[3]+6)*s); ctx.lineTo(0, -5*s); ctx.fill(); });
    } else if (type === 'dino_hood') {
        const hg = ctx.createLinearGradient(0, -20*s, 0, 5*s); hg.addColorStop(0, '#5cd65c'); hg.addColorStop(1, '#2eb82e');
        ctx.fillStyle = '#145214'; ctx.beginPath(); ctx.moveTo(0, -18*s); ctx.lineTo(-6*s, -30*s); ctx.lineTo(8*s, -18*s); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-8*s, -10*s); ctx.lineTo(-18*s, -20*s); ctx.lineTo(-12*s, -5*s); ctx.fill();
        ctx.fillStyle = hg; ctx.beginPath(); ctx.moveTo(-16*s, 8*s); ctx.quadraticCurveTo(-20*s, -18*s, 0, -22*s);
        ctx.quadraticCurveTo(20*s, -18*s, 16*s, 8*s); ctx.quadraticCurveTo(0, 14*s, -16*s, 8*s); ctx.fill();
        ctx.fillStyle = '#ffffe6'; for(let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo((i*5 - 2)*s, 9*s); ctx.lineTo((i*5)*s, 15*s); ctx.lineTo((i*5 + 2)*s, 9*s); ctx.fill(); }
        ctx.fillStyle = '#0a0a0a'; ctx.beginPath(); ctx.ellipse(-8*s, -6*s, 2.5*s, 3.5*s, -0.2, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.ellipse(8*s, -6*s, 2.5*s, 3.5*s, 0.2, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-8.5*s, -7*s, 1*s, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(7.5*s, -7*s, 1*s, 0, Math.PI*2); ctx.fill();
    } else if (type === 'smiley') {
        const hg = ctx.createLinearGradient(0, -22*s, 0, 0); hg.addColorStop(0, '#ffe600'); hg.addColorStop(1, '#e6b800');
        ctx.fillStyle = hg; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(-12*s, -20*s); ctx.lineTo(12*s, -20*s); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#cca300'; ctx.beginPath(); ctx.ellipse(0, 4*s, 18*s, 4*s, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = hg; ctx.beginPath(); ctx.ellipse(0, 4*s, 16*s, 3*s, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#ffdb4d'; ctx.beginPath(); ctx.ellipse(0, -20*s, 12*s, 3*s, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#1a1a1a'; ctx.beginPath(); ctx.ellipse(-4*s, -10*s, 1.2*s, 2*s, 0, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.ellipse(4*s, -10*s, 1.2*s, 2*s, 0, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 1.5*s; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-5*s, -4*s); ctx.quadraticCurveTo(0, 1*s, 5*s, -4*s); ctx.stroke();
    }
    ctx.restore();
}

function spawnParticles(x,y,col,n){
    for(let i=0;i<n;i++){ const a=Math.random()*Math.PI*2,sp=1.5+Math.random()*3; G.particles.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,col,life:40,maxLife:40}); }
}
function updateDrawParticles(){
    G.particles=G.particles.filter(p=>p.life>0);
    for(const p of G.particles){
        p.x+=p.vx;p.y+=p.vy;p.vy+=0.1;p.life--; ctx.globalAlpha=p.life/p.maxLife; ctx.fillStyle=p.col;ctx.beginPath();ctx.arc(p.x,p.y,2.5,0,Math.PI*2);ctx.fill();
    }
    ctx.globalAlpha=1;
}

// ── WORLD DRAW ──
function drawWorld(){
    const sx0=Math.floor(G.cam.x/TS)-1, sy0=Math.floor(G.cam.y/TS)-1;
    const sx1=sx0+Math.ceil(canvas.width/TS)+2, sy1=sy0+Math.ceil(canvas.height/TS)+2;
    for(let ty=Math.max(0,sy0);ty<Math.min(WS,sy1);ty++){
        for(let tx=Math.max(0,sx0);tx<Math.min(WS,sx1);tx++){
            const px=tx*TS-G.cam.x, py=ty*TS-G.cam.y; const t=worldMap[ty][tx];
            ctx.fillStyle=tileClr[ty][tx];ctx.fillRect(px,py,TS+1,TS+1);
            if(t===2){ const w=Math.sin(G.tick*0.025+tx*0.6+ty*0.4)*0.12+0.12; ctx.fillStyle=G.level===2?`rgba(255,200,50,${w})`:`rgba(255,255,255,${w})`; ctx.fillRect(px+4,py+TS/2-2,TS-8,4); }
            if(t===1&&(tx*7+ty*11)%5===0){ ctx.fillStyle=G.level===2?'#1a0a05':'#1a4015'; ctx.beginPath();ctx.arc(px+TS/2,py+TS/2,11,0,Math.PI*2);ctx.fill(); ctx.fillStyle=G.level===2?'#2a1005':'#2d6028'; ctx.beginPath();ctx.arc(px+TS/2,py+TS/2-5,8,0,Math.PI*2);ctx.fill(); }
            if(t===0&&(tx*13+ty*7)%9===0){ ctx.fillStyle=G.level===2?'#2a1a12':'#3a7a30'; ctx.fillRect(px+6,py+22,2.5,8);ctx.fillRect(px+13,py+19,2.5,11);ctx.fillRect(px+22,py+24,2.5,6); }
            if(t===3&&(tx*3+ty*9)%7===0){ ctx.strokeStyle=G.level===2?'rgba(120,50,20,0.5)':'rgba(180,150,60,0.4)'; ctx.lineWidth=1;ctx.beginPath(); ctx.arc(px+TS/2,py+TS/2,8,0,Math.PI);ctx.stroke(); }
            if(t===4){
                const pulse = Math.sin(G.tick*0.07 + tx*0.6 + ty*0.4)*0.25 + 0.75; const flow = Math.sin(G.tick*0.04 + tx*0.3 - ty*0.2)*6;
                ctx.fillStyle = '#2a0500'; ctx.fillRect(px, py, TS, TS);
                ctx.fillStyle = 'rgba(200,40,0,' + (pulse*0.9).toFixed(2) + ')'; ctx.fillRect(px+2, py+2, TS-4, TS-4);
                ctx.fillStyle = 'rgba(255,120,0,' + (pulse*0.85).toFixed(2) + ')'; ctx.beginPath(); ctx.ellipse(px+TS/2, py+TS/2+flow, TS*0.38, TS*0.28, 0.3, 0, Math.PI*2); ctx.fill();
                ctx.fillStyle = 'rgba(255,200,50,' + pulse.toFixed(2) + ')'; ctx.beginPath(); ctx.arc(px+TS/2, py+TS/2, 8, 0, Math.PI*2); ctx.fill();
            }
        }
    }
}
function drawHazards() {
    for(const h of G.hazards){
        const sx = h.x - G.cam.x; const sy = h.y - G.cam.y;
        if(sx < -100 || sx > canvas.width + 100 || sy < -100 || sy > canvas.height + 100) continue;
        ctx.fillStyle = 'rgba(255, 0, 0, 0.2)'; ctx.beginPath(); ctx.arc(sx, sy, 45, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(255, 50, 0, 0.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(sx, sy, 45, 0, Math.PI * 2); ctx.stroke();
        const pct = 1 - (h.life / h.maxLife); const rockY = sy - 600 * (1 - pct);
        ctx.fillStyle = '#4a2010'; ctx.beginPath(); ctx.arc(sx, rockY, 18, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ff4400'; ctx.beginPath(); ctx.arc(sx, rockY, 12, 0, Math.PI * 2); ctx.fill();
    }
}
function drawWilds(){
    for(const w of G.wilds){
        const sx=w.x-G.cam.x, sy=w.y-G.cam.y;
        if(sx<-130||sx>canvas.width+130||sy<-130||sy>canvas.height+130) continue;
        if(w.isBoss){
            const pulse=Math.sin(G.tick*0.05)*0.15+0.15;
            ctx.fillStyle=`rgba(255,30,30,${pulse})`;ctx.beginPath();ctx.arc(sx,sy,90,0,Math.PI*2);ctx.fill();
            ctx.strokeStyle='rgba(255,50,50,0.7)';ctx.lineWidth=2; ctx.setLineDash([6,6]);ctx.beginPath();ctx.arc(sx,sy,90,0,Math.PI*2);ctx.stroke(); ctx.setLineDash([]);
        }
        drawDino(w.key,sx,sy,w.face,w.anim,1,1);
        const dn=DINOS[w.key];
        ctx.fillStyle='rgba(0,0,0,0.65)';ctx.fillRect(sx-32,sy-dn.sz-25,64,14);
        ctx.fillStyle=RARITY_COLOR[dn.rarity];ctx.font='bold 9px Courier New'; ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(dn.name,sx,sy-dn.sz-18);
    }
}
function drawPlayer(){
    const p=G.player; const sx=p.x-G.cam.x, sy=p.y-G.cam.y;
    const asz=10, ay=sy-DINOS[p.dk].sz-32+Math.sin(G.tick*0.08)*4;
    ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(sx,ay);ctx.lineTo(sx-asz,ay-asz);ctx.lineTo(sx+asz,ay-asz);ctx.fill();
    
    if (G.coop.partnerId) {
        ctx.fillStyle='rgba(40,20,100,0.7)'; ctx.fillRect(sx-60, sy-DINOS[p.dk].sz-50, 120, 16);
        ctx.fillStyle='#dd88ff'; ctx.font='bold 10px Courier New'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(`Bonded to ${G.coop.partnerName}`, sx, sy-DINOS[p.dk].sz-42);
    }

    drawDino(p.dk,sx,sy,p.face,p.anim,1.25,1, p.oc);
    const headOff=DINOS[p.dk].sz*1.25*0.55; const bob=Math.sin(p.anim*0.18)*2.5;
    drawHat(G.player.hat || 'bucket',sx,sy-headOff+bob-2,1.1);

    const pct=G.playerHp/pMaxHp(); const col=pct>0.5?'#44cc44':pct>0.25?'#cccc44':'#cc4444';
    hpBar(sx-28,sy-DINOS[p.dk].sz-18,56,8,G.playerHp,pMaxHp(),col);
    if (G.playerShield > 0) hpBar(sx-28,sy-DINOS[p.dk].sz-26,56,6,G.playerShield,Math.floor(pMaxHp()*0.4),'#44aaff');
}

// ── HUD ──
function drawHUD(){
    G.btns=[]; const W=canvas.width, H=canvas.height;
    ctx.fillStyle='rgba(0,0,0,0.82)';ctx.fillRect(0,0,W,52);
    ctx.strokeStyle='rgba(100,180,255,0.2)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,52);ctx.lineTo(W,52);ctx.stroke();

    ctx.fillStyle='#aaddff';ctx.shadowColor='#55aaff';ctx.shadowBlur=8; ctx.font='bold 22px Courier New';ctx.textAlign='left';ctx.textBaseline='middle'; ctx.fillText(`🪣 ${G.wheat}`,16,18);ctx.shadowBlur=0;
    ctx.fillStyle='#aaa'; ctx.font='12px Courier New'; ctx.fillText(`Map: ${G.level===1?'Isla Uno':'Volcano Island'}`, 16, 38);

    if(G.cheatsActive){
        const pulse = 0.6 + Math.sin(G.tick * 0.12) * 0.4; ctx.fillStyle = `rgba(255, 0, 0, ${pulse})`; ctx.shadowColor = '#ff0000'; ctx.shadowBlur = 14; ctx.font = 'bold 18px Courier New'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('⚠ CHEATS ACTIVE ⚠', W / 2, 40); ctx.shadowBlur = 0;
    }

    const d=pDino();
    ctx.fillStyle=RARITY_COLOR[d.rarity];ctx.shadowColor=RARITY_COLOR[d.rarity];ctx.shadowBlur=10; ctx.font='bold 15px Courier New';ctx.textAlign='center'; ctx.fillText(`${d.em} ${d.name}[${d.rarity}]`,W/2,G.cheatsActive?18:26);ctx.shadowBlur=0;

    const pct=G.playerHp/pMaxHp(); const hcol=pct>0.5?'#44cc44':pct>0.25?'#cccc44':'#cc4444';
    hpBar(W-195,12,180,16,G.playerHp,pMaxHp(),hcol,`HP ${G.playerHp}/${pMaxHp()}`);
    if (G.playerShield > 0) hpBar(W-195,30,180,10,G.playerShield,Math.floor(pMaxHp()*0.4),'#44aaff',`SHIELD`);

    // RESTORED RESTART BUTTON!
    btn(W-100, 32, 85, 20, 'Restart', '#aa2222', '#fff', () => {
        if(confirm("Are you sure you want to restart? All progress will be lost!")) {
            localStorage.removeItem('dinoworld_save'); window.activeSave = null;
            if(G.coop.partnerId) { sendCoop({ type: 'coop_break', target: G.coop.partnerId }); breakCoop("You restarted."); }
            startGame(true); G.state = 'intro';
        }
    }, '🔄');

    const isConnected = G.peerId || Object.keys(G.conns).length > 0;
    if (!isConnected) {
        btn(W-100, 56, 40, 20, 'Host', '#8822cc', '#fff', () => showMpModal('host')); btn(W-55, 56, 40, 20, 'Join', '#cc2288', '#fff', () => showMpModal('join'));
    } else {
        btn(W-100, 56, 85, 20, 'Leave Room', '#aa2222', '#fff', leaveGame); ctx.fillStyle='#fff'; ctx.font='bold 12px Courier New'; ctx.textAlign='right'; ctx.fillText(G.peerId ? 'Room: '+G.peerId : 'Connected', W-15, 88);
    }

    if (G.coop.partnerId) {
        btn(16, 56, 110, 20, 'Leave Co-op', '#cc2244', '#fff', () => {
            if(confirm("Warning: Leaving Co-op will break the party and reset your progress back to Solo Level 1. Continue?")) { sendCoop({ type: 'coop_break', target: G.coop.partnerId }); breakCoop("You left the Co-op party."); }
        }, '💔');
    }

    const bw=95,bh=44,gap=10,by=H-58; const total=4*(bw+gap)-gap; const bsx=(W-total)/2;
    btn(bsx, by,bw,bh,'Index', '#2255cc','#fff',()=>{G.state='index';G.idxPage=0;G.btns=[];},'📘');
    btn(bsx+bw+gap,by,bw,bh,'Shop', '#cc5522','#fff',()=>{G.state='shop';G.btns=[];},'🛒');
    btn(bsx+2*(bw+gap),by,bw,bh,'Shld(40)','#225588','#fff',()=>{ const maxS = Math.floor(pMaxHp()*0.4); const addS = Math.floor(pMaxHp()*0.15); if(G.wheat>=40 && G.playerShield < maxS){ G.wheat-=40; G.playerShield = Math.min(maxS, G.playerShield + addS); spawnParticles(W/2,H-80,'#44aaff',12); } },'🛡️');
    btn(bsx+3*(bw+gap),by,bw,bh,'Heal(5)','#225522','#fff',()=>{ const addH = Math.floor(pMaxHp()*0.1); if(G.wheat>=5 && G.playerHp < pMaxHp()){ G.wheat-=5; G.playerHp = Math.min(pMaxHp(), G.playerHp + addH); spawnParticles(W/2,H-80,'#44ff44',8); } },'💊');

    const mm=90, mmx=W-mm-8, mmy=H-mm-65;
    ctx.fillStyle='rgba(0,0,0,0.75)';ctx.fillRect(mmx,mmy,mm,mm); ctx.strokeStyle='rgba(255,200,50,0.4)';ctx.lineWidth=1;ctx.strokeRect(mmx,mmy,mm,mm);
    const msc=mm/WS;
    for(let ty2=0;ty2<WS;ty2+=2){
        for(let tx2=0;tx2<WS;tx2+=2){
            const tt=worldMap[ty2][tx2]; let mmCol='#4a7c3f';
            if(G.level===2) mmCol=tt===2?'#8a251a':tt===1?'#1f1410':tt===3?'#5a3a2a':tt===4?'#ff2200':'#3d2e25'; else mmCol=tt===2?'#1a6b8a':tt===1?'#2d5a27':tt===3?'#c8a85a':'#4a7c3f';
            ctx.fillStyle=mmCol; ctx.fillRect(mmx+tx2*msc,mmy+ty2*msc,msc*2+0.5,msc*2+0.5);
        }
    }
    ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(mmx+G.player.x/TS*msc,mmy+G.player.y/TS*msc,3,0,Math.PI*2);ctx.fill();
    for(let id in G.otherPlayers) {
        if(!G.isHost && G.peer && id === G.peer.id) continue;
        const op = G.otherPlayers[id]; if(!op) continue;
        ctx.fillStyle='#aaddff'; ctx.beginPath();ctx.arc(mmx+op.x/TS*msc,mmy+op.y/TS*msc,2.5,0,Math.PI*2);ctx.fill();
    }
    for(const w of G.wilds){
        ctx.fillStyle=w.isBoss?'#ff3333':RARITY_COLOR[DINOS[w.key].rarity];
        ctx.beginPath();ctx.arc(mmx+w.x/TS*msc,mmy+w.y/TS*msc,w.isBoss?3:1.5,0,Math.PI*2);ctx.fill();
    }
    ctx.fillStyle='rgba(200,200,200,0.6)';ctx.font='8px Courier New';ctx.textAlign='center';ctx.textBaseline='top'; ctx.fillText('MAP',mmx+mm/2,mmy-10);
    if(G.encCd>0){ ctx.fillStyle='rgba(255,220,0,0.85)';ctx.font='bold 13px Courier New';ctx.textAlign='center';ctx.textBaseline='bottom'; ctx.fillText('⛨ Safe Zone',W/2,H-65); }

    if (G.pvp.cd > 0) G.pvp.cd--;
    if (G.coop.reqFrom) {
        const rw = 280, rh = 80; const rx = 20, ry = H/2 - rh/2;
        rr(rx, ry, rw, rh, 8, 'rgba(20,20,40,0.95)', '#22ccaa', 2);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 15px Courier New'; ctx.textAlign = 'center'; ctx.fillText(G.coop.reqFromName + ' requested Co-op!', rx + rw/2, ry + 25);
        btn(rx + 20, ry + 45, 110, 26, 'Deny', '#cc2222', '#fff', () => { sendCoop({ type: 'coop_reply', target: G.coop.reqFrom, sender: (G.isHost ? 'host' : G.peer.id), accept: false, name: G.username || 'Player' }); G.coop.reqFrom = null; }, '✖');
        btn(rx + 150, ry + 45, 110, 26, 'Accept', '#22ccaa', '#fff', () => {
            if(confirm("WARNING: Accepting this Co-op request will completely reset your current Solo Progress back to Level 1. Continue?")) { sendCoop({ type: 'coop_reply', target: G.coop.reqFrom, sender: (G.isHost ? 'host' : G.peer.id), accept: true, name: G.username || 'Player' }); bondWithPartner(G.coop.reqFrom, G.coop.reqFromName); } 
            else { sendCoop({ type: 'coop_reply', target: G.coop.reqFrom, sender: (G.isHost ? 'host' : G.peer.id), accept: false, name: G.username || 'Player' }); }
            G.coop.reqFrom = null;
        }, '🤝');
    } else if (G.pvp.reqFrom) {
        const rw = 280, rh = 80; const rx = W/2 - rw/2, ry = H - 240;
        rr(rx, ry, rw, rh, 8, 'rgba(20,20,40,0.95)', '#8822cc', 2);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 15px Courier New'; ctx.textAlign = 'center'; ctx.fillText(G.pvp.reqFromName + ' requested PvP!', W/2, ry + 25);
        btn(rx + 20, ry + 45, 110, 26, 'Deny', '#cc2222', '#fff', () => { sendPvP({ type: 'pvp_reply', target: G.pvp.reqFrom, sender: (G.isHost ? 'host' : G.peer.id), accept: false, name: G.username || 'Player' }); G.pvp.reqFrom = null; G.pvp.cd = 1800; }, '✖');
        btn(rx + 150, ry + 45, 110, 26, 'Accept', '#22cc22', '#fff', () => { sendPvP({ type: 'pvp_reply', target: G.pvp.reqFrom, sender: (G.isHost ? 'host' : G.peer.id), accept: true, stats: getMyBattleStats() }); startPvPBattle(G.pvp.reqFrom, G.pvp.reqFromStats, false); G.pvp.reqFrom = null; }, '✔');
    } else if (G.pvp.closeId && G.encCd <= 0) {
        const op = G.otherPlayers[G.pvp.closeId];
        if (op) {
            if (!G.coop.partnerId && !G.pvp.reqTo) {
                btn(W/2 + 20, H - 150, 140, 36, 'PvP Battle', G.pvp.cd > 0 ? '#888888' : '#cc6622', '#fff', () => {
                    if(G.pvp.cd > 0) G.pvp.msgTimer = 180; else { G.pvp.reqTo = G.pvp.closeId; sendPvP({ type: 'pvp_request', target: G.pvp.closeId, sender: (G.isHost ? 'host' : G.peer.id), name: G.username || 'Player', stats: getMyBattleStats() }); addChatMessage('System', 'PvP Request Sent!'); }
                }, '⚔️');
            }
            if (!G.coop.partnerId && !op.coopPartner && !G.coop.reqTo) {
                btn(W/2 - 160, H - 150, 140, 36, 'Add Friend', '#22ccaa', '#fff', () => {
                    if(confirm("WARNING: Sending a Co-op request will permanently reset your Solo Progress if accepted. Continue?")) { G.coop.reqTo = G.pvp.closeId; sendCoop({ type: 'coop_request', target: G.pvp.closeId, sender: (G.isHost ? 'host' : G.peer.id), name: G.username || 'Player' }); addChatMessage('System', 'Co-op Request Sent!'); }
                }, '🤝');
            }
        }
    }

    if (G.pvp.msgTimer > 0) {
        G.pvp.msgTimer--; ctx.fillStyle = '#ff4444'; ctx.shadowColor = '#000'; ctx.shadowBlur = 4; ctx.font = 'bold 16px Courier New'; ctx.textAlign = 'center'; ctx.fillText("PvP request is on cooldown!", W/2, H/2 - 60 - (180 - G.pvp.msgTimer) * 0.2); ctx.shadowBlur = 0;
    }

    btn(16, 280, 65, 40, 'Chat', '#44aa44', '#fff', () => { document.getElementById('chatBox').style.display = 'flex'; document.getElementById('chatInp').focus(); document.getElementById('chatMessages').style.pointerEvents = 'auto'; wakeChat(); }, '💬');
}

// ── BATTLE ──
function drawBattle(){
    G.btns=[]; const W=canvas.width,H=canvas.height; const b=G.battle, boss=b.isBoss;
    const bg=ctx.createLinearGradient(0,0,0,H); bg.addColorStop(0,boss?'#1a0303':'#060e1a');bg.addColorStop(1,boss?'#2a0808':'#080f1f');
    ctx.fillStyle=bg;ctx.fillRect(0,0,W,H); ctx.strokeStyle='rgba(255,255,255,0.02)';ctx.lineWidth=1;
    for(let i=0;i<W;i+=48){ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i,H);ctx.stroke();} for(let i=0;i<H;i+=48){ctx.beginPath();ctx.moveTo(0,i);ctx.lineTo(W,i);ctx.stroke();}
    ctx.fillStyle=boss?'rgba(100,15,15,0.45)':'rgba(15,50,100,0.4)'; ctx.beginPath();ctx.ellipse(W/2,H*0.62,W*0.42,H*0.13,0,0,Math.PI*2);ctx.fill();

    if(boss){
        ctx.fillStyle='rgba(150,0,0,0.3)';ctx.fillRect(0,0,W,50); ctx.strokeStyle='#ff3333';ctx.lineWidth=2;ctx.strokeRect(0,0,W,50);
        ctx.fillStyle='#ff4444';ctx.shadowColor='#ff0000';ctx.shadowBlur=20; ctx.font='bold 26px Courier New';ctx.textAlign='center';ctx.textBaseline='middle'; ctx.fillText('⚠ BOSS BATTLE ⚠',W/2,25);ctx.shadowBlur=0;
    }

    const en=DINOS[b.ek]; const eshake=b.eshake>0?(Math.random()-0.5)*10:0; const eScale = boss ? 2.8 : (b.isPvP ? 1.65 : 1.9);
    drawDino(b.ek,W*0.67+eshake,H*0.37,-1,G.tick,eScale,1, b.isPvP ? b.eoc : null);
    if (b.isPvP) drawHat(b.ehat || 'bucket', W*0.67+eshake, H*0.37 - DINOS[b.ek].sz * 1.65 * 0.55, 1.5);

    const ehPct=b.ehp/b.emhp; const ehCol=ehPct>0.5?'#44cc44':ehPct>0.25?'#cccc44':'#cc4444';
    hpBar(W*0.46,52,W*0.44,20,b.ehp,b.emhp,ehCol,`${b.ehp}/${b.emhp}`);
    if (b.isPvP && b.eshield > 0) hpBar(W*0.46, 76, W*0.44, 10, b.eshield, b.emshield, '#44aaff', 'SHIELD');
    ctx.fillStyle=RARITY_COLOR[en.rarity];ctx.font='bold 14px Courier New';ctx.textAlign='left';ctx.textBaseline='middle';
    ctx.fillText(b.isPvP ? `⚔️ ${b.ename}'s ${en.name}` : `${en.em} ${en.name}`, W*0.46+4, 42);

    const pDk=G.player.dk; const pd=pDino();
    
    if (b.isCoop) {
        const pshake=b.pshake>0?(Math.random()-0.5)*8:0; const cshake=b.cshake>0?(Math.random()-0.5)*8:0;
        // P1
        drawDino(pDk, W*0.25+pshake, H*0.4, 1, G.tick, 1.4, b.php>0?1:0.3, G.player.oc);
        drawHat(G.player.hat || 'bucket', W*0.25+pshake, H*0.4-DINOS[pDk].sz*1.4*0.55, 1.3);
        const phPct=b.php/b.pmhp; hpBar(W*0.02, H*0.5, W*0.3, 14, b.php, b.pmhp, phPct>0.5?'#44cc44':phPct>0.25?'#cccc44':'#cc4444', `${b.php}/${b.pmhp}`);
        if (b.php_shield > 0) hpBar(W*0.02, H*0.5+16, W*0.3, 8, b.php_shield, b.pmhp_shield, '#44aaff');
        ctx.fillStyle='#aaffaa'; ctx.font='bold 11px Courier New'; ctx.textAlign='left'; ctx.fillText(`P1: ${pd.em} ${pd.name}`, W*0.02, H*0.5-10);
        // P2
        drawDino(b.cpDk, W*0.25+cshake, H*0.65, 1, G.tick, 1.4, b.cpHp>0?1:0.3, b.cpOc);
        drawHat(b.cpHat || 'bucket', W*0.25+cshake, H*0.65-DINOS[b.cpDk].sz*1.4*0.55, 1.3);
        const cpPct=b.cpHp/b.cpMhp; hpBar(W*0.02, H*0.75, W*0.3, 14, b.cpHp, b.cpMhp, cpPct>0.5?'#44cc44':cpPct>0.25?'#cccc44':'#cc4444', `${b.cpHp}/${b.cpMhp}`);
        if (b.cpShield > 0) hpBar(W*0.02, H*0.75+16, W*0.3, 8, b.cpShield, Math.floor(b.cpMhp*0.4), '#44aaff');
        ctx.fillStyle='#aaddff'; ctx.font='bold 11px Courier New'; ctx.textAlign='left'; ctx.fillText(`P2: ${b.cpName}`, W*0.02, H*0.75-10);
    } else {
        const pshake=b.pshake>0?(Math.random()-0.5)*8:0;
        drawDino(pDk,W*0.28+pshake,H*0.52,1,G.tick,1.65,1, G.player.oc);
        drawHat(G.player.hat || 'bucket',W*0.28+pshake,H*0.52-DINOS[pDk].sz*1.65*0.55,1.5);
        const phPct=b.php/b.pmhp; hpBar(W*0.05,H*0.68,W*0.36,18,b.php,b.pmhp,phPct>0.5?'#44cc44':phPct>0.25?'#cccc44':'#cc4444',`${b.php}/${b.pmhp}`);
        if (b.php_shield > 0) hpBar(W*0.05,H*0.68+20,W*0.36,10,b.php_shield,Math.floor(b.pmhp*0.4),'#44aaff',`SHIELD`);
        ctx.fillStyle='#aaffaa';ctx.font='bold 13px Courier New';ctx.textAlign='left';ctx.textBaseline='middle'; ctx.fillText(`${pd.em} ${pd.name} [YOU]`,W*0.05,H*0.68-14);
    }

    const logY = b.isCoop ? H*0.83 : H*0.73; const logH = b.isCoop ? 85 : 105;
    rr(W*0.05, logY, W*0.56, logH, 8, 'rgba(0,0,0,0.8)', 'rgba(100,130,200,0.3)', 1);
    b.log.slice(0,4).forEach((line,i)=>{
        ctx.fillStyle=i===0?'#ffffff':`rgba(255,255,255,${0.55-i*0.12})`; ctx.font=`${i===0?'bold ':''}12px Courier New`; ctx.textAlign='left';ctx.textBaseline='top'; ctx.fillText(line,W*0.05+12,logY+10+i*23);
    });

    for(const dn of b.dnums){
        ctx.globalAlpha=dn.life/60; ctx.fillStyle=dn.col;ctx.font=`bold ${Math.max(10,26-dn.life*0.1)}px Courier New`; ctx.textAlign='center';ctx.textBaseline='middle'; ctx.fillText(`-${dn.val}`,dn.x,dn.y-(60-dn.life)*0.9);
    }
    ctx.globalAlpha=1;

    if(b.res === 'level2'){
        rr(W/2-165,H/2-70,330,140,12,'rgba(40,0,40,0.92)','#cc44ff',3);
        ctx.fillStyle='#cc44ff';ctx.shadowColor='#cc44ff';ctx.shadowBlur=15; ctx.font='bold 26px Courier New';ctx.textAlign='center';ctx.textBaseline='middle'; ctx.fillText('🏆 MEGALODON DEFEATED!',W/2,H/2-35);ctx.shadowBlur=0;
        ctx.fillStyle='#ddd';ctx.font='13px Courier New'; ctx.fillText('The earth shakes... Map 2 Unlocked!',W/2,H/2);
        btn(W/2-85,H/2+25,170,40,'Enter Level 2','#8822cc','#fff',()=>{
            G.level = 2; G.discovered = {utahraptor: true}; G.player.dk = 'utahraptor'; generateWorld(); spawnWilds(); spawnMega();
            G.player.x = WS/2*TS; G.player.y = WS/2*TS; G.volcanoTimer = 10800; G.volcanoActive = 0; G.hazards =[]; G.cam.x = G.player.x - canvas.width/2; G.cam.y = G.player.y - canvas.height/2;
            exitBattle(); G.playerHp = pMaxHp(); G.playerShield = 0; if (G.coop.partnerId) sendCoop({ type: 'coop_sync', level: 2 });
        },'🌋');
    } else if(!b.res){
        const bx=W*0.65, by= b.isCoop ? H*0.83 : H*0.73;
        if (b.isCoop && b.turn === 'partner') {
            ctx.fillStyle='#aaddff'; ctx.font='bold 14px Courier New'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(`⏳ Waiting for ${b.cpName}...`, bx + 65, by + 20);
        } else if (b.isCoop && b.turn === 'enemy') {
            ctx.fillStyle='#ff8844'; ctx.font='bold 14px Courier New'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(`▶ Enemy Turn...`, bx + 65, by + 20);
        } else {
            btn(bx,by,130,46,'Attack','#cc2222','#fff',doAttack,'⚔️'); if(!b.isCoop) btn(bx,by+54,130,46,'Run Away','#224422','#fff',doRun,'🏃');
            ctx.fillStyle='#44ff44'; ctx.font='bold 13px Courier New';ctx.textAlign='center';ctx.textBaseline='bottom'; ctx.fillText('▶ Your Turn',bx+65,by-6);
        }
    } else {
        const win=b.res==='win';
        rr(W/2-165,H/2-70,330,140,12,win?'rgba(0,80,0,0.92)':'rgba(80,0,0,0.92)',win?'#44ff44':'#ff4444',3);
        ctx.fillStyle=win?'#44ff44':'#ff4444';ctx.shadowColor=win?'#44ff44':'#ff4444';ctx.shadowBlur=15; ctx.font='bold 30px Courier New';ctx.textAlign='center';ctx.textBaseline='middle'; ctx.fillText(win?'🏆 VICTORY!':'💀 DEFEATED!',W/2,H/2-35);ctx.shadowBlur=0;
        ctx.fillStyle='#ddd';ctx.font='13px Courier New'; ctx.fillText(b.log[0]||'',W/2,H/2); btn(W/2-70,H/2+25,140,40,'Continue','#224488','#fff',exitBattle,'▶');
    }
}

// ── REMAINDER OF UI FILES (INDEX, SHOP, CUSTOMIZE, INTRO) ──
function drawIndex(){
    G.btns=[]; const W=canvas.width,H=canvas.height;
    ctx.fillStyle='#070d1a';ctx.fillRect(0,0,W,H);
    for(let i=0;i<60;i++){ ctx.fillStyle=`rgba(255,255,255,${0.1+((i*31)%10)*0.04})`; ctx.beginPath();ctx.arc((i*137+i*i)%W,(i*89+i*31)%H,0.8,0,Math.PI*2);ctx.fill(); }
    ctx.fillStyle='rgba(10,25,60,0.95)';ctx.fillRect(0,0,W,52); ctx.strokeStyle='rgba(100,150,255,0.3)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,52);ctx.lineTo(W,52);ctx.stroke();
    ctx.fillStyle='#6699ff';ctx.shadowColor='#4477ff';ctx.shadowBlur=15; ctx.font='bold 24px Courier New';ctx.textAlign='center';ctx.textBaseline='middle'; ctx.fillText(G.level===1?'📘 DINO INDEX (MAP 1)':'📘 DINO INDEX (MAP 2)',W/2,26);ctx.shadowBlur=0;
    
    const ak=Object.keys(DINOS).filter(k=>DINOS[k].lvl === G.level);
    ctx.fillStyle='#888';ctx.font='12px Courier New';ctx.textAlign='left';ctx.textBaseline='middle'; ctx.fillText(`${ak.filter(k=>G.discovered[k]).length}/${ak.length} Discovered`,20,26);
    const cw=Math.min(145,Math.floor((W-30)/Math.max(1,Math.floor((W-30)/145)))); const cols=Math.max(1,Math.floor((W-30)/cw)); const rows=Math.max(1,Math.floor((H-90)/130));
    const per=cols*rows; const pg=G.idxPage; const si=pg*per, ei=Math.min(si+per,ak.length);
    
    for(let i=si;i<ei;i++){
        const key=ak[i], dn=DINOS[key]; const col=(i-si)%cols, row=Math.floor((i-si)/cols); const cx=15+col*cw+cw/2, cy=68+row*130+62;
        const found=G.discovered[key], isCur=G.player.dk===key;
        rr(cx-cw/2+4,cy-58,cw-8,124,10,isCur?'rgba(20,60,20,0.95)':found?'rgba(12,25,55,0.9)':'rgba(8,12,25,0.7)',isCur?'#44ff44':found?RARITY_COLOR[dn.rarity]:'#282838',2);
        
        if(found){
            ctx.save();ctx.beginPath();ctx.rect(cx-cw/2+6,cy-55,cw-12,80);ctx.clip(); const idxOc=isCur?G.player.oc:null; drawDino(key,cx,cy-18,1,G.tick*0.5,0.65,1,idxOc);ctx.restore();
        } else { ctx.fillStyle='rgba(60,60,100,0.8)';ctx.font='40px Courier New'; ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('?',cx,cy-18); }
        ctx.fillStyle=found?RARITY_COLOR[dn.rarity]:'#444';ctx.font='bold 10px Courier New'; ctx.textAlign='center';ctx.textBaseline='bottom';ctx.fillText(found?dn.name:'???',cx,cy+44);
        
        if(found){
            ctx.fillStyle='rgba(0,0,0,0.6)';ctx.fillRect(cx-28,cy+45,56,13); ctx.fillStyle=RARITY_COLOR[dn.rarity];ctx.font='8px Courier New';ctx.fillText(dn.rarity,cx,cy+58);
            if(!isCur) btn(cx-32,cy+61,64,22,'Equip','#1a3a88','#fff',()=>{
                if(G.swapCd>0) return; const oldHpPct = Math.min(1, G.playerHp / pMaxHp()); G.player.dk=key; G.playerHp = Math.max(1, Math.floor(pMaxHp() * oldHpPct)); G.playerShield = Math.min(G.playerShield, Math.floor(pMaxHp() * 0.4)); G.swapCd = 120; 
                const ttx = Math.floor(G.player.x/TS); const tty = Math.floor(G.player.y/TS); const canSwim =['spinosaurus','pterodactyl','megalodon','mosasaurus'].includes(key); if(worldMap[tty] && worldMap[tty][ttx] === 2 && !canSwim){ G.player.x = WS/2*TS; G.player.y = WS/2*TS; }
            });
            else{ctx.fillStyle='#44ff44';ctx.font='bold 9px Courier New';ctx.textBaseline='middle';ctx.fillText('✓ ACTIVE',cx,cy+72);}
        }
    }
    const tp=Math.ceil(ak.length/per);
    if(tp>1){ if(pg>0) btn(14,H-48,80,34,'◀ Prev','#1a2a44','#fff',()=>G.idxPage--); ctx.fillStyle='#777';ctx.font='12px Courier New';ctx.textAlign='center';ctx.textBaseline='middle'; ctx.fillText(`${pg+1}/${tp}`,W/2,H-30); if(pg<tp-1) btn(W-94,H-48,80,34,'Next ▶','#1a2a44','#fff',()=>G.idxPage++); }
    btn(W-86,8,78,34,'✕ Close','#4a2010','#fff',()=>{G.state='world';G.btns=[];});
}

function drawShop(){
    G.btns=[]; const W=canvas.width,H=canvas.height;
    ctx.fillStyle='#0a0602';ctx.fillRect(0,0,W,H);
    for(let i=0;i<W;i+=60){ ctx.strokeStyle='rgba(200,150,0,0.03)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i,H);ctx.stroke(); }
    ctx.fillStyle='rgba(60,30,0,0.95)';ctx.fillRect(0,0,W,52); ctx.strokeStyle='rgba(255,200,0,0.3)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,52);ctx.lineTo(W,52);ctx.stroke();
    ctx.fillStyle='#ffd700';ctx.shadowColor='#ffaa00';ctx.shadowBlur=12; ctx.font='bold 24px Courier New';ctx.textAlign='center';ctx.textBaseline='middle'; ctx.fillText('🛒 DINO SHOP',W/2,26);ctx.shadowBlur=0;
    ctx.fillStyle='#aaddff';ctx.font='bold 18px Courier New';ctx.textAlign='left';ctx.textBaseline='middle'; ctx.fillText(`🪣 ${G.wheat}`,16,26);

    const upgs=[ {k:'hp', label:'HP Boost', desc:'+28 Max HP', icon:'❤️', base:25,col:'#aa2222', max:35}, {k:'atk',label:'Atk Power', desc:'+5 Attack', icon:'⚔️', base:30,col:'#aa6622', max:30}, {k:'spd',label:'Speed Up', desc:'+0.5 Speed', icon:'⚡', base:20,col:'#2244aa', max:25} ];
    const cw2=Math.min(240,Math.floor((W-60)/3)); const ch=240; const tw=upgs.length*cw2+(upgs.length-1)*18; const sx2=(W-tw)/2;

    upgs.forEach((upg,i)=>{
        const lv=G.player.upg[upg.k]; const maxLv=upg.max; const maxed=lv>=maxLv; const cost=upg.base+lv*15; const can=!maxed&&G.wheat>=cost; const x=sx2+i*(cw2+18), y=65;
        rr(x,y,cw2,ch,12,'rgba(18,10,4,0.97)',maxed?'#886600':can?upg.col:'#2a2020',2);
        ctx.font='36px sans-serif';ctx.textAlign='center';ctx.textBaseline='top';ctx.fillText(upg.icon,x+cw2/2,y+14);
        ctx.fillStyle='#fff';ctx.font='bold 15px Courier New';ctx.textBaseline='top';ctx.fillText(upg.label,x+cw2/2,y+62);
        ctx.fillStyle=maxed?'#ffaa00':'#ffd700';ctx.font='bold 13px Courier New'; ctx.fillText(maxed?`Lv ${lv} ✓`:`Lv ${lv}`,x+cw2/2,y+83);
        ctx.fillStyle='#aaa';ctx.font='11px Courier New';ctx.fillText(upg.desc,x+cw2/2,y+104);
        if(maxed) { ctx.fillStyle='#ffaa00';ctx.font='bold 13px Courier New';ctx.fillText('MAX UPGRADE',x+cw2/2,y+126); } else { ctx.fillStyle=can?'#aaddff':'#664422';ctx.font='bold 13px Courier New';ctx.fillText(`Cost: 🪣 ${cost}`,x+cw2/2,y+126); }
        btn(x+16,y+154,cw2-32,42,maxed?'MAX UPGRADE':'UPGRADE', maxed?'#553300':can?upg.col:'#2a2020', maxed?'#ffaa00':can?'#fff':'#665', ()=>{ if(!maxed&&G.wheat>=cost){ G.wheat-=cost;G.player.upg[upg.k]++; if(upg.k==='hp') G.playerHp += Math.floor(28 * R_MULT[pDino().rarity]); spawnParticles(x+cw2/2,y+175,'#55ccff',10); } });
        ctx.fillStyle='#111'; ctx.fillRect(x+16, y+ch-20, cw2-32, 10); ctx.fillStyle=upg.col; ctx.fillRect(x+16, y+ch-20, Math.max(0, (cw2-32)*(lv/maxLv)), 10);
    });

    const hy=65+ch+20; const hw=Math.min(420,W-60), hx=(W-hw)/2; const hhw = (hw - 10)/2;
    const scost = 40; const scan = G.wheat>=scost && G.playerShield < Math.floor(pMaxHp()*0.4);
    rr(hx,hy,hhw,80,10,'rgba(0,30,50,0.95)',scan?'#44aaff':'#1a2a3a',2);
    ctx.font='24px sans-serif';ctx.fillText('🛡️',hx+hhw/2,hy+10); ctx.fillStyle='#aaddff';ctx.font='bold 14px Courier New';ctx.fillText('+15% Shield',hx+hhw/2,hy+42); ctx.fillText(`Cost: 🪣 ${scost}`,hx+hhw/2,hy+60);
    btn(hx,hy,hhw,80,'',scan?'rgba(0,0,0,0.01)':'rgba(0,0,0,0.01)','rgba(0,0,0,0)',()=>{ const maxS = Math.floor(pMaxHp()*0.4); const addS = Math.floor(pMaxHp()*0.15); if(G.wheat>=scost && G.playerShield < maxS){G.wheat-=scost;G.playerShield=Math.min(maxS, G.playerShield+addS);spawnParticles(W/2,H/2,'#44aaff',14);} });

    const hcost = 5; const hcan = G.wheat>=hcost && G.playerHp < pMaxHp();
    rr(hx+hhw+10,hy,hhw,80,10,'rgba(0,30,0,0.95)',hcan?'#44aa44':'#1a2a1a',2);
    ctx.font='24px sans-serif';ctx.fillText('💊',hx+hhw+10+hhw/2,hy+10); ctx.fillStyle='#aaffaa';ctx.font='bold 14px Courier New';ctx.fillText('+10% Heal',hx+hhw+10+hhw/2,hy+42); ctx.fillText(`Cost: 🪣 ${hcost}`,hx+hhw+10+hhw/2,hy+60);
    btn(hx+hhw+10,hy,hhw,80,'',hcan?'rgba(0,0,0,0.01)':'rgba(0,0,0,0.01)','rgba(0,0,0,0)',()=>{ if(G.wheat>=hcost && G.playerHp < pMaxHp()){G.wheat-=hcost;G.playerHp=Math.min(pMaxHp(), G.playerHp + Math.floor(pMaxHp()*0.1));spawnParticles(W/2,H/2,'#44ff44',14);} });

    const custY = hy + 90; const custW = Math.min(320, W-60); const custX = (W - custW) / 2;
    btn(custX, custY, custW, 50, 'customize ur avatar here', '#cc5522', '#fff', () => { G.state = 'customize'; G.btns =[]; }, '🧢');
    btn(W-86,8,78,34,'✕ Close','#4a2010','#fff',()=>{G.state='world';G.btns=[];});
}

function drawCustomize(){
    G.btns=[]; const W=canvas.width,H=canvas.height;
    ctx.fillStyle='#0a0602';ctx.fillRect(0,0,W,H);
    for(let i=0;i<W;i+=60){ ctx.strokeStyle='rgba(150,50,255,0.03)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i,H);ctx.stroke(); }
    ctx.fillStyle='rgba(40,10,80,0.95)';ctx.fillRect(0,0,W,52); ctx.strokeStyle='rgba(200,100,255,0.3)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,52);ctx.lineTo(W,52);ctx.stroke();
    ctx.fillStyle='#dd88ff';ctx.shadowColor='#aa44ff';ctx.shadowBlur=12; ctx.font='bold 24px Courier New';ctx.textAlign='center';ctx.textBaseline='middle'; ctx.fillText('🧢 AVATAR CUSTOMIZATION',W/2,26);ctx.shadowBlur=0;

    const px = W/2; const py = 180; const pDk = G.player.dk;
    drawDino(pDk, px, py, 1, G.tick, 2.5, 1, G.player.oc);
    const headOff = DINOS[pDk].sz * 2.5 * 0.55; const bob = Math.sin(G.tick * 0.18) * 2.5; drawHat(G.player.hat || 'bucket', px, py - headOff + bob - 2, 2.2);

    const hats =[{ id: 'bucket', name: 'Cyber Bucket' },{ id: 'bacon', name: 'Bacon Hair' },{ id: 'dino_hood', name: 'Dino Hood' },{ id: 'smiley', name: 'Smiley Bucket' }];
    const cw = Math.min(160, (W-40)/2); const ch = 100; const sx = W/2 - cw - 10; const sy = 280;

    hats.forEach((h, i) => {
        const col = i % 2; const row = Math.floor(i / 2); const x = sx + col * (cw + 20); const y = sy + row * (ch + 15);
        const isEq = (G.player.hat || 'bucket') === h.id;
        rr(x, y, cw, ch, 10, isEq ? 'rgba(80,20,120,0.9)' : 'rgba(20,10,30,0.9)', isEq ? '#dd88ff' : '#442266', 2);
        drawHat(h.id, x + cw/2, y + 40, 1.6);
        ctx.fillStyle = isEq ? '#dd88ff' : '#ccc'; ctx.font = 'bold 12px Courier New'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(h.name, x + cw/2, y + 70);
        if(!isEq) { btn(x + 20, y + 80, cw - 40, 15, 'Equip', '#5522aa', '#fff', () => { G.player.hat = h.id; }); } else { ctx.fillStyle = '#44ff44'; ctx.font = 'bold 11px Courier New'; ctx.fillText('✓ EQUIPPED', x + cw/2, y + 88); }
    });

    const parts =['body', 'head', 'legs', 'neck', 'tail']; if(!G.custPart) G.custPart = 'body';
    const CUST_COLS =['#40c4ff', '#ff4040', '#40ff40', '#c440ff', '#aaaaaa', '#ffaa00', '#ffffff', '#111111', 'grad:#00ffee:#009999', 'grad:#ff0055:#880022', 'grad:#5cd65c:#2eb82e', 'grad:#dd88ff:#5522aa'];
    
    ctx.fillStyle = '#fff'; ctx.font = 'bold 14px Courier New'; ctx.fillText('Select Limb:', W/2, sy + 2*(ch+15));
    parts.forEach((pt, i) => { const pxx = W/2 - 165 + i*66; const isSel = G.custPart === pt; btn(pxx, sy + 2*(ch+15) + 15, 60, 26, pt, isSel ? '#8822cc' : '#333', '#fff', () => G.custPart = pt); });

    const colsY = sy + 2*(ch + 15) + 70;
    ctx.fillStyle = '#fff'; ctx.font = 'bold 14px Courier New'; ctx.fillText('Select Color:', W/2, colsY - 15);
    CUST_COLS.forEach((col, i) => {
        const rx = W/2 - 165 + (i%6)*55; const ry = colsY + Math.floor(i/6)*50;
        ctx.fillStyle = getCol(col, 18); ctx.beginPath(); ctx.arc(rx+25, ry+20, 18, 0, Math.PI*2); ctx.fill();
        if (G.player.oc[G.custPart] === col) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke(); }
        btn(rx+5, ry, 40, 40, '', 'rgba(0,0,0,0)', 'rgba(0,0,0,0)', () => { G.player.oc[G.custPart] = col; });
    });
    btn(W-86,8,78,34,'✕ Close','#4a2010','#fff',()=>{G.state='world';G.btns=[];});
}

function drawIntro(){
    G.btns=[]; const W=canvas.width,H=canvas.height;
    ctx.fillStyle='#03080f';ctx.fillRect(0,0,W,H);
    for(let i=0;i<180;i++){ const brt=0.3+((i*31+G.tick*0.2)%1)*0.5; ctx.fillStyle=`rgba(255,255,255,${brt*0.65})`; ctx.beginPath();ctx.arc((i*137+i*i)%W,(i*89+i*31)%H,0.8,0,Math.PI*2);ctx.fill(); }
    const mp=G.tick%300; if(mp<60){ ctx.strokeStyle=`rgba(255,200,100,${(60-mp)/60*0.8})`;ctx.lineWidth=2;ctx.beginPath(); ctx.moveTo(mp*8,mp*2);ctx.lineTo(mp*8-30,mp*2-10);ctx.stroke(); }
    ctx.fillStyle='rgba(0,80,20,0.12)';ctx.beginPath();ctx.ellipse(W/2,H*0.35,320,80,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#7ab648';ctx.shadowColor='#3a7a18';ctx.shadowBlur=60; ctx.font=`bold ${Math.min(62,W*0.065)}px Courier New`;ctx.textAlign='center';ctx.textBaseline='middle'; ctx.fillText('🦖 DinoWorld',W/2,H*0.3);ctx.shadowBlur=0;
    ctx.fillStyle='rgba(150,200,120,0.85)';ctx.font=`${Math.min(18,W*0.018)}px Courier New`; ctx.fillText('Open-World Survival Index',W/2,H*0.3+52);
    
    const feats=['🪣 Collect Buckets','📘 Dino Index','🌋 2 Huge Maps','🦈 Boss Raids','🛒 Upgrade Shop'];
    feats.forEach((f,i)=>{ const fx=W/2+(i-2)*Math.min(158,W/6.2), fy=H*0.5; rr(fx-54,fy-14,108,28,6,'rgba(255,255,255,0.06)','rgba(255,255,255,0.14)',1); ctx.fillStyle='rgba(255,255,255,0.75)';ctx.font='11px Courier New';ctx.textAlign='center';ctx.textBaseline='middle'; ctx.fillText(f,fx,fy); });
    
    drawDino('raptor',W*0.22,H*0.7,1,G.tick,2.2,1, G.player?.oc); drawHat(G.player?.hat || 'bucket',W*0.22,H*0.7-DINOS.raptor.sz*2.2*0.55,2.0);
    drawDino('trex',W*0.78,H*0.7,-1,G.tick,2.2,1); if(W>700) drawDino('pterodactyl',W*0.5,H*0.65,1,G.tick,1.8,0.8);
    
    const iby = H*0.78; rr(W/2-160,iby,320,56,8,'rgba(0,0,0,0.6)','rgba(255,255,255,0.1)',1);
    ctx.fillStyle='rgba(180,220,255,0.8)';ctx.font='12px Courier New';ctx.textAlign='center';ctx.textBaseline='middle'; ctx.fillText('WASD / Arrow Keys to move • Touch joystick on mobile',W/2,iby+18);
    ctx.fillStyle='rgba(150,200,150,0.7)';ctx.font='11px Courier New'; ctx.fillText('Walk into wild dinos to battle • Defeat them to collect!',W/2,iby+38);
    
    if (window.activeSave) {
        const sy = Math.max(iby + 65, H*0.85); ctx.fillStyle='#44ff44';ctx.shadowColor='#00ff00';ctx.shadowBlur=8; ctx.font=`bold ${Math.min(16,W*0.04)}px Courier New`; ctx.fillText('Your recent data was saved!',W/2,sy); ctx.fillStyle='#aaffaa'; ctx.shadowBlur=0; ctx.font=`${Math.min(12,W*0.03)}px Courier New`; ctx.fillText('You can continue where you started.',W/2,sy+18);
        btn(W/2-110, sy+28, 100, 32, 'Continue', '#228822', '#fff', () => startGame(false), '▶');
        btn(W/2+10, sy+28, 100, 32, 'Restart', '#cc2222', '#fff', () => { localStorage.removeItem('dinoworld_save'); window.activeSave = null; startGame(true); }, '🔄');
    } else {
        if(Math.floor(G.tick/28)%2){ ctx.fillStyle='rgba(255,220,80,0.95)';ctx.shadowColor='#ffaa00';ctx.shadowBlur=12; ctx.font=`bold ${Math.min(20,W*0.02)}px Courier New`; ctx.fillText('[ Click or Press Any Key to Start ]',W/2,Math.max(iby + 75, H*0.9));ctx.shadowBlur=0; }
    }
}

// ── MAIN RENDER LOOP ──
function render(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    if(G.state==='intro'){drawIntro();return;}
    
    if(G.state==='world'){
        ctx.save();
        if(G.camShake > 0) ctx.translate((Math.random()-0.5)*10, (Math.random()-0.5)*10);
        
        drawWorld(); drawWilds(); drawPlayer();

        for (let id in G.otherPlayers) {
            if (!G.isHost && G.peer && id === G.peer.id) continue; 
            const op = G.otherPlayers[id]; if (!op) continue;
            const sx = op.x - G.cam.x; const sy = op.y - G.cam.y;
            if (sx > -100 && sx < canvas.width + 100 && sy > -100 && sy < canvas.height + 100) {
                drawDino(op.dk, sx, sy, op.face, op.anim, 1.25, 0.75, op.oc); 
                const headOff = DINOS[op.dk].sz * 1.25 * 0.55; const bob = Math.sin(op.anim * 0.18) * 2.5;
                drawHat(op.hat || 'bucket', sx, sy - headOff + bob - 2, 1.1);
                if (op.coopPartner) { ctx.fillStyle='#dd88ff'; ctx.font='bold 10px Courier New'; ctx.textAlign='center'; ctx.fillText(`Bonded`, sx, sy - DINOS[op.dk].sz - 35); }
                ctx.fillStyle='#aaddff'; ctx.font='bold 12px Courier New'; ctx.textAlign='center'; ctx.fillText(op.name || 'Player', sx, sy - DINOS[op.dk].sz - 25);
            }
        }
        drawHazards(); updateDrawParticles(); ctx.restore();
        
        if(G.level===2 && G.volcanoActive > 0){
            ctx.fillStyle = 'rgba(255, 40, 0, 0.15)'; ctx.fillRect(0,0,canvas.width,canvas.height);
            ctx.fillStyle = '#ff4444'; ctx.shadowColor = '#000'; ctx.shadowBlur = 4; ctx.font = 'bold 22px Courier New'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
            ctx.fillText(`🌋 VOLCANO ERUPTION! DODGE FALLING ROCKS! ${Math.ceil(G.volcanoActive/60)}s`, canvas.width/2, 60); ctx.shadowBlur = 0;
        }
        drawHUD();
        if(G.joy.on){
            const jx=G.joy.sx,jy=G.joy.sy; ctx.fillStyle='rgba(255,255,255,0.12)';ctx.beginPath();ctx.arc(jx,jy,52,0,Math.PI*2);ctx.fill(); ctx.strokeStyle='rgba(255,255,255,0.45)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(jx,jy,52,0,Math.PI*2);ctx.stroke();
            const jl=Math.min(42,Math.hypot(G.joy.dx,G.joy.dy)); const ja=Math.atan2(G.joy.dy,G.joy.dx); ctx.fillStyle='rgba(255,255,255,0.35)';ctx.beginPath(); ctx.arc(jx+Math.cos(ja)*jl,jy+Math.sin(ja)*jl,26,0,Math.PI*2);ctx.fill();
        }
    } else if(G.state==='battle'){ drawBattle(); updateDrawParticles();
    } else if(G.state==='index'){ drawIndex();
    } else if(G.state==='shop'){ drawShop(); updateDrawParticles();
    } else if(G.state==='customize'){ drawCustomize(); }
}
