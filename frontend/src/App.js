import React, { useEffect, useMemo, useState } from 'react';

const DEFAULT_BACKEND = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001';
const CATS = [
  { key:'pho', vi:'PHỞ', zh:'河粉（湯類）', en:'PHO' },
  { key:'bun', vi:'BÚN', zh:'米線（湯類）', en:'RICE VERMICELLI' },
  { key:'friedRice', vi:'CƠM RANG', zh:'炒飯', en:'FRIED RICE' },
  { key:'friedNoodles', vi:'MỲ GÓI XÀO', zh:'炒泡麵（炒類）', en:'FRIED INSTANT NOODLES' },
  { key:'friedPho', vi:'PHỞ XÀO', zh:'炒河粉（炒類）', en:'STIR-FRIED PHO' },
  { key:'sidesDrinks', vi:'MÓN ĂN KÈM & THỨC UỐNG', zh:'配菜和飲料', en:'SIDES & DRINKS' }
];
const T = {
  vi:{admin:'Admin',dine:'Ăn tại bàn',take:'Mang về',table:'Số bàn',cart:'Giỏ hàng',note:'Yêu cầu khác',send:'Gửi đơn',total:'Tổng',spicy:'Cay',noSpicy:'Không cay',cooked:'Thịt bò chín',rare:'Bò tái',add:'Thêm',empty:'Chưa có món',success:'Đã gửi đơn thành công!',fail:'Gửi đơn lỗi',name:'Tên khách',phone:'SĐT',back:'Quay lại menu',password:'Mật khẩu admin',login:'Đăng nhập',edit:'Sửa',del:'Xóa',save:'Lưu món',cancel:'Hủy sửa',requests:'Yêu cầu không ăn',onion:'Hành lá',pepper:'Tiêu đen',westernOnion:'Hành tây'},
  zh:{admin:'管理',dine:'內用',take:'外帶',table:'桌號',cart:'購物車',note:'其他要求',send:'送出訂單',total:'總計',spicy:'辣',noSpicy:'不辣',cooked:'牛肉全熟',rare:'手沖牛肉',add:'加入',empty:'尚未選餐',success:'訂單已送出！',fail:'送出失敗',name:'客人姓名',phone:'電話',back:'回菜單',password:'管理密碼',login:'登入',edit:'編輯',del:'刪除',save:'儲存餐點',cancel:'取消編輯',requests:'其他要求不要請打X',onion:'蔥花',pepper:'黑胡椒',westernOnion:'洋蔥'},
  en:{admin:'Admin',dine:'Dine in',take:'Takeaway',table:'Table',cart:'Cart',note:'Special request',send:'Send order',total:'Total',spicy:'Spicy',noSpicy:'Not spicy',cooked:'Cooked beef',rare:'Rare beef',add:'Add',empty:'Cart is empty',success:'Order sent!',fail:'Order failed',name:'Name',phone:'Phone',back:'Back to menu',password:'Admin password',login:'Login',edit:'Edit',del:'Delete',save:'Save item',cancel:'Cancel edit',requests:'Do not add',onion:'Scallion',pepper:'Black pepper',westernOnion:'Onion'}
};
const apiUrl = p => `${DEFAULT_BACKEND.replace(/\/$/,'')}${p}`;
const getName = (i,l) => i[`name_${l}`] || i.name_vi || i.name_zh || i.name_en || '';
const getDesc = (i,l) => i[`description_${l}`] || '';
const money = n => `${Number(n||0)}$`;

export default function App(){
  const [page,setPage]=useState(window.location.pathname.includes('admin')?'admin':'menu');
  const [lang,setLang]=useState(localStorage.getItem('lang')||'vi');
  const [menu,setMenu]=useState([]), [cart,setCart]=useState([]);
  const [type,setType]=useState('dine-in'), [table,setTable]=useState(new URLSearchParams(window.location.search).get('table')||'');
  const [customerName,setCustomerName]=useState(''), [phone,setPhone]=useState(''), [note,setNote]=useState(''), [requests,setRequests]=useState([]);
  const [loading,setLoading]=useState(false), [msg,setMsg]=useState('');
  const dict=T[lang];
  useEffect(()=>localStorage.setItem('lang',lang),[lang]);
  const loadMenu=()=>fetch(apiUrl('/menu')).then(r=>r.json()).then(setMenu).catch(()=>setMsg('Không tải được menu backend'));
  useEffect(()=>{loadMenu()},[]);
  const grouped=useMemo(()=>CATS.map(c=>({...c,items:menu.filter(i=>i.category===c.key&&i.available!==false)})),[menu]);
  const total=cart.reduce((s,i)=>s+Number(i.price)*Number(i.quantity),0);
  function addItem(item,choice={}){const key=item.id+JSON.stringify(choice);setCart(p=>{const f=p.find(x=>x.key===key);return f?p.map(x=>x.key===key?{...x,quantity:x.quantity+1}:x):[...p,{...item,...choice,key,quantity:1}]})}
  function changeQty(key,d){setCart(p=>p.map(x=>x.key===key?{...x,quantity:x.quantity+d}:x).filter(x=>x.quantity>0))}
  function toggleReq(v){setRequests(p=>p.includes(v)?p.filter(x=>x!==v):[...p,v])}
  async function sendOrder(){
    if(!cart.length)return alert(dict.empty);
    if(type==='dine-in'&&!table.trim())return alert('Chưa nhập số bàn / 尚未輸入桌號 / Table required');
    setLoading(true);setMsg('');
    try{const r=await fetch(apiUrl('/order'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({table,type,customerName,phone,note,requests,items:cart})});const d=await r.json();if(!d.ok)throw new Error(d.message||'error');setCart([]);setNote('');setRequests([]);setMsg(dict.success)}catch(e){setMsg(dict.fail+': '+e.message)}finally{setLoading(false)}
  }
  if(page==='admin')return <Admin lang={lang} setLang={setLang} setPage={setPage} reloadMenu={loadMenu}/>;
  return <div className="app">
    <header className="hero"><div className="logoCircle"><span>0909609678<br/>康河粉</span><b>Phở<br/>Khang</b></div><div className="brand"><div className="zh-title">康河粉</div><h1>PHỞ KHANG</h1><p>龍井區台灣大道五段3巷16號</p></div><div className="langBox"><button onClick={()=>setLang('vi')} className={lang==='vi'?'on':''}>VI</button><button onClick={()=>setLang('zh')} className={lang==='zh'?'on':''}>繁中</button><button onClick={()=>setLang('en')} className={lang==='en'?'on':''}>EN</button><button onClick={()=>setPage('admin')}>{dict.admin}</button></div></header>
    <section className="orderType"><button className={type==='dine-in'?'active':''} onClick={()=>setType('dine-in')}>{dict.dine}</button><button className={type==='takeaway'?'active':''} onClick={()=>setType('takeaway')}>{dict.take}</button>{type==='dine-in'&&<input placeholder={dict.table} value={table} onChange={e=>setTable(e.target.value)}/>}</section>
    <main className="layout"><section className="menu">{grouped.map(g=><div key={g.key} className="cat"><div className="catTitle">{g[lang]}</div>{g.items.map(item=><MenuItem key={item.id} item={item} lang={lang} dict={dict} addItem={addItem}/>)}</div>)}</section>
    <aside className="cart"><h2>{dict.cart}</h2>{cart.length===0&&<p className="muted">{dict.empty}</p>}{cart.map(it=><div className="cartItem" key={it.key}><div><b>{getName(it,lang)}</b><small>{[it.spicy==='spicy'?dict.spicy:it.spicy==='noSpicy'?dict.noSpicy:'',it.beefCooked==='cooked'?dict.cooked:it.beefCooked==='rare'?dict.rare:''].filter(Boolean).join(' • ')}</small></div><div className="qty"><button onClick={()=>changeQty(it.key,-1)}>-</button><span>{it.quantity}</span><button onClick={()=>changeQty(it.key,1)}>+</button></div><strong>{money(it.price*it.quantity)}</strong></div>)}<hr/><input placeholder={dict.name} value={customerName} onChange={e=>setCustomerName(e.target.value)}/><input placeholder={dict.phone} value={phone} onChange={e=>setPhone(e.target.value)}/>
    <div className="requestBox"><b>{dict.requests}</b><label><input type="checkbox" checked={requests.includes(dict.onion)} onChange={()=>toggleReq(dict.onion)}/> {dict.onion}</label><label><input type="checkbox" checked={requests.includes(dict.pepper)} onChange={()=>toggleReq(dict.pepper)}/> {dict.pepper}</label><label><input type="checkbox" checked={requests.includes(dict.westernOnion)} onChange={()=>toggleReq(dict.westernOnion)}/> {dict.westernOnion}</label></div>
    <textarea placeholder={dict.note} value={note} onChange={e=>setNote(e.target.value)}/><div className="total"><span>{dict.total}</span><b>{money(total)}</b></div><button className="send" disabled={loading} onClick={sendOrder}>{loading?'...':dict.send}</button>{msg&&<p className="message">{msg}</p>}<div className="extra">+ 飯/麵/蛋/牛肉/海鮮<br/>Cơm +20, Mì +20, Trứng +20, Thịt bò +70, Hải sản +60</div></aside></main>
  </div>
}
function MenuItem({item,lang,dict,addItem}){const[spicy,setSpicy]=useState(''),[beefCooked,setBeefCooked]=useState('');return <div className="item"><div className="itemInfo">{item.image?<img src={item.image} alt={getName(item,lang)}/>:<div className="noImg">{getName(item,lang).slice(0,1)}</div>}<div><h3>{getName(item,lang)}</h3>{getDesc(item,lang)&&<p>{getDesc(item,lang)}</p>}<div className="options">{item.options?.spicy&&<><label><input type="radio" name={'s'+item.id} onChange={()=>setSpicy('spicy')}/> {dict.spicy}</label><label><input type="radio" name={'s'+item.id} onChange={()=>setSpicy('noSpicy')}/> {dict.noSpicy}</label></>}{item.options?.beefCooked&&<><label><input type="radio" name={'b'+item.id} onChange={()=>setBeefCooked('rare')}/> {dict.rare}</label><label><input type="radio" name={'b'+item.id} onChange={()=>setBeefCooked('cooked')}/> {dict.cooked}</label></>}</div></div></div><div className="itemRight"><strong>{money(item.price)}</strong><button onClick={()=>addItem(item,{spicy,beefCooked})}>{dict.add}</button></div></div>}
function Admin({lang,setLang,setPage,reloadMenu}){
  const [password,setPassword]=useState(localStorage.getItem('adminPassword')||''),[ok,setOk]=useState(!!localStorage.getItem('adminPassword')),[items,setItems]=useState([]);
  const empty={category:'pho',name_vi:'',name_zh:'',name_en:'',price:'',image:'',description_vi:'',description_zh:'',description_en:'',available:true,featured:false,options:{spicy:false,beefCooked:false}};
  const [form,setForm]=useState(empty),[editing,setEditing]=useState(''),[msg,setMsg]=useState('');
  const headers={'Content-Type':'application/json','x-admin-password':password};
  async function login(){const r=await fetch(apiUrl('/admin/login'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password})});if(r.ok){localStorage.setItem('adminPassword',password);setOk(true);load()}else alert('Sai mật khẩu')}
  async function load(){const r=await fetch(apiUrl('/admin/menu'),{headers:{'x-admin-password':password}});const d=await r.json();if(Array.isArray(d))setItems(d)}
  useEffect(()=>{if(ok)load()},[ok]);
  const set=(k,v)=>setForm(f=>({...f,[k]:v})); const setOpt=(k,v)=>setForm(f=>({...f,options:{...f.options,[k]:v}}));
  async function save(){const method=editing?'PUT':'POST',url=editing?apiUrl('/admin/menu/'+editing):apiUrl('/admin/menu');const r=await fetch(url,{method,headers,body:JSON.stringify(form)});const d=await r.json();if(!d.ok)return alert(d.message||'Lỗi');setForm(empty);setEditing('');setMsg('Đã lưu món');load();reloadMenu()}
  function edit(i){setEditing(i.id);setForm({...empty,...i,options:{spicy:false,beefCooked:false,...(i.options||{})}});window.scrollTo(0,0)}
  async function del(id){if(!window.confirm('Xóa món này?'))return;await fetch(apiUrl('/admin/menu/'+id),{method:'DELETE',headers:{'x-admin-password':password}});load();reloadMenu()}
  async function upload(e){const file=e.target.files[0];if(!file)return;const fd=new FormData();fd.append('image',file);const r=await fetch(apiUrl('/admin/upload'),{method:'POST',headers:{'x-admin-password':password},body:fd});const d=await r.json();if(d.ok)set('image',d.url);else alert(d.message||'Upload lỗi')}
  if(!ok)return <div className="adminLogin"><h1>PHỞ KHANG ADMIN</h1><input type="password" placeholder={T[lang].password} value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==='Enter'&&login()}/><button onClick={login}>{T[lang].login}</button><button onClick={()=>setPage('menu')}>{T[lang].back}</button></div>;
  return <div className="admin"><div className="adminTop"><h1>PHỞ KHANG ADMIN</h1><div><button onClick={()=>setLang('vi')}>VI</button><button onClick={()=>setLang('zh')}>繁中</button><button onClick={()=>setLang('en')}>EN</button><button onClick={()=>setPage('menu')}>{T[lang].back}</button></div></div>
  <section className="adminForm"><h2>{editing?'Sửa món':'Thêm món mới'}</h2><select value={form.category} onChange={e=>set('category',e.target.value)}>{CATS.map(c=><option key={c.key} value={c.key}>{c.vi} / {c.zh} / {c.en}</option>)}</select><input placeholder="Tên tiếng Việt" value={form.name_vi} onChange={e=>set('name_vi',e.target.value)}/><input placeholder="中文名稱" value={form.name_zh} onChange={e=>set('name_zh',e.target.value)}/><input placeholder="English name" value={form.name_en} onChange={e=>set('name_en',e.target.value)}/><input type="number" placeholder="Giá" value={form.price} onChange={e=>set('price',e.target.value)}/><input placeholder="Link ảnh món" value={form.image} onChange={e=>set('image',e.target.value)}/><input type="file" accept="image/*" onChange={upload}/>{form.image&&<img className="preview" src={form.image} alt="preview"/>}<textarea placeholder="Mô tả tiếng Việt" value={form.description_vi} onChange={e=>set('description_vi',e.target.value)}/><textarea placeholder="中文描述" value={form.description_zh} onChange={e=>set('description_zh',e.target.value)}/><textarea placeholder="English description" value={form.description_en} onChange={e=>set('description_en',e.target.value)}/><div className="checks"><label><input type="checkbox" checked={!!form.available} onChange={e=>set('available',e.target.checked)}/> Đang bán</label><label><input type="checkbox" checked={!!form.options?.spicy} onChange={e=>setOpt('spicy',e.target.checked)}/> Có chọn cay/không cay</label><label><input type="checkbox" checked={!!form.options?.beefCooked} onChange={e=>setOpt('beefCooked',e.target.checked)}/> Có chọn bò tái/chín</label></div><button className="save" onClick={save}>{T[lang].save}</button>{editing&&<button onClick={()=>{setEditing('');setForm(empty)}}>{T[lang].cancel}</button>}{msg&&<p className="message">{msg}</p>}</section>
  <section className="adminList"><h2>Danh sách món ({items.length})</h2>{CATS.map(c=><div key={c.key} className="adminCat"><h3>{c.vi} / {c.zh} / {c.en}</h3>{items.filter(i=>i.category===c.key).map(i=><div className="adminRow" key={i.id}>{i.image?<img src={i.image} alt=""/>:<div className="miniNoImg">{(i.name_vi||'?').slice(0,1)}</div>}<div><b>{i.name_vi}</b><p>{i.name_zh}</p><p>{i.name_en}</p><small>{money(i.price)} • {i.available?'Đang bán':'Đã ẩn'}</small></div><div><button onClick={()=>edit(i)}>{T[lang].edit}</button><button className="danger" onClick={()=>del(i.id)}>{T[lang].del}</button></div></div>)}</div>)}</section></div>
}