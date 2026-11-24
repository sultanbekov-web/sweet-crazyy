/* ===== Разделы сайта. Тема (цвета) задаётся в css/style.css через data-theme ===== */
const SECTIONS={
 sweets:{icon:'🍭',title:'Мир ярких<br>вкусняшек! 💥',text:'Выбирай любимые сладости и собирай заказ',sticker:'🍬🍡',search:'🔎 Найти вкусняшку...',count:'Товаров',defCat:'Мармелад',emoji:'🍬',color:'#ff4fc8',empty:'🥺',doc:'каталог сладостей'},
 dairy:{icon:'🥛',title:'Свежее и<br>полезное! 🐄',text:'Молочные продукты для маленьких и больших',sticker:'🥛🧀',search:'🔎 Найти молочный продукт...',count:'Молочных продуктов',defCat:'Молоко',emoji:'🥛',color:'#2a7fd6',empty:'🥛',doc:'молочные продукты'}
};
const DAIRY_CATS=['Молоко','Кефир','Йогурты','Творог','Сметана','Сыры','Масло','Десерты молочные'];
const $=id=>document.getElementById(id);
let products=[],cart=load('sc_cart',{}),category='Все',section='sweets',admin=false,csrf='',editingPhoto='';

function load(k,f){try{const v=localStorage.getItem(k);return v?JSON.parse(v):f}catch(e){return f}}
function saveCart(){try{localStorage.setItem('sc_cart',JSON.stringify(cart))}catch(e){}}
function money(n){return Number(n).toLocaleString('ru-RU',{maximumFractionDigits:2})+' ₽'}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function categories(){return['Все',...new Set(products.filter(p=>p.section===section).map(p=>p.category).filter(Boolean))]}

/* ===== Тема и разделы ===== */
function applyTheme(){
 const S=SECTIONS[section];document.body.dataset.theme=section;
 document.querySelector('meta[name=theme-color]').content=S.color;
 $('logo').textContent=S.icon;$('heroTitle').innerHTML=S.title;$('heroText').textContent=S.text;
 $('heroSticker').textContent=S.sticker;$('search').placeholder=S.search;document.title='Sweet Crazy — '+S.doc;
 document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active',t.dataset.sec===section));
}
function setSection(s){
 section=s;category='Все';applyTheme();history.replaceState(null,'','#'+s);
 const m=$('main');m.classList.remove('fade');void m.offsetWidth;m.classList.add('fade');render();
}
function setCat(i){category=categories()[i];render()}

/* ===== Каталог ===== */
function render(){
 const cats=categories();if(!cats.includes(category))category='Все';
 $('chips').innerHTML=cats.map((c,i)=>`<button class="chip ${category===c?'active':''}" onclick="setCat(${i})">${esc(c)}</button>`).join('');
 $('adminBar').classList.toggle('hidden',!admin);$('adminLink').classList.toggle('hidden',admin);
 const q=$('search').value.toLowerCase(),s=$('sort').value,S=SECTIONS[section];
 let list=products.filter(p=>p.section===section&&(category==='Все'||p.category===category)&&p.name.toLowerCase().includes(q));
 if(s==='asc')list.sort((a,b)=>a.price-b.price);if(s==='desc')list.sort((a,b)=>b.price-a.price);if(s==='az')list.sort((a,b)=>a.name.localeCompare(b.name,'ru'));
 $('countLabel').textContent=`${S.count}: ${list.length}`;
 $('products').innerHTML=list.map(p=>`<article class="card"><div class="photo">${p.photo?`<img src="${esc(p.photo)}" alt="${esc(p.name)}" loading="lazy">`:`<span class="emoji">${esc(p.emoji||S.emoji)}</span>`}<span class="tag">${esc(p.category||'')}</span>${admin?`<button class="edit-mini" onclick="editProduct(${p.id})">✏️</button>`:''}</div><h3>${esc(p.name)}</h3><div class="meta">${p.pack?`В ящике: ${p.pack} шт.`:''}${p.pack&&p.box?' · ':''}${p.box?`Ящик ${money(p.box)}`:''}</div><div class="price-row"><div><div class="price">${money(p.price)}</div><div class="unit">за 1 шт./блок</div></div>${(cart[p.id]||0)>0?`<div class="qty-control"><button onclick="changeQty(${p.id},-1)">−</button><b>${cart[p.id]}</b><button onclick="changeQty(${p.id},1)">+</button></div>`:`<button class="add" onclick="changeQty(${p.id},1)">＋ В заказ</button>`}</div></article>`).join('')
 ||`<div class="empty" style="grid-column:1/-1"><span>${S.empty}</span>${products.some(p=>p.section===section)?'Ничего не найдено':'В этом разделе пока нет товаров'}</div>`;
 updateCartBar();
}

/* ===== Корзина ===== */
function changeQty(id,d){cart[id]=Math.max(0,(cart[id]||0)+d);if(!cart[id])delete cart[id];saveCart();render()}
function cartItems(){return Object.entries(cart).map(([id,qty])=>({p:products.find(p=>p.id==id),qty})).filter(x=>x.p)}
function total(){return cartItems().reduce((s,x)=>s+x.p.price*x.qty,0)}
function updateCartBar(){const items=cartItems(),qty=items.reduce((s,x)=>s+x.qty,0);$('bottomCart').style.display=qty?'flex':'none';$('cartCount').textContent=`${qty} шт. · ${items.length} поз.`;$('cartSum').textContent=money(total())}
function showSheet(html){$('sheet').innerHTML=html;$('overlay').classList.add('show')}
function closeSheet(){$('overlay').classList.remove('show')}
function openCart(){
 const items=cartItems();
 showSheet(`<div class="sheet-head"><h2>🛒 Твой заказ</h2><button class="close" onclick="closeSheet()">×</button></div>${items.length?items.map(({p,qty})=>`<div class="cart-line"><div><strong>${esc(p.name)}</strong><small>${money(p.price)} × ${qty}</small><div class="qty-control" style="display:inline-flex;margin-top:7px"><button onclick="changeQty(${p.id},-1);openCart()">−</button><b>${qty}</b><button onclick="changeQty(${p.id},1);openCart()">+</button></div></div><div class="line-right"><b>${money(p.price*qty)}</b><button class="link-btn" onclick="changeQty(${p.id},-${qty});openCart()">Удалить</button></div></div>`).join(''):`<div class="empty"><span>🛍️</span>Корзина пока пустая</div>`}<div class="cart-total"><span>Итого</span><span>${money(total())}</span></div><button class="primary" ${items.length?'':'disabled'} onclick="copyOrder()">📋 Скопировать заказ</button><button class="secondary" onclick="closeSheet()">Продолжить выбор</button><button class="secondary danger" onclick="if(confirm('Очистить корзину?')){cart={};saveCart();render();openCart()}">Очистить корзину</button>`);
}
function orderText(){const l=['ЗАКАЗ SWEET CRAZY','────────────────────'];cartItems().forEach(({p,qty},i)=>l.push(`${i+1}. ${p.name}\n   ${qty} шт. × ${money(p.price)} = ${money(p.price*qty)}`));l.push('────────────────────',`ИТОГО: ${money(total())}`);return l.join('\n')}
async function copyOrder(){const t=orderText();try{await navigator.clipboard.writeText(t)}catch(e){const a=document.createElement('textarea');a.value=t;document.body.appendChild(a);a.select();document.execCommand('copy');a.remove()}alert('Заказ скопирован! Можно вставить его в сообщение.')}

/* ===== Связь с сервером (api.php) ===== */
async function api(action,body,isForm){
 const o={method:'POST',headers:{'X-CSRF':csrf}};
 if(isForm)o.body=body;else{o.headers['Content-Type']='application/json';o.body=JSON.stringify(body||{})}
 let r,d;
 try{r=await fetch('api.php?action='+action,o);d=await r.json()}catch(e){throw new Error('Сервер недоступен. Проверьте, что на хостинге включён PHP и загружен api.php')}
 if(!r.ok)throw new Error(d.error||'Ошибка сервера');return d;
}
function openLogin(){
 showSheet(`<div class="sheet-head"><h2>🔐 Вход для владельца</h2><button class="close" onclick="closeSheet()">×</button></div><div class="modal-field"><label>Пароль</label><input id="pw" type="password" onkeydown="if(event.key==='Enter')doLogin()"></div><button class="primary" onclick="doLogin()">Войти</button>`);
 setTimeout(()=>$('pw')&&$('pw').focus(),50);
}
async function doLogin(){try{const d=await api('login',{password:$('pw').value});csrf=d.csrf;admin=true;closeSheet();render()}catch(e){alert(e.message)}}
async function logout(){try{await api('logout')}catch(e){}admin=false;csrf='';render()}
async function checkAdmin(){try{const d=await(await fetch('api.php?action=status',{cache:'no-store'})).json();if(d.admin){admin=true;csrf=d.csrf;render()}}catch(e){}}

/* ===== Редактирование товаров ===== */
function autoPrice(){const pr=$('fPrice');if(pr.dataset.manual)return;const b=Number($('fBox').value),k=Number($('fPack').value);if(b>0&&k>0)pr.value=Math.round(b/k*100)/100}
function secChanged(v){$('fCat').value=SECTIONS[v].defCat;$('fEmoji').value=SECTIONS[v].emoji}
function editProduct(id=null,sec=section){
 const p=id?products.find(x=>x.id==id):{name:'',box:'',pack:'',price:'',category:SECTIONS[sec].defCat,emoji:SECTIONS[sec].emoji,photo:'',section:sec};
 if(!p)return;sec=p.section;editingPhoto=p.photo||'';
 showSheet(`<div class="sheet-head"><h2>${id?'✏️ Редактировать товар':'✨ Новый товар'}</h2><button class="close" onclick="closeSheet()">×</button></div>
 <div class="modal-field"><label>Раздел</label><select id="fSec" onchange="secChanged(this.value)">${Object.entries(SECTIONS).map(([k,v])=>`<option value="${k}" ${sec===k?'selected':''}>${v.icon} ${k==='dairy'?'Молочные продукты':'Сладости'}</option>`).join('')}</select></div>
 <div class="modal-field"><label>Название товара</label><input id="fName" value="${esc(p.name)}" placeholder="Например, Мармелад Кислинка"></div>
 <div class="form-grid"><div class="modal-field"><label>Цена за ящик/упаковку, ₽</label><input id="fBox" type="number" step="0.01" value="${p.box}" oninput="autoPrice()"></div><div class="modal-field"><label>Штук в ящике/упаковке</label><input id="fPack" type="number" step="1" value="${p.pack}" oninput="autoPrice()"></div></div>
 <div class="modal-field"><label>Цена за штуку / блок, ₽</label><input id="fPrice" type="number" step="0.01" value="${p.price}" oninput="this.dataset.manual=1" ${id?'data-manual="1"':''}></div>
 <div class="form-grid"><div class="modal-field"><label>Категория</label><input id="fCat" list="catList" value="${esc(p.category)}"><datalist id="catList">${[...new Set([...DAIRY_CATS,...products.map(x=>x.category)])].map(c=>`<option value="${esc(c)}">`).join('')}</datalist></div><div class="modal-field"><label>Эмодзи (если нет фото)</label><input id="fEmoji" value="${esc(p.emoji)}"></div></div>
 <div class="modal-field"><label>Фотография товара</label><input id="fPhoto" type="file" accept="image/*" onchange="readPhoto(event)"><img id="photoPreview" class="photo-preview" ${editingPhoto?`src="${esc(editingPhoto)}" style="display:block"`:''}><small id="photoMsg" class="note"></small>${editingPhoto?`<button class="secondary" onclick="editingPhoto='';$('photoPreview').style.display='none'">Убрать фото</button>`:''}</div>
 <button class="primary" onclick="saveProduct(${id||'null'})">Сохранить товар</button>${id?`<button class="secondary danger" onclick="deleteProduct(${id})">Удалить товар</button>`:''}`);
}
function readPhoto(e){
 const file=e.target.files[0];if(!file)return;
 const img=new Image(),url=URL.createObjectURL(file);
 img.onload=()=>{
  const k=Math.min(1,900/Math.max(img.width,img.height)),c=document.createElement('canvas');c.width=Math.round(img.width*k);c.height=Math.round(img.height*k);
  const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(url);
  c.toBlob(async b=>{
   $('photoMsg').textContent='Загружаю фото…';
   try{const fd=new FormData();fd.append('photo',b,'photo.jpg');const d=await api('upload',fd,true);editingPhoto=d.path;const pr=$('photoPreview');pr.src=d.path;pr.style.display='block';$('photoMsg').textContent='Фото загружено ✓ — не забудьте нажать «Сохранить товар»'}
   catch(err){$('photoMsg').textContent='';alert(err.message)}
  },'image/jpeg',.85);
 };
 img.onerror=()=>alert('Не удалось прочитать картинку');img.src=url;
}
async function persist(next){await api('save',{products:next});products=next}
async function saveProduct(id){
 const name=$('fName').value.trim(),box=Number($('fBox').value)||0,pack=Number($('fPack').value)||0,price=Number($('fPrice').value),sec=$('fSec').value;
 if(!name||!(price>0)){alert('Укажи название и цену за единицу.');return}
 const obj={id:id||Math.max(0,...products.map(p=>Number(p.id)||0))+1,name,box,pack,price,section:sec,category:$('fCat').value.trim()||SECTIONS[sec].defCat,emoji:$('fEmoji').value||SECTIONS[sec].emoji,photo:editingPhoto};
 try{await persist(id?products.map(p=>p.id==id?obj:p):[...products,obj]);closeSheet();setSection(sec)}catch(e){alert(e.message)}
}
async function deleteProduct(id){
 if(!confirm('Удалить этот товар из каталога?'))return;
 try{await persist(products.filter(p=>p.id!=id));delete cart[id];saveCart();closeSheet();render()}catch(e){alert(e.message)}
}
function exportData(){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(products,null,1)],{type:'application/json'}));a.download='products.json';a.click();URL.revokeObjectURL(a.href)}

/* ===== Старт ===== */
(async function init(){
 const h=location.hash.slice(1);section=Object.keys(SECTIONS).includes(h)?h:'sweets';applyTheme();
 try{const r=await fetch('data/products.json',{cache:'no-store'});products=await r.json()}
 catch(e){$('products').innerHTML='<div class="empty" style="grid-column:1/-1"><span>⚠️</span>Не удалось загрузить каталог. Откройте сайт через хостинг, а не двойным кликом по файлу.</div>';return}
 render();checkAdmin();
})();
