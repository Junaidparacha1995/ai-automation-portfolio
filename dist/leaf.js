let leafModel;
function mountLeafClassifier() {
  demo.querySelector('.workbench').insertAdjacentHTML('afterend',`<section class="detector-panel leaf-detector">
    <h4>Classify a leaf photo</h4>
    <p>The ConCaPlant model ranks possible PlantVillage classes on your device.</p>
    <label for="leaf-file">Choose a leaf photo</label>
    <input id="leaf-file" type="file" accept="image/jpeg,image/png,image/webp">
    <button type="button" class="sample-photo">Run tomato leaf sample</button>
    <p class="sample-credit">Sample label: healthy tomato. <a href="https://github.com/spMohanty/PlantVillage-Dataset/blob/master/raw/color/Tomato___healthy/000146ff-92a4-4db6-90ad-8fce2ae4fddd___GH_HL%20Leaf%20259.1.JPG">PlantVillage</a> · <a href="https://creativecommons.org/licenses/by-sa/3.0/">CC BY-SA 3.0</a></p>
    <canvas id="leaf-preview" aria-label="Uploaded leaf preview" hidden></canvas>
    <button type="button" class="run" id="leaf-run" disabled>Analyze photo</button>
    <p id="leaf-status" role="status">Choose a JPG, PNG or WebP under 10 MB.</p>
    <ol id="leaf-predictions"></ol>
    <p><a href="https://huggingface.co/innocent11105/plantvillage-mobilenetv3" target="_blank" rel="noopener">ConCaPlant model · MIT license ↗</a></p>
  </section>`);
  const input=demo.querySelector('#leaf-file');
  const preview=demo.querySelector('#leaf-preview');
  const button=demo.querySelector('#leaf-run');
  const status=demo.querySelector('#leaf-status');
  const predictions=demo.querySelector('#leaf-predictions');
  const sample=demo.querySelector('.leaf-detector .sample-photo');
  const showStage=mountModelScene(status,['Photo','Normalize','Classify','Rank']);
  if(location.protocol==='file:'){
    status.innerHTML='Start Start-portfolio.bat and open the <a href="http://127.0.0.1:4173/#crop-disease">local portfolio</a> to analyze a photo.';
    input.disabled=true;
    sample.disabled=true;
    return;
  }
  let pixelTensor,version=0;
  async function loadPhoto(file){
    const current=++version;
    showStage(-1);
    button.disabled=true;
    preview.hidden=true;
    pixelTensor=null;
    predictions.replaceChildren();
    if(!file)return;
    if(file.size>10*1024*1024 || !['image/jpeg','image/png','image/webp'].includes(file.type)){
      status.textContent='Choose a JPG, PNG or WebP under 10 MB.';
      return;
    }
    try {
      showStage(0);
      status.textContent='Reading the image…';
      const bitmap=await createImageBitmap(file);
      if(current!==version || !input.isConnected){bitmap.close();return;}
      const size=224, side=Math.min(bitmap.width,bitmap.height);
      preview.width=preview.height=size;
      const context=preview.getContext('2d',{willReadFrequently:true});
      context.drawImage(bitmap,(bitmap.width-side)/2,(bitmap.height-side)/2,side,side,0,0,size,size);
      bitmap.close();
      const rgba=context.getImageData(0,0,size,size).data;
      const plane=size*size, mean=[.485,.456,.406], deviation=[.229,.224,.225];
      pixelTensor=new Float32Array(plane*3);
      for(let channel=0;channel<3;channel++){
        for(let pixel=0;pixel<plane;pixel++)pixelTensor[channel*plane+pixel]=(rgba[pixel*4+channel]/255-mean[channel])/deviation[channel];
      }
      preview.hidden=false;
      showStage(1,false,false);
      status.textContent='Photo cropped and normalized. Ready to analyze.';
      button.disabled=false;
    } catch {
      if(current===version)status.textContent='This image could not be opened. Choose another photo.';
    }
  }
  input.addEventListener('change',()=>loadPhoto(input.files[0]));
  mountPhotoSample(input,sample,status,button,loadPhoto,'plantvillage-tomato.jpg');
  button.addEventListener('click',async()=>{
    const current=version;
    const pixels=pixelTensor;
    button.disabled=true;
    predictions.replaceChildren();
    showStage(2);
    status.textContent='Loading the classifier…';
    try {
      if(!leafModel)leafModel=Promise.all([
        import('./runtime/ort.wasm.min.mjs'),
        fetch('./runtime/leaf-classes.json').then(response=>{
          if(!response.ok)throw Error('Class labels are unavailable.');
          return response.json();
        })
      ]).then(async ([ort,labels])=>{
        ort.env.wasm.numThreads=1;
        ort.env.wasm.wasmPaths=new URL('./runtime/',location.href).href;
        const model=await ort.InferenceSession.create('./runtime/leaf-model.onnx',{executionProviders:['wasm'],externalData:[{path:'model.onnx.data',data:new URL('./runtime/model.onnx.data',location.href).href}]});
        return {ort,labels,model};
      }).catch(error=>{leafModel=null;throw error;});
      const {ort,labels,model}=await leafModel;
      if(current!==version || !input.isConnected)return;
      status.textContent='Classifying the normalized image…';
      const output=await model.run({[model.inputNames[0]]:new ort.Tensor('float32',pixels,[1,3,224,224])});
      if(current!==version || !input.isConnected)return;
      const logits=output[model.outputNames[0]].data;
      const max=Math.max(...logits);
      const scores=Array.from(logits,value=>Math.exp(value-max));
      const total=scores.reduce((sum,value)=>sum+value,0);
      scores.map((score,index)=>({label:labels[index],score:score/total})).sort((a,b)=>b.score-a.score).slice(0,3).forEach(({label,score})=>{
        const row=document.createElement('li');
        row.textContent=`${label.replace(/_+/g,' ')} · ${(score*100).toFixed(1)}% model score`;
        predictions.append(row);
      });
      status.textContent='Top 3 predictions for this photo.';
      settleReadout(predictions,true);
      showStage(3,true);
    } catch(error) {
      console.error(error);
      if(current===version){
        showStage(1,false,false);
        status.textContent='Could not run the classifier. Try again or reload the portfolio.';
      }
    } finally {
      if(current===version && input.isConnected)button.disabled=false;
    }
  });
}
