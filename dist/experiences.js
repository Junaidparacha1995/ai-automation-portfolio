const cases = [
  ['wall-segmentation','Wall segmentation','Computer vision','Separating walls from furniture and openings by hand makes image and video editing slow.','Walls can share colors with other objects, and their visible boundaries change between frames.','The project targets pixel-level wall masks for images and video. Try a room schematic to see how a mask isolates an editable surface.'],
  ['crop-disease','Crop disease detection','Deep learning','Leaf photos can help narrow down what needs a closer inspection.','Visible symptoms can overlap, and lighting can change how the same leaf looks in a photo.','The project uses DenseNet121 for image classification. Explore a labeled sample and how resizing and RGB normalization prepare a model input.'],
  ['document-qa','Document Q&A','n8n · OpenAI · RAG','Teams spend time searching long documents for one answer.','An answer needs a source readers can check. Some questions have no answer in the available material.','The project uses retrieval augmented generation. This demo searches a short sample policy, ranks passages and returns an excerpt with its source.'],
  ['airtable-agent','Airtable AI agent','n8n · OpenAI · Airtable','Teams need quick answers about their records without rebuilding filters for every question.','The workflow first needs to identify the right table and fields, then choose a search or aggregation.','The n8n export connects a chat agent to schema and record tools. This demo applies those operations to a small lead table.'],
  ['movie-agent','Movie recommendation','n8n · OpenAI · MongoDB','A viewer knows the mood they want but may have no title in mind.','A recommendation needs to turn fuzzy preferences into searchable constraints and explain the match.','The n8n export uses an agent and a MongoDB aggregation tool. Here you can change filters and see how a local catalog produces a ranked result.'],
  ['reinforcement-learning','Reinforcement learning','Q-learning · SARSA · CartPole','An agent must learn which actions work through feedback from an environment.','The agent needs to explore, and Q-learning and SARSA use different next-action targets.','This interactive grid illustrates those updates using real calculations. The CartPole demonstration uses a small physics simulation so you can compare two controllers.'],
  ['crm-automation','CRM workflow','OpenAI · CRM · Drive · Slack','An inquiry can get lost when intake, CRM entry, documentation and team notifications happen separately.','Routing depends on the inquiry, and each downstream tool needs different fields.','This sample mirrors the handoff pattern with an intake form, routing rules, a draft CRM record, a Drive note and a Slack preview.'],
  ['lab-safety','Lab safety detection','YOLOv8 · computer vision','Reviewing images or video manually makes it hard to quickly locate visible safety equipment.','Equipment varies in size and may be partly hidden. Low-confidence detections require review.','The project repository includes a YOLOv8 training notebook. The playable demo runs the third-party SafetyVision model in your browser and overlays its detections.']
].map(([id,name,tech,problem,challenge,approach]) => ({id,name,tech,problem,challenge,approach}));

const deliverables = {
  'wall-segmentation':'A reusable wall mask for recoloring or editing images and video. The demo lets you toggle a sample overlay.',
  'crop-disease':'A ranked list of supported crop and condition labels from a leaf photo, with model scores.',
  'document-qa':'An answer paired with the source passage so a reader can verify it.',
  'airtable-agent':'A table summary, a record count, or a list filtered to the request.',
  'movie-agent':'A ranked shortlist that fits the viewer’s genre and time limit, with a reason for the top pick.',
  'reinforcement-learning':'A learned policy you can test on the sample grid, plus a CartPole controller comparison.',
  'crm-automation':'A routed inquiry, a sample CRM record and Drive note, and a Slack draft addressed to the right team.',
  'lab-safety':'An annotated photo with boxes, equipment labels, and model scores for review.'
};

const leadExamples = {
  sales:{lead:'Alex Morgan',message:'Could we schedule a demo and get a pricing quote for our team?'},
  support:{lead:'Jordan Lee',message:'Our dashboard is broken and shows an error when we open it.'}
};

const policy = [
  {section:'§1 · Standard returns', text:'Unused items may be returned within 30 days of delivery.'},
  {section:'§2 · Refunds', text:'Refunds are issued to the original payment method within 5 business days after inspection.'},
  {section:'§3 · Damaged delivery', text:'Report damaged or defective deliveries to Support within 72 hours. Include photos of the packaging.'},
  {section:'§4 · Digital goods', text:'Downloaded digital products are excluded from standard returns.'}
];
const catalog = [
  ['Arrival','Sci-fi',116,9,'Thoughtful first-contact story'],
  ['Moon','Sci-fi',97,8,'Quiet science fiction about isolation'],
  ['Gattaca','Sci-fi',106,8,'A thoughtful story about identity'],
  ['Paddington 2','Comedy',103,9,'Warm, lighthearted adventure'],
  ['School of Rock','Comedy',109,8,'Upbeat comedy with music'],
  ['The Secret Life of Walter Mitty','Adventure',114,8,'An optimistic journey of discovery'],
  ['The Princess Bride','Adventure',98,9,'Playful fantasy adventure']
].map(([title,genre,minutes,score,reason]) => ({title,genre,minutes,score,reason}));
const leads = [
  {name:'Northstar Studio',status:'New inquiry'},
  {name:'Willow & Co.',status:'Awaiting reply'},
  {name:'Juniper Labs',status:'Contacted'},
  {name:'Maple Works',status:'New inquiry'}
];
const step = (name, detail, data) => ({name,detail,data});
const options = (name,label,values) => `<label>${label}<select name="${name}">${values.map(value=>`<option>${escapeHTML(value)}</option>`).join('')}</select></label>`;
const rows = list => list.map(item => typeof item === 'string' ? item : JSON.stringify(item)).join('\n');
const commonWords = new Set('a an the is are can i my how for what and of do are when where to be on does will it in after'.split(' '));
const keywords = value => [...new Set((value.toLowerCase().match(/[a-z]+/g)||[]).filter(word=>!commonWords.has(word)).map(word=>word.replace(/s$/,'')))];

const experiences = {
  'movie-agent': {
    mode:'Local catalog demo',
    controls:() => options('genre','What are you in the mood for?',['Sci-fi','Comedy','Adventure']) + options('limit','Maximum runtime',['120','100','90']),
    build(data) {
      const genre=data.get('genre'), limit=Number(data.get('limit'));
      const found=catalog.filter(movie=>movie.genre===genre && movie.minutes<=limit);
      const ranked=[...found].sort((a,b)=>b.score-a.score || a.minutes-b.minutes);
      return [
        step('Read preferences','Capture the selected genre and time budget.',{genre, maximumMinutes:limit}),
        step('Build catalog query','Filter by genre and runtime, then sort by catalog score.',{genre, runtimeAtMost:limit, sort:'Score descending, then shortest runtime'}),
        step('Search sample catalog',`Matched ${found.length} of ${catalog.length} titles.`,found.map(({title,minutes,score})=>({title,minutes,score}))),
        step('Recommend a title',ranked.length?`${ranked[0].title} · ${ranked[0].minutes} min. ${ranked[0].reason}. It ranks first by the sample catalog score.`:'No titles fit. Try allowing more time.',ranked.map(({title,score,reason})=>({title,score,reason})))
      ];
    }
  },
  'airtable-agent': {
    mode:'Local table demo',
    controls:() => options('request','Choose a request',['Needs follow-up','Count by status','Show all records']),
    build(data) {
      const request=data.get('request');
      const matching=request==='Needs follow-up'?leads.filter(lead=>lead.status!=='Contacted'):leads;
      const result=request==='Count by status'?Object.fromEntries([...new Set(leads.map(lead=>lead.status))].map(status=>[status, leads.filter(lead=>lead.status===status).length])):matching;
      return [
        step('Receive request','Read the selected request.',{request}),
        step('Inspect table','Identify the fields available for the operation.',{table:'Demo leads',fields:['name','status']}),
        step('Query sample rows',request==='Needs follow-up'?'Exclude contacted leads.':'Read the full sample table.',matching),
        step('Build the answer',request==='Count by status'?'Group the rows by status.':`Return ${matching.length} matching records.`,result)
      ];
    }
  },
  'document-qa': {
    mode:'Local retrieval demo',
    controls:() => '<label>Ask the sample returns policy<input required maxlength="180" name="question" value="How long do refunds take?"></label><details><summary>Read the sample policy</summary><ul>'+policy.map(({section,text})=>`<li><strong>${section}</strong> · ${text}</li>`).join('')+'</ul></details>',
    build(data) {
      const question=data.get('question').trim();
      const terms=keywords(question);
      const matches=policy.map(p=>({...p,score:keywords(p.section+' '+p.text).filter(word=>terms.includes(word)).length})).filter(p=>p.score>0).sort((a,b)=>b.score-a.score);
      const best=matches[0];
      return [
        step('Read question','Capture the question for retrieval.',{question}),
        step('Extract search terms','Normalize words and drop common filler words.',terms),
        step('Rank passages','Rank matching sections by the number of shared terms.',matches),
        step('Cite a passage',best?best.text:'The sample policy has no passage matching those terms. Try a question about returns, refunds or damaged delivery.',best?{source:best.section,excerpt:best.text}:[])
      ];
    }
  },
  'crm-automation': {
    mode:'Local workflow demo',
    controls:() => `<fieldset class="scenario-picker"><legend>Load an example</legend>
       <button type="button" data-example="sales" aria-pressed="true">Sales inquiry</button>
       <button type="button" data-example="support" aria-pressed="false">Support request</button>
      </fieldset><label class="lead-field">Lead name<input name="lead" required maxlength="60" value="${escapeHTML(leadExamples.sales.lead)}"></label>
      <label class="inquiry-field">Inquiry<textarea name="message" required maxlength="250" rows="3">${escapeHTML(leadExamples.sales.message)}</textarea></label>`,
    build(data) {
      const lead=data.get('lead').trim(), message=data.get('message').trim();
      const routes=[['Support','support','bug','broken','error'],['Partnerships','partner','partnership','collaborate'],['Sales','sale','demo','pricing','quote','buy','inquiry']];
      const words=keywords(message);
      const match=routes.map(([name,...terms])=>({name,term:terms.find(term=>words.includes(term))})).find(route=>route.term);
      const team=match?.name||'Manual review';
      const record={name:lead,owner:team,status:'New inquiry'};
      return [
        step('Accept inquiry','Capture the lead name and message.',{lead,message}),
        step('Route the lead',match?`The word “${match.term}” matched the ${team} rule.`:'No routing rule matched. Send to manual review.',{team, matchedWord:match?.term||null}),
        step('Prepare CRM and Drive','Create a sample record and a note from the same input.',{CRM:record,Drive:{title:`Inquiry from ${lead}`,body:message}}),
        step('Draft Slack message',`New inquiry from ${lead} → ${team}`,{destination:'#'+team.toLowerCase().replace(' ','-'),message:`New inquiry from ${lead}. Assigned to ${team}. “${message}”`})
      ];
    }
  }
};
experiences['wall-segmentation'] = {
  mode:'Interactive mask schematic',
  controls:() => options('room','Choose a schematic',['Living room','Bedroom','Office']),
  build(data) {
    const room=data.get('room');
    const surfaces = {'Living room':[[1,1,13,5],[1,6,3,2],[10,6,4,2]],'Bedroom':[[1,1,13,4],[1,5,5,3],[12,5,2,3]],'Office':[[1,1,13,5],[1,6,2,2],[12,6,2,2]]};
    const wall=surfaces[room];
    const pixels=Array.from({length:150},(_,i)=>wall.some(([x,y,w,h])=>i%15>=x&&i%15<x+w&&Math.floor(i/15)>=y&&Math.floor(i/15)<y+h));
    const diagram=`<div class="pixel-mask" role="img" aria-label="A room grid with wall cells highlighted">${pixels.map(on=>`<i class="${on?'wall':''}"></i>`).join('')}</div><label class="mask-switch"><input type="checkbox" checked> Show wall overlay</label>`;
    return [
      step('Load room',room+' schematic selected.',{width:15,height:10}),
      step('Define regions','Use the known wall coordinates of this schematic.',wall),
      step('Build binary mask','Each grid cell is either wall or background.',{wallCells:pixels.filter(Boolean).length,totalCells:pixels.length}),
      {...step('Overlay the mask','Toggle the mask to compare the wall cells with the input grid.',{legend:{highlight:'Wall'}}),visual:diagram}
    ];
  }
};
experiences['crop-disease'] = {
  mode:'Model input walkthrough',
  controls:() => options('leaf','Choose a labeled teaching sample',['Leaf with spots','Even green leaf','Yellowing leaf']),
  build(data) {
    const samples={'Leaf with spots':['#4b7437','#8a5429','#ad8342','#477038'],'Even green leaf':['#417c40','#54904b','#688e43','#487b3e'],'Yellowing leaf':['#9f983d','#bdaa4d','#877432','#526f32']};
    const kind=data.get('leaf'), colors=samples[kind];
    const rgb=colors.map(color=>color.slice(1).match(/../g).map(hex=>parseInt(hex,16)));
    const normalized=rgb.map(pixel=>pixel.map(channel=>Number((channel/255).toFixed(3))));
    return [
      step('Select sample','Choose a labeled, synthetic color patch.',{sample:kind}),
      {...step('Read RGB channels','Extract three channel values for each example pixel.',rgb),visual:`<div class="leaf-samples" aria-label="Four sample colors">${colors.map(color=>`<i style="--swatch:${color}"></i>`).join('')}</div>`},
      step('Normalize pixels','Divide each color value by 255 to illustrate input preparation.',normalized),
      step('Inspect model input','The values below are calculated from your sample. This example ends before DenseNet121 inference.',{sampleLabel:kind,normalizedRGB:normalized})
    ];
  }
};

function gridTraining(algorithm) {
  const values=Array.from({length:6},()=>[0,0]);
  const action=state=>values[state][1]>values[state][0]?1:0;
  let seed=311;
  const random=()=>((seed=(Math.imul(1664525,seed)+1013904223)>>>0)/4294967296);
  const policy=state=>random()<.25?Number(random()>=.5):action(state);
  for(let episode=0;episode<70;episode++){
    let state=0, move=policy(state);
    for(let turn=0;turn<25;turn++){
      const next=Math.min(5,Math.max(0,state+(move?1:-1)));
      const reward=next===5?1:-.04, nextAction=policy(next);
      const target=reward+(next===5?0:.9*(algorithm==='SARSA'?values[next][nextAction]:Math.max(...values[next])));
      values[state][move]+=.25*(target-values[state][move]);
      if(next===5)break;
      state=next;
      move=algorithm==='SARSA'?nextAction:policy(state);
    }
  }
  const path=[0];
  for(let turn=0;turn<12&&path.at(-1)!==5;turn++)path.push(Math.max(0,path.at(-1)+(action(path.at(-1))?1:-1)));
  return {values:values.slice(0,5).map(([left,right],cell)=>({cell,left:+left.toFixed(3),right:+right.toFixed(3)})),path};
}
function runCartPole(controller) {
  let x=0, velocity=0, angle=.12, angularVelocity=0;
  const angles=[];
  for(let frame=0;frame<150;frame++){
    const force=controller==='Balance controller'?Math.max(-10,Math.min(10,42*angle+10*angularVelocity+x+2*velocity)):0;
    const sine=Math.sin(angle), cosine=Math.cos(angle);
    const temp=(force+.05*angularVelocity**2*sine)/1.1;
    const angularAcceleration=(9.8*sine-cosine*temp)/(.5*(4/3-.1*cosine**2/1.1));
    x+=.02*velocity; angle+=.02*angularVelocity;
    velocity+=.02*(temp-.05*angularAcceleration*cosine/1.1);
    angularVelocity+=.02*angularAcceleration;
    angles.push(Math.round(angle*180/Math.PI));
    if(Math.abs(angle)>.35||Math.abs(x)>2.4)break;
  }
  return angles;
}
experiences['reinforcement-learning'] = {
  mode:'Browser simulation',
  controls:() => options('algorithm','Choose a learning rule or controller',['Q-learning','SARSA','Balance controller','No controller']),
  build(data) {
    const algorithm=data.get('algorithm');
    if(algorithm.endsWith('controller')){
      const angles=runCartPole(algorithm);
      return [
        step('Set starting state','Start with a slightly tilted pole.',{startAngleDegrees:7}),
        step('Choose a controller',algorithm==='No controller'?'Apply zero force.':'Use the pole angle and cart motion to choose a correction.',{controller:algorithm}),
        step('Advance the physics','Integrate the cart and pole motion at 50 steps per second.',angles.filter((_,i)=>i%10===0)),
        {...step('Review the outcome',`The pole ran for ${(angles.length/50).toFixed(2)} seconds of the 3-second trial.`,{frames:angles.length,finalAngleDegrees:angles.at(-1)}),visual:`<div class="cartpole" aria-hidden="true"><i style="--pole-angle:${angles.at(-1)}deg"></i></div>`}
      ];
    }
    const {values,path}=gridTraining(algorithm);
    return [
      step('Set the environment','Move left or right on a six-cell track. Reaching cell 5 gives a reward.',{start:0,goal:5}),
      step('Choose update target',algorithm==='SARSA'?'Use the value of the next action the policy selects.':'Use the largest value available in the next state.',{algorithm}),
      step('Train the policy','Run 70 seeded training episodes and update the action values.',values),
      step('Test the learned policy',`Greedy path: ${path.join(' → ')}.`,{path,reachedGoal:path.at(-1)===5})
    ];
  }
};
