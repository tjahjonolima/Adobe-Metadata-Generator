// --- PWA install ---
if ('serviceWorker' in navigator) navigator.serviceWorker.register('service-worker.js');

// --- Config (AI endpoint placeholder) ---
// Saat backend AI siap, ganti API_URL ke endpoint kamu.
const API_URL = "https://6c043263-9ae7-4cbc-a50b-079d1bea7ee3-00-1kqd6tf9p3518.sisko.replit.dev/analyze-image"; // placeholder

const filesEl = document.getElementById('files');
const presetEl = document.getElementById('preset');
const runBtn = document.getElementById('run');
const resEl = document.getElementById('results');
const histEl = document.getElementById('history');
const copyBtn = document.getElementById('copy');
const csvBtn = document.getElementById('csv');

let currentRows = [];
let history = JSON.parse(localStorage.getItem('amg_history')||"[]");

renderHistory();

runBtn.onclick = async ()=>{
  const files = [...filesEl.files];
  if(!files.length){ alert("Select images first"); return; }
  resEl.innerHTML = "Processing…";
runBtn.onclick = async ()=>{
  const files = [...filesEl.files];
  if(!files.length){ alert("Select images first"); return; }

  resEl.innerHTML = "Processing…";
  const rows = [];

  for (const file of files) {
    const formData = new FormData();
    formData.append("image", file);
    formData.append("preset", presetEl.value);

    try {
      const resp = await fetch(API_URL, {
        method: "POST",
        body: formData
      });

      if (!resp.ok) {
        throw new Error("Server error: " + resp.status);
      }

      const data = await resp.json();
      rows.push(data);

    } catch (err) {
      console.error(err);
      alert("Failed to process: " + file.name);
    }
  }

  currentRows = rows;
  render(rows);
  saveHistory(rows);
};
};

copyBtn.onclick = ()=>{
  if(!currentRows.length) return;
  const txt = currentRows.map(r=>`${r.filename}\n${r.title}\n${r.description}\n${r.keywords.join(", ")}`).join("\n\n");
  navigator.clipboard.writeText(txt);
  alert("Copied");
};

csvBtn.onclick = ()=>{
  if(!currentRows.length) return;
  const header = "filename,title,description,keywords\n";
  const body = currentRows.map(r=>[
    esc(r.filename), esc(r.title), esc(r.description), esc(r.keywords.join(", "))
  ].join(",")).join("\n");
  const blob = new Blob([header+body],{type:"text/csv"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "adobe_metadata.csv";
  a.click();
};

// --- Helpers ---
function esc(s){ return `"${(s||"").replace(/"/g,'""')}"`; }

function render(rows){
  resEl.innerHTML = rows.map(r=>`
    <div class="item">
      <div><b>${r.filename}</b></div>
      <div class="small">${r.title}</div>
      <div class="small">${r.description}</div>
      <div class="small"><b>Keywords:</b> ${r.keywords.join(", ")}</div>
    </div>
  `).join("");
}

function saveHistory(rows){
  history.unshift({at: new Date().toISOString(), rows});
  history = history.slice(0,50);
  localStorage.setItem('amg_history', JSON.stringify(history));
  renderHistory();
}

function renderHistory(){
  histEl.innerHTML = history.map(h=>`
    <div class="item">
      <div class="small">${new Date(h.at).toLocaleString()}</div>
      <div class="small">${h.rows.length} items</div>
    </div>
  `).join("") || "<div class='small'>No history</div>";
}

// --- Mock generator (Adobe-safe, 10 keyword noun-only) ---
function mockMeta(filename, preset){
  const presets = {
    none: ["image","concept","subject","object","detail","light","shadow","background","texture","composition"],
    valentine: ["romance","heart","rose","dessert","chocolate","candle","shadow","light","table","gift"],
    surreal: ["concept","dream","figure","mirror","city","landscape","contrast","symbol","light","space"],
    food: ["food","dish","plate","ingredient","texture","steam","light","shadow","kitchen","table"],
    business: ["business","office","team","meeting","document","laptop","light","desk","strategy","growth"]
  };

  const base = presets[preset] || presets.none;
  return {
    filename,
    title: "Adobe Stock–ready image with cinematic composition",
    description: "High-quality visual optimized for Adobe Stock. Clean composition, commercial-safe concept, and editorially neutral styling. English output with strict keyword rules applied.",
    keywords: base.slice(0,10) // 10 noun-only, singular
  };
}
