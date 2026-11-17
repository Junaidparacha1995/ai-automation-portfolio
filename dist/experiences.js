const projectCategories = [
  {id:'automation',name:'AI agents & automation'},
  {id:'vision',name:'Computer vision'},
  {id:'learning',name:'Reinforcement learning'}
];

const cases = [
  ['crm-automation','CRM workflow','automation','OpenAI · CRM · Google Drive · Slack',['Lead routing','Draft handoff'],'An inquiry can get lost when intake, CRM entry, documentation and team notifications happen separately.','Routing depends on the inquiry, and each downstream tool needs different fields.','This sample mirrors the handoff pattern with an intake form, routing rules, a draft CRM record, a Drive note and a Slack preview.'],
  ['document-qa','Document Q&A','automation','n8n · OpenAI',['RAG','Source citations'],'Teams spend time searching long documents for one answer.','An answer needs a source readers can check. Some questions have no answer in the available material.','The project uses retrieval augmented generation. This demo searches a short sample policy, ranks passages and returns an excerpt with its source.'],
  ['airtable-agent','Airtable AI agent','automation','n8n · OpenAI · Airtable',['Schema lookup','Data queries'],'Teams need quick answers about their records without rebuilding filters for every question.','The workflow first needs to identify the right table and fields, then choose a search or aggregation.','The n8n export connects a chat agent to schema and record tools. This demo applies those operations to a small lead table.'],
  ['movie-agent','Movie recommendation','automation','n8n · OpenAI · MongoDB',['Recommendations','Ranking'],'A viewer knows the mood they want but may have no title in mind.','A recommendation needs to turn fuzzy preferences into searchable constraints and explain the match.','The n8n export uses an agent and a MongoDB aggregation tool. Here you can change filters and see how a local catalog produces a ranked result.'],
  ['appointment-automation','Appointment lifecycle','automation','Make.com · GoHighLevel · OpenAI',['Webhooks','Booking workflows'],'A confirmation, a no-show and a completed visit each need a different follow-up.','The workflow needs to branch on booking status and account for feedback after completed visits.','The Make.com blueprint routes status changes to a confirmation, a reschedule and team alert, or AI-assisted feedback and a review request. The browser demo previews these branches using sample events.'],
  ['executive-digest','Multi-location executive digest','automation','Make.com · GoHighLevel · OpenAI',['KPI reporting','Anomaly detection'],'Managers need to spot which locations slipped without reading separate CRM reports.','Aggregated totals can hide a drop at a single location.','The Make.com blueprint turns CRM contacts and opportunities into an executive summary. The browser demo calculates conversion rates and flags changes with a visible rule.'],
  ['wall-segmentation','Wall segmentation','vision','JavaScript (schematic demo)',['Segmentation','Image & video'],'Separating walls from furniture and openings by hand makes image and video editing slow.','Walls can share colors with other objects, and their visible boundaries change between frames.','The project targets pixel-level wall masks for images and video. Try a room schematic to see how a mask isolates an editable surface.'],
  ['crop-disease','Crop disease detection','vision','DenseNet121 (project) · ONNX Runtime Web (demo)',['Image classification','Plant health'],'Leaf photos can help narrow down what needs a closer inspection.','Visible symptoms can overlap, and lighting can change how the same leaf looks in a photo.','The project uses DenseNet121 for image classification. Explore how resizing and RGB normalization prepare an input, then try photo inference with the browser model.'],
  ['lab-safety','Lab safety detection','vision','Python · YOLOv8 · ONNX Runtime Web',['Object detection','PPE'],'Reviewing images or video manually makes it hard to quickly locate visible safety equipment.','Equipment varies in size and may be partly hidden. Low-confidence detections require review.','The project repository includes a YOLOv8 training notebook. The playable demo runs the third-party SafetyVision model in your browser and overlays its detections.'],
  ['classifier-uncertainty','Image classifier uncertainty','vision','Python · TensorFlow/Keras · scikit-learn',['Model evaluation','Bootstrap intervals'],'One accuracy number gives little sense of how much a model’s evaluation could vary on another sample.','Small evaluation sets can make apparently precise scores unstable.','The laryngeal-image research notebook compares MobileNet with a Random Forest on CNN features. The browser exercise uses synthetic prediction outcomes to demonstrate bootstrap intervals.'],
  ['reinforcement-learning','Grid learning & CartPole','learning','JavaScript · Canvas',['Q-learning','SARSA','CartPole'],'An agent must learn which actions work through feedback from an environment.','The agent needs to explore, and Q-learning and SARSA use different next-action targets.','This interactive grid illustrates those updates using real calculations. The CartPole demonstration uses a small physics simulation so you can compare two controllers.'],
  ['blackjack-mdp','Blackjack decision model','learning','Python · Gymnasium · NumPy',['Markov decision process','Value functions'],'An agent has to decide whether to draw or stop with incomplete information about the dealer.','An ace can change value, and a draw can improve the hand or push it over 21.','The notebook compares dynamic programming and reinforcement learning on Gymnasium Blackjack. The browser exercise calculates the expected outcomes for hit and stand with an infinite-deck model.']
].map(([id,name,category,tech,tags,problem,challenge,approach]) => ({id,name,category,tech,tags,problem,challenge,approach}));

const deliverables = {
  'wall-segmentation':'A reusable wall mask for recoloring or editing images and video. The demo lets you toggle a sample overlay.',
  'crop-disease':'A ranked list of supported crop and condition labels from a leaf photo, with model scores.',
  'document-qa':'An answer paired with the source passage so a reader can verify it.',
  'airtable-agent':'A table summary, a record count, or a list filtered to the request.',
  'movie-agent':'A ranked shortlist that fits the viewer’s genre and time limit, with a reason for the top pick.',
  'reinforcement-learning':'A learned policy you can test on the sample grid, plus a CartPole controller comparison.',
  'crm-automation':'A routed inquiry, a sample CRM record and Drive note, and a Slack draft addressed to the right team.',
  'appointment-automation':'A status-specific SMS draft, with a team alert or review request where the booking calls for one.',
  'executive-digest':'A sample briefing with lead and win totals, conversion changes by location, and follow-up suggestions.',
  'classifier-uncertainty':'A calculated accuracy estimate and 95% bootstrap interval for a synthetic evaluation set.',
  'blackjack-mdp':'A comparison of hit and stand values, with dealer probabilities and the chance of busting on the next draw.',
  'lab-safety':'An annotated photo with boxes, equipment labels, and model scores for review.'
};

const appointmentEvents = {
  Confirmed:{route:'Confirm booking',sms:'Hi Jordan, your appointment is confirmed for Tuesday at 10:30 a.m.'},
  'No-show':{route:'Recover missed visit',sms:'Hi Jordan, we missed you today. Reply to choose another time.',teamAlert:'Offer the customer a new appointment.'},
  Completed:{route:'Request a review',feedback:'The team answered my questions and everything went smoothly.',sms:'Thanks for visiting, Jordan. Would you share your feedback in a review?'}
};

const appointmentExperience = {
  mode:'Sample workflow · drafts only',
  controls:() => options('status','Appointment status',Object.keys(appointmentEvents)),
  build(data) {
    const status=data.get('status');
    const {route,sms,teamAlert,feedback}=appointmentEvents[status];
    const followUp=feedback?{sampleFeedback:feedback,sampleSentiment:'Positive'}:teamAlert?{teamAlert}:{appointment:'Tuesday at 10:30 a.m.'};
    return [
      step('Receive sample webhook','Read a booking status update.',{appointmentId:'DEMO-104',customer:'Jordan',status}),
      step('Select a branch',`The ${status.toLowerCase()} status selects ${route.toLowerCase()}.`,{route}),
      step('Prepare the follow-up',feedback?'Use the preset sentiment example from the completed visit.':teamAlert?'Flag the missed visit for the team.':'Include the appointment time in the confirmation.',followUp),
      step('Preview the SMS draft',sms,{SMS:sms,...(teamAlert?{teamAlert}:{}),delivery:'Draft only'})
    ];
  }
};

const blackjackDeck=[1,2,3,4,5,6,7,8,9,10,10,10,10];
const blackjackHands={'Hard 12':[12,false],'Hard 16':[16,false],'Soft 18 (ace + 7)':[18,true],'Hard 20':[20,false]};

function addBlackjackCard(total,soft,card) {
  total+=card;
  if(soft&&total>21)return [total-10,false];
  if(!soft&&card===1&&total<=11)return [total+10,true];
  return [total,soft];
}

function evaluateBlackjack(total,soft,upCard) {
  const dealerMemo=new Map();
  function dealerOutcomes(dealerTotal,dealerSoft) {
    const key=`${dealerTotal}/${dealerSoft}`;
    if(dealerMemo.has(key))return dealerMemo.get(key);
    const probabilities=Array(6).fill(0); // 17 through 21, then bust
    if(dealerTotal>=17)probabilities[Math.min(5,dealerTotal-17)]=1;
    else for(const card of blackjackDeck) {
      dealerOutcomes(...addBlackjackCard(dealerTotal,dealerSoft,card)).forEach((chance,index)=>{
        probabilities[index]+=chance/blackjackDeck.length;
      });
    }
    dealerMemo.set(key,probabilities);
    return probabilities;
  }

  const dealer=dealerOutcomes(...addBlackjackCard(0,false,upCard));
  const stand=playerTotal=>dealer[5]+dealer.slice(0,5).reduce((score,chance,index)=>score+chance*Math.sign(playerTotal-index-17),0);
  const playerMemo=new Map();
  function hit(playerTotal,playerSoft) {
    const key=`${playerTotal}/${playerSoft}`;
    if(playerMemo.has(key))return playerMemo.get(key);
    const value=blackjackDeck.reduce((score,card)=>{
      const [nextTotal,nextSoft]=addBlackjackCard(playerTotal,playerSoft,card);
      return score+(nextTotal>21?-1:Math.max(stand(nextTotal),hit(nextTotal,nextSoft)));
    },0)/blackjackDeck.length;
    playerMemo.set(key,value);
    return value;
  }
  const busts=blackjackDeck.filter(card=>addBlackjackCard(total,soft,card)[0]>21).length;
  return {dealer,stand:stand(total),hit:hit(total,soft),bustChance:busts/blackjackDeck.length};
}

const blackjackExperience = {
  mode:'Browser simulation · points only',
  controls:() => options('hand','Player hand',Object.keys(blackjackHands)) + options('dealer','Dealer upcard',['6','10','2','Ace']),
  build(data) {
    const hand=data.get('hand'), upcard=data.get('dealer');
    const [total,soft]=blackjackHands[hand];
    const scores=evaluateBlackjack(total,soft,upcard==='Ace'?1:Number(upcard));
    const difference=scores.hit-scores.stand;
    const action=Math.abs(difference)<1e-10?'Tie':difference>0?'Hit':'Stand';
    const summary=action==='Tie'?'Hit and stand have the same expected score.':`${action} has the higher expected score for ${hand.toLowerCase()} against ${upcard}.`;
    return [
      step('Read the game state','Use the player total, ace status and visible dealer card.',{hand,usableAce:soft,dealerUpcard:upcard}),
      step('Model the dealer','Combine possible dealer draws. The dealer stands on 17 or higher.',Object.fromEntries(scores.dealer.map((chance,index)=>[index===5?'Bust':String(17+index),percent(chance)]))),
      step('Value hit and stand','Count +1 for a win, 0 for a tie and −1 for a loss. After a hit, later decisions use the better action.',{hit:scores.hit.toFixed(3),stand:scores.stand.toFixed(3),bustOnNextDraw:percent(scores.bustChance)}),
      step('Compare decisions',summary,{higherValueAction:action,expectedHit:scores.hit.toFixed(3),expectedStand:scores.stand.toFixed(3)})
    ];
  }
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
const percent = rate => `${(rate*100).toFixed(1)}%`;
const rows = list => list.map(item => typeof item === 'string' ? item : JSON.stringify(item)).join('\n');
const commonWords = new Set('a an the is are can i my how for what and of do are when where to be on does will it in after'.split(' '));
const keywords = value => [...new Set((value.toLowerCase().match(/[a-z]+/g)||[]).filter(word=>!commonWords.has(word)).map(word=>word.replace(/s$/,'')))];

const digestWeeks = {
  'Week 1':[['North',80,24],['Central',56,19],['South',72,15]],
  'Week 2':[['North',90,24],['Central',60,22],['South',83,11]],
  'Week 3':[['North',92,30],['Central',65,18],['South',75,18]]
};
const reportWeeks={'Week 3':'Week 2','Week 2':'Week 1'};
const digestLocations=['All locations',...digestWeeks['Week 1'].map(([location])=>location)];

const classifierPaths={'MobileNet':.8,'CNN features + Random Forest':.75};

function bootstrapAccuracy(outcomes,resamples) {
  let seed=24319;
  const sampleIndex=()=>Math.floor(((seed=(Math.imul(1664525,seed)+1013904223)>>>0)/4294967296)*outcomes.length);
  const estimates=Array.from({length:resamples},()=>{
    let correct=0;
    for(let draw=0;draw<outcomes.length;draw++)correct+=outcomes[sampleIndex()];
    return correct/outcomes.length;
  }).sort((a,b)=>a-b);
  return {lower:estimates[Math.floor(.025*(resamples-1))],upper:estimates[Math.ceil(.975*(resamples-1))]};
}

const experiences = {
  'appointment-automation':appointmentExperience,
  'blackjack-mdp':blackjackExperience,
  'executive-digest': {
    mode:'Sample CRM report · draft only',
    controls:() => options('week','Reporting period',Object.keys(reportWeeks)) + options('location','Locations',digestLocations),
    build(data) {
      const week=data.get('week'), location=data.get('location');
      const previousWeek=reportWeeks[week];
      const matchesLocation=([name])=>location==='All locations'||location===name;
      const reportRows=period=>digestWeeks[period].filter(matchesLocation).map(([location,leads,wins])=>({location,leads,wins}));
      const current=reportRows(week), previous=reportRows(previousWeek);
      const comparisons=current.map(({location,leads,wins})=>{
        const baseline=previous.find(row=>row.location===location);
        const rate=wins/leads;
        return {location,rate,change:rate-baseline.wins/baseline.leads};
      });
      const leads=current.reduce((total,row)=>total+row.leads,0), wins=current.reduce((total,row)=>total+row.wins,0);
      const conversion=percent(wins/leads);
      const flagged=comparisons.filter(row=>row.change<=-.05);
      const changes=comparisons.map(({location,rate,change})=>({location,conversion:percent(rate),change:`${change>=0?'+':''}${(change*100).toFixed(1)} percentage points`}));
      const flaggedLocations=flagged.map(row=>row.location);
      const followUp=flaggedLocations.length?flaggedLocations.map(name=>`Review leads that did not convert in ${name}.`):['Keep monitoring conversion over the next reporting period.'];
      return [
        step('Read sample CRM data',`Use ${week} and compare with ${previousWeek}.`,{location,current,previous}),
        step('Calculate conversion','Divide won opportunities by leads in the same sample cohort.',{leads,wonOpportunities:wins,conversion,byLocation:changes}),
        step('Flag declines','Flag a location when conversion falls by five percentage points or more.',{flaggedLocations,comparisons:changes}),
        step('Draft the executive digest',`${week} · ${location}: ${wins} wins from ${leads} leads (${conversion}). ${flaggedLocations.length?`Review ${flaggedLocations.join(', ')}.`:'No locations met the decline rule.'}`,{followUp,delivery:'Draft only'})
      ];
    }
  },
  'classifier-uncertainty': {
    mode:'Synthetic evaluation · research explainer',
    controls:() => options('model','Model pathway',Object.keys(classifierPaths)) + options('size','Evaluation set size',['20','80']),
    build(data) {
      const model=data.get('model'), size=Number(data.get('size'));
      const accuracy=classifierPaths[model], correct=Math.round(size*accuracy), resamples=1000;
      const outcomes=Array.from({length:size},(_,index)=>Number(index<correct));
      const {lower,upper}=bootstrapAccuracy(outcomes,resamples);
      const visual=`<figure class="uncertainty-interval" aria-hidden="true">
        <div class="uncertainty-track" style="--lower:${lower*100}%;--upper:${upper*100}%;--estimate:${accuracy*100}%"><span></span><i></i></div>
        <figcaption><span>0%</span><span>Accuracy</span><span>100%</span></figcaption>
      </figure>`;
      return [
        step('Load synthetic predictions','Use generated correct and incorrect outcomes for an evaluation exercise.',{model,predictions:size,correct}),
        step('Measure observed accuracy',`${correct} of ${size} synthetic predictions are correct.`,{accuracy:percent(accuracy)}),
        step('Resample the outcomes','Draw a new sample of the same size with replacement and repeat 1,000 times.',{resamples,drawsPerResample:size}),
        {...step('Read the bootstrap interval',`The central 95% of resampled accuracy estimates span ${percent(lower)} to ${percent(upper)}. Try changing the sample size.`,{observedAccuracy:percent(accuracy),lowerBound:percent(lower),upperBound:percent(upper),data:'Synthetic'}),visual}
      ];
    }
  },
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
