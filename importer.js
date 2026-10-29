/* Optional import helpers. All saved data stays in the existing local recipe store. */
(function(){
const $=s=>document.querySelector(s);
const msg=t=>{const el=$('#rv-import-status');if(el)el.textContent=t};
const clean=s=>(s||'').replace(/\r/g,'').replace(/\u00a0/g,' ').trim();
const plain=s=>clean(s.replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&nbsp;/g,' '));
function lines(s){return clean(s).split('\n').map(x=>x.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').trim()).filter(Boolean)}
function extractText(text,source=''){
 const raw=clean(text); const all=lines(raw);
 const ingIdx=all.findIndex(s=>/^(zutaten|ingredients)(?:\s*\(.*\))?\s*:?$/i.test(s));
 const stepIdx=all.findIndex(s=>/^(zubereitung|anleitung|zubereitungsschritte|instructions|method|directions|so geht.s)\s*:?$/i.test(s));
 const ing=ingIdx>=0?all.slice(ingIdx+1,stepIdx>ingIdx?stepIdx:undefined):all.filter(s=>/^\d+(?:[,.\/]\d+)?\s*(?:g|kg|ml|l|EL|TL|Stk|Stück|Prise|Tasse|Dose|Zehe|Bund|cups?|tbsp|tsp)\b/i.test(s));
 const steps=stepIdx>=0?all.slice(stepIdx+1):[];
 const heading=all.find(s=>!/^https?:\/\//.test(s)&&!/^(zutaten|ingredients|zubereitung|anleitung)$/i.test(s)&&s.length<110)||'Importiertes Rezept';
 const portions=(raw.match(/(?:portionen|portions|servings|ergibt)\s*:?\s*(\d+)/i)||raw.match(/(\d+)\s*(?:portionen|portions|servings)/i)||[])[1];
 const minutes=(raw.match(/(?:gesamtzeit|zubereitungszeit|dauer|total time|zeit)\s*:?\s*(\d+)\s*(?:min|Minuten)/i)||[])[1];
 return {title:heading,ingredients:ing.join('\n'),steps:steps.join('\n'),portions:portions||'2',minutes:minutes||'30',source};
}
function flattenRecipe(o,source){
 if(Array.isArray(o))o=o.find(x=>typeof x==='object'&&/recipe/i.test(JSON.stringify(x['@type']||'')))||o[0];
 if(o&&o['@graph'])return flattenRecipe(o['@graph'],source);
 if(o&&o.mainEntity&&typeof o.mainEntity==='object')return flattenRecipe(o.mainEntity,source);
 if(!o||!/recipe/i.test(JSON.stringify(o['@type']||'')))return null;
 const ingredients=o.recipeIngredient||o.ingredients||[]; const steps=o.recipeInstructions||[];
 const stepText=(arr)=>arr.flatMap(v=>typeof v==='string'?[v]:v?.itemListElement?stepText(v.itemListElement):v?.text?[v.text]:[]);
 const duration=(o.totalTime||o.prepTime||o.cookTime||'').match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
 const mins=duration?(Number(duration[1]||0)*60+Number(duration[2]||0)):30;
 const yieldNum=parseInt(Array.isArray(o.recipeYield)?o.recipeYield[0]:o.recipeYield)||2;
 return {title:plain(o.name||'Importiertes Rezept'),ingredients:(Array.isArray(ingredients)?ingredients:[ingredients]).map(plain).join('\n'),steps:stepText(Array.isArray(steps)?steps:[steps]).map(plain).join('\n'),portions:String(yieldNum),minutes:String(mins),source};
}
function jsonLd(html,source){
 const doc=new DOMParser().parseFromString(html,'text/html');
 for(const node of doc.querySelectorAll('script[type="application/ld+json"]')){
 try{const r=flattenRecipe(JSON.parse(node.textContent),source);if(r&&r.ingredients)return r}catch(_e){}
 }
 return null;
}
async function remoteRecipe(url){
 const target=new URL(url);if(!/^https?:$/.test(target.protocol))throw new Error('Bitte eine HTTP(S)-Adresse eingeben.');
 msg('Website wird ausgelesen …');
 const endpoint='https://api.allorigins.win/raw?url='+encodeURIComponent(target.href);
 try{const response=await fetch(endpoint,{signal:AbortSignal.timeout(17000)});if(!response.ok)throw Error('HTTP '+response.status);
 const html=await response.text(); const structured=jsonLd(html,url);if(structured)return structured;
 const doc=new DOMParser().parseFromString(html,'text/html');doc.querySelectorAll('script,style,header,footer,nav').forEach(n=>n.remove());
 return extractText(doc.querySelector('article')?.innerText||doc.body?.textContent||'',url);
 }catch(e){
 msg('Direkter Abruf nicht möglich. Alternativen werden geprüft …');
 const markdownUrl='https://r.jina.ai/'+url;
 try{const r=await fetch(markdownUrl,{signal:AbortSignal.timeout(18000)});if(!r.ok)throw Error('HTTP '+r.status);return extractText(await r.text(),url)}
 catch{throw new Error('Die Website blockiert den Abruf. Kopiere den Rezepttext in das Textfeld oder lade einen Screenshot hoch.')} }
}
let loaded;
async function ocr(file){
 if(!file?.type.startsWith('image/'))throw Error('Bitte ein Bild (JPG, PNG oder WebP) auswählen.');
 msg('Texterkennung wird geladen … (Internetverbindung nötig)');
 if(!loaded)loaded=new Promise((resolve,reject)=>{if(window.Tesseract)return resolve(window.Tesseract);const script=document.createElement('script');script.src='https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';script.onload=()=>resolve(window.Tesseract);script.onerror=()=>reject(Error('Texterkennung konnte nicht geladen werden.'));document.head.appendChild(script)});
 const T=await loaded;msg('Bild wird ausgelesen …');
 const worker=await T.createWorker(['deu','eng'],1,{logger:m=>{if(m.status==='recognizing text')msg('Texterkennung: '+Math.round((m.progress||0)*100)+' %')}});
 try{const result=await worker.recognize(file);return extractText(result.data.text)}finally{await worker.terminate()}
}
function apply(x){window.recipeModal?.();let form=$('#recipe-form');if(!form)throw Error('Rezepteditor nicht gefunden');
 for(const k of ['title','ingredients','steps','portions','minutes','source'])if(x[k]!==undefined&&form.elements.namedItem(k))form.elements.namedItem(k).value=x[k];
 msg('');P.toast('Bitte Zutaten und Schritte prüfen und speichern.');}
function show(){P.modal(`<div class="modal-head"><div><div class="eyebrow">SMART IMPORT</div><h2>Rezept importieren</h2></div><button class="iconbutton" data-close>${P.ico('x')}</button></div>
 <p class="muted">Rezept von einer Website, aus einem Foto oder aus kopiertem Text übernehmen. Anschließend kannst du alles vor dem Speichern bearbeiten.</p>
 <div class="stack" style="margin-top:18px"><div class="field"><label>Website-Adresse</label><input class="input" id="rv-url" type="url" placeholder="https://www.beispiel.de/rezept"><button type="button" class="button primary" id="rv-from-url" style="margin-top:8px">Website auslesen</button></div>
 <div class="field"><label>Rezeptfoto oder Screenshot</label><input class="input" id="rv-photo" type="file" accept="image/*"><button type="button" class="button" id="rv-from-image" style="margin-top:8px">Bild auslesen (OCR)</button></div>
 <div class="field"><label>Alternativ Rezepttext einfügen</label><textarea id="rv-text" rows="6" placeholder="Rezeptname\nZutaten\n200 g Mehl\n…\nZubereitung\n…"></textarea><button type="button" class="button" id="rv-from-text" style="margin-top:8px">Text übernehmen</button></div></div>
 <p id="rv-import-status" role="status" class="muted" style="font-size:13px;margin-top:16px"></p><p class="muted" style="font-size:12px">Hinweis: Die Bildanalyse wird im Browser ausgeführt (Texterkennung über Tesseract.js). Zum Laden der Bibliothek ist Internet nötig. Website-Import nutzt externe Abrufdienste; die URL wird an diese übertragen. Manche Seiten sperren den Zugriff.</p>`)}
document.addEventListener('click',async e=>{if(e.target.closest('[data-smart-import]'))return show();const button=e.target.closest('#rv-from-url,#rv-from-image,#rv-from-text');if(!button)return;button.disabled=true;try{let v;if(button.id==='rv-from-url')v=await remoteRecipe($('#rv-url').value);if(button.id==='rv-from-image')v=await ocr($('#rv-photo').files[0]);if(button.id==='rv-from-text'){if(!$('#rv-text').value.trim())throw Error('Bitte zuerst Rezepttext einfügen.');v=extractText($('#rv-text').value)}if(!v.ingredients&&!v.steps)msg('Es wurden keine klaren Zutaten/Schritte erkannt. Im Editor kannst du den Text korrigieren.');apply(v)}catch(err){msg('Fehler: '+err.message)}finally{button.disabled=false}});
window.recipeSmartImport={show,extractText,flattenRecipe,jsonLd};
})();
