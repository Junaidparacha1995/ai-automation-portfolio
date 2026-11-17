const networkDisposers=new Set();

function disposeNetworks() {
  for(const dispose of networkDisposers)dispose();
  networkDisposers.clear();
}

function networkMarkup(names,inspectable,profileId) {
  const stations=names.map((name,index)=>{
    const label=`<b aria-hidden="true">${String(index+1).padStart(2,'0')}</b><span>${escapeHTML(name)}</span>`;
    return inspectable
      ? `<button type="button" class="machine-station inspect-step" aria-pressed="false" data-state="waiting" disabled>${label}</button>`
      : `<div class="machine-station" data-state="waiting">${label}</div>`;
  }).join('');
  const profile=workflowDiagrams[profileId];
  return `<div class="machine neural-scene" data-profile="${profileId}"${inspectable?'':' aria-hidden="true"'}>
    <div class="neural-header" aria-hidden="true"><span><i></i> ${profile.title}</span><span class="neural-status">Ready</span></div>
    <div class="neural-view"><canvas class="neural-canvas" aria-hidden="true"></canvas><span class="neural-node-label" aria-hidden="true" hidden></span></div>
    <div class="neural-event" aria-hidden="true" hidden></div>
    <div class="neural-rail"${inspectable?' role="group" aria-label="Inspect a processing step"':''}>${stations}</div>
    <p class="neural-hint" aria-hidden="true">Drag to rotate${inspectable?' · Select a node to inspect an available step':''}</p>
  </div>`;
}

function drawDiagramIcon(ctx,kind) {
  const path=points=>{
    ctx.beginPath();
    points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));
    ctx.stroke();
  };
  const box=(x,y,w,h)=>ctx.strokeRect(x,y,w,h);
  const circle=(x,y,r)=>{ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.stroke();};
  const lines=(y,x=-9,end=9)=>path([[x,y],[end,y]]);

  switch(kind){
    case 'agent':
      path([[-9,-5],[0,-10],[9,-5],[9,5],[0,10],[-9,5],[-9,-5],[0,0],[9,-5]]);
      path([[0,0],[0,10]]);
      break;
    case 'route':
      path([[-8,-3],[0,-3],[5,-8],[10,-8]]);
      path([[0,-3],[5,5],[10,5]]);
      break;
    case 'grid':
    case 'table':
    case 'mask':
      box(-10,-9,20,18);
      lines(-3,-10,10);
      lines(3,-10,10);
      path([[-3,-9],[-3,9]]);
      path([[4,-9],[4,9]]);
      if(kind==='mask')ctx.fillRect(-3,-9,7,12);
      break;
    case 'search':
      circle(-2,-2,6);
      path([[3,3],[9,9]]);
      break;
    case 'film':
      box(-11,-8,22,16);
      path([[-6,-8],[-6,8]]);
      path([[6,-8],[6,8]]);
      [-4,0,4].forEach(y=>{lines(y,-11,-6);lines(y,6,11);});
      break;
    case 'image':
    case 'room':
    case 'box':
      box(-12,-9,24,18);
      if(kind==='box'){box(-6,-6,7,11); box(3,-3,6,8);}
      else if(kind==='room'){path([[-12,-9],[-5,-4],[-5,4],[-12,9]]);path([[-5,4],[12,4]]);box(1,-6,7,7);}
      else {path([[-12,6],[-5,-2],[1,4],[6,-2],[12,4]]);circle(5,-5,1.5);}
      break;
    case 'leaf':
      ctx.beginPath();ctx.ellipse(0,-1,6,11,.7,0,Math.PI*2);ctx.stroke();
      path([[-6,8],[5,-8]]);
      break;
    case 'signal':
      path([[-11,3],[-6,3],[-3,-6],[1,8],[5,-3],[8,3],[11,3]]);
      break;
    case 'sliders':
      [-6,0,6].forEach((y,i)=>{lines(y);circle(i*5-5,y,2.5);});
      break;
    case 'inbox':
      box(-11,-7,22,14);
      path([[-11,-7],[0,1],[11,-7]]);
      break;
    case 'message':
      path([[-11,-7],[11,-7],[11,5],[-2,5],[-7,9],[-7,5],[-11,5],[-11,-7]]);
      lines(-1,-6,6);
      break;
    case 'quote':
      box(-10,-7,20,14); lines(-2,-6,5); lines(2,-6,2);
      break;
    default:
      box(-8,-10,16,20);
      lines(-4,-5,5);lines(0,-5,5);lines(4,-5,2);
  }
}

function initializeNetwork(scene,{persistent=false}={}) {
  const canvas=scene.querySelector('canvas');
  const ctx=canvas.getContext('2d');
  const stations=[...scene.querySelectorAll('.machine-station')];
  const indicator=scene.querySelector('.neural-status');
  const event=scene.querySelector('.neural-event');
  const label=scene.querySelector('.neural-node-label');
  const profileId=scene.dataset.profile;
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  let width=0,height=0,frame=0,stage=-1,finished=false,running=false,changed=0,visible=false;
  let yaw=-.12,pitch=.18,targetYaw=0,targetPitch=0,trace=[];
  let pointer=null,targets=[],hovered=-1;
  const copper=[255,160,105];

  function schedule() {
    if(ctx&&width&&!frame&&visible&&!document.hidden)frame=requestAnimationFrame(draw);
  }

  function project(x,y,z,scale) {
    const c=Math.cos(yaw),s=Math.sin(yaw);
    const depth=z*c-x*s;
    const yp=y*Math.cos(pitch)-depth*Math.sin(pitch);
    const perspective=780/(780-depth);
    return {x:width*.5+(x*c+z*s)*scale*perspective,y:height*.47+yp*scale*perspective,s:perspective};
  }

  function activeProfile(){
    if(profileId==='reinforcement-learning'&&trace[1]?.data?.controller)return workflowDiagrams.cartpole;
    return workflowDiagrams[profileId];
  }

  function chosenBranch() {
    if(profileId==='crm-automation'&&stage>=1)return trace[1]?.data?.team;
    if(profileId==='document-qa'&&stage>=3)return trace[3]?.data?.source?.match(/§\d+/)?.[0];
    return undefined;
  }

  function material(node,x,y,r,active,lit,dimmed,time){
    const opacity=dimmed?.35:1;
    ctx.save();
    ctx.globalAlpha=opacity;
    if(active||lit){
      const halo=ctx.createRadialGradient(x,y,3,x,y,r*2.6);
      halo.addColorStop(0,active?'#ffb67c68':'#e5915735');
      halo.addColorStop(1,'#e48a5100');
      ctx.fillStyle=halo;
      ctx.fillRect(x-r*2.6,y-r*2.6,r*5.2,r*5.2);
    }
    const surface=ctx.createLinearGradient(x-r,y-r,x+r,y+r);
    surface.addColorStop(0,active?'#8e4d31':lit?'#4c3026':'#342924');
    surface.addColorStop(1,'#241b17');
    ctx.fillStyle='#110e0d';
    ctx.beginPath();
    ctx.roundRect(x-r+3,y-r+5,2*r,2*r,6);
    ctx.fill();
    ctx.fillStyle=surface;
    ctx.strokeStyle=active?'#ffd5ad':lit?'#bf825e':'#8b6c5a';
    ctx.lineWidth=active?1.4:1;
    ctx.beginPath();
    ctx.roundRect(x-r,y-r,2*r,2*r,6);
    ctx.fill();
    ctx.stroke();
    ctx.save();
    ctx.translate(x,y);
    ctx.scale(r/18,r/18);
    ctx.strokeStyle=active?'#ffedda':lit?'#ffd4b7':'#ccb4a5';
    ctx.fillStyle=ctx.strokeStyle;
    ctx.lineJoin='round';
    ctx.lineCap='round';
    ctx.lineWidth=1.2;
    drawDiagramIcon(ctx,node.kind);
    ctx.restore();
    if(active&&time<520&&!motion.matches){
      const t=time/520;
      ctx.strokeStyle=`rgba(255,178,125,${(1-t)*.6})`;
      ctx.beginPath();
      ctx.roundRect(x-r-t*11,y-r-t*11,2*(r+t*11),2*(r+t*11),8);
      ctx.stroke();
    }
    ctx.restore();
  }

  function stroke(a,b,color,lineWidth) {
    ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);
    ctx.strokeStyle=color;ctx.lineWidth=lineWidth;ctx.stroke();
  }

  function draw(time) {
    frame=0;
    if(!visible||document.hidden)return;
    const elapsed=time-changed;
    const animated=!motion.matches;
    const moving=animated&&running&&elapsed<720;
    const reveal=animated&&finished&&elapsed<600&&stage===3;
    const preferredYaw=-.12+targetYaw;
    const preferredPitch=.19+targetPitch;
    yaw=animated?yaw+(preferredYaw-yaw)*.16:preferredYaw;
    pitch=animated?pitch+(preferredPitch-pitch)*.16:preferredPitch;
    const scale=Math.min(width/580,height/253);
    const p=(x,y,z)=>project(x,y,z,scale);
    const profile=activeProfile();
    const branch=chosenBranch();
    const movieCount=profileId==='movie-agent'&&stage>=2?trace[2]?.data?.length:undefined;
    const muted=(index)=>movieCount!==undefined&&index>=2&&index<=4&&index-2>=movieCount;
    const points=profile.nodes.map(node=>p(node.x,node.y,node.z));
    const routeOpen=condition=>!condition||branch===condition;
    ctx.clearRect(0,0,width,height);

    for(let z=-140;z<=140;z+=40)stroke(p(-328,115,z),p(328,115,z),'#96705a24',.75);
    for(let x=-320;x<=320;x+=40)stroke(p(x,115,-140),p(x,115,140),'#96705a24',.75);

    profile.links.forEach(([from,to,phase,condition],index)=>{
      const a=points[from],b=points[to];
      const allowed=routeOpen(condition)&&!muted(from)&&!muted(to);
      const current=allowed&&phase===stage;
      const passed=allowed&&(finished||phase<stage);
      const color=(alpha)=>`rgba(${copper.join(',')},${alpha})`;
      stroke(a,b,color(current?.8:passed?.49:condition?.14:.21),current?2.0:passed?1.5:.9);
      if(!moving||!current)return;
      const afterRouter=profileId==='crm-automation'&&phase===1&&from===1;
      const delay=afterRouter?290:index%2*60;
      const duration=phase===1&&profileId==='crm-automation'?350:510;
      const progress=Math.min(1,Math.max(0,(elapsed-delay)/duration));
      if(progress<=0)return;
      const tip={x:a.x+(b.x-a.x)*progress,y:a.y+(b.y-a.y)*progress};
      const tail=Math.max(0,progress-.26);
      const back={x:a.x+(b.x-a.x)*tail,y:a.y+(b.y-a.y)*tail};
      const streak=ctx.createLinearGradient(back.x,back.y,tip.x,tip.y);
      streak.addColorStop(0,color(0));streak.addColorStop(1,'#ffdbb5');
      stroke(back,tip,streak,3);
      ctx.beginPath();ctx.arc(tip.x,tip.y,3.4,0,2*Math.PI);ctx.fillStyle='#ffe7ce';ctx.fill();
    });

    targets=profile.nodes.map((node,index)=>{
      const {x,y,s}=points[index];
      const matching=!node.branch||node.branch===branch;
      const dimmed=muted(index)||(node.branch&&stage>=1&&!matching);
      const lit=!dimmed&&(finished||node.stage<stage);
      const current=!dimmed&&!finished&&node.stage===stage;
      const compact=node.kind==='route'||node.label.startsWith('§');
      const radius=(compact?13.5:22)*s*Math.max(.73,Math.min(scale,1.15));
      material(node,x,y,radius,current,lit,Boolean(dimmed),elapsed);
      if(index===hovered){
        ctx.beginPath();
        ctx.roundRect(x-radius-3,y-radius-3,2*radius+6,2*radius+6,8);
        ctx.strokeStyle='#ffd0ae';
        ctx.lineWidth=1.2;
        ctx.stroke();
      }
      if(reveal&&node.stage===3){
        const progress=elapsed/600;
        ctx.beginPath();
        ctx.roundRect(x-radius-progress*14,y-radius-progress*14,2*(radius+progress*14),2*(radius+progress*14),8);
        ctx.strokeStyle=`rgba(255,194,150,${(1-progress)*.6})`;
        ctx.lineWidth=1.2;
        ctx.stroke();
      }
      if(node.kind!=='route'||width>=440){
        ctx.font=`600 ${width<440?10:11.5}px system-ui,sans-serif`;
        ctx.textAlign='center';
        ctx.textBaseline='top';
        ctx.fillStyle=current?'#ffe0c4':dimmed?'#9b8479':'#dec8ba';
        const text=node.kind==='film'&&movieCount!==undefined&&muted(index)?'No match':node.label;
        ctx.fillText(text,x,y+radius+5,Math.max(42,width*.26));
      }
      return {x,y,radius:Math.max(18,radius+4),stage:node.stage,name:node.label};
    });
    if(moving||reveal||(animated&&(Math.abs(preferredYaw-yaw)+Math.abs(preferredPitch-pitch)>.002)))schedule();
  }

  function resize(){
    if(!ctx)return;
    const box=canvas.getBoundingClientRect();
    width=box.width;height=box.height;
    const ratio=Math.min(devicePixelRatio||1,1.75);
    canvas.width=Math.round(width*ratio);
    canvas.height=Math.round(height*ratio);
    ctx.setTransform(ratio,0,0,ratio,0,0);
    schedule();
  }
  function hitTest(event){
    const box=canvas.getBoundingClientRect();
    let nearest=-1, distance=Infinity;
    targets.forEach((target,index)=>{
      const offset=Math.hypot(event.clientX-box.left-target.x,event.clientY-box.top-target.y);
      if(offset<target.radius&&offset<distance){nearest=index;distance=offset}
    });
    return nearest;
  }
  function setHover(next){
    if(next===hovered)return;
    hovered=next;
    canvas.dataset.overNode=String(next>=0);
    label.hidden=next<0;
    label.textContent=targets[next]?.name||'';
    schedule();
  }
  function startDrag(event){
    if(!event.isPrimary||event.button!==0)return;
    pointer={id:event.pointerId,x:event.clientX,y:event.clientY,yaw:targetYaw,pitch:targetPitch,moved:false};
    canvas.setPointerCapture(event.pointerId);
  }
  function track(event){
    if(!pointer){
      if(event.pointerType!=='touch')setHover(hitTest(event));
      return;
    }
    if(event.pointerId!==pointer.id)return;
    const dx=event.clientX-pointer.x,dy=event.clientY-pointer.y;
    if(!pointer.moved&&Math.hypot(dx,dy)<6)return;
    pointer.moved=true;
    canvas.dataset.dragging='true';
    setHover(-1);
    targetYaw=Math.max(-.57,Math.min(.57,pointer.yaw+dx*.004));
    if(event.pointerType!=='touch')targetPitch=Math.max(-.30,Math.min(.30,pointer.pitch-dy*.004));
    schedule();
  }
  function endDrag(event){
    if(!pointer||event.pointerId!==pointer.id)return;
    const tap=!pointer.moved&&event.type==='pointerup';
    pointer=null;
    canvas.dataset.dragging='false';
    if(tap){
      const hit=hitTest(event);
      setHover(hit);
      if(hit>=0){
        const button=stations[targets[hit].stage];
        if(button instanceof HTMLButtonElement&&!button.disabled)button.click();
      }
    }
  }
  function clearHover(){
    if(!pointer)setHover(-1);
  }
  const sizeObserver=new ResizeObserver(resize);
  sizeObserver.observe(canvas);
  const viewObserver=new IntersectionObserver(([entry])=>{
    visible=entry.isIntersecting;
    if(visible)schedule();
    else {cancelAnimationFrame(frame);frame=0;}
  });
  viewObserver.observe(scene);
  canvas.addEventListener('pointerdown',startDrag);
  canvas.addEventListener('pointermove',track);
  canvas.addEventListener('pointerup',endDrag);
  canvas.addEventListener('pointercancel',endDrag);
  canvas.addEventListener('lostpointercapture',endDrag);
  canvas.addEventListener('pointerleave',clearHover);
  document.addEventListener('visibilitychange',schedule);
  motion.addEventListener('change',schedule);

  const dispose=()=>{
    cancelAnimationFrame(frame);
    sizeObserver.disconnect();
    viewObserver.disconnect();
    canvas.removeEventListener('pointerdown',startDrag);
    canvas.removeEventListener('pointermove',track);
    canvas.removeEventListener('pointerup',endDrag);
    canvas.removeEventListener('pointercancel',endDrag);
    canvas.removeEventListener('lostpointercapture',endDrag);
    canvas.removeEventListener('pointerleave',clearHover);
    document.removeEventListener('visibilitychange',schedule);
    motion.removeEventListener('change',schedule);
  };
  if(!persistent)networkDisposers.add(dispose);

  function showCaption(index){
    const item=trace[index];
    const branch=chosenBranch();
    const route=profileId==='crm-automation'&&branch;
    const note=item?(route?`${branch} route · ${item.name}`:item.name):'';
    if(event.textContent===note)return;
    event.textContent=note;
    event.hidden=!note;
    if(note)settleReadout(event);
  }

  const updateStage=(next,complete=false,animate=true,steps=[])=>{
    stage=next;
    finished=complete;
    running=next>=0&&!complete&&animate;
    trace=steps;
    setHover(-1);
    changed=performance.now();
    scene.dataset.running=String(running);
    const branch=chosenBranch();
    scene.dataset.branch=branch||'';
    indicator.textContent=complete?'Complete':next>=0?`Step ${next+1} of ${stations.length}`:'Ready';
    showCaption(next);
    stations.forEach((station,index)=>{
      station.dataset.state=complete||index<next?'done':index===next?'active':'waiting';
    });
    schedule();
  };
  updateStage.inspect=showCaption;
  return updateStage;
}
