/* solar-glass-card v20 — tuiles Flux en lignes horizontales compactes (1 colonne) ; diagramme desktop 380 ; colonnes alignées en haut ; bandeau récap (mois, cumul, CO₂) ;
   tuile Maison : taux de couverture solaire instantané (pv/maison) au lieu du
   taux d'autoconsommation (trompeur : 100 % dès que rien n'est exporté) ;
   tuile Réseau : puissance tirée en temps réel ajoutée devant les kWh du jour */
class SolarGlassCard extends HTMLElement{
  constructor(){super();this.attachShadow({mode:'open'});this._open=null;this._sheet=false;this._last='';}
  setConfig(cfg){
    this._c=Object.assign({
      pv:'sensor.jackery_home_pv_power',
      pvL:'sensor.jackery_home_pv_lissee',
      pv1J:'sensor.jackery_home_pv1_energy_today',
      pv2J:'sensor.jackery_home_pv2_energy_today',
      solJ:'sensor.jackery_home_solar_energy_generated_today',
      solM:'sensor.jackery_home_solaire_mensuel_kwh',
      solCumul:'sensor.jackery_home_jackery_solaire_cumule',
      co2:'sensor.jackery_home_co2_saved',
      soc:'sensor.jackery_home_battery_soc',
      batP:'sensor.jackery_battery_power',
      batRest:'sensor.jackery_home_battery_energy_remaining',
      batChJ:'sensor.jackery_home_battery_charged_today',
      batDisJ:'sensor.jackery_home_battery_discharged_today',
      disHP:'sensor.jackery_decharge_kwh_hp_cumul',
      disHC:'sensor.jackery_decharge_kwh_hc_cumul',
      grid:'sensor.jackery_home_grid_power',
      gridImpJ:'sensor.jackery_home_grid_energy_imported_today',
      gridExpJ:'sensor.jackery_home_grid_energy_exported_today',
      shImp:'sensor.shellypro3em_8c4f00c47360_energie',
      shExp:'sensor.shellypro3em_8c4f00c47360_energie_restituee',
      maison:'sensor.consommation_reelle_maison',
      autoconso:'sensor.taux_autoconsommation_solaire',
      ecoJ:'sensor.economies_solaire_auj',
      coutJ:'sensor.cout_aujourd_hui_avec_abonnement',
      coutJP:'sensor.cout_aujourd_hui_propre',
      coutSansJ:'sensor.cout_sans_solaire_aujourd_hui',
      coutM:'sensor.cout_mensuel_propre',
      coutSansM:'sensor.cout_sans_solaire_ce_mois',
      prevDemain:'sensor.energy_production_tomorrow',
      cielCouvert:'binary_sensor.ciel_couvert',
      back:'/dashboard-test/accueil',
      rooms:[
        {key:'pan',name:'Panneaux',sub:''},
        {key:'bat',name:'Batterie',sub:''},
        {key:'res',name:'Réseau',sub:''},
        {key:'mai',name:'Maison',sub:''}
      ]
    },cfg||{});
  }
  set hass(h){this._h=h;
    const fp=this._fp();if(fp===this._last)return;this._last=fp;
    const sr=this.shadowRoot;
    if(this._open!==null||this._sheet||!sr||!sr.querySelector('.wrap')){this._render();return;}
    const st=this._structSig();
    if(st===this._lastStruct)this._patch();else{this._lastStruct=st;this._render();}}
  _s(e){const st=this._h&&this._h.states[e];return st?st.state:null;}
  _f(e,d){const v=parseFloat(this._s(e));return isNaN(v)?(d||0):v;}
  _n(v,dec){if(v==null||v==='unknown'||v==='unavailable')return'–';const f=parseFloat(v);return isNaN(f)?v:f.toLocaleString('fr-FR',{maximumFractionDigits:dec==null?2:dec});}
  _nav(p){history.pushState(null,'',p);this.dispatchEvent(new Event('location-changed',{bubbles:true,composed:true}));}
  _fp(){const c=this._c;const ids=[c.pv,c.pvL,c.pv1J,c.pv2J,c.solJ,c.solM,c.solCumul,c.co2,c.soc,c.batP,c.batRest,c.batChJ,c.batDisJ,c.grid,c.gridImpJ,c.gridExpJ,c.maison,c.autoconso,c.ecoJ,c.coutJ,c.coutM,c.coutSansM,c.prevDemain,c.cielCouvert];
    return ids.map(e=>{const st=this._h&&this._h.states[e];return st?st.state:'x';}).join(';')+(this._open||'')+(this._sheet?'S':'');}
  _batMode(){const p=this._f(this._c.batP);if(p>50)return'charge';if(p<-50)return'decharge';return'repos';}
  _structSig(){const c=this._c;
    const pv=this._f(c.pv),grid=this._f(c.grid);
    const m=this._batMode();const eco=this._n(this._s(c.ecoJ),2);
    return [pv>80,grid>50,m,eco!=='–'].join(',');}
  _patch(){const c=this._c,sr=this.shadowRoot;
    const pv=this._f(c.pv),mai=this._f(c.maison),g=this._f(c.grid),batP=this._f(c.batP),m=this._batMode();
    const prevDem=this._n(this._s(c.prevDemain),1);
    let actTxt;
    if(pv>80&&m==='charge')actTxt=`Le soleil couvre la maison · surplus vers la batterie (${this._n(batP,0)} W)`;
    else if(pv>80&&g>50)actTxt=`Soleil + appoint réseau ${this._n(g,0)} W`;
    else if(pv>80)actTxt='Le soleil alimente la maison';
    else if(m==='decharge')actTxt=`Nuit · la batterie alimente la maison (${this._n(-batP,0)} W)`;
    else if(g>50)actTxt=`Réseau seul · ${this._n(g,0)} W`;
    else actTxt='Tout au repos';
    if(prevDem!=='–')actTxt+=` · demain ${prevDem} kWh prévus`;
    const eco=this._n(this._s(c.ecoJ),2);
    const cov=mai>0?Math.min(100,Math.round(100*pv/mai)):0;
    const v={
      hpv:`${this._n(pv,0)} W`,hsoc:`${this._n(this._s(c.soc),0)} %`,
      hbatrest:`${this._n(this._s(c.batRest),1)} kWh`,hcout:`${this._n(this._s(c.coutJ),2)} €`,
      hmai:`${this._n(mai,0)} W`,hsub:actTxt,heco:`${eco} €`,
      tpan:`${this._n(pv,0)} W · ${this._n(this._s(c.solJ),2)} kWh aujourd'hui`,
      tbat:`${this._n(this._s(c.soc),0)} % · ${m==='charge'?'en charge '+this._n(batP,0)+' W':(m==='decharge'?'en décharge '+this._n(-batP,0)+' W':'au repos')}`,
      tres:`${this._n(g,0)} W tirés · ${this._n(this._s(c.gridImpJ),2)} kWh aujourd'hui`,
      tmai:`${this._n(mai,0)} W · solaire couvre ${cov} %`,
      rmois:`${this._n(this._s(c.solM),1)} kWh`,reco:`${this._n(this._f(c.coutSansM)-this._f(c.coutM),2)} €`,
      rcumul:`${this._n(this._s(c.solCumul),0)} kWh`,rco2:`${this._n(this._s(c.co2),0)} kg`
    };
    sr.querySelectorAll('[data-p]').forEach(el=>{const k=el.getAttribute('data-p');if(v[k]!==undefined)el.textContent=v[k];});
    this._patchFlows();}
  _icSun(){return `<svg viewBox='0 0 24 24' width='19' height='19' fill='none' stroke='currentColor' stroke-width='1.9' stroke-linecap='round'><circle cx='12' cy='12' r='4.2'/><path d='M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5 5l1.7 1.7M17.3 17.3 19 19M19 5l-1.7 1.7M6.7 17.3 5 19'/></svg>`;}
  _icBat(){return `<svg viewBox='0 0 24 24' width='19' height='19' fill='none' stroke='currentColor' stroke-width='1.9' stroke-linecap='round' stroke-linejoin='round'><rect x='3' y='8' width='15' height='9' rx='2'/><path d='M21 11v3'/><path d='M10.5 9.5 8 12.5h3l-2 2.8'/></svg>`;}
  _icGrid(){return `<svg viewBox='0 0 24 24' width='19' height='19' fill='none' stroke='currentColor' stroke-width='1.9' stroke-linecap='round' stroke-linejoin='round'><path d='M6 21 10 3h4l4 18'/><path d='M7.2 15h9.6M8.4 9.5h7.2'/></svg>`;}
  _icHome(){return `<svg viewBox='0 0 24 24' width='19' height='19' fill='none' stroke='currentColor' stroke-width='1.9' stroke-linecap='round' stroke-linejoin='round'><path d='M4 11.5 12 4.5l8 7'/><path d='M6.5 10v9h11v-9'/></svg>`;}
  _tile(r){const c=this._c;let on=false,sub='',ic='';
    if(r.key==='pan'){const pv=this._f(c.pv);on=pv>80;ic=this._icSun();
      sub=`${this._n(pv,0)} W · ${this._n(this._s(c.solJ),2)} kWh aujourd'hui`;}
    if(r.key==='bat'){const m=this._batMode();on=m!=='repos';ic=this._icBat();
      sub=`${this._n(this._s(c.soc),0)} % · ${m==='charge'?'en charge '+this._n(this._f(c.batP),0)+' W':(m==='decharge'?'en décharge '+this._n(-this._f(c.batP),0)+' W':'au repos')}`;}
    if(r.key==='res'){const g=this._f(c.grid);on=g>50;ic=this._icGrid();
      sub=`${this._n(g,0)} W tirés · ${this._n(this._s(c.gridImpJ),2)} kWh aujourd'hui`;}
    if(r.key==='mai'){ic=this._icHome();const mai=this._f(c.maison);const pv=this._f(c.pv);
      const cov=mai>0?Math.min(100,Math.round(100*pv/mai)):0;
      sub=`${this._n(mai,0)} W · solaire couvre ${cov} %`;}
    return `<div class='room ${on?'on':''}' data-act='open' data-k='${r.key}'>
      <span class='pastille ${r.key==='pan'&&on?'sOn':''}${r.key==='bat'&&on?'bOn':''}'>${ic}</span>
      <div class='rText'><div class='rName'>${r.name}</div>
      <div class='rSub' data-p='t${r.key}'>${sub}</div></div></div>`;}
  _heroHtml(){const c=this._c;
    const pv=this._f(c.pv),mai=this._f(c.maison),g=this._f(c.grid);const m=this._batMode();
    const prevDem=this._n(this._s(c.prevDemain),1);
    let actTxt;
    if(pv>80&&m==='charge')actTxt=`Le soleil couvre la maison · surplus vers la batterie (${this._n(this._f(c.batP),0)} W)`;
    else if(pv>80&&g>50)actTxt=`Soleil + appoint réseau ${this._n(g,0)} W`;
    else if(pv>80)actTxt='Le soleil alimente la maison';
    else if(m==='decharge')actTxt=`Nuit · la batterie alimente la maison (${this._n(-this._f(c.batP),0)} W)`;
    else if(g>50)actTxt=`Réseau seul · ${this._n(g,0)} W`;
    else actTxt='Tout au repos';
    const eco=this._n(this._s(c.ecoJ),2);
    if(prevDem!=='–')actTxt+=` · demain ${prevDem} kWh prévus`;
    const chips=[[pv>80,'Production','sun'],[m!=='repos',m==='charge'?'Batterie · charge':(m==='decharge'?'Batterie · décharge':'Batterie au repos'),'bat'],[g>50,'Réseau sollicité','']];
    return `<div class='hero'>
      <div class='heroLeft'><div class='hHead'><div class='eyebrow'>Solaire${eco!=='–'?`<span class='profil'>Économisé <span data-p='heco'>${eco} €</span> aujourd'hui</span>`:''}</div><span class='gear' data-act='sopen'><svg viewBox='0 0 24 24' width='18' height='18' fill='none' stroke='currentColor' stroke-width='1.9' stroke-linecap='round'><path d='M4 7h9.4M18.6 7H20M4 12h3.4M12.6 12H20M4 17h11.4'/><circle cx='16' cy='7' r='2.3'/><circle cx='10' cy='12' r='2.3'/><circle cx='18' cy='17' r='2.3'/></svg></span></div>
      <div class='hStats'>
        <div class='stat'><div class='sv' data-p='hpv'>${this._n(pv,0)} W</div><div class='sl'>Production</div></div>
        <div class='stat'><div class='sv' data-p='hsoc'>${this._n(this._s(c.soc),0)} %</div><div class='sl'>Batterie · <span data-p='hbatrest'>${this._n(this._s(c.batRest),1)} kWh</span></div></div>
        <div class='stat'><div class='sv' data-p='hcout'>${this._n(this._s(c.coutJ),2)} €</div><div class='sl'>Coût aujourd'hui</div></div>
        <div class='stat out'><div class='sv' data-p='hmai'>${this._n(mai,0)} W</div><div class='sl'>Maison</div></div>
      </div>
      <div class='sub' data-p='hsub'>${actTxt}</div></div>
      <div class='heroRow'>${chips.map(f=>`<div class='chip ro ${f[0]?'on '+f[2]:''}'><span class='dot'></span>${f[1]}</div>`).join('')}</div>
      </div>`;}
  _ribbonHtml(){const c=this._c;
    const ecoM=this._f(c.coutSansM)-this._f(c.coutM);
    return `<div class='ribbon'>
      <div class='rcell'><div class='rv' data-p='rmois'>${this._n(this._s(c.solM),1)} kWh</div><div class='rl'>Solaire ce mois</div></div>
      <div class='rcell'><div class='rv' data-p='reco'>${this._n(ecoM,2)} €</div><div class='rl'>Économies du mois</div></div>
      <div class='rcell'><div class='rv' data-p='rcumul'>${this._n(this._s(c.solCumul),0)} kWh</div><div class='rl'>Production totale</div></div>
      <div class='rcell'><div class='rv' data-p='rco2'>${this._n(this._s(c.co2),0)} kg</div><div class='rl'>CO₂ évité</div></div>
    </div>`;}
  _row(l,v){return `<div class='statRow'><span>${l}</span><b>${v}</b></div>`;}
  _sheetRoomHtml(){const c=this._c;const r=c.rooms.find(x=>x.key===this._open);if(!r)return'';
    let body='';
    if(r.key==='pan'){const pv2=this._f(c.pv2J);const prevDem=this._n(this._s(c.prevDemain),1);
      body=`<div class='dial'><div class='target'><div class='tval'>${this._n(this._f(c.pv),0)} W</div><div class='tlab'>Production instantanée · lissée ${this._n(this._s(c.pvL),0)} W</div></div></div>
      ${pv2===0?`<div class='whyRow'>PV2 (ouest) absent — les deux panneaux SE travaillent seuls</div>`:''}
      ${this._row("Aujourd'hui",this._n(this._s(c.solJ),2)+' kWh')}
      ${this._row('Demain (prévision)',prevDem+' kWh → '+((prevDem!=='–'&&this._f(c.prevDemain)>this._f(c.solJ))?'↑ plus ensoleillé':'→ vigilance'))}
      ${this._row('PV1 (sud-est)',this._n(this._s(c.pv1J),2)+' kWh')}
      ${this._row('PV2 (ouest)',this._n(this._s(c.pv2J),2)+' kWh')}
      ${this._row('Ce mois-ci',this._n(this._s(c.solM),1)+' kWh')}
      ${this._row('Depuis le début',this._n(this._s(c.solCumul),0)+' kWh')}
      ${this._row('CO₂ évité',this._n(this._s(c.co2),0)+' kg')}`;}
    if(r.key==='bat'){const m=this._batMode();
      body=`<div class='dial'><div class='target'><div class='tval'>${this._n(this._s(c.soc),0)} %</div><div class='tlab'>${this._n(this._s(c.batRest),1)} kWh disponibles · ${m==='charge'?'en charge':(m==='decharge'?'en décharge':'au repos')}</div></div></div>
      ${this._row("Chargé aujourd'hui",this._n(this._s(c.batChJ),2)+' kWh')}
      ${this._row("Déchargé aujourd'hui",this._n(this._s(c.batDisJ),2)+' kWh')}
      ${this._row('Restitué en heures pleines (cumul)',this._n(this._s(c.disHP),0)+' kWh')}
      ${this._row('Restitué en heures creuses (cumul)',this._n(this._s(c.disHC),0)+' kWh')}
      <div class='rowNote'>La batterie rend ${this._n(100*this._f(c.disHP)/(this._f(c.disHP)+this._f(c.disHC)+0.001),0)} % de son énergie en heures pleines — là où le kWh coûte le plus cher</div>`;}
    if(r.key==='res'){
      body=`<div class='dial'><div class='target'><div class='tval'>${this._n(this._f(c.grid),0)} W</div><div class='tlab'>Tirage réseau instantané</div></div></div>
      ${this._row("Importé aujourd'hui",this._n(this._s(c.gridImpJ),2)+' kWh')}
      ${this._row("Exporté aujourd'hui",this._n(this._s(c.gridExpJ),2)+' kWh')}
      ${this._row('Compteur import (Shelly)',this._n(this._s(c.shImp),0)+' kWh')}
      ${this._row('Compteur export (Shelly)',this._n(this._s(c.shExp),0)+' kWh')}
      ${this._row("Coût aujourd'hui (avec abonnement)",this._n(this._s(c.coutJ),2)+' €')}`;}
    if(r.key==='mai'){const eco_m=this._f(c.coutSansM)-this._f(c.coutM);const mai2=this._f(c.maison);const pv3=this._f(c.pv);
      const cov2=mai2>0?Math.min(100,Math.round(100*pv3/mai2)):0;
      body=`<div class='dial'><div class='target'><div class='tval'>${this._n(mai2,0)} W</div><div class='tlab'>Consommation réelle · solaire couvre ${cov2} % en ce moment</div></div></div>
      ${this._row('Autoconsommation (part du solaire non exportée)',this._n(this._s(c.autoconso),0)+' %')}
      ${this._row("Coût aujourd'hui",this._n(this._s(c.coutJP),2)+' €')}
      ${this._row("Sans le solaire, aujourd'hui aurait coûté",this._n(this._s(c.coutSansJ),2)+' €')}
      ${this._row('Coût du mois',this._n(this._s(c.coutM),2)+' €')}
      ${this._row('Sans le solaire, ce mois',this._n(this._s(c.coutSansM),2)+' €')}
      <div class='rowNote'>Le solaire t'a économisé ${this._n(eco_m,2)} € ce mois-ci</div>`;}
    return `<div class='scrim open' data-act='rclose'></div>
    <div class='sheet open sheetScroll'><div class='grab'></div>
      <div class='sheetHead'><h2>${r.name}</h2><button class='close closeX' data-act='rclose' title='Fermer'><svg viewBox='0 0 24 24' width='18' height='18' fill='none' stroke='currentColor' stroke-width='2.2' stroke-linecap='round'><path d='M6 6l12 12M18 6L6 18'/></svg></button></div>
      ${body}</div>`;}
  _setSheetHtml(){const c=this._c;
    const srow=(lab,val)=>`<div class='sRow'><div class='sLab'>${lab}</div><div class='sCtrl'><b class='sVal'>${val}</b></div></div>`;
    return `<div class='scrim open' data-act='sclose'></div>
    <div class='sheet open sheetScroll'><div class='grab'></div>
      <div class='sheetHead'><h2>Bilan solaire</h2><button class='close closeX' data-act='sclose' title='Fermer'><svg viewBox='0 0 24 24' width='18' height='18' fill='none' stroke='currentColor' stroke-width='2.2' stroke-linecap='round'><path d='M6 6l12 12M18 6L6 18'/></svg></button></div>
      <div class='sGrp'>Production cumulée</div>
      <div class='sCard'>
        ${srow("Depuis l'installation",this._n(this._s(c.solCumul),0)+' kWh')}
        ${srow('Ce mois-ci',this._n(this._s(c.solM),1)+' kWh')}
      </div>
      <div class='sGrp'>Impact</div>
      <div class='sCard'>
        ${srow('CO₂ évité',this._n(this._s(c.co2),0)+' kg')}
        ${srow('Économie du mois',this._n(this._f(c.coutSansM)-this._f(c.coutM),2)+' €')}
      </div>
      <div class='sNote'>Données Jackery (production, batterie) et Shelly Pro 3EM (réseau) · coûts calculés par tes capteurs tarifaires</div>
    </div>`;}
  _flowDiagramHtml(){
    const cSun='#ffb340',cGrid='#ff6b6b',cHome='#4fe3c2',cBat='#6fdcff';
    const C={x:200,y:180},R=46;
    const N={sol:{x:200,y:62},res:{x:64,y:180},mai:{x:336,y:180},bat:{x:200,y:298}};
    const icSun=`<svg width='22' height='22' viewBox='0 0 24 24' fill='none' stroke-width='1.9' stroke-linecap='round'><circle cx='12' cy='12' r='4.2'/><path d='M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5 5l1.7 1.7M17.3 17.3 19 19M19 5l-1.7 1.7M6.7 17.3 5 19'/></svg>`;
    const icGrid=`<svg width='22' height='22' viewBox='0 0 24 24' fill='none' stroke-width='1.9' stroke-linecap='round' stroke-linejoin='round'><path d='M6 21 10 3h4l4 18'/><path d='M7.2 15h9.6M8.4 9.5h7.2'/></svg>`;
    const icHome=`<svg width='22' height='22' viewBox='0 0 24 24' fill='none' stroke-width='1.9' stroke-linecap='round' stroke-linejoin='round'><path d='M4 11.5 12 4.5l8 7'/><path d='M6.5 10v9h11v-9'/></svg>`;
    const icBat=`<svg width='22' height='22' viewBox='0 0 24 24' fill='none' stroke-width='1.9' stroke-linecap='round' stroke-linejoin='round'><rect x='5' y='6' width='14' height='12' rx='2'/><path d='M9 2h6'/></svg>`;
    const node=(id,p,col,ic,lab,dy)=>`
      <g id="node-grp-${id}">
        <circle id="node-circ-${id}" cx='${p.x}' cy='${p.y}' r='${R}' class='node-circle' stroke='rgba(255,255,255,0.18)'/>
        <g transform='translate(${p.x-11},${p.y-22})' id="node-ic-${id}" stroke='rgba(244,245,255,0.55)'>${ic}</g>
        <text id="node-val-${id}" x='${p.x}' y='${p.y+12}' class='node-val'>0</text>
        <text x='${p.x}' y='${p.y+dy}' class='node-lab'>${lab}</text>
      </g>`;
    return `
    <div class='flowSection'>
      <svg class='flowSvg' viewBox='0 0 400 360' xmlns='http://www.w3.org/2000/svg'>
        <defs>
          <filter id="glow-sun" filterUnits="userSpaceOnUse" x="0" y="0" width="400" height="360"><feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="${cSun}" flood-opacity="0.8"/></filter>
          <filter id="glow-grid" filterUnits="userSpaceOnUse" x="0" y="0" width="400" height="360"><feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="${cGrid}" flood-opacity="0.8"/></filter>
          <filter id="glow-bat" filterUnits="userSpaceOnUse" x="0" y="0" width="400" height="360"><feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="${cBat}" flood-opacity="0.8"/></filter>
        </defs>
        <path d='M${N.sol.x},${N.sol.y} Q${C.x},${C.y} ${N.mai.x},${N.mai.y}' class='flow-bg' stroke='${cSun}' />
        <path d='M${N.sol.x},${N.sol.y} Q${C.x},${C.y} ${N.bat.x},${N.bat.y}' class='flow-bg' stroke='${cSun}' />
        <path d='M${N.res.x},${N.res.y} Q${C.x},${C.y} ${N.mai.x},${N.mai.y}' class='flow-bg' stroke='${cGrid}' />
        <path d='M${N.bat.x},${N.bat.y} Q${C.x},${C.y} ${N.mai.x},${N.mai.y}' class='flow-bg' stroke='${cBat}' />
        <path id='flow-sol-mai' d='M${N.sol.x},${N.sol.y} Q${C.x},${C.y} ${N.mai.x},${N.mai.y}' class='flow-line' stroke='${cSun}' filter='url(#glow-sun)' style='opacity:0;' />
        <path id='flow-sol-bat' d='M${N.sol.x},${N.sol.y} Q${C.x},${C.y} ${N.bat.x},${N.bat.y}' class='flow-line' stroke='${cSun}' filter='url(#glow-sun)' style='opacity:0;' />
        <path id='flow-res-mai' d='M${N.res.x},${N.res.y} Q${C.x},${C.y} ${N.mai.x},${N.mai.y}' class='flow-line' stroke='${cGrid}' filter='url(#glow-grid)' style='opacity:0;' />
        <path id='flow-bat-mai' d='M${N.bat.x},${N.bat.y} Q${C.x},${C.y} ${N.mai.x},${N.mai.y}' class='flow-line' stroke='${cBat}' filter='url(#glow-bat)' style='opacity:0;' />
        ${node('sol',N.sol,cSun,icSun,'Solaire',-50)}
        ${node('res',N.res,cGrid,icGrid,'Réseau',64)}
        ${node('mai',N.mai,cHome,icHome,'Maison',64)}
        ${node('bat',N.bat,cBat,icBat,'Batterie',56)}
      </svg>
    </div>`;}
  _patchFlows(){const sr=this.shadowRoot;if(!sr.querySelector('.flowSvg'))return;
    const c=this._c;
    const pv=this._f(c.pv),batP=this._f(c.batP),grid=this._f(c.grid),mai=this._f(c.maison),soc=this._f(c.soc);
    const batCharge=batP>40,batDischarge=batP<-40,solToHome=pv>40,gridActive=grid>40;
    const col={sol:'#ffb340',res:'#ff6b6b',mai:'#4fe3c2',bat:'#6fdcff',off:'rgba(255,255,255,0.18)',icOff:'rgba(244,245,255,0.55)'};
    const setNode=(id,val,active,c2)=>{
      const tx=sr.getElementById('node-val-'+id);if(tx&&tx.textContent!==val)tx.textContent=val;
      const ci=sr.getElementById('node-circ-'+id),ic=sr.getElementById('node-ic-'+id);
      if(ci){ci.classList.toggle('active',active);ci.style.stroke=active?c2:col.off;}
      if(ic)ic.style.stroke=active?c2:col.icOff;};
    setNode('sol',`${this._n(pv,0)} W`,solToHome,col.sol);
    setNode('mai',`${this._n(mai,0)} W`,mai>40,col.mai);
    setNode('res',`${this._n(grid,0)} W`,gridActive,col.res);
    setNode('bat',batCharge?`↓ ${this._n(batP,0)} W`:(batDischarge?`↑ ${this._n(-batP,0)} W`:`${this._n(soc,0)} %`),batCharge||batDischarge,col.bat);
    const dur=w=>w>1500?'1.1s':(w>500?'2s':'3s');
    const setPath=(id,active,w)=>{const p=sr.getElementById(id);if(!p)return;
      if(active){p.style.opacity='1';const d=dur(w);if(p.style.getPropertyValue('--flow-dur')!==d)p.style.setProperty('--flow-dur',d);}
      else p.style.opacity='0';};
    setPath('flow-sol-mai',solToHome,pv);
    setPath('flow-sol-bat',solToHome&&batCharge,pv);
    setPath('flow-res-mai',gridActive,grid);
    setPath('flow-bat-mai',batDischarge,Math.abs(batP));}
  _render(){if(!this._h)return;
    const c=this._c;
    const prevSc=this.shadowRoot.querySelector('.sheetScroll');const sy=prevSc?prevSc.scrollTop:0;
    const sheets=this._open?this._sheetRoomHtml():(this._sheet?this._setSheetHtml():'');
    this.shadowRoot.innerHTML=`<style>${this._css()}</style>
    <div class='wrap'>
      ${this._heroHtml()}
      ${this._ribbonHtml()}
      <div class='lowerCols'>
        <div class='fluxCol'>
          <div class='secTitle'>Flux</div>
          <div class='grid'>${c.rooms.map(r=>this._tile(r)).join('')}</div>
        </div>
        <div class='flowCol'>
          <div class='secTitle flowTitle'>Distribution d'énergie</div>
          ${this._flowDiagramHtml()}
        </div>
      </div>
    </div>${sheets}`;
    const newSc=this.shadowRoot.querySelector('.sheetScroll');if(newSc&&sy)newSc.scrollTop=sy;
    this.shadowRoot.querySelectorAll('[data-act]').forEach(el=>{el.addEventListener('click',e=>this._click(e));});
    this._patchFlows();
    this._lastStruct=this._structSig();}
  _click(e){const t=e.currentTarget;const act=t.dataset.act;const c=this._c;
    if(act==='back'){this._nav(c.back);return;}
    if(act==='sopen'){e.stopPropagation();this._sheet=true;this._last='';this._render();return;}
    if(act==='sclose'){this._sheet=false;this._last='';this._render();return;}
    if(act==='rclose'){this._open=null;this._last='';this._render();return;}
    if(act==='open'){this._open=t.dataset.k;this._last='';this._render();return;}}
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
.chip.ro{cursor:default}
.dot{width:8px;height:8px;border-radius:50%;background:currentColor;flex-shrink:0}
.chip.on .dot{background:#3ec3f7}
.ribbon{display:grid;grid-template-columns:repeat(2,1fr);gap:8px 4px;background:var(--glass);border:1px solid var(--stroke);border-radius:20px;backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);padding:13px 10px;margin:0 0 18px}
.rcell{text-align:center;padding:3px 10px}
.rv{font-size:20px;font-weight:700;letter-spacing:-.02em;line-height:1;white-space:nowrap}
.rl{font-size:10.5px;font-weight:700;color:var(--txt2);text-transform:uppercase;letter-spacing:.06em;margin-top:6px;white-space:nowrap}
.secTitle{font-size:18px;font-weight:700;color:#fff;margin:0 4px 12px}
.grid{display:grid;grid-template-columns:1fr;gap:11px}
.room{position:relative;background:var(--glass);border:1px solid var(--stroke);border-radius:18px;backdrop-filter:blur(28px);-webkit-backdrop-filter:blur(28px);padding:13px 18px;min-height:74px;display:flex;flex-direction:row;align-items:center;gap:14px;cursor:pointer;overflow:hidden;transition:background .25s,transform .15s,color .25s,box-shadow .25s}
.room:active{transform:scale(.97)}
.rText{min-width:0;flex:1}
.pastille{width:38px;height:38px;border-radius:50%;background:rgba(255,255,255,.1);display:flex;align-items:center;justify-content:center;color:#cfe9ff;flex-shrink:0}
.pastille.sOn{background:rgba(255,195,92,.22);color:#ffb340}
.pastille.bOn{background:rgba(111,220,255,.22);color:#6fdcff}
.room.on{background:rgba(255,255,255,.92);border-color:rgba(255,255,255,.95);color:#1c1c2e;box-shadow:0 8px 28px rgba(10,20,60,.25)}
.room.on .pastille{background:#3ec3f7;color:#fff}
.room.on .rSub{color:#0a7eb8;font-weight:600}
.rName{font-size:15px;font-weight:700}
.rSub{margin-top:3px;font-size:13px;font-weight:500;color:var(--txt2);transition:.25s}
.profil{font-size:11px;font-weight:700;letter-spacing:.06em;padding:4px 10px;border-radius:11px;background:rgba(255,255,255,.1);border:1px solid var(--stroke);color:#f4f5ff;text-transform:none;white-space:nowrap}
.flowTitle{margin-top:22px}
.flowSection{margin:0 0 28px;padding:14px 16px;background:var(--glass);border:1px solid var(--stroke);border-radius:22px;backdrop-filter:blur(28px);-webkit-backdrop-filter:blur(28px)}
.flowSvg{width:100%;max-width:430px;height:auto;display:block;margin:0 auto;overflow:visible}
.flow-bg{fill:none;stroke-width:2.5;stroke-opacity:.15;stroke-linecap:round}
.flow-line{fill:none;stroke-width:3;stroke-linecap:round;stroke-dasharray:10 20;animation:flowDash var(--flow-dur,2s) linear infinite var(--flow-dir,normal);transition:opacity .4s ease}
@keyframes flowDash{to{stroke-dashoffset:-30}}
.node-circle{fill:rgba(255,255,255,.05);stroke-width:1.5;transition:stroke .4s ease,stroke-width .4s ease}
.node-circle.active{stroke-width:2.5}
.node-val{fill:#fff;font-size:14px;font-weight:700;text-anchor:middle;transition:fill .3s}
.node-lab{fill:rgba(244,245,255,.65);font-size:12px;font-weight:600;text-anchor:middle}
.scrim{position:fixed;inset:0;background:rgba(10,12,40,.55);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);opacity:0;pointer-events:none;transition:.3s;z-index:998}
.scrim.open{opacity:1;pointer-events:auto}
.sheet{position:fixed;left:0;right:0;bottom:0;z-index:999;max-width:430px;margin:0 auto;background:linear-gradient(180deg,rgba(58,52,140,.95),rgba(28,26,82,.98));border:1px solid var(--stroke);border-bottom:none;border-radius:32px 32px 0 0;backdrop-filter:blur(30px);-webkit-backdrop-filter:blur(30px);padding:14px 20px calc(28px + env(safe-area-inset-bottom));transform:translateY(105%);transition:transform .35s cubic-bezier(.32,.72,.25,1)}
.sheet.open{transform:translateY(0)}
.grab{width:42px;height:5px;border-radius:3px;background:rgba(255,255,255,.3);margin:0 auto 14px}
.sheetHead{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}
.sheetHead h2{font-size:20px;font-weight:700}
.close{font-size:14px;color:var(--txt2);background:none;border:none;font-family:inherit;padding:6px 10px;cursor:pointer}
.closeX{width:36px;height:36px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;padding:0;background:rgba(255,255,255,.08);border:1px solid var(--stroke);color:#f4f5ff;transition:.15s}
.closeX:hover{background:rgba(255,255,255,.14)}
.closeX:active{transform:scale(.92);background:rgba(255,255,255,.18)}
.sGrp{font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--txt2);margin:22px 6px 8px;opacity:.85}
.sCard{background:rgba(255,255,255,.05);border:1px solid var(--stroke);border-radius:18px;backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);overflow:hidden}
.sRow{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:13px 16px;border-top:1px solid rgba(255,255,255,.06)}
.sRow:first-child{border-top:none}
.sLab{flex:1;min-width:0;font-size:14.5px;font-weight:600;color:#f4f5ff}
.sCtrl{flex-shrink:0}
.sVal{color:var(--cool);font-weight:700;font-size:15px}
.sNote{font-size:12px;color:var(--txt2);padding:14px 6px 4px;line-height:1.5;opacity:.8;font-style:italic}
.dial{display:flex;align-items:center;justify-content:center;gap:22px;margin:4px 0 18px}
.target{text-align:center}
.tval{font-size:54px;font-weight:700;letter-spacing:-.03em;line-height:1;color:var(--cool)}
.tlab{font-size:13px;color:var(--txt2);margin-top:4px}
.statRow{display:flex;justify-content:space-between;align-items:center;padding:14px 4px;border-top:1px solid rgba(255,255,255,.1);font-size:15px}
.statRow span{color:var(--txt2)}
.statRow b{color:#fff;font-weight:700}
.whyRow{margin:0 0 12px;padding:11px 14px;border-radius:14px;font-size:13px;font-weight:600;background:rgba(255,255,255,.08);border:1px solid var(--stroke);color:var(--txt2);text-align:center;line-height:1.5}
.rowNote{font-size:12px;color:var(--txt2);padding:6px 4px 4px;line-height:1.5}
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
.heroRow{margin-top:0;width:470px;flex-shrink:0;align-self:center}
.sv{font-size:40px}
.secTitle{font-size:20px;margin:6px 4px 14px}
.lowerCols{display:flex;gap:24px;align-items:flex-start}
.fluxCol{flex:1;min-width:0}
.flowCol{flex:0 0 440px}
.flowCol .flowSection{margin-bottom:0}
.flowCol .flowSvg{max-width:380px}
.ribbon{grid-template-columns:repeat(4,1fr);padding:15px 14px}
.rcell:not(:first-child){border-left:1px solid rgba(255,255,255,.14)}
.rv{font-size:23px}
}`;}
  getCardSize(){return 6;}
}
customElements.define('solar-glass-card',SolarGlassCard);
window.customCards=window.customCards||[];
window.customCards.push({type:'solar-glass-card',name:'Solar Glass Card',description:'Vue solaire énergie Liquid Glass'});