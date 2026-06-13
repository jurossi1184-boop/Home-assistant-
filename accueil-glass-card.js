/* accueil-glass-card v27 — glisser vers le bas pour fermer les pop-ups (détail météo + panneau auto) ; fix scroll page (ne remonte plus au clic) ; nettoyage + fix palette hero (hex) + code mort purgé
   Palette hero adaptative (toutes couleurs) · patch ciblé anti-sursaut · badges ⚡🔥📍
   Tokens : --glass .11 / --stroke .16 / --r 26px / blur 24px / max 1100px / @container 880px */
class AccueilGlassCard extends HTMLElement{
  constructor(){super();this.attachShadow({mode:'open'});this._last='';this._sheetDay=null;this._hf=null;this._hfTs=0;this._autoPanel=false;}
  setConfig(cfg){
    this._c=Object.assign({
      tIntRdc:'sensor.alsace_zone_rdc_circuit_1_current_temperature',
      tIntEtage:'sensor.alsace_zone_etage_circuit_0_current_temperature',
      tExt:'sensor.alsace_outdoor_temperature',
      meteo:'weather.meteo_france_forecast_for_city_lagny_sur_marne_ile_de_france_77_fr_lagny_sur_marne',
      sun:'sun.sun',
      conso:'sensor.consommation_reelle_maison',
      pv:'sensor.jackery_home_pv_power',
      soc:'sensor.jackery_home_battery_soc',
      batP:'sensor.jackery_battery_power',
      coutJ:'sensor.cout_aujourd_hui_avec_abonnement',
      volets:'sensor.volets_ouverts',
      clims:'sensor.clims_actives',
      ecs:'water_heater.alsace_domestic_hot_water_0',
      ecsT:'sensor.alsace_domestic_hot_water_0_tank_temperature',
      away:'switch.alsace_away_mode',
      auto:'input_boolean.clim_pilotage_auto',
      free:'input_boolean.freecooling_nocturne_actif',
      svRdc:'sensor.alsace_zone_rdc_circuit_1_current_special_function',
      svEt:'sensor.alsace_zone_etage_circuit_0_current_special_function',
      fenParents:'binary_sensor.myggbett_door_window_sensor_porte',
      fenLeandre:'binary_sensor.myggbett_door_window_sensor_porte_2',
      fenLouise:'binary_sensor.myggbett_door_window_sensor_porte_3',
      four:'sensor.four_machine_state',
      lv:'sensor.siemens_016010396329000301_bsh_common_status_operationstate',
      climEntities:['climate.salon','climate.chambre_parents','climate.chambre_louise','climate.chambre_leandre'],
      climAutomations:[
        {g:'Pilotage',items:[
          {e:'automation.clim_salon_refroidissement_solaire',l:'Refroidit le salon au soleil'},
          {e:'automation.clim_etage_refroidissement_chambres',l:'Refroidit les chambres le soir'},
          {e:'automation.clim_deshumidification_auto_etage',l:'Déshumidifie l\'étage'},
          {e:'automation.clim_deshumidification_auto_salon_rdc',l:'Déshumidifie le salon (RDC)'},
          {e:'automation.clim_sechage_apres_deshu_ventilation_10_min',l:'Sèche l\'unité après déshu'}
        ]},
        {g:'Sécurités',items:[
          {e:'automation.clim_chambres_coupure_si_fenetre_ouverte',l:'Coupe la clim si fenêtre chambre ouverte'},
          {e:'automation.gardien_fenetre_ouverte_clim_coupee',l:'Garde la clim coupée tant que fenêtre ouverte'},
          {e:'automation.clim_garde_fou_anti_chauffage_pac_prioritaire',l:'Empêche clim et chauffage en même temps'}
        ]},
        {g:'Mode manuel',items:[
          {e:'automation.clim_detection_manuel_thermostat',l:'Détecte un réglage à la main'},
          {e:'automation.clim_mode_manuel_slider',l:'Applique le curseur de température'},
          {e:'automation.clim_mode_manuel_auto_off_quand_tout_est_eteint',l:'Repasse en auto quand tout est éteint'}
        ]},
        {g:'Minuterie & maître',items:[
          {e:'automation.clim_interrupteur_maitre_automatisations',l:'Interrupteur maître (relais)'},
          {e:'automation.clim_minuterie_echue',l:'Éteint la clim à la fin du minuteur'},
          {e:'automation.clim_annule_la_minuterie_a_l_extinction_manuelle',l:'Annule minuterie si extinction manuelle'},
          {e:'automation.clim_annule_minuterie_si_extinction_hors_fenetre',l:'Annule minuterie hors plage horaire'}
        ]}
      ],
      coverEntities:['cover.chambre_2','cover.chambre_3','cover.chambre_leandre','cover.cuisine','cover.salon_devant','cover.sejour_jardin','cover.terrasse'],
      manuelVolets:['input_boolean.volets_manuel_terrasse','input_boolean.volets_manuel_cuisine','input_boolean.volets_manuel_sejour_jardin','input_boolean.volets_manuel_leandre'],
      socMin:20,
      socCritical:10,
      pvActiveThreshold:300,
      caniculeThreshold:32,
      allClosedThreshold:5,
      navClim:'/dashboard-test/clim',
      navVolets:'/dashboard-test/volets-glass',
      navPac:'/dashboard-test/pac-glass',
      navSolar:'/dashboard-test/solar-glass'
    },cfg||{});
  }
  getCardSize(){return 10;}
  set hass(h){
    this._h=h;this._loadForecast();
    const fp=this._fp();
    if(fp===this._last)return;
    this._last=fp;
    const m=this._model();
    const st=this._structSig(m);
    if(st===this._lastStruct&&this.shadowRoot.querySelector('.wrap')){
      this._patch(m); // valeurs seules → patch ciblé, pas de reconstruction DOM
    }else{
      this._lastStruct=st;
      this._render(m);
    }
  }
  async _loadForecast(){
    const now=Date.now();
    if(this._fcTs&&now-this._fcTs<1800000)return;
    this._fcTs=now;
    try{
      const r=await this._h.callWS({type:'call_service',domain:'weather',service:'get_forecasts',service_data:{type:'daily'},target:{entity_id:this._c.meteo},return_response:true});
      const resp=r&&(r.response||r);
      const f=resp&&resp[this._c.meteo]&&resp[this._c.meteo].forecast;
      if(f&&f.length){this._fc=f.slice(0,3);const m=this._model();this._lastStruct=this._structSig(m);this._render(m);}
    }catch(e){}
  }
  _s(e){const st=this._h&&this._h.states[e];return st?st.state:null;}
  _condNuit(cond){
    // Météo France renvoie souvent sunny la nuit → corriger selon sun.sun
    if(this._s(this._c.sun)==='below_horizon'){
      if(cond==='sunny')return 'clear-night';
      if(cond==='partlycloudy')return 'cloudy';
    }
    return cond;
  }
  _climAutoFlat(){const g=this._c.climAutomations||[];return g.reduce((acc,sec)=>acc.concat(sec.items||[]),[]);}
  _f(e,d){const v=parseFloat(this._s(e));return isNaN(v)?(d===undefined?0:d):v;}
  _fp(){
    const c=this._c;
    const r=(e,div)=>{const v=parseFloat(this._s(e));return isNaN(v)?'?':Math.round(v/(div||1));};
    const raw=[c.meteo,c.sun,c.volets,c.clims,c.ecs,c.away,c.auto,c.free,c.svRdc,c.svEt,c.fenParents,c.fenLeandre,c.fenLouise,c.four,c.lv].concat(c.climEntities).concat(c.manuelVolets).concat(c.coverEntities).concat(this._climAutoFlat().map(a=>a.e)).map(e=>this._s(e));
    const nums=[r(c.tIntRdc,0.1),r(c.tIntEtage,0.1),r(c.tExt,1),r(c.conso,20),r(c.pv,20),r(c.soc,1),r(c.batP,20),r(c.coutJ,0.01),r(c.ecsT,1)];
    return raw.join('|')+'#'+nums.join('|')+'#'+(this._fc?this._fc.map(d=>d.datetime+d.temperature).join(','):'');
  }
  _nav(p){history.pushState(null,'',p);window.dispatchEvent(new CustomEvent('location-changed',{bubbles:true,composed:true}));}
  _call(d,s,data){this._h.callService(d,s,data);}
  _coverSeq(service,delayStart){
    const c=this._c;
    const base=delayStart||0;
    c.coverEntities.forEach((e,i)=>{
      setTimeout(()=>this._call('cover',service,{entity_id:e}),base+i*600);
    });
  }
  async _loadHourly(){
    const now=Date.now();
    if(this._hfTs&&now-this._hfTs<1800000&&this._hf)return;
    this._hfTs=now;
    try{
      const r=await this._h.callWS({type:'call_service',domain:'weather',service:'get_forecasts',service_data:{type:'hourly'},target:{entity_id:this._c.meteo},return_response:true});
      const resp=r&&(r.response||r);
      const f=resp&&resp[this._c.meteo]&&resp[this._c.meteo].forecast;
      if(f&&f.length){this._hf=f;const m=this._model();this._lastStruct=this._structSig(m);this._render(m);}
    }catch(e){}
  }
  _openSheet(i){this._sheetDay=i;this._loadHourly();const m=this._model();this._lastStruct=this._structSig(m);this._render(m);}
  _closeSheet(){this._sheetDay=null;const m=this._model();this._lastStruct=this._structSig(m);this._render(m);}
  _openAuto(){this._autoPanel=true;const m=this._model();this._lastStruct=this._structSig(m);this._render(m);}
  _closeAuto(){this._autoPanel=false;const m=this._model();this._lastStruct=this._structSig(m);this._render(m);}
  _autoPanelHtml(){
    if(!this._autoPanel)return '';
    const c=this._c;
    const groups=(c.climAutomations||[]).map(sec=>{
      const items=sec.items||[];
      const secOff=items.filter(a=>this._s(a.e)==='off').length;
      const rows=items.map(a=>{
        const on=this._s(a.e)==='on';
        return `<div class="apRow ${on?'apOn':'apOff'}" data-autotoggle="${a.e}">
          <span class="apName">${a.l}</span>
          <span class="apSw ${on?'apSwOn':''}"><span class="apKnob"></span></span>
        </div>`;
      }).join('');
      return `<div class="apGroup">
        <div class="apGHead"><span class="apGTitle">${sec.g}</span><div class="apGRight"><span class="apGCount ${secOff>0?'apGWarn':''}">${items.length-secOff}/${items.length}</span><span class="apGSw ${secOff===0?'apGSwOn':''}" data-secsw="${secOff===0?'off':'on'}" data-secents="${items.map(a=>a.e).join(',')}"><span class="apGKnob"></span></span></div></div>
        ${rows}
      </div>`;
    }).join('');
    const flat=this._climAutoFlat();
    const off=flat.filter(a=>this._s(a.e)==='off').length;
    const total=flat.length;
    return `
      <div class="veil" data-closeauto="1"></div>
      <div class="sheet apSheet">
        <div class="shHead">
          ${this._ic('snow','shBig')}
          <div class="shTit">
            <span class="shJ">Automatisations clim</span>
            <span class="shC">${total-off}/${total} actives${off>0?` · ${off} désactivée${off>1?'s':''}`:''}</span>
          </div>
          <button class="shX" data-closeauto="1">✕</button>
        </div>
        <div class="apActions">
          <button class="apBtn ${off===0?'apKill':'apAllOn'}" data-autoall="${off===0?'off':'on'}">${this._ic('power','abi')}<span>${off===0?'Tout couper':'Tout activer'}</span></button>
        </div>
        <div class="apList">${groups}</div>
      </div>`;
  }
  _windDir(b){const d=['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSO','SO','OSO','O','ONO','NO','NNO'];return d[Math.round(b/22.5)%16];}
  _sheetHtml(){
    if(this._sheetDay===null||!this._fc||!this._fc[this._sheetDay])return '';
    const c=this._c,i=this._sheetDay,d=this._fc[i];
    const dt=new Date(d.datetime);
    const jour=i===0?"Aujourd'hui":dt.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'});
    const cond=i===0?this._condNuit(this._s(c.meteo)||d.condition):d.condition;
    const icHtml=this._coloredMeteo(cond, 'shBig');
    const st=this._h.states[c.meteo];
    const at=(st&&st.attributes)||{};
    const dets=[];
    if(i===0&&at.temperature!==undefined)dets.push({ic:'therm',l:'Actuel',v:`${Number(at.temperature).toFixed(1)}°`});
    const hum=i===0&&at.humidity!==undefined?at.humidity:d.humidity;
    if(hum!==undefined)dets.push({ic:'drop',l:'Humidité',v:`${Math.round(hum)}%`});
    if(i===0&&at.wind_speed!==undefined)dets.push({ic:'fan',l:'Vent',v:`${Math.round(at.wind_speed)} km/h${at.wind_bearing!==undefined?' '+this._windDir(at.wind_bearing):''}`});
    dets.push({ic:'drop',l:'Précip. jour',v:`${(d.precipitation||0).toFixed(d.precipitation>0&&d.precipitation<10?1:0)} mm`});
    const detHtml=dets.map(x=>`<div class="shChip">${this._ic(x.ic,'shi')}<div class="cTxt"><span class="cV">${x.v}</span><span class="cL">${x.l}</span></div></div>`).join('');
    const now=Date.now();
    const hours=(this._hf||[]).filter(h=>{
      const hd=new Date(h.datetime);
      if(hd.getDate()!==dt.getDate()||hd.getMonth()!==dt.getMonth())return false;
      return i===0?hd.getTime()>=now-3600000:true;
    });
    const hHtml=hours.length?hours.map(h=>{
      const hd=new Date(h.datetime);
      return `<div class="hCell">
        <span class="hH">${hd.getHours()}h</span>
        ${this._coloredMeteo(h.condition, 'hci')}
        <span class="hT">${Math.round(h.temperature)}°</span>
        <span class="hP${h.precipitation>0?'':' hP0'}">${h.precipitation>0?h.precipitation.toFixed(1)+' mm':'·'}</span>
      </div>`;
    }).join('')
    :`<div class="hEmpty">${this._hf?'Prévision horaire indisponible pour ce jour':'Chargement…'}</div>`;
    return `
      <div class="veil" data-close="1"></div>
      <div class="sheet">
        <div class="shHead">
          ${icHtml}
          <div class="shTit">
            <span class="shJ">${jour}</span>
            <span class="shC">${this._meteoFr(cond)} · ${Math.round(d.temperature)}° <span class="fcMin">/ ${Math.round(d.templow)}°</span></span>
          </div>
          <button class="shX" data-close="1">✕</button>
        </div>
        <div class="shDets">${detHtml}</div>
        <div class="shSub">Heure par heure</div>
        <div class="hRow">${hHtml}</div>
      </div>`;
  }
  _coloredMeteo(s, cls){
    if(s==='partlycloudy'){
      return `<div class="fcIcPair">${this._ic('cloud','fcCloud')}${this._ic('sun','fcSun')}</div>`;
    }
    const m = {
      'sunny': `<svg class="${cls}" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" fill="#FFC35C"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4l1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4m11.4-11.4l1.4-1.4" stroke="#FFC35C" stroke-width="2" stroke-linecap="round"/></svg>`,
      'clear-night': `<svg class="${cls}" viewBox="0 0 24 24"><path d="M20 13.8A8 8 0 0 1 10.2 4a7.5 7.5 0 1 0 9.8 9.8z" fill="#FFC35C"/></svg>`,
      'cloudy': `<svg class="${cls}" viewBox="0 0 24 24"><path d="M7 18a5 5 0 0 1 0-10h.5a7 7 0 0 1 14 2 5 5 0 0 1-4.5 8H7z" fill="#6FDCFF"/></svg>`,
      'fog': `<svg class="${cls}" viewBox="0 0 24 24"><path d="M7 18a5 5 0 0 1 0-10h.5a7 7 0 0 1 14 2 5 5 0 0 1-4.5 8H7z" fill="#6FDCFF"/></svg>`,
      'rainy': `<svg class="${cls}" viewBox="0 0 24 24"><path d="M7 16a5 5 0 0 1 0-10h.5a7 7 0 0 1 14 2 5 5 0 0 1-4.5 8H7z" fill="#6FDCFF"/><path d="M9 17l-1 4m4-4l-1 4m4-4l-1 4" stroke="#6FDCFF" stroke-width="2" stroke-linecap="round"/></svg>`,
      'pouring': `<svg class="${cls}" viewBox="0 0 24 24"><path d="M7 15a5 5 0 0 1 0-10h.5a7 7 0 0 1 14 2 5 5 0 0 1-4.5 8H7z" fill="#6FDCFF"/><path d="M7 16l-1 3m4-3l-1 3m4-3l-1 3m4-3l-1 3" stroke="#6FDCFF" stroke-width="2" stroke-linecap="round"/></svg>`,
      'lightning': `<svg class="${cls}" viewBox="0 0 24 24"><path d="M7 17a5 5 0 0 1 0-10h.5a7 7 0 0 1 14 2 5 5 0 0 1-4.5 8H7z" fill="#6FDCFF"/><path d="M13 15l-3 4h4l-2 4" stroke="#FFC35C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`,
      'lightning-rainy': `<svg class="${cls}" viewBox="0 0 24 24"><path d="M7 17a5 5 0 0 1 0-10h.5a7 7 0 0 1 14 2 5 5 0 0 1-4.5 8H7z" fill="#6FDCFF"/><path d="M13 15l-3 4h4l-2 4" stroke="#FFC35C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`,
      'snowy': `<svg class="${cls}" viewBox="0 0 24 24"><path d="M7 16a5 5 0 0 1 0-10h.5a7 7 0 0 1 14 2 5 5 0 0 1-4.5 8H7z" fill="#6FDCFF"/><path d="M9 18v2m-1-1h2m3-1v2m-1-1h2m3-1v2m-1-1h2" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>`,
      'snowy-rainy': `<svg class="${cls}" viewBox="0 0 24 24"><path d="M7 16a5 5 0 0 1 0-10h.5a7 7 0 0 1 14 2 5 5 0 0 1-4.5 8H7z" fill="#6FDCFF"/><path d="M9 17l-1 3m4-2v2m-1-1h2m3-2l-1 3" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>`,
      'hail': `<svg class="${cls}" viewBox="0 0 24 24"><path d="M7 16a5 5 0 0 1 0-10h.5a7 7 0 0 1 14 2 5 5 0 0 1-4.5 8H7z" fill="#6FDCFF"/><circle cx="9" cy="19" r="1" fill="#fff"/><circle cx="15" cy="19" r="1" fill="#fff"/></svg>`,
      'windy': `<svg class="${cls}" viewBox="0 0 24 24"><path d="M7 18a5 5 0 0 1 0-10h.5a7 7 0 0 1 14 2 5 5 0 0 1-4.5 8H7z" fill="#6FDCFF"/><path d="M10 21h4M8 23h8" stroke="#6FDCFF" stroke-width="2" stroke-linecap="round"/></svg>`,
      'windy-variant': `<svg class="${cls}" viewBox="0 0 24 24"><path d="M7 18a5 5 0 0 1 0-10h.5a7 7 0 0 1 14 2 5 5 0 0 1-4.5 8H7z" fill="#6FDCFF"/><path d="M10 21h4M8 23h8" stroke="#6FDCFF" stroke-width="2" stroke-linecap="round"/></svg>`
    };
    return m[s] || m['cloudy'];
  }
  _meteoFr(s){
    const m={'clear-night':'Nuit claire',cloudy:'Nuageux',exceptional:'Exceptionnel',fog:'Brouillard',hail:'Grêle',lightning:'Orages','lightning-rainy':'Orages pluvieux',partlycloudy:'Éclaircies',pouring:'Pluie forte',rainy:'Pluie',snowy:'Neige','snowy-rainy':'Neige fondue',sunny:'Ensoleillé',windy:'Venteux','windy-variant':'Venteux'};
    return m[s]||s||'—';
  }
  _ic(n,s){
    const p={
      home:'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
      therm:'M15 13V5a3 3 0 0 0-6 0v8a5 5 0 1 0 6 0zM12 4a1 1 0 0 1 1 1v3h-2V5a1 1 0 0 1 1-1z',
      flash:'M7 2v11h3v9l7-12h-4l4-8z',
      sun:'M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0-5l2 3h-4l2-3zm0 20l-2-3h4l-2 3zM2 12l3-2v4l-3-2zm20 0l-3 2v-4l3 2zM5 5l3.5.7L6 8.2 5 5zm14 14l-3.5-.7 2.5-2.5L19 19zM19 5l-.7 3.5L15.8 6 19 5zM5 19l.7-3.5L8.2 18 5 19z',
      bat:'M16 4h-1V2h-6v2H8a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1z',
      eur:'M15 18.5A6.5 6.5 0 0 1 8.7 14H14v-2H8.2a6 6 0 0 1 0-2H14V8H8.7a6.5 6.5 0 0 1 10.8-2.3l1.4-1.4A8.5 8.5 0 0 0 6.6 8H4v2h2.1a8 8 0 0 0 0 2H4v2h2.6a8.5 8.5 0 0 0 14.3 3.7l-1.4-1.4a6.5 6.5 0 0 1-4.5 2.2z',
      snow:'M22 11h-4.2l3.3-3.3-1.4-1.4L15 11h-2V9l4.7-4.7-1.4-1.4L13 6.2V2h-2v4.2L7.7 2.9 6.3 4.3 11 9v2H9L4.3 6.3 2.9 7.7 6.2 11H2v2h4.2l-3.3 3.3 1.4 1.4L9 13h2v2l-4.7 4.7 1.4 1.4 3.3-3.3V22h2v-4.2l3.3 3.3 1.4-1.4-3.3-3.3H22z',
      shutter:'M3 4h18v3H3V4zm0 5h18v2H3V9zm0 4h18v2H3v-2zm0 4h18v2H3v-2z',
      fire:'M12 23a7.5 7.5 0 0 0 7.5-7.5c0-5-7.5-13.5-7.5-13.5S4.5 10.5 4.5 15.5A7.5 7.5 0 0 0 12 23z',
      win:'M6 2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2h-2V4H6V2zm-2 4h10v16H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z',
      boiler:'M12 2a6 6 0 0 0-6 6v8a6 6 0 0 0 12 0V8a6 6 0 0 0-6-6zm0 16a3 3 0 0 1-3-3c0-2 3-5.4 3-5.4S15 13 15 15a3 3 0 0 1-3 3z',
      fan:'M12 11a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm.5-9C18 2 18.8 7.3 15 8.5c-1 .4-1.8 1-2.3 1.9a3 3 0 0 0-1.2-.4C12 6.7 9 2 12.5 2zM2 11.5C2 6 7.3 5.2 8.5 9c.4 1 1 1.8 1.9 2.3a3 3 0 0 0-.4 1.2C6.7 12 2 15 2 11.5zM11.5 22C6 22 5.2 16.7 9 15.5c1-.4 1.8-1 2.3-1.9.4.2.8.3 1.2.4 0 3.3 3 8-1 8zM22 12.5c0 5.5-5.3 6.3-6.5 2.5-.4-1-1-1.8-1.9-2.3.2-.4.3-.8.4-1.2 3.3 0 8-3 8 1z',
      power:'M13 3h-2v10h2V3zm5.1 2.9l-1.4 1.4A7 7 0 1 1 7.3 7.3L5.9 5.9a9 9 0 1 0 12.2 0z',
      away:'M12 3 2 12h3v8h6v-6h2v6h6v-8h3L12 3zm7 16h-2v-6H7v6H5v-9.2l7-6.3 7 6.3V19zM3.4 21.7l-1.4-1.4L20.3 2 21.7 3.4 3.4 21.7z',
      pump:'M4 4h16a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zm4 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm0 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm9-1h2v6h-2V9z',
      drop:'M12 2S5.5 9.2 5.5 14a6.5 6.5 0 0 0 13 0C18.5 9.2 12 2 12 2z',
      stove:'M4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm2 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm12 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM6 14h12v4H6v-4z',
      dish:'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm0-14a6 6 0 1 0 0 12 6 6 0 0 0 0-12z',
      check:'M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z',
      cloud:'M7 18a5 5 0 0 1 0-10h.5a7 7 0 0 1 14 2 5 5 0 0 1-4.5 8H7z'
    };
    return `<svg class="${s||'i'}" viewBox="0 0 24 24" fill="currentColor"><path d="${p[n]||p.home}"/></svg>`;
  }
  _paletteDynamique(){
    const c=this._c;
    const climOn=c.climEntities.some(e=>['off','unavailable','unknown',null].indexOf(this._s(e))===-1);
    const nVolets=this._f(c.volets);
    const voletsFermes=nVolets<c.allClosedThreshold;
    const pv=this._f(c.pv);
    const pvActif=pv>c.pvActiveThreshold;
    const batP=this._f(c.batP);
    const batActive=Math.abs(batP)>40;
    
    if(climOn)return {color:'#6fdcff',ic:'snow',label:'Clim active'};
    if(voletsFermes)return {color:'#ffc35c',ic:'shutter',label:'Ombrage actif'};
    if(pvActif)return {color:'#ffb340',ic:'sun',label:'Solaire actif'};
    if(batActive)return {color:'#6fdcff',ic:'bat',label:'Batterie active'};
    return {color:null,ic:null,label:null};
  }
  _alerts(){
    const c=this._c,a=[];
    const soc=this._f(c.soc,100);
    const batP=this._f(c.batP);
    const tMax=this._fc&&this._fc[0]?this._fc[0].temperature:null;
    const ecs=this._s(c.ecs);
    if(ecs==='Manual'||ecs==='Cylinder Boost')a.push({ic:'boiler',cl:'aHeat',t:'Eau chaude en chauffe',sub:`Ballon ${this._f(c.ecsT).toFixed(0)}°C`,nav:c.navPac});
    if(soc<c.socMin)a.push({ic:'bat',cl:'aWarn',t:'Batterie faible',sub:`${soc.toFixed(0)}% · injection ${Math.abs(batP).toFixed(0)} W`,nav:c.navSolar});
    if(tMax!==null&&tMax>c.caniculeThreshold)a.push({ic:'fire',cl:'aWarn',t:'Canicule prévue',sub:`Demain jusqu'à ${Math.round(tMax)}°C`,nav:c.navVolets});
    if(this._s(c.free)==='on')a.push({ic:'fan',cl:'aCool',t:'Freecooling actif',sub:'Ouvre les fenêtres pour rafraîchir',nav:c.navClim});
    if(this._s(c.away)==='on')a.push({ic:'away',cl:'aInfo',t:'Mode absent',sub:'PAC en éco',nav:c.navPac});
    const sv1=this._s(c.svRdc),sv2=this._s(c.svEt);
    if((sv1&&sv1!=='None'&&sv1!=='unknown')||(sv2&&sv2!=='None'&&sv2!=='unknown'))a.push({ic:'fire',cl:'aHeat',t:'PAC — Quick Veto actif',sub:'Dérogation temporaire en cours',nav:c.navPac});
    const fen=[[c.fenParents,'Parents'],[c.fenLeandre,'Léandre'],[c.fenLouise,'Louise']].filter(f=>this._s(f[0])==='on').map(f=>f[1]);
    if(fen.length)a.push({ic:'win',cl:'aWarn',t:fen.length>1?'Fenêtres ouvertes':'Fenêtre ouverte',sub:`Chambre${fen.length>1?'s':''} ${fen.join(', ')} — clim coupée`,nav:c.navClim});
    if(this._s(c.four)==='running')a.push({ic:'stove',cl:'aHeat',t:'Four en cuisson',sub:'En cours'});
    if((this._s(c.lv)||'').indexOf('OperationState.Run')>-1)a.push({ic:'dish',cl:'aCool',t:'Lave-vaisselle en cycle',sub:'En cours'});
    return a;
  }
  _model(){
    const c=this._c;
    const now=new Date();
    const salut=now.getHours()>=18?'Bonsoir':(now.getHours()<6?'Bonne nuit':'Bonjour');
    const dateFr=now.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'});
    const tRdc=this._f(c.tIntRdc),tEt=this._f(c.tIntEtage),tExt=this._f(c.tExt);
    const conso=this._f(c.conso),pv=this._f(c.pv),soc=this._f(c.soc),cout=this._f(c.coutJ);
    const nVolets=this._f(c.volets),climsTxt=this._s(c.clims)||'—';
    const climOn=c.climEntities.some(e=>['off','unavailable','unknown',null].indexOf(this._s(e))===-1);
    const autoOn=this._s(c.auto)==='on';
    const autoOff=this._climAutoFlat().filter(a=>this._s(a.e)==='off').length;
    const awayOn=this._s(c.away)==='on';
    const ecsOn=['Manual','Cylinder Boost'].indexOf(this._s(c.ecs))>-1;
    const meteo=this._meteoFr(this._condNuit(this._s(c.meteo)));
    const alerts=this._alerts();
    const palette=this._paletteDynamique();
    const movingOpen=c.coverEntities.some(e=>this._s(e)==='opening');
    const movingClose=c.coverEntities.some(e=>this._s(e)==='closing');
    const socCritical=soc<c.socCritical;
    const manuelActif=c.manuelVolets.some(e=>this._s(e)==='on');
    const chipVals=[
      `${tRdc.toFixed(1)}°`,
      `${tEt.toFixed(1)}°`,
      `${soc.toFixed(0)}%`,
      conso>=1000?`${(conso/1000).toFixed(2)} kW`:`${conso.toFixed(0)} W`,
      `${pv.toFixed(0)} W`,
      `${cout.toFixed(2)} €`
    ];
    const tileSubs=[
      climOn?climsTxt:'Arrêtée',
      `${nVolets.toFixed(0)} ouvert${nVolets>1?'s':''}`+(manuelActif?' 📍':''),
      `ECS ${this._f(c.ecsT).toFixed(0)}°C${ecsOn?' · chauffe':''}`,
      `${pv.toFixed(0)} W · bat. ${soc.toFixed(0)}%${socCritical?' ⚡':''}`
    ];
    const eyeTxt=`${meteo} ${tExt.toFixed(0)}°`;
    return {c,salut,dateFr,climOn,autoOn,autoOff,awayOn,ecsOn,nVolets,climsTxt,alerts,palette,movingOpen,movingClose,chipVals,tileSubs,eyeTxt,pv,soc};
  }
  _structSig(m){
    // Signature structurelle : tout ce qui modifie le DOM autrement que des textes
    const fcSig=(this._s(m.c.meteo)||'')+(this._s(m.c.sun)||'')+'@'+(this._fc||[]).map(d=>d.datetime+d.condition+(d.precipitation>0?'P':'')).join(';');
    const alertSig=m.alerts.map(a=>a.ic+a.t+a.cl+(a.nav||'')).join(';');
    const btnSig=[m.autoOn,m.autoOff,m.awayOn,m.climOn,m.movingOpen,m.movingClose,m.nVolets<m.c.coverEntities.length,m.nVolets>0].join(',');
    const tileSig=[m.climOn,m.nVolets>0,m.ecsOn,m.pv>5].join(',');
    return [m.salut,m.dateFr,m.palette.color||'',alertSig,btnSig,tileSig,fcSig,this._sheetDay,this._autoPanel].join('#');
  }
  _patch(m){
    // Mise à jour ciblée : on ne touche que les textes, le DOM reste en place
    const sr=this.shadowRoot;
    const eye=sr.querySelector('.eyeMeteo');if(eye)eye.textContent=m.eyeTxt;
    sr.querySelectorAll('[data-cv]').forEach(el=>{const i=parseInt(el.getAttribute('data-cv'),10);if(m.chipVals[i]!==undefined)el.textContent=m.chipVals[i];});
    sr.querySelectorAll('[data-ai]').forEach(el=>{const i=parseInt(el.getAttribute('data-ai'),10);const s=el.querySelector('.aS');if(s&&m.alerts[i])s.textContent=m.alerts[i].sub;});
    sr.querySelectorAll('[data-ti]').forEach(el=>{const i=parseInt(el.getAttribute('data-ti'),10);const s=el.querySelector('.rSub');if(s&&m.tileSubs[i]!==undefined)s.textContent=m.tileSubs[i];});
    (this._fc||[]).forEach((d,i)=>{
      const day=sr.querySelector(`.fcDay[data-fc="${i}"]`);if(!day)return;
      const tMax=d.temperature!==undefined?Math.round(d.temperature):'—';
      const tMin=d.templow!==undefined?Math.round(d.templow):'—';
      const t=day.querySelector('.fcT');if(t)t.innerHTML=`${tMax}° <span class="fcMin">/ ${tMin}°</span>`;
      const p=day.querySelector('.fcP');if(p&&d.precipitation>0)p.innerHTML=`${this._ic('drop','fpi')}${d.precipitation.toFixed(d.precipitation<10?1:0)} mm`;
    });
  }
  _scroller(){let n=this;while(n){if(n.nodeType===1){const oy=getComputedStyle(n).overflowY;if((oy==='auto'||oy==='scroll')&&n.scrollHeight>n.clientHeight+2)return n;}let p=n.parentNode;if(!p){const r=n.getRootNode&&n.getRootNode();p=r&&r.host?r.host:null;}else if(p.nodeType===11){p=p.host||null;}n=p;}return document.scrollingElement||document.documentElement;}
  _attachSheetSwipe(){const sheet=this.shadowRoot.querySelector('.sheet');if(!sheet)return;const veil=this.shadowRoot.querySelector('.veil');const head=sheet.querySelector('.shHead');const scrollEl=sheet.querySelector('.apList')||sheet;let y0=0,sc0=0,dy=0,active=false,grabbed=false;const EASE='transform .3s cubic-bezier(.2,.8,.3,1)';sheet.addEventListener('touchstart',ev=>{if(ev.touches.length!==1)return;y0=ev.touches[0].clientY;sc0=scrollEl.scrollTop;dy=0;active=false;grabbed=!!(head&&ev.target.closest&&ev.target.closest('.shHead')&&!ev.target.closest('.shX'));sheet.style.animation='none';sheet.style.transition='none';if(veil)veil.style.transition='none';},{passive:true});sheet.addEventListener('touchmove',ev=>{if(ev.touches.length!==1)return;const d=ev.touches[0].clientY-y0;if(!active){if(d>4&&(sc0<=0||grabbed))active=true;else return;}dy=d>0?d:0;sheet.style.transform='translateY('+dy+'px)';if(veil)veil.style.opacity=String(Math.max(0,1-dy/400));if(ev.cancelable)ev.preventDefault();},{passive:false});const end=()=>{sheet.style.transition=EASE;if(veil)veil.style.transition='opacity .3s';if(active&&dy>90){sheet.style.transform='translateY(100%)';if(veil)veil.style.opacity='0';setTimeout(()=>{this._sheetDay=null;this._autoPanel=false;const m=this._model();this._lastStruct=this._structSig(m);this._render(m);},300);}else{sheet.style.transform='translateY(0)';if(veil)veil.style.opacity='';}active=false;dy=0;};sheet.addEventListener('touchend',end);sheet.addEventListener('touchcancel',end);}
  _render(m){
    if(!this._h)return;
    if(!m)m=this._model();
    const c=this._c;
    const psc=this._scroller();const py=psc?psc.scrollTop:0;
    const {salut,dateFr,climOn,autoOn,awayOn,ecsOn,nVolets,climsTxt,alerts,palette,movingOpen,movingClose,chipVals,tileSubs,eyeTxt}=m;

    const fcHtml=(this._fc||[]).map((d,i)=>{
      const dt=new Date(d.datetime);
      const jour=i===0?"Aujourd'hui":dt.toLocaleDateString('fr-FR',{weekday:'long'});
      const cond=i===0?this._condNuit(this._s(c.meteo)||d.condition):d.condition;
      const tMax=d.temperature!==undefined?Math.round(d.temperature):'—';
      const tMin=d.templow!==undefined?Math.round(d.templow):'—';
      const pluie=d.precipitation>0?`<span class="fcP">${this._ic('drop','fpi')}${d.precipitation.toFixed(d.precipitation<10?1:0)} mm</span>`:'';
      const icHtml=this._coloredMeteo(cond, 'fci');
      return `<div class="fcDay" data-fc="${i}">
        <span class="fcJ">${jour}</span>
        ${icHtml}
        <span class="fcC">${this._meteoFr(cond)}</span>
        <span class="fcT">${tMax}° <span class="fcMin">/ ${tMin}°</span></span>
        ${pluie}
      </div>`;
    }).join('');

    const pastilles=[
      autoOn?`<span class="pastille pOn pAuto" data-autopanel="1">${this._ic('check','pi')}Auto${m.autoOff>0?`<span class="pBadge">${m.autoOff}</span>`:''}</span>`:`<span class="pastille pMan pAuto" data-autopanel="1">${this._ic('power','pi')}Manuel${m.autoOff>0?`<span class="pBadge">${m.autoOff}</span>`:''}</span>`,
      climOn?`<span class="pastille pCool">${this._ic('snow','pi')}${climsTxt}</span>`:'',
      ecsOn?`<span class="pastille pHeat">${this._ic('drop','pi')}ECS</span>`:'',
      awayOn?`<span class="pastille pMan">${this._ic('away','pi')}Absent</span>`:''
    ].join('');

    const chipMeta=[{ic:'home',l:'RDC'},{ic:'therm',l:'Étage'},{ic:'bat',l:'Batterie'},{ic:'flash',l:'Conso'},{ic:'sun',l:'Solaire'},{ic:'eur',l:'Coût jour'}];
    const chips=chipMeta.map((x,i)=>`<div class="chip">${this._ic(x.ic,'ci')}<div class="cTxt"><span class="cV" data-cv="${i}">${chipVals[i]}</span><span class="cL">${x.l}</span></div></div>`).join('');

    const alertHtml=alerts.length?alerts.map((a,i)=>`
      <div class="alert ${a.cl} ${a.nav?'':'aStatic'}" data-nav="${a.nav||''}" data-ai="${i}">
        ${this._ic(a.ic,'ai')}
        <div class="aTxt"><span class="aT">${a.t}</span><span class="aS">${a.sub}</span></div>
        ${a.nav?'<span class="aGo">›</span>':''}
      </div>`).join('')
      :`<div class="alert aCalm">${this._ic('check','ai')}<div class="aTxt"><span class="aT">Tout est calme</span><span class="aS">Aucune alerte en cours</span></div></div>`;

    const voletsBtns=movingClose?[
      {id:'vcancelopen',ic:'shutter',l:'⏹ Annuler · rouvrir',on:true,cl:'man'},
      {id:'vstop',ic:'power',l:'Stop',on:false,cl:''}
    ]:movingOpen?[
      {id:'vcancelclose',ic:'shutter',l:'⏹ Annuler · refermer',on:true,cl:'man'},
      {id:'vstop',ic:'power',l:'Stop',on:false,cl:''}
    ]:[
      ...(nVolets<c.coverEntities.length?[{id:'vopen',ic:'shutter',l:'Ouvrir volets',on:false,cl:''}]:[]),
      ...(nVolets>0?[{id:'vclose',ic:'shutter',l:'Fermer volets',on:false,cl:''}]:[])
    ];
    const actions=[
      {id:'away',ic:'away',l:'Absent',on:awayOn,cl:awayOn?'man':''},
      ...(climOn?[{id:'climoff',ic:'snow',l:'Stop clim',on:climOn,cl:'cool'}]:[]),
      ...voletsBtns
    ].map(b=>`<button class="act ${b.cl}" data-act="${b.id}">${this._ic(b.ic,'bi')}<span>${b.l}</span></button>`).join('');

    const tiles=[
      {ic:'snow',n:'Climatisation',on:climOn,nav:c.navClim,cl:'tCool'},
      {ic:'shutter',n:'Volets',on:nVolets>0,nav:c.navVolets,cl:'tCool'},
      {ic:'pump',n:'Pompe à chaleur',on:ecsOn,nav:c.navPac,cl:'tHeat'},
      {ic:'sun',n:'Énergie',on:m.pv>5,nav:c.navSolar,cl:'tSun'}
    ].map((t,i)=>`
      <div class="room ${t.on?'rOn':''} ${t.cl}" data-nav="${t.nav}" data-ti="${i}">
        ${this._ic(t.ic,'sv')}
        <div class="rName">${t.n}</div>
        <div class="rSub">${tileSubs[i]}</div>
      </div>`).join('');

    const heroBg=palette.color?`background:linear-gradient(135deg,rgba(255,255,255,.11),rgba(255,255,255,.05));border:1px solid ${palette.color}33;box-shadow:inset 0 0 40px ${palette.color}11;`:`background:var(--glass);border:1px solid var(--stroke);`;

    this.shadowRoot.innerHTML=`
    <style>
      :host{--glass:rgba(255,255,255,.11);--stroke:rgba(255,255,255,.16);--txt2:rgba(244,245,255,.72);--cool:#6fdcff;--manual:#ffc35c;--heat:#ff9d6f;--okc:#7dffb2;--off:rgba(255,255,255,.35);--r:26px;display:block;color:#fff;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',Roboto,sans-serif;}
      .wrap{max-width:1100px;margin:0 auto;container-type:inline-size;padding:0 2px;}
      .hero{${heroBg}border-radius:var(--r);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);padding:18px 20px 16px;margin:4px 0 18px;transition:background .3s,border-color .3s,box-shadow .3s;}
      .eyebrow{display:flex;align-items:center;gap:10px;font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--txt2);min-height:36px;}
      .hTitle{font-size:30px;font-weight:800;letter-spacing:-.02em;margin:6px 0 2px;}
      .hSub{font-size:14px;color:var(--txt2);text-transform:capitalize;}
      .pastilles{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;}
      .pastille{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:700;padding:5px 11px;border-radius:999px;background:rgba(255,255,255,.10);color:var(--txt2);}
      .pi{width:13px;height:13px;}
      .pOn{background:rgba(125,255,178,.18);color:var(--okc);}
      .pMan{background:rgba(255,195,92,.22);color:var(--manual);}
      .pCool{background:rgba(111,220,255,.20);color:var(--cool);}
      .pHeat{background:rgba(255,157,111,.22);color:var(--heat);}
      .pAuto{cursor:pointer;position:relative;}
      .pAuto:active{transform:scale(.95);}
      .pBadge{display:inline-flex;align-items:center;justify-content:center;min-width:16px;height:16px;padding:0 4px;margin-left:2px;border-radius:999px;background:#ff5d5d;color:#fff;font-size:10px;font-weight:800;}
      .apSheet{max-width:520px;}
      .apList{margin-top:14px;display:flex;flex-direction:column;gap:16px;max-height:78vh;overflow-y:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;}
      .apList::-webkit-scrollbar{display:none;}
      .apGroup{display:flex;flex-direction:column;gap:8px;}
      .apGHead{display:flex;align-items:center;justify-content:space-between;padding:0 4px 2px;}
      .apGTitle{font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--txt2);}
      .apGCount{font-size:11px;font-weight:800;color:var(--okc);}
      .apGWarn{color:#ff8a8a;}
      .apGRight{display:flex;align-items:center;gap:10px;}
      .apGSw{width:36px;height:21px;border-radius:999px;background:rgba(255,255,255,.18);position:relative;cursor:pointer;transition:background .2s;flex:none;}
      .apGSwOn{background:var(--okc);}
      .apGKnob{position:absolute;top:2.5px;left:2.5px;width:16px;height:16px;border-radius:999px;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.3);transition:left .2s;}
      .apGSwOn .apGKnob{left:17.5px;}
      .apActions{display:flex;gap:10px;margin-top:14px;}
      .apBtn{flex:1;display:flex;align-items:center;justify-content:center;gap:7px;padding:12px;border-radius:16px;font-family:inherit;font-size:13.5px;font-weight:700;cursor:pointer;border:1px solid var(--stroke);background:rgba(255,255,255,.08);color:#fff;transition:transform .12s,background .15s;}
      .apBtn:active{transform:scale(.96);}
      .abi{width:16px;height:16px;}
      .apAllOn{background:rgba(125,255,178,.16);border-color:rgba(125,255,178,.3);color:var(--okc);}
      .apAllOn .abi{color:var(--okc);}
      .apKill{background:rgba(255,93,93,.14);border-color:rgba(255,93,93,.32);color:#ff8a8a;}
      .apKill .abi{color:#ff8a8a;}
      .apRow{display:flex;align-items:center;justify-content:space-between;gap:12px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.09);border-radius:16px;padding:13px 15px;cursor:pointer;transition:background .15s,transform .12s;}
      .apRow:active{transform:scale(.985);}
      .apName{font-size:14px;font-weight:700;color:#fff;}
      .apOff .apName{color:var(--txt2);}
      .apSw{flex:none;width:42px;height:25px;border-radius:999px;background:rgba(255,255,255,.18);position:relative;transition:background .2s;}
      .apSwOn{background:var(--okc);}
      .apKnob{position:absolute;top:2.5px;left:2.5px;width:20px;height:20px;border-radius:999px;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.3);transition:left .2s;}
      .apSwOn .apKnob{left:19.5px;}
      .heroR{margin-top:14px;}
      .chips{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;}
      .chip{display:flex;align-items:center;gap:9px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.10);border-radius:18px;padding:12px 10px;min-width:0;}
      .ci{width:18px;height:18px;flex:none;color:var(--txt2);}
      .cTxt{display:flex;flex-direction:column;min-width:0;}
      .cV{font-size:15px;font-weight:800;letter-spacing:-.01em;white-space:nowrap;}
      .cL{font-size:11px;color:var(--txt2);white-space:nowrap;}
      .secTitle{font-size:18px;font-weight:800;letter-spacing:-.01em;margin:20px 2px 10px;display:flex;align-items:center;gap:8px;}
      .alert{display:flex;align-items:center;gap:12px;background:var(--glass);border:1px solid var(--stroke);border-radius:22px;backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);padding:13px 16px;margin-bottom:10px;cursor:pointer;transition:transform .15s,background .15s;}
      .alert:active{transform:scale(.985);}
      .ai{width:22px;height:22px;flex:none;}
      .aTxt{display:flex;flex-direction:column;min-width:0;flex:1;}
      .aT{font-size:15px;font-weight:700;}
      .aS{font-size:12.5px;color:var(--txt2);}
      .aGo{font-size:22px;color:var(--off);font-weight:300;}
      .aHeat .ai{color:var(--heat);}
      .aCool .ai{color:var(--cool);}
      .aWarn .ai{color:var(--manual);}
      .aInfo .ai{color:var(--txt2);}
      .aCalm{cursor:default;}
      .aCalm .ai{color:var(--okc);}
      .aStatic{cursor:default;}
      .aStatic:active{transform:none;}
      .acts{display:flex;flex-wrap:wrap;gap:10px;overflow:hidden;}
      .act{display:flex;align-items:center;gap:8px;background:var(--glass);border:1px solid var(--stroke);border-radius:18px;backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);padding:12px 15px;color:#fff;font-family:inherit;font-size:13.5px;font-weight:700;cursor:pointer;transition:transform .15s,background .15s;}
      .act:active{transform:scale(.95);}
      .bi{width:17px;height:17px;color:var(--txt2);}
      .act.on{background:rgba(125,255,178,.16);border-color:rgba(125,255,178,.3);}
      .act.on .bi{color:var(--okc);}
      .act.man{background:rgba(255,195,92,.16);border-color:rgba(255,195,92,.3);}
      .act.man .bi{color:var(--manual);}
      .act.cool{background:rgba(111,220,255,.16);border-color:rgba(111,220,255,.3);}
      .act.cool .bi{color:var(--cool);}
      .fc{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;}
      .fcDay{background:var(--glass);border:1px solid var(--stroke);border-radius:22px;backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);padding:14px 10px;min-height:118px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;text-align:center;cursor:pointer;transition:transform .15s;}
      .fcDay:active{transform:scale(.97);}
      .eyeMeteo{cursor:pointer;}
      .veil{position:fixed;inset:0;background:rgba(8,10,18,.5);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);z-index:9;animation:fadeIn .2s ease;}
      .sheet{position:fixed;left:0;right:0;bottom:0;margin:0 auto;max-width:560px;background:rgba(28,32,48,.92);backdrop-filter:blur(30px);-webkit-backdrop-filter:blur(30px);border:1px solid var(--stroke);border-bottom:none;border-radius:26px 26px 0 0;padding:18px 18px calc(18px + env(safe-area-inset-bottom));z-index:10;animation:slideUp .25s cubic-bezier(.2,.8,.3,1);}
      @keyframes slideUp{from{transform:translateY(40px);opacity:0}to{transform:translateY(0);opacity:1}}
      @keyframes fadeIn{from{opacity:0}to{opacity:1}}
      .shHead{display:flex;align-items:center;gap:12px;}
      .shBig{width:38px;height:38px;flex:none;}
      .shTit{display:flex;flex-direction:column;flex:1;min-width:0;}
      .shJ{font-size:17px;font-weight:800;letter-spacing:-.01em;text-transform:capitalize;}
      .shC{font-size:13px;color:var(--txt2);}
      .shX{flex:none;width:32px;height:32px;border-radius:999px;border:1px solid var(--stroke);background:rgba(255,255,255,.08);color:var(--txt2);font-size:14px;cursor:pointer;}
      .shDets{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:14px;}
      .shChip{display:flex;align-items:center;gap:9px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.10);border-radius:18px;padding:12px 10px;min-width:0;}
      .shi{width:18px;height:18px;flex:none;color:var(--cool);}
      .shSub{font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--txt2);margin:16px 2px 8px;}
      .hRow{display:flex;gap:8px;overflow-x:auto;padding-bottom:6px;-webkit-overflow-scrolling:touch;scrollbar-width:none;}
      .hRow::-webkit-scrollbar{display:none;}
      .hCell{flex:none;width:58px;display:flex;flex-direction:column;align-items:center;gap:4px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.09);border-radius:16px;padding:10px 4px;}
      .hH{font-size:11px;font-weight:700;color:var(--txt2);}
      .hci{width:20px;height:20px;}
      .hT{font-size:14px;font-weight:800;}
      .hP{font-size:10px;font-weight:700;color:var(--cool);white-space:nowrap;}
      .hP0{color:transparent;}
      .hEmpty{font-size:13px;color:var(--txt2);padding:10px 2px;}
      .fcJ{font-size:12px;font-weight:700;letter-spacing:.04em;text-transform:capitalize;color:var(--txt2);}
      .fcIcPair{display:inline-flex;align-items:center;justify-content:center;position:relative;width:30px;height:30px;}
      .fcCloud{color:var(--cool);width:24px;height:24px;position:absolute;z-index:1;top:6px;left:2px;}
      .fcSun{color:var(--manual);width:18px;height:18px;position:absolute;z-index:2;top:-1px;left:3px;}
      .fci{width:30px;height:30px;}
      .fcC{font-size:11.5px;color:var(--txt2);}
      .fcT{font-size:16px;font-weight:800;letter-spacing:-.01em;}
      .fcMin{font-size:12.5px;font-weight:600;color:var(--off);}
      .fcP{display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:700;color:var(--cool);}
      .fpi{width:11px;height:11px;}
      .grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;}
      .room{background:var(--glass);border:1px solid var(--stroke);border-radius:22px;backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);padding:14px;min-height:118px;display:flex;flex-direction:column;justify-content:flex-end;gap:2px;cursor:pointer;position:relative;transition:transform .15s,background .15s;}
      .room:active{transform:scale(.97);}
      .sv{width:34px;height:34px;position:absolute;top:14px;left:14px;color:var(--off);}
      .rOn.tCool .sv{color:var(--cool);}
      .rOn .sv{color:#6b7280;}
      .rOn .rName{color:#1d1d1f;}
      .rOn .rSub{color:#6b7280;}
      .rOn.tCool{background:#fff;border-color:#e5e5e7;}
      .rOn.tHeat .sv{color:var(--heat);}
      .rOn.tHeat{background:#fff;border-color:#e5e5e7;}
      .rOn.tSun .sv{color:var(--manual);}
      .rOn.tSun{background:#fff;border-color:#e5e5e7;}
      .rName{font-size:15px;font-weight:800;letter-spacing:-.01em;}
      .rSub{font-size:12.5px;color:var(--txt2);}
      .room .sv{color:var(--off);}
      .duo{display:flex;flex-direction:column;}
      .foot{height:8px;}
      @container (min-width:880px){
        .hero{display:flex;align-items:center;justify-content:space-between;gap:32px;padding:18px 24px;min-height:150px;}
        .heroL{flex:none;}
        .heroR{flex:1;margin-top:0;}
        .chips{grid-template-columns:repeat(3,1fr);}
        .chip{padding:9px 10px;}
        .grid{grid-template-columns:repeat(4,1fr);}
        .room{min-height:104px;}
        .fcDay{min-height:96px;padding:10px 8px;gap:3px;}
        .fci{width:26px;height:26px;}
        .fcIcPair{width:26px;height:26px;}
        .sv{width:34px;height:34px;}
        .secTitle{margin:12px 2px 8px;}
        .hero{margin:4px 0 12px;}
        .duo{display:grid;grid-template-columns:1fr 1fr;gap:0 16px;align-items:start;}
        .alert{margin-bottom:8px;padding:11px 14px;}
        .act{padding:10px 14px;}
      }
      @container (min-width:470px) and (max-width:580px){.chips{grid-template-columns:repeat(3,1fr);}}
      @container (max-width:380px){.chips{grid-template-columns:repeat(2,1fr);}}
    </style>
    <div class="wrap">
      <div class="hero">
        <div class="heroL">
          <div class="eyebrow">${this._ic('home','pi')}Maison · <span class="eyeMeteo" data-fc="0">${eyeTxt}</span></div>
          <div class="hTitle">${salut}</div>
          <div class="hSub">${dateFr}</div>
          <div class="pastilles">${pastilles}</div>
        </div>
        <div class="heroR"><div class="chips">${chips}</div></div>
      </div>

      <div class="duo">
        <div class="duoCol"><div class="secTitle">Alertes</div>${alertHtml}</div>
        <div class="duoCol"><div class="secTitle">Actions rapides</div><div class="acts">${actions}</div></div>
      </div>

      ${fcHtml?`<div class="secTitle">Météo · 3 jours</div><div class="fc">${fcHtml}</div>`:''}

      <div class="secTitle">Pièces & systèmes</div>
      <div class="grid">${tiles}</div>
      <div class="foot"></div>
      ${this._sheetHtml()}
      ${this._autoPanelHtml()}
    </div>`;

    this.shadowRoot.querySelectorAll('[data-nav]').forEach(el=>{
      el.addEventListener('click',()=>{const p=el.getAttribute('data-nav');if(p)this._nav(p);});
    });
    this.shadowRoot.querySelectorAll('[data-fc]').forEach(el=>{
      el.addEventListener('click',ev=>{ev.stopPropagation();this._openSheet(parseInt(el.getAttribute('data-fc'),10));});
    });
    this.shadowRoot.querySelectorAll('[data-close]').forEach(el=>{
      el.addEventListener('click',ev=>{ev.stopPropagation();this._closeSheet();});
    });
    this.shadowRoot.querySelectorAll('[data-autopanel]').forEach(el=>{
      el.addEventListener('click',ev=>{ev.stopPropagation();this._openAuto();});
    });
    this.shadowRoot.querySelectorAll('[data-closeauto]').forEach(el=>{
      el.addEventListener('click',ev=>{ev.stopPropagation();this._closeAuto();});
    });
    this.shadowRoot.querySelectorAll('[data-autotoggle]').forEach(el=>{
      el.addEventListener('click',ev=>{
        ev.stopPropagation();
        const ent=el.getAttribute('data-autotoggle');
        const on=this._s(ent)==='on';
        this._call('automation',on?'turn_off':'turn_on',{entity_id:ent});
      });
    });
    this.shadowRoot.querySelectorAll('[data-autoall]').forEach(el=>{
      el.addEventListener('click',ev=>{
        ev.stopPropagation();
        const action=el.getAttribute('data-autoall')==='on'?'turn_on':'turn_off';
        this._climAutoFlat().forEach((a,i)=>{
          setTimeout(()=>this._call('automation',action,{entity_id:a.e}),i*150);
        });
      });
    });
    this.shadowRoot.querySelectorAll('[data-secsw]').forEach(el=>{
      el.addEventListener('click',ev=>{
        ev.stopPropagation();
        const action=el.getAttribute('data-secsw')==='on'?'turn_on':'turn_off';
        const ents=(el.getAttribute('data-secents')||'').split(',').filter(Boolean);
        ents.forEach((e,i)=>{
          setTimeout(()=>this._call('automation',action,{entity_id:e}),i*150);
        });
      });
    });
    this.shadowRoot.querySelectorAll('[data-act]').forEach(el=>{
      el.addEventListener('click',ev=>{
        ev.stopPropagation();
        const a=el.getAttribute('data-act');
        if(a==='away')this._call('switch','toggle',{entity_id:c.away});
        else if(a==='climoff')this._call('climate','turn_off',{entity_id:c.climEntities});
        else if(a==='vopen')this._coverSeq('open_cover');
        else if(a==='vclose')this._coverSeq('close_cover');
        else if(a==='vcancelopen'){
          this._coverSeq('stop_cover');
          this._coverSeq('open_cover',5500);
        }
        else if(a==='vcancelclose'){
          this._coverSeq('stop_cover');
          this._coverSeq('close_cover',5500);
        }
        else if(a==='vstop')this._coverSeq('stop_cover');
      });
    });
    if(psc&&psc.scrollTop!==py)psc.scrollTop=py;
    this._attachSheetSwipe();
  }
}
customElements.define('accueil-glass-card',AccueilGlassCard);
window.customCards=window.customCards||[];
window.customCards.push({type:'accueil-glass-card',name:'Accueil Glass Card',description:'Vue d\'accueil Liquid Glass — patch ciblé, palette dynamique'});