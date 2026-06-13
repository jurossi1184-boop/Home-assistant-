/* volets-glass-card v3 — vue Volets Liquid Glass (soeur de clim-glass-card). Affiche la cible cerveau par volet, _why complet (heat_mode/anticipation/coucher/garde-fou/soft), profil cliquable, salon_devant et parents marqués non pilotés. */
class VoletsGlassCard extends HTMLElement{
  constructor(){super();this.attachShadow({mode:'open'});this._open=null;this._sheet=false;this._last='';this._pend={};this._tmr={};}
  setConfig(cfg){
    this._c=Object.assign({
      indice:'sensor.indice_surchauffe',
      ext:'sensor.alsace_outdoor_temperature',
      rdc:'sensor.temperature_interieure_rdc',
      etage:'sensor.alsace_zone_etage_circuit_0_current_temperature',
      extc:'sensor.temperature_exterieure_corrigee',
      pv:'sensor.jackery_home_pv_lissee',
      sun:'sun.sun',
      fSej:'input_boolean.sejour_ombrage_actif',
      fEta:'input_boolean.etage_ombrage_actif',
      fConf:'input_boolean.volets_confort_thermique_ferme',
      profil:'input_select.profil_de_journee',
      auto:'input_boolean.volets_pilotage_auto',
      cielCouvert:'binary_sensor.ciel_couvert',
      prevMax:'input_number.prevision_temp_max_jour',
      ph:'input_number.volets_plafond_sejour_haut',
      pb:'input_number.volets_plafond_sejour_bas',
      gf:'input_number.volets_seuil_garde_fou_etage',
      ant:'input_number.volets_seuil_anticipation',
      couv:'input_number.volets_seuil_couvert',
      dpv:'input_number.volets_seuil_doux_pv',
      dtemp:'input_number.volets_seuil_doux_temp',
      posC:'input_number.volets_position_confort_thermique',
      back:'/dashboard-test/accueil',
      openThreshold:95,
      grpRdc:[
        {key:'salondevant',name:'Salon Devant',cover:'cover.salon_devant',manual:'input_boolean.volets_manuel_salon_devant',piloted:false,zone:'sejour'},
        {key:'sejourjardin',name:'S\u00e9jour Jardin',cover:'cover.sejour_jardin',manual:'input_boolean.volets_manuel_sejour_jardin',piloted:true,zone:'sejour',targetType:'west'},
        {key:'terrasse',name:'Terrasse',cover:'cover.terrasse',manual:'input_boolean.volets_manuel_terrasse',piloted:true,zone:'sejour',targetType:'south'},
        {key:'cuisine',name:'Cuisine',cover:'cover.cuisine',manual:'input_boolean.volets_manuel_cuisine',piloted:true,zone:'sejour',targetType:'south'}
      ],
      grpEtage:[
        {key:'parents',name:'Parents',cover:'cover.chambre_3',manual:'input_boolean.volets_manuel_parents',piloted:false,zone:'etage'},
        {key:'louise',name:'Louise',cover:'cover.chambre_2',manual:'input_boolean.volets_manuel_louise',piloted:true,zone:'etage',targetType:'kids'},
        {key:'leandre',name:'L\u00e9andre',cover:'cover.chambre_leandre',manual:'input_boolean.volets_manuel_leandre',piloted:true,zone:'etage',targetType:'kids'}
      ]
    },cfg||{});
  }
  set hass(h){this._h=h;this._reconcile();const fp=this._fp();if(fp!==this._last){this._last=fp;this._render();}}
  _rooms(){return [...this._c.grpRdc,...this._c.grpEtage];}
  _s(e){const st=this._h&&this._h.states[e];return st?st.state:null;}
  _a(e,a){const st=this._h&&this._h.states[e];return st?st.attributes[a]:null;}
  _pos(r){const k=r.key;if(this._pend[k]!=null)return this._pend[k];
    const st=this._h&&this._h.states[r.cover];
    if(!st||st.state==='unavailable'||st.state==='unknown')return null;
    const p=st.attributes.current_position;
    if(p!=null)return p;
    return st.state==='closed'?0:(st.state==='open'?100:null);}
  _reconcile(){let changed=false;
    for(const k in this._pend){const r=this._rooms().find(x=>x.key===k);if(!r){continue;}
      const st=this._h.states[r.cover];if(!st)continue;
      const real=st.attributes.current_position;
      const moving=st.state==='opening'||st.state==='closing';
      if(real!=null&&!moving&&Math.abs(real-this._pend[k])<=2){delete this._pend[k];clearTimeout(this._tmr[k]);changed=true;}}
    if(changed)this._last='';}
  _countOpen(){let n=0;this._rooms().forEach(r=>{const p=this._pos(r);if(p!=null&&p>=this._c.openThreshold)n++;});return n;}
  _n(v){if(v==null||v==='unknown'||v==='unavailable')return'\u2013';const f=parseFloat(v);return isNaN(f)?v:f.toLocaleString('fr-FR',{maximumFractionDigits:1});}
  _brainVars(){const c=this._c;const f=(e,d)=>{const v=parseFloat(this._s(e));return isNaN(v)?d:v;};
    const indice=f(c.indice,0),extc=f(c.extc,0),extf=extc,rdc=f(c.rdc,0),etage=f(c.etage,0);
    const pv=parseFloat(this._s(c.pv));const prev=f(c.prevMax,0);
    const sAntic=f(c.ant,28),sDpv=f(c.dpv,500),sDtemp=f(c.dtemp,22),sGf=f(c.gf,24.5);
    const azimuth=parseFloat(this._a(c.sun,'azimuth'))||0;
    const sej=this._s(c.fSej)==='on',couvert=this._s(c.cielCouvert)==='on';
    const antic=prev>sAntic;
    const heat_mode=extc<18&&rdc<22;
    const soft=!sej||couvert||((!isNaN(pv)&&pv<sDpv)&&extc<sDtemp);
    const open_base=heat_mode||(soft&&!antic);
    const plancher=(antic||extf>30)?0:((extf>=26||indice>=90)?30:40);
    const target=Math.max(100-indice-(antic?35:0),plancher);
    const south_exposed=azimuth>=90&&azimuth<=245;
    const west_exposed=azimuth>=190;
    const south_target=open_base?100:(south_exposed?target:100);
    const west_target=open_base?100:(west_exposed?target:100);
    const now=new Date();const hh=now.getHours(),mm=now.getMinutes();
    const coucher=(hh===20&&mm>=30)||hh>=21||hh<9;
    const kids_gf=south_exposed&&etage>sGf;
    const kids_target=coucher?0:(kids_gf?target:south_target);
    return {south_target:Math.round(south_target),west_target:Math.round(west_target),kids_target:Math.round(kids_target),open_base,antic,heat_mode,soft,couvert,sej,south_exposed,west_exposed,coucher,kids_gf,target:Math.round(target)};}
  _targetFor(r){if(!r.piloted||!r.targetType)return null;const b=this._brainVars();return b[r.targetType+'_target'];}
  _fp(){const ids=[this._c.indice,this._c.ext,this._c.profil,this._c.prevMax,this._c.fSej,this._c.fEta,this._c.fConf,this._c.ph,this._c.pb,this._c.gf,this._c.ant,this._c.couv,this._c.dpv,this._c.dtemp,this._c.posC];
    ids.push(this._c.auto,this._c.cielCouvert);this._rooms().forEach(r=>{ids.push(r.cover);if(r.manual)ids.push(r.manual);});
    return ids.map(e=>{const st=this._h&&this._h.states[e];return st?st.state+'|'+(st.attributes.current_position!=null?st.attributes.current_position:''):'x';}).join(';')+(this._open||'')+(this._sheet?'S':'')+JSON.stringify(this._pend);}
  _nav(p){history.pushState(null,'',p);this.dispatchEvent(new Event('location-changed',{bubbles:true,composed:true}));}
  _why(r){const c=this._c;
    if(r.manual&&this._s(r.manual)==='on')return 'Mode manuel \u2014 le cerveau ne touche pas ce volet';
    if(!r.piloted)return 'Volet libre \u2014 non pilot\u00e9 par le cerveau';
    if(this._s(c.auto)!=='on')return 'Pilotage automatique coup\u00e9';
    const b=this._brainVars();
    if(r.targetType==='kids'&&b.coucher)return 'Coucher \u2014 chambre ferm\u00e9e de 20h30 \u00e0 9h';
    const h2=new Date().getHours();
    if(h2<9)return 'Avant 9h \u2014 position nuit (s\u00e9curit\u00e9 chat)';
    if(b.heat_mode)return 'Chauffage passif \u2014 RDC frais, on capte le soleil (forc\u00e9 ouvert)';
    if(b.antic)return 'Anticipation m\u00e9t\u00e9o \u2014 pr\u00e9-fermeture (pr\u00e9vision \u00e9lev\u00e9e)';
    if(r.targetType==='kids'&&b.kids_gf)return 'Garde-fou \u00e9tage \u2014 chambres ombr\u00e9es (\u00e9tage chaud + soleil sud)';
    if(b.soft)return b.couvert?'Ciel couvert \u2014 maintenu ouvert, aucun soleil \u00e0 bloquer':'Jour doux \u2014 soleil faible et air frais, pas besoin d\u2019ombre';
    if(r.targetType==='south'&&!b.south_exposed)return 'Ouvert \u2014 le soleil n\u2019est plus sur la fa\u00e7ade sud';
    if(r.targetType==='west'&&!b.west_exposed)return 'Ouvert \u2014 le soleil n\u2019est plus sur la fa\u00e7ade ouest';
    if(r.targetType==='kids'&&!b.south_exposed)return 'Ouvert \u2014 le sud est libre, les chambres suivent';
    return 'Ombrage actif \u2014 protection thermique en cours';}
  _statusTxt(r){const st=this._s(r.cover);if(st==='opening')return'Ouverture\u2026';if(st==='closing')return'Fermeture\u2026';const p=this._pos(r);if(p==null)return'Indisponible';if(p>=100)return'Ouvert';if(p<=0)return'Ferm\u00e9';return'\u00c0 '+this._n(p)+'\u00a0%';}
  _icWin(){return `<svg viewBox='0 0 24 24' width='19' height='19' fill='none' stroke='currentColor' stroke-width='1.9' stroke-linecap='round' stroke-linejoin='round'><rect x='4.5' y='3.5' width='15' height='17' rx='2.2'/><path d='M4.5 8h15M4.5 12.5h15'/></svg>`;}
  _tile(r){const st=this._s(r.cover);const p=this._pos(r);const na=p==null;
    const moving=st==='opening'||st==='closing';
    const shading=!na&&p>0&&p<100;const closed=!na&&p<=0;
    const man=r.manual&&this._s(r.manual)==='on';
    const cls=na?'room na':(shading||moving?'room on':(closed?'room dim':'room'));
    const fill=na?0:Math.max(0,Math.min(100,p));
    return `<div class='${cls}' data-act='open' data-k='${r.key}'>
      <div class='rTop'><span class='pastille ${shading?'pOn':''}'><span class='pFill' style='height:${fill}%'></span>${this._icWin()}</span>
      <span class='pwrGrp'>${moving?`<span class='pwr' data-act='quick' data-k='${r.key}' data-m='stop'><svg viewBox='0 0 24 24' width='17' height='17' fill='currentColor' stroke='currentColor' stroke-width='2.1' stroke-linejoin='round'><rect x='7' y='7' width='10' height='10' rx='2'/></svg></span>`:(shading?`<span class='pwr' data-act='quick' data-k='${r.key}' data-m='up'><svg viewBox='0 0 24 24' width='17' height='17' fill='none' stroke='currentColor' stroke-width='2.1' stroke-linecap='round' stroke-linejoin='round'><path d='M12 19V6M6.5 11.5 12 6l5.5 5.5'/></svg></span><span class='pwr' data-act='quick' data-k='${r.key}' data-m='down'><svg viewBox='0 0 24 24' width='17' height='17' fill='none' stroke='currentColor' stroke-width='2.1' stroke-linecap='round' stroke-linejoin='round'><path d='M12 5v13M6.5 12.5 12 18l5.5-5.5'/></svg></span>`:`<span class='pwr' data-act='quick' data-k='${r.key}' data-m='${closed?"up":"down"}'><svg viewBox='0 0 24 24' width='17' height='17' fill='none' stroke='currentColor' stroke-width='2.1' stroke-linecap='round' stroke-linejoin='round'>${closed?"<path d='M12 19V6M6.5 11.5 12 6l5.5 5.5'/>":"<path d='M12 5v13M6.5 12.5 12 18l5.5-5.5'/>"}</svg></span>`)}</span></div>
      <div class='rName'>${r.name}</div>
      <div class='rSub'>${this._statusTxt(r)}${man?" \u00b7 <span class='badgeM'>Manuel</span>":''}</div></div>`;}
  _heroHtml(){const c=this._c;
    const sej=this._s(c.fSej)==='on',eta=this._s(c.fEta)==='on';
    const ombL=sej&&eta?'Ombrage \u00b7 s\u00e9jour + \u00e9tage':(sej?'Ombrage \u00b7 s\u00e9jour':(eta?'Ombrage \u00b7 \u00e9tage':'Ombrage inactif'));
    const flags=[[sej||eta,ombL],[this._s(c.fConf)==='on','Confort ferm\u00e9']];
    const n=this._countOpen();const tot=this._rooms().length;
    const autoOn=this._s(c.auto)==='on';
    let actTxt;
    if(sej&&eta)actTxt='Ombrage actif \u00b7 s\u00e9jour et \u00e9tage';
    else if(sej)actTxt='Ombrage actif \u00b7 s\u00e9jour';
    else if(eta)actTxt='Ombrage actif \u00b7 \u00e9tage';
    else actTxt=n>=tot?'Tout ouvert':(n<=0?'Tout ferm\u00e9':n+' ouvert'+(n>1?'s':'')+' sur '+tot);
    if(!autoOn)actTxt='Pilotage coup\u00e9 \u00b7 '+actTxt;
    return `<div class='hero'>
      <div class='heroLeft'><div class='hHead'><div class='eyebrow'>Volets<span class='profil' data-act='profil'>${this._s(c.profil)||''}\u00a0\u00b7\u00a0max pr\u00e9vu ${this._n(this._s(c.prevMax))}\u00b0</span></div><span class='gear' data-act='sopen'><svg viewBox='0 0 24 24' width='18' height='18' fill='none' stroke='currentColor' stroke-width='1.9' stroke-linecap='round'><path d='M4 7h9.4M18.6 7H20M4 12h3.4M12.6 12H20M4 17h11.4'/><circle cx='16' cy='7' r='2.3'/><circle cx='10' cy='12' r='2.3'/><circle cx='18' cy='17' r='2.3'/></svg></span></div>
      <div class='hStats'>
        <div class='stat'><div class='sv'>${this._n(this._s(c.indice))}<span class='svDim'>\u2009%</span></div><div class='sl'>Indice surchauffe</div></div>
        <div class='stat'><div class='sv'>${n}<span class='svDim'>/${tot}</span></div><div class='sl'>Ouverts</div></div>
        <div class='stat out'><div class='sv'>${this._n(this._s(c.ext))}\u00b0</div><div class='sl'>Ext\u00e9rieur</div></div>
      </div>
      <div class='sub'>${actTxt}</div></div>
      <div class='heroRow'>${(()=>{const mans=this._rooms().filter(r=>r.manual&&this._s(r.manual)==='on');const aOn=this._s(c.auto)==='on';if(!aOn)return `<div class='chip' data-act='pilot'><span class='dot'></span>Pilotage coup\u00e9</div>`;if(mans.length)return `<div class='chip on part' data-act='pilot'><span class='dot'></span>Pilotage partiel \u00b7 ${mans.length} manuel${mans.length>1?'s':''}</div>`;return `<div class='chip on' data-act='pilot'><span class='dot'></span>Pilotage auto</div>`;})()}${flags.map(f=>`<div class='chip ro ${f[0]?'on':''}'><span class='dot'></span>${f[1]}</div>`).join('')}</div>
      </div>`;}
  _sheetRoomHtml(){const r=this._rooms().find(x=>x.key===this._open);if(!r)return'';
    const p=this._pos(r);const posC=this._n(this._s(this._c.posC));
    const target=this._targetFor(r);
    const manOn=r.manual&&this._s(r.manual)==='on';
    const showTarget=target!=null&&!manOn&&this._s(this._c.auto)==='on';
    const targetRow=showTarget?`<div class='whyRow targetRow' data-act='goTarget' data-k='${r.key}'><span class='tDot'></span>Cible cerveau : <b>${target}\u00a0%</b> \u00b7 toucher pour s'y mettre</div>`:'';
    return `<div class='scrim open' data-act='rclose'></div>
    <div class='sheet open'><div class='grab'></div>
      <div class='sheetHead'><h2>${r.name}</h2><button class='close' data-act='rclose'>Fermer</button></div>
      <div class='dial'>
        <button class='stepBtn' data-act='pstep' data-k='${r.key}' data-d='-10'>\u2212</button>
        <div class='target'><div class='tval'>${this._n(p)}\u00a0%</div><div class='tlab'>Position actuelle</div></div>
        <button class='stepBtn' data-act='pstep' data-k='${r.key}' data-d='10'>+</button>
      </div>
      <div class='modes'>
        <div class='mode' data-act='cmd' data-k='${r.key}' data-m='open'>Ouvrir</div>
        <div class='mode' data-act='cmd' data-k='${r.key}' data-m='stop'>Stop</div>
        <div class='mode' data-act='cmd' data-k='${r.key}' data-m='close'>Fermer</div>
        <div class='mode' data-act='cmd' data-k='${r.key}' data-m='confort'>Confort ${posC}\u00a0%</div>
      </div>
      ${targetRow}
      <div class='whyRow'>${this._why(r)}</div>
      ${r.manual?`<div class='manRow ${manOn?'manOn':''}' data-act='chip' data-e='${r.manual}'>${manOn?'Mode manuel \u2014 le cerveau ne touche pas ce volet \u00b7 toucher pour rendre la main':'Pilot\u00e9 automatiquement \u00b7 toucher pour passer en manuel'}</div>`:''}
    </div>`;}
  _setSheetHtml(){const c=this._c;
    const N=e=>this._n(this._s(e));
    const num=(e,u,st)=>`<span class='pv'><button class='pBtn' data-act='nstep' data-e='${e}' data-d='${-(st||1)}'>\u2212</button><b>${N(e)}${u}</b><button class='pBtn' data-act='nstep' data-e='${e}' data-d='${st||1}'>+</button></span>`;
    const sh=(col,txt,ic)=>`<div class='shead'><span class='shic' style='color:${col}'>${ic}</span>${txt}</div>`;
    const icSun=`<svg viewBox='0 0 24 24' width='15' height='15' fill='none' stroke='currentColor' stroke-width='1.9' stroke-linecap='round'><circle cx='12' cy='12' r='4.2'/><path d='M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M18.7 5.3l-1.8 1.8M7.1 16.9l-1.8 1.8'/></svg>`;
    const icCloud=`<svg viewBox='0 0 24 24' width='15' height='15' fill='none' stroke='currentColor' stroke-width='1.9' stroke-linecap='round' stroke-linejoin='round'><path d='M7 18h10a4 4 0 0 0 .8-7.9 5.5 5.5 0 0 0-10.7-1A4.5 4.5 0 0 0 7 18z'/></svg>`;
    const icLeaf=`<svg viewBox='0 0 24 24' width='15' height='15' fill='none' stroke='currentColor' stroke-width='1.9' stroke-linecap='round' stroke-linejoin='round'><path d='M5 19c0-8 5-13 14-14-1 9-6 14-14 14z'/><path d='M5 19c3-5 7-8 11-10'/></svg>`;
    const icMoon=`<svg viewBox='0 0 24 24' width='15' height='15' fill='none' stroke='currentColor' stroke-width='1.9' stroke-linecap='round' stroke-linejoin='round'><path d='M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z'/></svg>`;
    return `<div class='scrim open' data-act='sclose'></div>
    <div class='sheet open sheetScroll'><div class='grab'></div>
      <div class='sheetHead'><h2>R\u00e9glages</h2><button class='close' data-act='sclose'>Fermer</button></div>
      ${sh('#ffd60a','Ombrage automatique',icSun)}
      <div class='ph'>Le s\u00e9jour s'ombrage <span class='nw'>au-dessus de ${num(c.ph,'\u00b0',0.5)}</span> <span class='nw'>et lib\u00e8re sous ${num(c.pb,'\u00b0',0.5)}</span></div>
      <div class='ph'>Garde-fou \u00e9tage : <span class='nw'>chambres ombr\u00e9es si l'\u00e9tage d\u00e9passe ${num(c.gf,'\u00b0',0.5)}</span></div>
      ${sh('#6fdcff','Anticipation m\u00e9t\u00e9o',icCloud)}
      <div class='ph'>\u00c0 9h, <span class='nw'>pr\u00e9-fermer si la pr\u00e9vision d\u00e9passe ${num(c.ant,'\u00b0',0.5)}</span></div>
      <div class='ph'>Ciel consid\u00e9r\u00e9 couvert <span class='nw'>sous ${num(c.couv,'\u00a0W',10)}</span> de rayonnement</div>
      ${sh('#79e3c0','Mode doux',icLeaf)}
      <div class='ph'>S'active si <span class='nw'>le PV d\u00e9passe ${num(c.dpv,'\u00a0W',10)}</span> <span class='nw'>et la temp\u00e9rature ${num(c.dtemp,'\u00b0',0.5)}</span></div>
      ${sh('var(--manual)','Soir et confort',icMoon)}
      <div class='ph'>Position confort thermique : <span class='nw'>${num(c.posC,'\u00a0%',5)} d'ouverture</span></div>
    </div>`;}
  _render(){if(!this._h)return;
    const c=this._c;
    const sheets=this._open?this._sheetRoomHtml():(this._sheet?this._setSheetHtml():'');
    this.shadowRoot.innerHTML=`<style>${this._css()}</style>
    <div class='wrap'>
      <div class='top'><span class='back' data-act='back'>\u2039&nbsp;Accueil</span></div>
      ${this._heroHtml()}
      <div class='secTitle'>RDC</div>
      <div class='grid'>${c.grpRdc.map(r=>this._tile(r)).join('')}</div>
      <div class='secTitle'>\u00c9tage</div>
      <div class='grid'>${c.grpEtage.map(r=>this._tile(r)).join('')}</div>
    </div>${sheets}`;
    this.shadowRoot.querySelectorAll('[data-act]').forEach(el=>{el.addEventListener('click',e=>this._click(e));});
    const sc=this.shadowRoot.querySelector('.sheetScroll');if(sc&&this._scTop)sc.scrollTop=this._scTop;
    if(sc)sc.addEventListener('scroll',()=>{this._scTop=sc.scrollTop;});}
  _click(e){const t=e.currentTarget;const act=t.dataset.act;const h=this._h;const c=this._c;
    if(act==='back'){this._nav(c.back);return;}
    if(act==='sopen'){e.stopPropagation();this._sheet=true;this._scTop=0;this._last='';this._render();return;}
    if(act==='sclose'){this._sheet=false;this._last='';this._render();return;}
    if(act==='rclose'){this._open=null;this._pend={};this._last='';this._render();return;}
    if(act==='chip'){e.stopPropagation();h.callService('input_boolean','toggle',{entity_id:t.dataset.e});return;}
    if(act==='profil'){e.stopPropagation();h.callService('input_select','select_next',{entity_id:c.profil});return;}
    if(act==='pilot'){e.stopPropagation();const aOn=this._s(c.auto)==='on';const mans=this._rooms().filter(r=>r.manual&&this._s(r.manual)==='on').map(r=>r.manual);if(!aOn){h.callService('input_boolean','turn_on',{entity_id:c.auto});return;}if(mans.length){h.callService('input_boolean','turn_off',{entity_id:mans});return;}h.callService('input_boolean','turn_off',{entity_id:c.auto});return;}
    if(act==='goTarget'){e.stopPropagation();const rr=this._rooms().find(x=>x.key===t.dataset.k);if(!rr)return;const tgt=this._targetFor(rr);if(tgt==null)return;this._pend[rr.key]=tgt;h.callService('cover','set_cover_position',{entity_id:rr.cover,position:tgt});clearTimeout(this._tmr[rr.key]);this._tmr[rr.key]=setTimeout(()=>{delete this._pend[rr.key];this._last='';this._render();},15000);this._last='';this._render();return;}
    if(act==='open'){if(e.target.closest("[data-act='quick']"))return;this._open=t.dataset.k;this._last='';this._render();return;}
    const r=this._rooms().find(x=>x.key===t.dataset.k);
    if(act==='quick'){e.stopPropagation();if(!r)return;const m2=t.dataset.m;if(m2==='stop'){h.callService('cover','stop_cover',{entity_id:r.cover});return;}h.callService('cover',m2==='up'?'open_cover':'close_cover',{entity_id:r.cover});return;}
    if(act==='cmd'){if(!r)return;const m=t.dataset.m;const k=r.key;
      if(m==='open')h.callService('cover','open_cover',{entity_id:r.cover});
      else if(m==='close')h.callService('cover','close_cover',{entity_id:r.cover});
      else if(m==='stop')h.callService('cover','stop_cover',{entity_id:r.cover});
      else if(m==='confort'){const pc=parseFloat(this._s(c.posC))||40;this._pend[k]=pc;h.callService('cover','set_cover_position',{entity_id:r.cover,position:pc});clearTimeout(this._tmr[k]);this._tmr[k]=setTimeout(()=>{delete this._pend[k];this._last='';this._render();},15000);}
      this._open=null;this._last='';this._render();return;}
    if(act==='pstep'){if(!r)return;const k=t.dataset.k;const d=parseFloat(t.dataset.d);
      const base=this._pos(r);const cur=this._pend[k]!=null?this._pend[k]:(base==null?0:base);
      const nv=Math.max(0,Math.min(100,cur+d));this._pend[k]=nv;this._last='';this._render();
      clearTimeout(this._tmr[k]);this._tmr[k]=setTimeout(()=>{h.callService('cover','set_cover_position',{entity_id:r.cover,position:this._pend[k]});setTimeout(()=>{delete this._pend[k];this._last='';this._render();},15000);},700);
      return;}
    if(act==='nstep'){const en=t.dataset.e;const d=parseFloat(t.dataset.d);
      const st=this._h.states[en];if(!st)return;
      const mn=parseFloat(st.attributes.min),mx=parseFloat(st.attributes.max);
      let v=(parseFloat(st.state)||0)+d;v=Math.max(mn,Math.min(mx,Math.round(v*10)/10));
      h.callService('input_number','set_value',{entity_id:en,value:v});return;}
  }
  _css(){return `:host{display:block;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',Roboto,sans-serif;color:#f4f5ff;--glass:rgba(255,255,255,.11);--stroke:rgba(255,255,255,.16);--txt2:rgba(244,245,255,.72);--cool:#6fdcff;--manual:#ffc35c;--off:rgba(255,255,255,.35);--r:26px}
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}
.wrap{max-width:1100px;margin:0 auto;container-type:inline-size}
.top{display:flex;margin-bottom:14px}
.back{display:inline-flex;align-items:center;gap:8px;padding:10px 18px 10px 14px;border-radius:18px;background:var(--glass);border:1px solid var(--stroke);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);font-size:14px;font-weight:600;color:var(--txt2);cursor:pointer;user-select:none}
.back:active{transform:scale(.96)}
.hero{position:relative;background:var(--glass);border:1px solid var(--stroke);border-radius:var(--r);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);padding:18px 20px 16px;margin:4px 0 18px}
.gear{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.07);border:1px solid var(--stroke);color:var(--txt2);font-size:17px;cursor:pointer;user-select:none;flex-shrink:0}
.gear:active{transform:scale(.92)}
.hHead{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}
.eyebrow{font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:var(--txt2);font-weight:600;display:flex;align-items:center;gap:10px}
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
.room.dim{opacity:.62}
.room.na{opacity:.42}
.rTop{display:flex;justify-content:space-between;align-items:flex-start}
.rName{font-size:15px;font-weight:700;margin-top:10px}
.rSub{margin-top:3px;font-size:13px;font-weight:500;color:var(--txt2);display:flex;align-items:center;gap:6px;flex-wrap:wrap;transition:.25s}
.pwr{width:34px;height:34px;border-radius:50%;border:1px solid var(--stroke);background:rgba(255,255,255,.08);display:flex;align-items:center;justify-content:center;color:var(--off);font-size:15px;transition:.25s;flex-shrink:0}
.room.on{background:rgba(255,255,255,.92);border-color:rgba(255,255,255,.95);color:#1c1c2e;box-shadow:0 8px 28px rgba(10,20,60,.25)}
.room.on .rSub{color:#0a7eb8;font-weight:600}
.room.on .pwr{background:rgba(28,28,46,.08);border-color:transparent;color:#1c1c2e}
.badgeM{display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:700;color:var(--manual)}
.room.on .badgeM{color:#b45309}
.badgeM::before{content:'';width:6px;height:6px;border-radius:50%;background:currentColor}
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
.modes{display:flex;gap:8px;margin-bottom:14px}
.mode{flex:1;padding:11px 4px;border-radius:16px;text-align:center;font-size:13px;font-weight:600;color:var(--txt2);background:rgba(255,255,255,.06);border:1px solid var(--stroke);cursor:pointer;transition:.15s}
.mode:active{transform:scale(.95);background:rgba(111,220,255,.18);border-color:rgba(111,220,255,.45);color:var(--cool)}
.whyRow{font-size:13px;color:var(--txt2);line-height:1.5;padding:8px 4px 4px}
.targetRow{display:flex;align-items:center;gap:8px;margin:6px 0 4px;padding:11px 14px;border-radius:14px;background:rgba(111,220,255,.1);border:1px solid rgba(111,220,255,.35);color:var(--cool);cursor:pointer;font-weight:600}
.targetRow:active{transform:scale(.98)}
.targetRow b{color:#fff;font-weight:700}
.tDot{width:8px;height:8px;border-radius:50%;background:var(--cool);flex-shrink:0;box-shadow:0 0 8px rgba(111,220,255,.6)}
.manRow{margin-top:12px;padding:13px 14px;border-radius:16px;font-size:13px;font-weight:600;line-height:1.45;color:var(--txt2);background:rgba(255,255,255,.06);border:1px solid var(--stroke);cursor:pointer}
.manRow.manOn{background:rgba(255,195,92,.13);border-color:rgba(255,195,92,.45);color:var(--manual)}
.shead{display:flex;align-items:center;gap:8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:var(--txt2);margin-top:18px;padding:0 4px 9px}
.shic{width:16px;height:16px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.shead+.ph{border-top:none;padding-top:4px}
.ph{padding:13px 4px;border-top:1px solid rgba(255,255,255,.1);font-size:15px;line-height:1.7;display:flex;flex-wrap:wrap;align-items:center;column-gap:6px;row-gap:8px}
.ph b{font-weight:700}
.pv{display:inline-flex;align-items:center;gap:6px;vertical-align:middle;margin:0 2px}
.pv b{color:var(--cool);min-width:48px;text-align:center}
.pBtn{width:30px;height:30px;border-radius:50%;background:rgba(255,255,255,.09);border:1px solid var(--stroke);color:#f4f5ff;font-size:15px;cursor:pointer;flex-shrink:0}
.nw{display:inline-flex;align-items:center;gap:6px;white-space:nowrap}
.sheetScroll{max-height:82vh;overflow-y:auto}
@media(min-width:700px){
.sheet{left:50%;right:auto;bottom:auto;top:50%;width:660px;max-width:92vw;border-radius:28px;border-bottom:1px solid var(--stroke);transform:translate(-50%,-46%) scale(.97);opacity:0;pointer-events:none;transition:.25s ease}
.sheet.open{transform:translate(-50%,-50%) scale(1);opacity:1;pointer-events:auto}
.sheetScroll{max-height:78vh}
.grab{display:none}
}
@container(min-width:880px){
.hero{display:flex;align-items:center;justify-content:space-between;gap:32px;padding:24px 28px;min-height:186px;box-sizing:border-box}
.gear{position:absolute;top:16px;right:18px}
.heroLeft{flex:1;min-width:0}
.hHead{margin-bottom:12px}
.heroRow{margin-top:0;flex-shrink:0;align-self:center;flex:0 1 auto;max-width:580px;min-width:300px;justify-content:flex-end}
.sv{font-size:40px}
.grid{grid-template-columns:repeat(4,1fr);gap:14px}
.room{min-height:132px;padding:16px}
.secTitle{font-size:20px;margin:6px 4px 14px}
}
/* === sp\u00e9cifique volets === */
.grid+.secTitle{margin-top:22px}
.pastille{position:relative;overflow:hidden;width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.1);color:#cfe9ff;flex-shrink:0}
.pFill{position:absolute;left:0;right:0;bottom:0;background:rgba(62,195,247,.28);transition:height .6s}
.room.on .pFill{background:rgba(10,126,184,.16)}
.pastille svg{position:relative;z-index:1}
.pastille.pOn{background:rgba(62,195,247,.22);color:#3ec3f7}
.room.dim .pastille{opacity:.5}
.room.on .pastille{background:rgba(62,195,247,.16);color:#0a7eb8}
.pwrGrp{display:flex;gap:6px}
.profil{font-size:11px;font-weight:700;letter-spacing:.06em;padding:4px 10px;border-radius:11px;background:rgba(255,255,255,.1);border:1px solid var(--stroke);color:#f4f5ff;text-transform:none;white-space:nowrap;cursor:pointer;user-select:none}
.profil:active{transform:scale(.94);background:rgba(255,255,255,.18)}
.svDim{font-size:20px;font-weight:600;color:var(--txt2)}
.chip.ro{cursor:default;opacity:.75}
.chip.ro.on{opacity:1}
.chip.on.part .dot{background:#e8930c}
.chip.on.part{color:#9a6200}
`;}
  getCardSize(){return 8;}
}
customElements.define('volets-glass-card',VoletsGlassCard);
window.customCards=window.customCards||[];
window.customCards.push({type:'volets-glass-card',name:'Volets Glass Card',description:'Vue volets Liquid Glass'});