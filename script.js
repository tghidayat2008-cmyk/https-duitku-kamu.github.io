const CATS={out:{Makanan:'🍜',Transport:'🚌',Belanja:'🛍️',Tagihan:'💡',Hiburan:'🎮',Kesehatan:'💊',Pendidikan:'📚',Lainnya:'📦'},in:{Gaji:'💼',Bonus:'🎁',Usaha:'🏪',Investasi:'📈','Lainnya ':'💵'}};
const ALL={...CATS.out,...CATS.in};
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const rp=n=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(n);
const iso=d=>{const z=new Date(d.getTime()-d.getTimezoneOffset()*6e4);return z.toISOString().slice(0,10)};
const fmtD=s=>new Date(s+'T00:00').toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'});
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let tx=[],type='out',editId=null,rmode='day';
try{tx=JSON.parse(localStorage.getItem('duitku_tx')||'null')||[]}catch(e){tx=[]}
function persist(){try{localStorage.setItem('duitku_tx',JSON.stringify(tx))}catch(e){}}
const em=c=>ALL[c]||ALL[c+' ']||'📦';
function sum(l,t){return l.filter(x=>x.type===t).reduce((a,x)=>a+x.amt,0)}
function rowHTML(x,act){return `<div class="row"><div class="em">${em(x.cat)}</div><div class="m"><b>${esc(x.note||x.cat)}</b><span>${x.cat} · ${fmtD(x.date)}</span></div><div class="amt ${x.type==='in'?'inc':'exp'}">${x.type==='in'?'+':'−'}${rp(x.amt)}</div>${act?`<div class="acts"><button class="ib" title="Edit" onclick="openForm('${x.id}')">✏️</button><button class="ib" title="Hapus" onclick="ask('${x.id}')">🗑️</button></div>`:''}</div>`}
function catBars(l){const m={};l.filter(x=>x.type==='out').forEach(x=>m[x.cat]=(m[x.cat]||0)+x.amt);const e=Object.entries(m).sort((a,b)=>b[1]-a[1]),tot=e.reduce((a,b)=>a+b[1],0);
 return e.length?e.slice(0,6).map(([c,v])=>`<div class="cat"><div><span>${em(c)} ${c}</span><span>${rp(v)} · ${Math.round(v/tot*100)}%</span></div><div class="bar"><i style="width:${v/e[0][1]*100}%"></i></div></div>`).join(''):'<div class="empty">Belum ada pengeluaran 🌱</div>'}
function dash(){
 $('#dBal').textContent=rp(sum(tx,'in')-sum(tx,'out'));$('#dInc').textContent=rp(sum(tx,'in'));$('#dExp').textContent=rp(sum(tx,'out'));
 const sorted=[...tx].sort((a,b)=>b.date.localeCompare(a.date));
 $('#dRecent').innerHTML=sorted.slice(0,5).map(x=>rowHTML(x)).join('')||'<div class="empty">Belum ada transaksi</div>';
 const n=new Date(),pre=iso(n).slice(0,7),mt=tx.filter(x=>x.date.startsWith(pre));
 $('#mTitle').textContent='Ringkasan '+n.toLocaleDateString('id-ID',{month:'long',year:'numeric'});
 const i=sum(mt,'in'),o=sum(mt,'out');
 $('#mSum').innerHTML=`<div style="display:flex;justify-content:space-between;font-weight:800"><span class="inc">Masuk ${rp(i)}</span><span class="exp">Keluar ${rp(o)}</span></div><div class="bar" style="height:16px;margin:8px 0 6px"><i style="width:${i?Math.min(100,o/i*100):(o?100:0)}%;background:var(--red)"></i></div><p style="margin:0 0 16px;color:var(--muted);font-size:13px;font-weight:700">${i?`Kamu sudah memakai ${Math.round(o/i*100)}% dari pemasukan bulan ini.`:'Belum ada pemasukan bulan ini.'}</p>`+catBars(mt);
}
function fillCats(){const c=$('#fCat'),v=c.value;c.innerHTML='<option value="">Semua kategori</option>'+Object.keys({...CATS.out,...CATS.in}).map(k=>`<option>${k.trim()}</option>`).join('');c.value=v}
function hist(){
 const q=$('#q').value.toLowerCase(),t=$('#fType').value,c=$('#fCat').value,s=$('#fSort').value;
 let l=tx.filter(x=>(!t||x.type===t)&&(!c||x.cat===c)&&(!q||(x.note+' '+x.cat).toLowerCase().includes(q)));
 l.sort((a,b)=>s==='asc'?a.date.localeCompare(b.date):b.date.localeCompare(a.date));
 $('#hList').innerHTML=l.map(x=>rowHTML(x,1)).join('')||'<div class="empty">Tidak ada transaksi yang cocok 🔎</div>';
}
function range(){const n=new Date(),p=$('#rPre').value;let a,b=new Date(n);
 if(p==='month')a=new Date(n.getFullYear(),n.getMonth(),1),b=new Date(n.getFullYear(),n.getMonth()+1,0);
 else if(p==='last')a=new Date(n.getFullYear(),n.getMonth()-1,1),b=new Date(n.getFullYear(),n.getMonth(),0);
 else if(p==='year')a=new Date(n.getFullYear(),0,1),b=new Date(n.getFullYear(),11,31);
 else if(p==='custom'){return [$('#rFrom').value||'0000',$('#rTo').value||'9999']}
 else a=new Date(n.getTime()-(+p-1)*864e5);
 return [iso(a),iso(b)]}
function rep(){
 const p=$('#rPre').value,cu=p==='custom';$('#rFrom').style.display=$('#rTo').style.display=cu?'':'none';
 if(!cu){const [a,b]=range();$('#rFrom').value=a;$('#rTo').value=b}
 const [a,b]=range(),l=tx.filter(x=>x.date>=a&&x.date<=b),i=sum(l,'in'),o=sum(l,'out');
 $('#rStats').innerHTML=`<div class="card stat"><small>Pemasukan</small><b class="inc">${rp(i)}</b></div><div class="card stat"><small>Pengeluaran</small><b class="exp">${rp(o)}</b></div><div class="card stat bal"><small>Selisih</small><b>${rp(i-o)}</b></div>`;
 const g={};l.forEach(x=>{const k=rmode==='day'?x.date:x.date.slice(0,7);(g[k]=g[k]||{in:0,out:0})[x.type]+=x.amt});
 const keys=Object.keys(g).sort(),mx=Math.max(1,...keys.map(k=>Math.max(g[k].in,g[k].out)));
 const lab=k=>rmode==='day'?new Date(k+'T00:00').toLocaleDateString('id-ID',{day:'numeric',month:'short'}):new Date(k+'-01T00:00').toLocaleDateString('id-ID',{month:'short',year:'2-digit'});
 $('#chart').innerHTML=keys.map(k=>`<div class="grp" title="${lab(k)}: +${rp(g[k].in)} / −${rp(g[k].out)}"><div class="bars"><i class="a" style="height:${g[k].in/mx*100}%"></i><i class="b" style="height:${g[k].out/mx*100}%"></i></div><span>${lab(k)}</span></div>`).join('')||'<div class="empty" style="width:100%;align-self:center">Tidak ada data pada periode ini</div>';
 $('#rCats').innerHTML=catBars(l);
 $('#rTable').innerHTML='<tr><th>'+(rmode==='day'?'Hari':'Bulan')+'</th><th>Masuk</th><th>Keluar</th></tr>'+[...keys].reverse().map(k=>`<tr><td>${lab(k)}</td><td class="inc">${rp(g[k].in)}</td><td class="exp">${rp(g[k].out)}</td></tr>`).join('');
}
function renderAll(){dash();hist();rep()}
function go(v){$$('.view').forEach(e=>e.classList.toggle('on',e.id===v));$$('#nav button').forEach(b=>b.classList.toggle('on',b.dataset.v===v));scrollTo({top:0,behavior:'smooth'})}
$$('#nav button').forEach(b=>b.onclick=()=>go(b.dataset.v));
$$('.seg button').forEach(b=>b.onclick=()=>{rmode=b.dataset.m;$$('.seg button').forEach(x=>x.classList.toggle('on',x===b));rep()});
['q','fType','fCat','fSort'].forEach(id=>$('#'+id).addEventListener('input',hist));
['rPre','rFrom','rTo'].forEach(id=>$('#'+id).addEventListener('change',rep));
function setType(t,keep){type=t;$$('.type button').forEach(b=>b.classList.toggle('on',b.dataset.t===t));
 $('#fCategory').innerHTML=Object.keys(CATS[t]).map(k=>`<option>${k.trim()}</option>`).join('');if(keep)$('#fCategory').value=keep}
$$('.type button').forEach(b=>b.onclick=()=>setType(b.dataset.t));
$('#fAmt').addEventListener('input',e=>{const d=e.target.value.replace(/\D/g,'');e.target.value=d?(+d).toLocaleString('id-ID'):''});
function openForm(id){editId=id||null;const x=tx.find(t=>t.id===id);
 $('#mTtl').textContent=x?'Edit Transaksi':'Tambah Transaksi';
 setType(x?x.type:'out',x&&x.cat);
 $('#fAmt').value=x?x.amt.toLocaleString('id-ID'):'';$('#fDate').value=x?x.date:iso(new Date());$('#fNote').value=x?x.note:'';
 $('#mdl').classList.add('on');setTimeout(()=>$('#fAmt').focus(),50)}
function closeM(id){$('#'+id).classList.remove('on')}
function save(){const amt=+$('#fAmt').value.replace(/\D/g,''),date=$('#fDate').value;
 if(!amt){$('#fAmt').focus();return alert('Masukkan nominal yang valid.')}
 if(!date)return alert('Pilih tanggal transaksi.');
 const o={type,cat:$('#fCategory').value,amt,date,note:$('#fNote').value.trim()};
 if(editId)tx=tx.map(t=>t.id===editId?{...t,...o}:t);else tx.push({id:'t'+Date.now(),...o});
 persist();closeM('mdl');renderAll()}
function ask(id){const x=tx.find(t=>t.id===id);$('#cfmT').textContent=`${x.note||x.cat} · ${rp(x.amt)}`;
 $('#cfmY').onclick=()=>{tx=tx.filter(t=>t.id!==id);persist();closeM('cfm');renderAll()};$('#cfm').classList.add('on')}
$$('.modal').forEach(m=>m.addEventListener('click',e=>{if(e.target===m)m.classList.remove('on')}));
fillCats();renderAll();

// Unduh laporan transaksi sesuai periode yang sedang dipilih.
function exportCSV(){
 const [a,b]=range();
 const l=tx.filter(x=>x.date>=a&&x.date<=b).sort((x,y)=>x.date.localeCompare(y.date));
 const inc=sum(l,'in'),out=sum(l,'out');
 const csvCell=v=>{
  let s=String(v??'');
  // Mencegah teks yang diawali karakter formula diperlakukan sebagai formula spreadsheet.
  if(/^[=+@\-]/.test(s)) s="'"+s;
  return '"'+s.replace(/"/g,'""')+'"';
 };
 const rows=[
  ['LAPORAN KEUANGAN DUITKU'],
  ['Periode',a,b],
  ['Total Pemasukan',inc],
  ['Total Pengeluaran',out],
  ['Selisih',inc-out],
  [],
  ['Tanggal','Jenis','Kategori','Keterangan','Nominal (Rp)']
 ];
 l.forEach(x=>rows.push([x.date,x.type==='in'?'Pemasukan':'Pengeluaran',x.cat,x.note||'',x.amt]));
 const content='\uFEFF'+rows.map(row=>row.map(csvCell).join(',')).join('\r\n');
 const blob=new Blob([content],{type:'text/csv;charset=utf-8;'});
 const url=URL.createObjectURL(blob),link=document.createElement('a');
 const safeA=(a||'semua').replace(/[^0-9-]/g,'');
 const safeB=(b||'data').replace(/[^0-9-]/g,'');
 link.href=url;link.download=`laporan-duitku-${safeA}-${safeB}.csv`;
 document.body.appendChild(link);link.click();link.remove();URL.revokeObjectURL(url);
}

// Buka dialog cetak browser; pengguna bisa memilih "Save as PDF / Simpan sebagai PDF".
function printReport(){
 const oldTitle=document.title;
 document.title='Laporan-Keuangan-Duitku';
 window.print();
 document.title=oldTitle;
}

