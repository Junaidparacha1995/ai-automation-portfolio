const list=document.getElementById('project-list');
const demo=document.getElementById('demo');
const grid=document.getElementById('project-grid');
const categoryGroups=projectCategories.map(category=>({...category,projects:cases.filter(project=>project.category===category.id)}));
const escapeHTML=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const github='https://github.com/Junaidparacha1995';
const workflows=github+'/n8n_Advanced_Workflows/blob/main/';
const blueprints=github+'/10-Make.com-ai-business-automation-blueprints/blob/main/';
const sourceLinks={
  'airtable-agent':workflows+'Airtable/AI%20Agent%20to%20chat%20with%20Airtable%20and%20analyze%20data.json',
  'movie-agent':workflows+'Database_and_Storage/MongoDB%20AI%20Agent%20-%20Intelligent%20Movie%20Recommendations.json',
  'appointment-automation':blueprints+'03_appointment_lifecycle_orchestrator.blueprint.json',
  'executive-digest':blueprints+'10_multi_location_executive_digest.blueprint.json',
  'classifier-uncertainty':github+'/laryngeal-cnn-uncertainty-quantification',
  'blackjack-mdp':github+'/blackjack-mdp-reinforcement-learning',
  'lab-safety':github+'/yolov8-lab-safety-detection'
};
// Pin line links to the revision that defines these demo implementations.
const demoSource=github+'/ai-automation-portfolio/blob/305daf36754eaef309157201df7c3e0c9b3ffebb/dist/';
const demoSourceLinks={
  'crm-automation':demoSource+'experiences.js#L272-L293',
  'document-qa':demoSource+'experiences.js#L256-L271',
  'wall-segmentation':demoSource+'experiences.js#L295-L311',
  'crop-disease':demoSource+'leaf.js#L2',
  'reinforcement-learning':demoSource+'experiences.js#L329-L389'
};
let selected=cases.findIndex(project=>project.id==='crm-automation'),runToken=0,stageTimer;
const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)');
let arrivalObserver;
let readingObserver;

function projectTags(project) {
  return `<ul class="project-tags" aria-label="Tags">${project.tags.map(tag=>`<li>${escapeHTML(tag)}</li>`).join('')}</ul>`;
}

function projectSourceLink(project) {
  const original=sourceLinks[project.id];
  const label=original?'GitHub source':'Demo code on GitHub';
  return `<a class="project-source" href="${original||demoSourceLinks[project.id]}" target="_blank" rel="noopener" aria-label="${label} for ${escapeHTML(project.name)}">${label} <span aria-hidden="true">↗</span></a>`;
}

function settleReadout(element,data=false){
  if(reduceMotion.matches)return;
  element.getAnimations().forEach(animation=>animation.cancel());
  const frames=data
    ? [{backgroundColor:'rgba(242,138,86,.26)'},{backgroundColor:'transparent'}]
    : [{clipPath:'inset(0 0 44% 0)',opacity:.82},{clipPath:'inset(0)',opacity:1}];
  element.animate(frames,{duration:data?430:210,easing:'cubic-bezier(.18,.76,.28,1)'});
}

function focusSection(element,region=element){
  arrivalObserver?.disconnect();
  if(!element.matches('a[href],button,input,select,textarea,[tabindex]'))element.tabIndex=-1;
  element.focus({preventScroll:true});
  region.scrollIntoView({block:'start',behavior:reduceMotion.matches?'instant':'smooth'});
  if(reduceMotion.matches)return;
  const heading=element.querySelector('h2,h3,h4')||element;
  arrivalObserver=new IntersectionObserver(([entry],observer)=>{
    if(!entry.isIntersecting||entry.intersectionRatio<.65)return;
    observer.disconnect();
    if(reduceMotion.matches)return;
    heading.getAnimations().forEach(effect=>effect.cancel());
    heading.animate([
      {opacity:.78,translate:'0 7px'},
      {opacity:1,translate:'0 0'}
    ],{duration:300,easing:'cubic-bezier(.16,1,.3,1)'});
  },{threshold:.65,rootMargin:'0px 0px -12% 0px'});
  arrivalObserver.observe(heading);
}

function mountModelScene(anchor,names) {
  anchor.insertAdjacentHTML('beforebegin',networkMarkup(names,false,cases[selected].id));
  return initializeNetwork(anchor.previousElementSibling);
}

function mountPhotoSample(input,sample,status,run,loadPhoto,filename) {
  let inputVersion=0;
  input.addEventListener('change',()=>inputVersion++);
  sample.addEventListener('click',async()=>{
    const version=++inputVersion;
    sample.disabled=true;
    status.textContent='Loading sample photo…';
    try{
      const response=await fetch('./samples/'+filename);
      if(!response.ok)throw Error('Sample photo could not be loaded.');
      const bytes=await response.arrayBuffer();
      if(version!==inputVersion||!input.isConnected)return;
      input.value='';
      await loadPhoto(new File([bytes],filename,{type:'image/jpeg'}));
      if(version===inputVersion&&input.isConnected&&!run.disabled)run.click();
    }catch(error){
      if(version===inputVersion&&input.isConnected)status.textContent=error.message;
    }finally{
      sample.disabled=false;
    }
  });
}

function formatOutput(value) {
  if(Array.isArray(value)){
    return value.length?`<ul class="output-list">${value.map(item=>`<li>${formatOutput(item)}</li>`).join('')}</ul>`:'<p>No matches.</p>';
  }
  if(value&&typeof value==='object'){
    return `<dl class="output-fields">${Object.entries(value).map(([key,item])=>{
      const label=key.replace(/([a-z])([A-Z])/g,'$1 $2').replace(/^./,letter=>letter.toUpperCase());
      return `<div><dt>${escapeHTML(label)}</dt><dd>${formatOutput(item)}</dd></div>`;
    }).join('')}</dl>`;
  }
  return escapeHTML(value===null?'None':String(value));
}

function mountExperience(experience) {
  const lab=demo.querySelector('.workbench');
  const form=lab.querySelector('form');
  const scene=lab.querySelector('.machine');
  const stageNames=workflowDiagrams[scene.dataset.profile].stages;
  const showStage=initializeNetwork(scene);
  const buttons=[...lab.querySelectorAll('.inspect-step')];
  const status=lab.querySelector('.workbench-status');
  const detail=lab.querySelector('.step-detail');
  const resultButton=lab.querySelector('.jump-result');
  const runButton=form.querySelector('[type=submit]');
  const skipButton=form.querySelector('.skip-run');
  const examples=[...form.querySelectorAll('[data-example]')];
  let trace=[],active=-1,visibleStep=-1;

  function showStep(index) {
    if(index===visibleStep)return;
    visibleStep=index;
    const item=trace[index];
    showStage.inspect(index);
    buttons.forEach((button,i)=>button.setAttribute('aria-pressed',String(i===index)));
    const raw=JSON.stringify(item.data,null,2);
    detail.innerHTML=`<div class="stage-explanation"><h4>${escapeHTML(item.name)}</h4><p>${escapeHTML(item.detail)}</p></div>
      <div class="stage-output">${item.visual||''}${formatOutput(item.data)}</div>
      <details class="stage-data"><summary>View details</summary><pre tabindex="0" aria-label="Step data">${escapeHTML(raw)}</pre></details>
      ${index===trace.length-1?'<a class="result-contact" href="https://github.com/Junaidparacha1995" target="_blank" rel="noopener">Discuss a similar project <span aria-hidden="true">↗</span></a>':''}`;
    settleReadout(detail.querySelector('.stage-explanation h4'));
    settleReadout(detail.querySelector('.stage-output'),true);
  }
  function finish() {
    clearTimeout(stageTimer);
    active=-1;
    showStage(trace.length-1,true,true,trace);
    buttons.forEach(button=>button.disabled=false);
    runButton.disabled=false;
    runButton.textContent='Run again';
    skipButton.hidden=true;
    status.textContent='Run complete. Select any step to inspect its data.';
    showStep(trace.length-1);
    resultButton.hidden=false;
  }
  function advance(index,token) {
    if(token!==runToken)return;
    if(index===trace.length){finish();return;}
    active=index;
    showStage(index,false,true,trace);
    buttons[index].disabled=false;
    status.textContent=`Step ${index+1} of ${trace.length} · ${trace[index].name}`;
    showStep(index);
    stageTimer=setTimeout(()=>advance(index+1,token),760);
  }
  buttons.forEach((button,i)=>button.addEventListener('click',()=>showStep(i)));
  resultButton.addEventListener('click',()=>{
    showStep(trace.length-1);
    focusSection(detail);
  });
  skipButton.addEventListener('click',()=>{finish();runButton.focus()});
  form.addEventListener('submit',event=>{
    event.preventDefault();
    for(const control of form.querySelectorAll('[required]')){
      if(!control.value.trim()){
        status.textContent='Fill in the required fields to run this demo.';
        control.focus();
        return;
      }
    }
    trace=experience.build(new FormData(form));
    visibleStep=-1;
    resultButton.hidden=true;
    buttons.forEach((button,i)=>{
      button.querySelector('span').textContent=trace[i].name;
      button.disabled=true;
    });
    runButton.disabled=true;
    skipButton.hidden=false;
    const token=++runToken;
    if(scene.getBoundingClientRect().bottom>innerHeight)scene.scrollIntoView({block:'nearest',behavior:reduceMotion.matches?'instant':'smooth'});
    if(reduceMotion.matches){finish();return}
    advance(0,token);
  });
  function invalidateRun(){
    if(!trace.length)return;
    runToken++;
    clearTimeout(stageTimer);
    active=-1;
    trace=[];
    visibleStep=-1;
    resultButton.hidden=true;
    showStage(-1);
    buttons.forEach((button,index)=>{
      button.disabled=true;
      button.setAttribute('aria-pressed','false');
      button.querySelector('span').textContent=stageNames[index];
    });
    runButton.disabled=false;
    runButton.textContent='Run demo';
    skipButton.hidden=true;
    status.textContent='Input changed. Run again to see the new result.';
    detail.innerHTML='<h4>Ready for a new run</h4><p>Run the updated input to see the new result.</p>';
  }
  form.addEventListener('input',()=>{
    examples.forEach(button=>button.setAttribute('aria-pressed','false'));
    invalidateRun();
  });
  examples.forEach(button=>button.addEventListener('click',()=>{
    const example=leadExamples[button.dataset.example];
    form.elements.lead.value=example.lead;
    form.elements.message.value=example.message;
    examples.forEach(candidate=>candidate.setAttribute('aria-pressed',String(candidate===button)));
    invalidateRun();
  }));
  detail.addEventListener('change',event=>{
    if(event.target.matches('.mask-switch input'))detail.querySelector('.pixel-mask').classList.toggle('mask-off',!event.target.checked);
  });
}

function render() {
  disposeNetworks();
  const oldStory=demo.querySelector('.case-story');
  if(oldStory)readingObserver?.unobserve(oldStory);
  const project=cases[selected];
  const experience=experiences[project.id];
  const profileId=project.id==='crop-disease'?'crop-preprocess':project.id;
  const category=projectCategories.find(group=>group.id===project.category);
  document.getElementById('project-count').textContent=`${String(selected+1).padStart(2,'0')} / ${cases.length}`;
  list.querySelector('.active')?.classList.remove('active');
  list.querySelector('[aria-current]')?.removeAttribute('aria-current');
  const selectedLink=list.querySelector(`a[href="#${project.id}"]`);
  selectedLink.classList.add('active');
  selectedLink.setAttribute('aria-current','true');
  selectedLink.closest('details').open=true;
  demo.innerHTML=`<div class="case-heading"><div class="case-title"><p>${escapeHTML(category.name)}</p><h3 tabindex="-1">${escapeHTML(project.name)}</h3></div>
    <div class="case-actions"><button class="jump-demo" type="button">Jump to demo <span aria-hidden="true">↓</span></button>${projectSourceLink(project)}</div></div>
    <div class="case-meta"><p><strong>Tech stack</strong> ${escapeHTML(project.tech)}</p>${projectTags(project)}</div>
    <dl class="case-story">
      <div><dt>Problem statement</dt><dd>${project.problem}</dd></div>
      <div><dt>How I solved it</dt><dd>${project.approach}</dd><dd class="case-constraint">${project.challenge}</dd></div>
      <div><dt>End product</dt><dd>${deliverables[project.id]}</dd></div>
    </dl>
    ${experience?`<section class="workbench" aria-label="${project.name} interactive demo">
      <div class="workbench-header"><h4>Try it yourself</h4><span>${experience.mode}</span></div>
      <form class="workbench-form${project.id==='crm-automation'?' lead-routing-form':''}">${experience.controls()}<div class="workbench-actions"><button class="run" type="submit">Run demo</button><button class="skip-run" type="button" hidden>Show result now</button></div></form>
      ${networkMarkup(workflowDiagrams[profileId].stages,true,profileId)}
      <div class="workbench-feedback"><p class="workbench-status" role="status">Run a sample to see each step and its output.</p><button class="jump-result" type="button" hidden>View result <span aria-hidden="true">↓</span></button></div>
      <div class="step-detail" tabindex="-1"><h4>How the result is generated</h4><p>After the run, select a step to inspect its data.</p></div>
    </section>`:'<div class="demo-stage"></div><div id="process-view"></div>'}
    <div class="demo-foot"><span>${experience?'Runs on sample data in your browser':'Image inference on your device'}</span></div>`;
  if(experience)mountExperience(experience);
  else mountDetector();
  if(project.id==='crop-disease')mountLeafClassifier();
  const target=demo.querySelector('.workbench,.detector-panel');
  target.tabIndex=-1;
  demo.querySelector('.jump-demo').addEventListener('click',()=>focusSection(target));
  readingObserver?.observe(demo.querySelector('.case-story'));
}

function mountPageMotion() {
  if(reduceMotion.matches)return;
  readingObserver=new IntersectionObserver((entries,observer)=>{
    for(const entry of entries){
      if(!entry.isIntersecting)continue;
      observer.unobserve(entry.target);
      if(!reduceMotion.matches)entry.target.dataset.visible='true';
    }
  },{threshold:.18});
  document.querySelectorAll('.hero-shell,.hero-copy,.hero-agent,.intro,.section-heading,.project-card,.contact-inner')
    .forEach(section=>readingObserver.observe(section));
}
function fromHash(scroll=true) {
  const index=cases.findIndex(item=>location.hash==='#'+item.id);
  if(index<0)return false;
  if(index!==selected||!demo.firstElementChild){
    runToken++;
    clearTimeout(stageTimer);
    selected=index;
    render();
  }else{
    list.querySelector('[aria-current=true]').closest('details').open=true;
  }
  if(scroll)demo.scrollIntoView({behavior:'instant'});
  return true;
}
document.querySelector('.agent-projects').innerHTML=categoryGroups.map(({id,name,projects})=>
  `<li><a href="#category-${id}"><strong>${escapeHTML(name)}</strong><span>${projects.length} demos <span aria-hidden="true">↗</span></span></a></li>`).join('');
list.innerHTML=categoryGroups.map(({name,projects})=>
  `<details class="picker-group" name="demo-categories">
    <summary><span>${escapeHTML(name)}</span><span class="picker-count" aria-hidden="true">${projects.length}</span></summary>
    <ul>${projects.map(project=>`<li><a class="project-option" href="#${project.id}">${escapeHTML(project.name)}</a></li>`).join('')}</ul>
  </details>`).join('');
grid.innerHTML=categoryGroups.map(({id,name,projects})=>
  `<section class="project-category" id="category-${id}" aria-labelledby="category-${id}-title">
    <h3 id="category-${id}-title">${escapeHTML(name)} <small>${projects.length} demos</small></h3>
    <div class="project-grid">${projects.map(project=>`<article class="project-card">
      <h4>${escapeHTML(project.name)}</h4><p>${escapeHTML(project.problem)}</p>
      <p class="card-stack"><strong>Tech stack</strong> ${escapeHTML(project.tech)}</p>${projectTags(project)}
      <div class="card-actions"><a href="#${project.id}" aria-label="Try the ${escapeHTML(project.name)} demo">Try the demo <span aria-hidden="true">↗</span></a>${projectSourceLink(project)}</div>
    </article>`).join('')}</div>
  </section>`).join('');
document.addEventListener('click',event=>{
  if(event.defaultPrevented||event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
  const link=event.target.closest('a[href^="#"]');
  if(!link||link.target||link.hasAttribute('download'))return;
  const fragment=link.getAttribute('href');
  const project=cases.some(item=>'#'+item.id===fragment);
  const section=project?demo:document.getElementById(fragment.slice(1));
  if(!section)return;
  event.preventDefault();
  if(fragment!==location.hash)history.pushState(null,'',fragment);
  if(project){
    fromHash(false);
    focusSection(demo.querySelector('h3'),demo);
    return;
  }
  const heading=fragment==='#top'?section.querySelector('.brand'):section.querySelector('h2,h3');
  focusSection(heading||section,section);
});
window.addEventListener('hashchange',()=>fromHash());
mountPageMotion();
if(cases.some(item=>location.hash==='#'+item.id))fromHash();
else render();
