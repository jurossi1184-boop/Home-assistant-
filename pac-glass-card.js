/* pac-glass-card v9 — vue Pompe à chaleur Liquid Glass — réglages MiGo · sélecteur Arrêt/Manuel · consigne optimiste (_pend) · tuile montre le mode · détection dérogation native (quick veto / preset boost) + annulation */
class PacGlassCard extends HTMLElement{
  constructor(){super();this.attachShadow({mode:'open'});this._open=null;this._last='';this._pend={};}
  setConfig(cfg){
    this._c=Object.assign({
      rdc:'climate.alsace_zone_rdc_circuit_1_climate',
      etage:'climate.alsace_zone_etage_circuit_0_climate',
      ext:'sensor.alsace_outdoor_temperature',
      tankT:'sensor.alsace_domestic_hot_water_0_tank_temperature',
      tankSet:'sensor.alsace_domestic_hot_water_0_setpoint',
      em:'sensor.alsace_energy_manager_state',
      boostEcs:'switch.alsace_domestic_hot_water_0_boost',
      finBoost:'automation.fin_de_boost_retour_mode_precedent',
      flowRdc:'sensor.alsace_circuit_1_current_flow_temperature',
      flowEtage:'sensor.alsace_circuit_0_current_flow_temperature',
      penteRdc:'number.alsace_circuit_1_heating_curve',
      penteEtage:'number.alsace_circuit_0_heating_curve',
      minRdc:'number.alsace_circuit_1_min_flow_temperature_setpoint',
      minEtage:'number.alsace_circuit_0_min_flow_temperature_setpoint',
      coupRdc:'number.alsace_circuit_1_heat_demand_limited_by_outside_temperature',
      coupEtage:'number.alsace_circuit_0_heat_demand_limited_by_outside_temperature',
      copNatif:'sensor.alsace_heating_energy_efficiency',
      pression:'sensor.alsace_system_water_pressure',
      consoCh:'sensor.alsace_device_0_geniaset_tek_consumed_electrical_energy_heating',
      prodCh:'sensor.alsace_device_0_geniaset_tek_heat_generated_heating',
      consoEcs:'sensor.alsace_device_0_geniaset_tek_consumed_electrical_energy_domestic_hot_water',
      prodEcs:'sensor.alsace_device_0_geniaset_tek_heat_generated_domestic_hot_water',
      bRdcFlag:'input_boolean.boost_depuis_eteint_rdc',
      bEtageFlag:'input_boolean.boost_depuis_eteint_etage',
      back:'/dashboard-test/accueil',
      rooms:[
        {key:'rdc',name:'RDC',sub:'Plancher chauffant',climate:'climate.alsace_zone_rdc_circuit_1_climate',flow:'sensor.alsace_circuit_1_current_flow_temperature',boost:'script.lancer_boost_rdc'},
        {key:'etage',name:'Chambres',sub:'Radiateurs',climate:'climate.alsace_zone_etage_circuit_0_climate',flow:'sensor.alsace_circuit_0_current_flow_temperature',boost:'script.lancer_boost_etage'},
        {key:'ecs',name:'Eau chaude',sub:'Ballon'}
      ]
    },cfg||{});
  }
  set hass(h){this._h=h;
    for(const k in this._pend){const p=this._pend[k];const st=h.states[k];const a=st?parseFloat(st.attributes.temperature):null;if(a===p.v||Date.now()-p.ts>15000){if(p.t)clearTimeout(p.t);delete this._pend[k];}}
    const fp=this._fp();if(fp!==this._last){this._last=fp;this._render();}}
  _s(e){const st=this._h&&this._h.states[e];return st?st.state:null;}
  _a(e,a){const st=this._h&&this._h.states[e];return st?st.attributes[a]:null;}
  _n(v){if(v==null||v==='unknown'||v==='unavailable')return'\u2013';const f=parseFloat(v);return isNaN(f)?v:f.toLocaleString('fr-FR',{maximumFractionDigits:2});}
  _setp(v){if(v==null||v==='unknown'||v==='unavailable')return'\u2013';const f=parseFloat(v);return(isNaN(f)||f<=0)?'\u2013':f.toLocaleString('fr-FR',{maximumFractionDigits:2});}
  _nav(p){history.pushState(null,'',p);this.dispatchEvent(new Event('location-changed',{bubbles:true,composed:true}));}
  _fp(){const c=this._c;const ids=[c.rdc,c.etage,c.ext,c.tankT,c.tankSet,c.em,c.boostEcs,c.copNatif,c.pression,c.flowRdc,c.flowEtage,c.bRdcFlag,c.bEtageFlag];
    return ids.map(e=>{const st=this._h&&this._h.states[e];return st?st.state+'|'+(st.attributes.temperature!=null?st.attributes.temperature:'')+'|'+(st.attributes.current_temperature!=null?st.attributes.current_temperature:'')+'|'+(st.attributes.hvac_action||'')+'|'+(st.attributes.preset_mode||''):'x';}).join(';')+(this._open||'')+'|p:'+Object.keys(this._pend).map(k=>k+this._pend[k].v).join(',');}
  _heating(e){return this._a(e,'hvac_action')==='heating';}
  _veto(cl){if(this._a(cl,'preset_mode')!=='boost')return null;const e=this._a(cl,'quick_veto_end_date_time');const d=e?new Date(e):null;return{end:(d&&!isNaN(d)&&d.getFullYear()>2000)?d:null};}
  _hm(d){return d.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});}
  _dhwOn(){return this._s(this._c.em)==='DHW'||this._s(this._c.boostEcs)==='on';}
  _cop(cons,prod){const a=parseFloat(this._s(cons)),b=parseFloat(this._s(prod));if(!a||!b||isNaN(a)||isNaN(b))return null;const v=b/a;return (v>0&&v<=6.5)?v.toLocaleString('fr-FR',{maximumFractionDigits:2}):null;}
  _icFloor(){return `<svg viewBox='0 0 24 24' width='19' height='19' fill='none' stroke='currentColor' stroke-width='1.9' stroke-linecap='round' stroke-linejoin='round'><path d='M3 19h18'/><path d='M6 15c1.5-2 1.5-4 0-6M11 15c1.5-2 1.5-4 0-6M16 15c1.5-2 1.5-4 0-6'/></svg>`;}
  _icRad(){return `<svg viewBox='0 0 24 24' width='19' height='19' fill='none' stroke='currentColor' stroke-width='1.9' stroke-linecap='round' stroke-linejoin='round'><rect x='4' y='6' width='16' height='12' rx='2'/><path d='M8 6v12M12 6v12M16 6v12'/></svg>`;}
  _icDrop(){return `<svg viewBox='0 0 24 24' width='19' height='19' fill='none' stroke='currentColor' stroke-width='1.9' stroke-linecap='round' stroke-linejoin='round'><path d='M12 3.5s6 6.8 6 11a6 6 0 0 1-12 0c0-4.2 6-11 6-11z'/></svg>`;}
  _tile(r){const c=this._c;
    let on,sub,ic,badge='',pOff='';
    if(r.key==='ecs'){on=this._dhwOn();ic=this._icDrop();sub=`${this._n(this._s(c.tankT))}\u00b0 \u00b7 ${on?'chauffe vers':'consigne'} ${this._n(this._s(c.tankSet))}\u00b0`;}
    else{ic=r.key==='rdc'?this._icFloor():this._icRad();
      const md=this._s(r.climate);const cur=this._n(this._a(r.climate,'current_temperature'));const vt=this._veto(r.climate);
      if(md==='off'){on=false;sub=`${cur}\u00b0 \u00b7 \u00e0 l\u2019arr\u00eat`;badge=`<span class='tBadge off'>Arr\u00eat</span>`;pOff='off';}
      else if(vt){on=true;sub=`${cur}\u00b0 \u00b7 d\u00e9rogation${vt.end?` jusqu'\u00e0 ${this._hm(vt.end)}`:''}`;badge=`<span class='tBadge veto'>D\u00e9rogation</span>`;}
      else if(md==='auto'){on=this._heating(r.climate);sub=`${cur}\u00b0 \u00b7 auto`;badge=`<span class='tBadge auto'>Auto</span>`;}
      else{on=this._heating(r.climate);sub=`${cur}\u00b0 \u00b7 ${on?'chauffe vers':'consigne'} ${this._setp(this._a(r.climate,'temperature'))}\u00b0`;badge=`<span class='tBadge man'>Manuel</span>`;}}
    return `<div class='room ${on?'on':''}' data-act='open' data-k='${r.key}'>
      <div class='rTop'><span class='pastille ${on?'hOn':''} ${pOff}'>${ic}</span>${badge}</div>
      <div><div class='rName'>${r.name}</div>
      <div class='rSub'>${sub}</div></div></div>`;}
  _heroHtml(){const c=this._c;
    const hR=this._heating(c.rdc),hE=this._heating(c.etage),dhw=this._dhwOn();
    const copv=this._s(c.copNatif);const cop=(copv&&copv!=='unknown'&&copv!=='unavailable')?this._n(copv):this._cop(c.consoCh,c.prodCh);
    let actTxt;
    if(dhw)actTxt='Eau chaude en pr\u00e9paration \u00b7 ballon '+this._n(this._s(c.tankT))+'\u00b0';
    else if(hR&&hE)actTxt='Chauffe en cours \u00b7 les deux circuits';
    else if(hR)actTxt='Chauffe en cours \u00b7 RDC \u00b7 d\u00e9part '+this._n(this._s(c.flowRdc))+'\u00b0';
    else if(hE)actTxt='Chauffe en cours \u00b7 chambres \u00b7 d\u00e9part '+this._n(this._s(c.flowEtage))+'\u00b0';
    else actTxt='Tout au repos \u00b7 ballon '+this._n(this._s(c.tankT))+'\u00b0 \u00b7 '+this._n(this._s(c.pression))+'\u00a0bar';
    const chips=[[hR,'Chauffe RDC'],[hE,'Chauffe chambres'],[dhw,'Eau chaude']];
    return `<div class='hero'>
      <div class='heroLeft'><div class='hHead'><div class='eyebrow'>Pompe \u00e0 chaleur${cop?`<span class='profil'>COP ${cop}</span>`:''}</div></div>
      <div class='hStats'>
        <div class='stat'><div class='sv'>${this._n(this._a(c.rdc,'current_temperature'))}\u00b0</div><div class='sl'>RDC \u00b7 consigne ${this._setp(this._a(c.rdc,'temperature'))}\u00b0</div></div>
        <div class='stat'><div class='sv'>${this._n(this._a(c.etage,'current_temperature'))}\u00b0</div><div class='sl'>Chambres \u00b7 consigne ${this._setp(this._a(c.etage,'temperature'))}\u00b0</div></div>
        <div class='stat out'><div class='sv'>${this._n(this._s(c.ext))}\u00b0</div><div class='sl'>Ext\u00e9rieur</div></div>
      </div>
      <div class='sub'>${actTxt}</div></div>
      <div class='heroRow'>${chips.map(f=>`<div class='chip ro ${f[0]?'on h':''}'><span class='dot'></span>${f[1]}</div>`).join('')}</div>
      </div>`;}
  _sheetRoomHtml(){const c=this._c;const r=c.rooms.find(x=>x.key===this._open);if(!r)return'';
    if(r.key==='ecs'){const boost=this._s(c.boostEcs)==='on';
      return `<div class='scrim open' data-act='rclose'></div>
      <div class='sheet open'><div class='grab'></div>
        <div class='sheetHead'><h2>Eau chaude</h2><button class='close' data-act='rclose'>Fermer</button></div>
        <div class='dial'><div class='target'><div class='tval heatv'>${this._n(this._s(c.tankT))}\u00b0</div><div class='tlab'>Ballon \u00b7 consigne ${this._n(this._s(c.tankSet))}\u00b0</div></div></div>
        ${boost?`<div class='boostBadge'>BOOST ECS EN COURS</div>`:''}
        <div class='boostRow'>${boost?`<div class='boostBtn stop' data-act='becs' data-v='off'>Arr\u00eater le boost</div>`:`<div class='boostBtn' data-act='becs' data-v='on'>\u26a1 Lancer un boost ECS</div>`}</div>
        <div class='rowNote'>Chauffe nocturne automatique \u00e0 4h si ballon froid \u00b7 anti-l\u00e9gionelle solaire le dimanche</div>
      </div>`;}
    const cl=r.climate;const boostFlag=this._s(r.key==='rdc'?c.bRdcFlag:c.bEtageFlag)==='on';
    const pd=this._pend[cl];const tgt=pd?this._setp(pd.v):this._setp(this._a(cl,'temperature'));
    const md=this._s(cl);const vt=this._veto(cl);
    const modeBtns=[['off','Arr\u00eat'],['heat_cool','Manuel']].map(m=>`<button class='mode ${md===m[0]?'sel heatSel':''}' data-act='mode' data-k='${r.key}' data-m='${m[0]}'>${m[1]}</button>`).join('');
    let status;
    if(md==='off')status='Circuit \u00e0 l\u2019arr\u00eat';
    else if(this._heating(cl))status='Chauffe en cours \u00b7 d\u00e9part d\u2019eau '+this._n(this._s(r.flow))+'\u00b0';
    else status='Au repos \u00b7 d\u00e9part d\u2019eau '+this._n(this._s(r.flow))+'\u00b0';
    return `<div class='scrim open' data-act='rclose'></div>
    <div class='sheet open'><div class='grab'></div>
      <div class='sheetHead'><h2>${r.name} \u00b7 ${r.sub}</h2><button class='close' data-act='rclose'>Fermer</button></div>
      <div class='dial'>
        <button class='stepBtn' data-act='step' data-k='${r.key}' data-d='-0.5'>\u2212</button>
        <div class='target'><div class='tval heatv'>${tgt}\u00b0</div><div class='tlab'>Consigne du circuit</div><div class='tlab2'>Pi\u00e8ce \u00e0 ${this._n(this._a(cl,'current_temperature'))}\u00b0</div></div>
        <button class='stepBtn' data-act='step' data-k='${r.key}' data-d='0.5'>+</button>
      </div>
      <div class='modeLab'>Mode du circuit</div>
      <div class='modes'>${modeBtns}</div>
      <div class='whyRow'>${status}</div>
      ${boostFlag?`<div class='boostBadge'>BOOST EN COURS \u2014 retour au mode pr\u00e9c\u00e9dent automatique</div>`:(vt?`<div class='boostBadge'>D\u00c9ROGATION EN COURS${vt.end?` \u00b7 jusqu'\u00e0 ${this._hm(vt.end)}`:''}</div>`:'')}
      <div class='boostRow'>${boostFlag?`<div class='boostBtn stop' data-act='bstop'>Arr\u00eater le boost</div>`:(vt?`<div class='boostBtn stop' data-act='vcancel' data-k='${r.key}'>Annuler la d\u00e9rogation</div>`:`<div class='boostBtn' data-act='blaunch' data-k='${r.key}'>\u26a1 Lancer un boost</div>`)}</div>
    </div>`;}
  _render(){if(!this._h)return;
    const c=this._c;
    const sheets=this._open?this._sheetRoomHtml():'';
    this.shadowRoot.innerHTML=`<style>${this._css()}</style>
    <div class='wrap'>
      ${this._heroHtml()}
      <div class='secTitle'>Circuits</div>
      <div class='grid'>${c.rooms.map(r=>this._tile(r)).join('')}</div>
    </div>${sheets}`;
    this.shadowRoot.querySelectorAll('[data-act]').forEach(el=>{el.addEventListener('click',e=>this._click(e));});}
  _click(e){const t=e.currentTarget;const act=t.dataset.act;const h=this._h;const c=this._c;
    if(act==='back'){this._nav(c.back);return;}
    if(act==='rclose'){this._open=null;this._last='';this._render();return;}
    if(act==='open'){this._open=t.dataset.k;this._last='';this._render();return;}
    const r=c.rooms.find(x=>x.key===t.dataset.k);
    if(act==='mode'){const cl=r.climate;const m=t.dataset.m;
      if(this._s(cl)===m)return;
      h.callService('climate','set_hvac_mode',{entity_id:cl,hvac_mode:m});this._last='';this._render();return;}
    if(act==='step'){const cl=r.climate;const p=this._pend[cl];const cur=p?p.v:(parseFloat(this._a(cl,'temperature'))||20);
      const mn=parseFloat(this._a(cl,'min_temp')),mx=parseFloat(this._a(cl,'max_temp'));
      let nv=Math.round((cur+parseFloat(t.dataset.d))*2)/2;if(!isNaN(mn))nv=Math.max(mn,nv);if(!isNaN(mx))nv=Math.min(mx,nv);
      if(p&&p.t)clearTimeout(p.t);
      const tm=setTimeout(()=>{h.callService('climate','set_temperature',{entity_id:cl,temperature:nv});},700);
      this._pend[cl]={v:nv,ts:Date.now(),t:tm};this._last='';this._render();return;}
    if(act==='blaunch'){h.callService('script','turn_on',{entity_id:r.boost});return;}
    if(act==='vcancel'){h.callService('mypyllant','cancel_quick_veto',{entity_id:r.climate});this._last='';this._render();return;}
    if(act==='bstop'){h.callService('automation','trigger',{entity_id:c.finBoost});return;}
    if(act==='becs'){h.callService('switch',t.dataset.v==='on'?'turn_on':'turn_off',{entity_id:c.boostEcs});return;}
  }
  _css(){return `:host{display:block;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',Roboto,sans-serif;color:#f4f5ff;--glass:rgba(255,255,255,.11);--stroke:rgba(255,255,255,.16);--txt2:rgba(244,245,255,.72);--cool:#6fdcff;--manual:#ffc35c;--off:rgba(255,255,255,.35);--r:26px}
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}
.wrap{max-width:1100px;margin:0 auto;container-type:inline-size}
.top{display:flex;margin-bottom:14px}
.back{display:inline-flex;align-items:center;gap:8px;padding:10px 18px 10px 14px;border-radius:18px;background:var(--glass);border:1px solid var(--stroke);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);font-size:14px;font-weight:600;color:var(--txt2);cursor:pointer;user-select:none}
.back:active{transform:scale(.96)}
.hero{position:relative;background:var(--glass);border:1px solid var(--stroke);border-radius:var(--r);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);padding:18px 20px 16px;margin:4px 0 18px}
.hHead{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}
.eyebrow{font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:var(--txt2);font-weight:600}
.hStats{display:flex;gap:30px;flex-wrap:wrap;row-gap:14px}
.stat{white-space:nowrap}
.stat.out{padding-left:26px;border-left:1px solid rgba(255,255,255,.22);opacity:.78}
.stat.out .sv{font-size:26px;font-weight:600;line-height:1.18}
.sv{font-size:34px;font-weight:700;letter-spacing:-.02em;line-height:1;text-shadow:0 1px 12px rgba(10,20,60,.25)}
.sl{font-size:11px;font-weight:700;color:var(--txt2);text-transform:uppercase;letter-spacing:.1em;margin-top:5px}
.sub{margin-top:12px;font-size:14px;color:var(--txt2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.heroRow{display:flex;flex-wrap:wrap;gap:10px;margin-top:16px}
.chip{flex:1 1 auto;display:flex;align-items:center;justify-content:center;gap:8px;padding:12px 10px;border-radius:18px;font-size:14px;font-weight:600;background:rgba(255,255,255,.07);border:1px solid var(--stroke);color:var(--txt2);cursor:pointer;transition:.25s;user-select:none;white-space:nowrap}
.chip.on{background:rgba(255,255,255,.92);border-color:rgba(255,255,255,.95);color:#0a7eb8;font-weight:700;box-shadow:0 6px 20px rgba(10,20,60,.22)}
.dot{width:8px;height:8px;border-radius:50%;background:currentColor;flex-shrink:0}
.chip.on .dot{background:#3ec3f7}
.secTitle{font-size:18px;font-weight:700;color:#fff;margin:0 4px 12px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:12px}
.room{position:relative;background:var(--glass);border:1px solid var(--stroke);border-radius:22px;backdrop-filter:blur(28px);-webkit-backdrop-filter:blur(28px);padding:14px;min-height:118px;display:flex;flex-direction:column;justify-content:space-between;cursor:pointer;overflow:hidden;transition:background .25s,transform .15s,color .25s,box-shadow .25s}
.room:active{transform:scale(.97)}
.rTop{display:flex;justify-content:space-between;align-items:flex-start}
.rName{font-size:15px;font-weight:700;margin-top:10px}
.rSub{margin-top:3px;font-size:13px;font-weight:500;color:var(--txt2);display:flex;align-items:center;gap:6px;flex-wrap:wrap;transition:.25s}
.room.on{background:rgba(255,255,255,.92);border-color:rgba(255,255,255,.95);color:#1c1c2e;box-shadow:0 8px 28px rgba(10,20,60,.25)}
.room.on .rSub{color:#0a7eb8;font-weight:600}
.scrim{position:fixed;inset:0;background:rgba(10,12,40,.55);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);opacity:0;pointer-events:none;transition:.3s;z-index:998}
.scrim.open{opacity:1;pointer-events:auto}
.sheet{position:fixed;left:0;right:0;bottom:0;z-index:999;max-width:430px;margin:0 auto;background:linear-gradient(180deg,rgba(58,52,140,.95),rgba(28,26,82,.98));border:1px solid var(--stroke);border-bottom:none;border-radius:32px 32px 0 0;backdrop-filter:blur(30px);-webkit-backdrop-filter:blur(30px);padding:14px 20px calc(28px + env(safe-area-inset-bottom));transform:translateY(105%);transition:transform .35s cubic-bezier(.32,.72,.25,1)}
.sheet.open{transform:translateY(0)}
.grab{width:42px;height:5px;border-radius:3px;background:rgba(255,255,255,.3);margin:0 auto 14px}
.sheetHead{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}
.sheetHead h2{font-size:20px;font-weight:700}
.close{font-size:14px;color:var(--txt2);background:none;border:none;font-family:inherit;padding:6px 10px;cursor:pointer}
.dial{display:flex;align-items:center;justify-content:center;gap:22px;margin:4px 0 18px}
.stepBtn{width:56px;height:56px;border-radius:50%;background:rgba(255,255,255,.09);border:1px solid var(--stroke);color:#f4f5ff;font-size:26px;font-weight:500;cursor:pointer}
.target{text-align:center;min-width:110px}
.tval{font-size:54px;font-weight:700;letter-spacing:-.03em;line-height:1;color:var(--cool)}
.tlab{font-size:13px;color:var(--txt2);margin-top:4px}
.tlab2{font-size:13px;color:var(--txt2);opacity:.7;margin-top:2px}
.modes{display:flex;gap:8px;margin-bottom:14px}
.mode{flex:1;padding:11px 4px;border-radius:16px;text-align:center;font-size:13px;font-weight:600;color:var(--txt2);background:rgba(255,255,255,.06);border:1px solid var(--stroke);cursor:pointer}
.mode.sel.heatSel{background:rgba(255,159,10,.2);border-color:rgba(255,159,10,.55);color:#ffb340}
.modeLab{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--txt2);margin:2px 4px 8px}
.tval.heatv{color:#ffb340}
.rowNote{font-size:12px;color:var(--txt2);padding:6px 4px 4px;line-height:1.5}
@media(min-width:700px){
.sheet{left:50%;right:auto;bottom:auto;top:50%;width:660px;max-width:92vw;border-radius:28px;border-bottom:1px solid var(--stroke);transform:translate(-50%,-46%) scale(.97);opacity:0;pointer-events:none;transition:.25s ease}
.sheet.open{transform:translate(-50%,-50%) scale(1);opacity:1;pointer-events:auto}
.grab{display:none}
}
@container(min-width:880px){
.hero{display:flex;align-items:center;justify-content:space-between;gap:32px;padding:24px 28px;min-height:186px;box-sizing:border-box}
.heroLeft{flex:1;min-width:0}
.hHead{margin-bottom:12px}
.heroRow{margin-top:0;width:470px;flex-shrink:0;align-self:center}
.sv{font-size:40px}
.grid{grid-template-columns:repeat(4,1fr);gap:14px}
.room{min-height:132px;padding:16px}
.secTitle{font-size:20px;margin:6px 4px 14px}
}
/* === spécifique PAC === */
.grid+.secTitle{margin-top:22px}
.pastille{position:relative;width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.1);color:#cfe9ff;flex-shrink:0}
.pastille.hOn{background:rgba(255,159,10,.22);color:#ffb340}
.room.on .pastille{background:rgba(255,159,10,.16);color:#c2410c}
.pastille.off{background:rgba(255,255,255,.06);color:var(--off)}
.tBadge{font-size:11px;font-weight:700;padding:4px 9px;border-radius:9px;white-space:nowrap;line-height:1.4}
.tBadge.off{background:rgba(255,255,255,.1);color:var(--txt2);border:1px solid var(--stroke)}
.tBadge.auto{background:rgba(111,220,255,.16);color:#9be5ff;border:1px solid rgba(111,220,255,.4)}
.tBadge.man{background:rgba(255,159,10,.16);color:#ffb340;border:1px solid rgba(255,159,10,.4)}
.tBadge.veto{background:rgba(255,159,10,.28);color:#ffce7a;border:1px solid rgba(255,159,10,.6)}
.room.on .tBadge.veto{background:rgba(255,159,10,.2);color:#c2410c;border-color:transparent}
.room.on .tBadge{background:rgba(28,28,46,.08);color:#1c1c2e;border-color:transparent}
.profil{font-size:11px;font-weight:700;letter-spacing:.06em;padding:4px 10px;border-radius:11px;background:rgba(255,255,255,.1);border:1px solid var(--stroke);color:#f4f5ff;text-transform:none;white-space:nowrap}
.eyebrow{display:flex;align-items:center;gap:10px}
.chip.ro{cursor:default}
.chip.on.h{color:#b45309}
.chip.on.h .dot{background:#ff9f0a}
.boostRow{display:flex;gap:8px;margin:0 0 14px}
.boostBtn{flex:1;text-align:center;padding:12px 10px;border-radius:16px;font-size:14px;font-weight:700;background:rgba(255,159,10,.14);border:1px solid rgba(255,159,10,.4);color:#ffb340;cursor:pointer}
.boostBtn.stop{background:rgba(255,99,99,.12);border-color:rgba(255,99,99,.35);color:#ff9a9a}
.boostBadge{margin:0 0 12px;padding:10px 14px;border-radius:14px;font-size:13px;font-weight:700;text-align:center;background:rgba(255,159,10,.16);border:1px solid rgba(255,159,10,.5);color:#ffb340}
`;}
  getCardSize(){return 6;}
}
customElements.define('pac-glass-card',PacGlassCard);
window.customCards=window.customCards||[];
window.customCards.push({type:'pac-glass-card',name:'PAC Glass Card',description:'Vue pompe \u00e0 chaleur Liquid Glass'});