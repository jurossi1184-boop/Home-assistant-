/* clim-glass-card v42 — minuterie PAR PIÈCE (timer.clim_minuterie_<key>) : chaque clim a son propre décompte indépendant, lancer une minuterie sur une clim n'affecte plus les autres. Décompte "S'éteint à HH:MM" (fiche + tuile), Annuler ciblé. Extinction réelle par automation.clim_minuterie_echue. */
class ClimGlassCard extends HTMLElement{
  setConfig(c){
    this._c=Object.assign({
      back:'/dashboard-test/accueil',
      rdc:'sensor.temperature_interieure_rdc',
      etage:'sensor.temperature_interieure_etage',
      ext:'sensor.alsace_outdoor_temperature',
      humRdc:'sensor.alsace_zone_rdc_circuit_1_humidity',
      humEtage:'sensor.alsace_zone_etage_circuit_0_humidity',
      auto:'input_boolean.clim_automatisations_actives',
      pilotageAuto:'input_boolean.clim_pilotage_auto',
      pre:'input_boolean.clim_pre_refroidissement_soir_19h',
      toggle_script:'clim_piece_toggle',
      sDeb:'input_datetime.clim_salon_debut_confort',
      sFin:'input_datetime.clim_salon_fin_confort',
      cDeb:'input_datetime.clim_chambres_debut_confort',
      cFin:'input_datetime.clim_chambres_fin_confort',
      bande:'input_number.clim_bande_morte',
      precoolT:'input_number.clim_temperature_pre_refroidissement',
      delai:'input_number.clim_delai_reprise_fenetre',
      deshu:'input_boolean.clim_deshu_auto',
      hygroH:'input_number.clim_hygro_seuil_haut',
      hygroB:'input_number.clim_hygro_seuil_bas',
      deshuDebSem:'input_number.clim_deshu_heure_debut_semaine',
      deshuDebWe:'input_number.clim_deshu_heure_debut_weekend',
      deshuFin:'input_number.clim_deshu_heure_fin',
      hygroHRdc:'input_number.clim_hygro_seuil_haut_rdc',
      hygroBRdc:'input_number.clim_hygro_seuil_bas_rdc',
      defChaudSalon:'input_number.clim_defaut_chaud_salon',
      defChaudChambres:'input_number.clim_defaut_chaud_chambres',
      defFroid:'input_number.clim_defaut_froid',
      vac:'input_boolean.mode_vacances',
      ecs:'sensor.alsace_energy_manager_state',
      boost:'switch.alsace_domestic_hot_water_0_boost',
      conso:'sensor.consommation_reelle_maison',
      seuilConso:'input_number.delestage_seuil_puissance',
      freecool:'input_boolean.freecooling_nocturne_actif',
      profil:'input_select.profil_de_journee',
      cielCouvert:'binary_sensor.ciel_couvert',
      ombrageSejour:'input_boolean.sejour_ombrage_actif',
      antimixRdc:'input_datetime.pac_derniere_chauffe_rdc',
      antimixEtage:'input_datetime.pac_derniere_chauffe_etage',
      antimixH:'input_number.clim_anti_mixite_heures',
      seuilExt:'input_number.clim_seuil_exterieur_froid',
      extPac:'sensor.alsace_outdoor_temperature',
      prevMax:'input_number.prevision_temp_max_jour',
      windows:[
        {name:'Parents',entity:'binary_sensor.myggbett_door_window_sensor_porte'},
        {name:'L\u00e9andre',entity:'binary_sensor.myggbett_door_window_sensor_porte_2'},
        {name:'Louise',entity:'binary_sensor.myggbett_door_window_sensor_porte_3'}
      ],
      rooms:[
        {key:'salon',name:'Salon',climate:'climate.salon',manual:'input_boolean.clim_manuel_salon',cons:'input_number.clim_consigne_ete',temp:'sensor.temperature_interieure_rdc',timer:'timer.clim_minuterie_salon'},
        {key:'parents',name:'Parents',climate:'climate.chambre_parents',manual:'input_boolean.clim_manuel_parents',cons:'input_number.clim_consigne_parents',timer:'timer.clim_minuterie_parents'},
        {key:'louise',name:'Louise',climate:'climate.chambre_louise',manual:'input_boolean.clim_manuel_louise',cons:'input_number.clim_consigne_louise',timer:'timer.clim_minuterie_louise'},
        {key:'leandre',name:'L\u00e9andre',climate:'climate.chambre_leandre',manual:'input_boolean.clim_manuel_leandre',cons:'input_number.clim_consigne_leandre',timer:'timer.clim_minuterie_leandre'}
      ]
    },c||{});
    this._open=null;
    this._settings=false;
    this._setTab=null;
    this._pend={};
  }
  set hass(h){this._h=h;
    for(const k in this._pend){const p=this._pend[k];const s2=h.states[k];const a=s2?parseFloat(s2.attributes.temperature):null;if(a===p.v||Date.now()-p.ts>15000)delete this._pend[k];}
    const fp=this._fp();if(fp===this._last)return;this._last=fp;
    if(this._open!==null||this._settings||!this.shadowRoot||!this.shadowRoot.querySelector('.wrap')){this._render();return;}
    const st=this._structSig();
    if(st===this._lastStruct)this._patch();else{this._lastStruct=st;this._render();}}
  _fp(){const c=this._c,h=this._h;const ids=[c.rdc,c.etage,c.ext,c.auto,c.pre];c.windows.forEach(w=>ids.push(w.entity));ids.push(c.sDeb,c.sFin,c.cDeb,c.cFin,c.bande,c.precoolT,c.delai,c.humRdc,c.humEtage,c.deshu,c.hygroH,c.hygroB,c.deshuDebSem,c.deshuDebWe,c.deshuFin,c.hygroHRdc,c.hygroBRdc,c.defChaudSalon,c.defChaudChambres,c.defFroid,c.antimixRdc,c.antimixEtage,c.antimixH,c.seuilExt,c.extPac,c.prevMax,c.vac,c.ecs,c.boost,c.freecool,c.profil,c.cielCouvert,c.ombrageSejour,c.conso,c.seuilConso,c.pilotageAuto);c.rooms.forEach(r=>ids.push(r.climate,r.manual,r.cons,r.timer));
    return ids.map(i=>{const s=h.states[i];if(!s)return'x';const a=s.attributes;return s.state+'|'+(a.current_temperature??'')+'|'+(a.temperature??'')+'|'+(a.fan_mode??'')+'|'+(a.swing_mode??'')+'|'+(a.finishes_at??'');}).join(';')+'|o:'+this._open+'|s:'+this._settings+'|p:'+Object.keys(this._pend).map(k=>k+this._pend[k].v).join(',');}
  _s(id){const s=this._h.states[id];return s?s.state:null;}
  _a(id,k){const s=this._h.states[id];return s?s.attributes[k]:null;}
  _n(v){const f=parseFloat(v);return isNaN(f)?'\u2013':String(Math.round(f*10)/10).replace('.',',');}
  _ecsOn(){return this._s(this._c.ecs)==='DHW'||this._s(this._c.boost)==='on';}
  _ml(m){return({off:'Off',cool:'Froid',dry:'D\u00e9shu',fan_only:'Ventil',heat:'Chaud',heat_cool:'Auto'})[m]||m;}
  _tim(r){if(!r.timer||this._s(r.timer)!=='active')return null;
    const fa=this._a(r.timer,'finishes_at');if(!fa)return'';
    const d=new Date(fa);return isNaN(d.getTime())?'':d.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});}
  _why(r){const c=this._c;const st=this._s(r.climate);
    if(this._s(r.manual)==='on')return null;
    if(this._s(c.vac)==='on')return 'Mode vacances \u2014 pilotage suspendu';
    if(st!=='off')return null;
    const win=c.windows.find(w=>w.name===r.name);
    if(win&&this._s(win.entity)==='on')return 'Fen\u00eatre ouverte \u2014 clim coup\u00e9e';
    if(this._s(c.pilotageAuto)!=='on')return 'Pilotage automatique d\u00e9sactiv\u00e9';
    if(this._s(c.ecs)==='DHW')return 'En attente \u2014 eau chaude sanitaire en cours';
    if(this._s(c.boost)==='on')return 'En attente \u2014 boost ECS en cours';
    const amE=r.key==='salon'?this._s(c.antimixRdc):this._s(c.antimixEtage);
    if(amE&&amE!=='unknown'&&amE!=='unavailable'){const tms=new Date(amE.replace(' ','T')).getTime();const hh=parseFloat(this._s(c.antimixH))||12;
      if(!isNaN(tms)&&(Date.now()-tms)<hh*3600000)return 'En attente \u2014 la PAC a chauff\u00e9 cette zone r\u00e9cemment (anti va-et-vient)';}
    const sx=parseFloat(this._s(c.seuilExt))||20,ex=parseFloat(this._s(c.extPac)),pv2=parseFloat(this._s(c.prevMax));
    if(!isNaN(ex)&&ex<=sx&&(isNaN(pv2)||pv2<=sx))return `Trop frais dehors (${this._n(ex)}\u00b0) \u2014 le froid attend une vraie chaleur`;
    if(parseFloat(this._s(c.conso))>parseFloat(this._s(c.seuilConso)||99999))return 'En attente \u2014 d\u00e9lestage (maison \u00e0 pleine puissance)';
    if(this._s(c.freecool)==='on')return 'Freecooling nocturne \u2014 la fra\u00eecheur entre toute seule';
    const sal=r.key==='salon';
    const deb=this._s(sal?c.sDeb:c.cDeb)||'00:00:00';const fin=this._s(sal?c.sFin:c.cFin)||'23:59:59';
    const hm=t=>t.slice(0,5);const nowS=new Date().toTimeString().slice(0,8);
    if(nowS<deb||nowS>=fin)return `Hors cr\u00e9neau \u2014 reprend \u00e0 ${hm(deb)}`;
    const temp=parseFloat(this._s(r.temp||c.etage));const seuil=parseFloat(this._s(r.cons));
    if(!isNaN(temp)&&!isNaN(seuil)&&temp<=seuil)return `${this._n(temp)}\u00b0 \u2014 sous le seuil de d\u00e9marrage (${this._n(seuil)}\u00b0)`;
    const chaudJour=['Canicule','Chaud ensoleill\u00e9'].includes(this._s(c.profil));
    if(chaudJour&&this._s(c.cielCouvert)==='off'){
      if(sal&&this._s(c.ombrageSejour)!=='on')return 'Verrouill\u00e9e \u2014 les volets d\u2019abord (jour ensoleill\u00e9)';
      if(!sal)return 'Verrouill\u00e9e \u2014 ombrage des chambres requis d\u2019abord';
    }
    return 'D\u00e9marrage imminent\u2026';}
  _statusTxt(r){const st=this._s(r.climate);if(st===null)return'Indisponible';if(st==='off')return'\u00c9teinte';
    if(st==='dry')return 'D\u00e9shu';
    const t=this._a(r.climate,'temperature');return this._ml(st)+(t?' \u2192 '+this._n(t)+'\u00b0':'');}
  _structSig(){const c=this._c;
    const chips=[this._s(c.auto),this._s(c.pre),this._s(c.deshu)].join(',');
    const wins=c.windows.map(w=>this._s(w.entity)).join(',');
    const ctx=[this._s(c.vac),this._s(c.ecs),this._s(c.boost),this._s(c.pilotageAuto),this._s(c.freecool),this._s(c.profil),this._s(c.cielCouvert)].join(',');
    const rooms=c.rooms.map(r=>{const st=this._s(r.climate);const tim=(r.timer&&this._s(r.timer)==='active')?'T':'';const man=this._s(r.manual)==='on'?'M':'';return st+tim+man;}).join(',');
    return chips+'|'+wins+'|'+ctx+'|'+rooms;}
  _patch(){const c=this._c,sr=this.shadowRoot;
    const v={
      hrdc:`${this._n(this._s(c.rdc))}\u00b0`,hrdch:`${this._n(this._s(c.humRdc))}\u2009%`,
      heta:`${this._n(this._s(c.etage))}\u00b0`,hetah:`${this._n(this._s(c.humEtage))}\u2009%`,
      hext:`${this._n(this._s(c.ext))}\u00b0`,hsub:this._heroSub()
    };
    c.rooms.forEach(r=>{const ct=this._a(r.climate,'current_temperature');v['rs'+r.key]=this._statusTxt(r)+(ct!=null?` \u00b7 ${this._n(ct)}\u00b0`:'');const w=this._why(r);v['rw'+r.key]=w||'';});
    sr.querySelectorAll('.rWhy[data-p]').forEach(el=>{const k=el.getAttribute('data-p');if(v[k]!==undefined)el.style.display=v[k]?'block':'none';});
    sr.querySelectorAll('[data-p]').forEach(el=>{const k=el.getAttribute('data-p');if(v[k]!==undefined)el.textContent=v[k];});}
  _nav(p){history.pushState(null,'',p);this.dispatchEvent(new Event('location-changed',{bubbles:true,composed:true}));}
  _css(){return `:host{display:block;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',Roboto,sans-serif;color:#f4f5ff;--glass:rgba(255,255,255,.11);--stroke:rgba(255,255,255,.16);--txt2:rgba(244,245,255,.72);--cool:#6fdcff;--manual:#ffc35c;--off:rgba(255,255,255,.35);--r:26px}
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}
.wrap{max-width:1100px;margin:0 auto;container-type:inline-size}
.top{display:flex;margin-bottom:14px}
.back{display:inline-flex;align-items:center;gap:8px;padding:10px 18px 10px 14px;border-radius:18px;background:var(--glass);border:1px solid var(--stroke);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);font-size:14px;font-weight:600;color:var(--txt2);cursor:pointer;user-select:none}
.back:active{transform:scale(.96)}
.alert{display:flex;align-items:center;gap:12px;background:var(--glass);border:1px solid var(--stroke);border-radius:22px;backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);padding:13px 16px;margin-bottom:10px;transition:transform .15s,background .15s}
.alert:active{transform:scale(.985)}
.alert .ai{width:22px;height:22px;flex:none}
.aTxt{display:flex;flex-direction:column;min-width:0;flex:1}
.aT{font-size:15px;font-weight:700;color:#fff}
.aS{font-size:12.5px;color:var(--txt2)}
.aWarn .ai{color:var(--manual)}
.aStatic{cursor:default}
.aStatic:active{transform:none}
.hero{position:relative;background:var(--glass);border:1px solid var(--stroke);border-radius:var(--r);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);padding:18px 20px 16px;margin:4px 0 18px}
.gear{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.07);border:1px solid var(--stroke);color:var(--txt2);font-size:17px;cursor:pointer;user-select:none;flex-shrink:0}
.gear:active{transform:scale(.92)}
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
.ric{width:38px;height:38px;border-radius:50%;background:rgba(255,255,255,.14);display:flex;align-items:center;justify-content:center;color:#fff;transition:.25s}
.rName{font-size:15px;font-weight:700;margin-top:10px}
.rSub{margin-top:3px;font-size:13px;font-weight:500;color:var(--txt2);display:flex;align-items:center;gap:6px;flex-wrap:wrap;transition:.25s}
.pwr{width:34px;height:34px;border-radius:50%;border:1px solid var(--stroke);background:rgba(255,255,255,.08);display:flex;align-items:center;justify-content:center;color:var(--off);font-size:15px;transition:.25s;flex-shrink:0}
.room.on{background:rgba(255,255,255,.92);border-color:rgba(255,255,255,.95);color:#1c1c2e;box-shadow:0 8px 28px rgba(10,20,60,.25)}
.room.on .ric{background:#3ec3f7;color:#fff}
.room.on.heat .ric{background:#ff9f0a}
.room.on .rSub{color:#0a7eb8;font-weight:600}
.room.on.heat .rSub{color:#c2410c}
.room.on .pwr{background:rgba(28,28,46,.08);border-color:transparent;color:#1c1c2e}
.badgeM{display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:700;color:var(--manual)}
.room.on .badgeM{color:#b45309}
.badgeM::before{content:'';width:6px;height:6px;border-radius:50%;background:currentColor}
.room.ecsBlocked{cursor:not-allowed;opacity:.55;background:rgba(255,159,10,.06);border-color:rgba(255,159,10,.25)}
.room.ecsBlocked:active{transform:none}
.room.ecsBlocked .ric{background:rgba(255,159,10,.18);color:#ff9f0a}
.pwrBlocked{cursor:not-allowed;color:#ff5d5d!important;background:rgba(255,93,93,.12)!important;border-color:rgba(255,93,93,.4)!important}
.pwrBlocked:active{transform:none!important}
.rWhy{margin-top:6px;font-size:11.5px;font-weight:500;color:var(--txt2);line-height:1.4;opacity:.85;font-style:italic}
.room.on .rWhy{display:none}
.sRowTgl{cursor:pointer;transition:background .15s}
.sRowTgl:hover{background:rgba(255,255,255,.03)}
.sRowTgl:active{transform:scale(.99)}
.sTgl{width:46px;height:26px;border-radius:14px;background:rgba(255,255,255,.14);position:relative;transition:.25s;display:inline-block}
.sTgl::after{content:'';position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:50%;background:#fff;transition:.25s}
.sTgl.on{background:#6fdcff}
.sTgl.on::after{left:23px}
.aHeat .ai{color:#ff9f0a}
.aCool .ai{color:#6fdcff}
.aInfo .ai{color:#c084fc}
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
.dial{display:flex;align-items:center;justify-content:center;gap:22px;margin:4px 0 18px}
.stepBtn{width:56px;height:56px;border-radius:50%;background:rgba(255,255,255,.09);border:1px solid var(--stroke);color:#f4f5ff;font-size:26px;font-weight:500;cursor:pointer}
.target{text-align:center;min-width:110px}
.tval{font-size:54px;font-weight:700;letter-spacing:-.03em;line-height:1;color:var(--cool)}
.tlab{font-size:13px;color:var(--txt2);margin-top:4px}
.modes{display:flex;gap:8px;margin-bottom:14px}
.mode{flex:1;padding:11px 4px;border-radius:16px;text-align:center;font-size:13px;font-weight:600;color:var(--txt2);background:rgba(255,255,255,.06);border:1px solid var(--stroke);cursor:pointer}
.mode.sel{background:rgba(111,220,255,.2);border-color:rgba(111,220,255,.5);color:var(--cool)}
.mode.sel.heatSel{background:rgba(255,159,10,.2);border-color:rgba(255,159,10,.55);color:#ffb340}
.tval.heatv{color:#ffb340}
.row{display:flex;justify-content:space-between;align-items:center;padding:14px 4px;border-top:1px solid rgba(255,255,255,.1);font-size:15px;cursor:pointer}
.l{display:flex;align-items:center;gap:10px}
.ic{opacity:.7;width:22px;text-align:center}
.v{color:var(--txt2);font-weight:500}
.toggle{width:50px;height:30px;border-radius:15px;background:rgba(255,255,255,.15);position:relative;transition:.25s;flex-shrink:0}
.toggle::after{content:'';position:absolute;top:3px;left:3px;width:24px;height:24px;border-radius:50%;background:#fff;transition:.25s}
.toggle.on{background:var(--manual)}
.toggle.on::after{left:23px}
.rowNote{font-size:12px;color:var(--txt2);padding:6px 4px 4px;line-height:1.5}
.whyRow{margin:0 0 12px;padding:11px 14px;border-radius:14px;font-size:13px;font-weight:600;background:rgba(255,255,255,.08);border:1px solid var(--stroke);color:var(--txt2);text-align:center;line-height:1.5}
.timRow{display:flex;align-items:center;gap:8px;margin:0 0 14px;flex-wrap:wrap}
.timLab{font-size:13px;color:var(--txt2);font-weight:600}
.timBtn{padding:8px 14px;border-radius:14px;background:rgba(255,255,255,.09);border:1px solid var(--stroke);font-size:13px;font-weight:700;cursor:pointer;user-select:none}
.timBtn:active{transform:scale(.95)}
.timBtn.timOff{background:rgba(255,99,99,.12);border-color:rgba(255,99,99,.35);color:#ff9a9a}
.timOn{font-size:13px;font-weight:700;color:var(--cool)}
.badgeT{display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:700;color:var(--cool)}
.room.on .badgeT{color:#0a7eb8}
.manRow{padding:13px 16px;border-radius:16px;background:rgba(255,255,255,.07);border:1px solid var(--stroke);font-size:13.5px;font-weight:600;color:var(--txt2);cursor:pointer;line-height:1.5;margin-bottom:4px}
.manRow.manOn{background:rgba(255,195,92,.13);border-color:rgba(255,195,92,.45);color:var(--manual)}
.shead{display:flex;align-items:center;gap:8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:var(--txt2);margin-top:18px;padding:0 4px 9px;scroll-margin-top:74px}
.setNav{display:flex;align-items:center;justify-content:flex-start;padding:0 0 14px;margin:0}
.setBack{display:inline-flex;align-items:center;gap:7px;padding:9px 18px 9px 13px;border-radius:18px;cursor:pointer;background:rgba(255,255,255,.06);border:1px solid var(--stroke);color:#f4f5ff;font-size:13.5px;font-weight:600;line-height:1;transition:.15s;user-select:none;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}
.setBack:hover{background:rgba(255,255,255,.1)}
.setBack:active{transform:scale(.96);background:rgba(255,255,255,.14)}
.setBackArr{font-size:18px;font-weight:400;line-height:1;color:var(--cool);margin-top:-1px}
.setMenu{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;padding:8px 0 6px}
.setMenuItem{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:24px 14px;border-radius:20px;background:rgba(255,255,255,.06);border:1px solid var(--stroke);cursor:pointer;transition:.18s;user-select:none;min-height:128px;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}
.setMenuItem:active{transform:scale(.97);background:rgba(255,255,255,.14)}
.menuIc{width:52px;height:52px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.08);border:1px solid var(--stroke)}
.menuIc svg{width:24px;height:24px}
.menuLab{font-size:14px;font-weight:600;color:#f4f5ff;text-align:center;line-height:1.3}
.sGrp{font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--txt2);margin:22px 6px 8px;opacity:.85}
.sCard{background:rgba(255,255,255,.05);border:1px solid var(--stroke);border-radius:18px;backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);overflow:hidden}
.sRow{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:13px 16px;border-top:1px solid rgba(255,255,255,.06)}
.sRow:first-child{border-top:none}
.sLab{display:flex;flex-direction:column;gap:3px;flex:1;min-width:0;font-size:14.5px;font-weight:600;color:#f4f5ff}
.sHint{font-size:11.5px;font-weight:500;color:var(--txt2);line-height:1.4}
.sCtrl{flex-shrink:0;width:148px;display:flex;justify-content:flex-end}
.sCtrl .pv{margin:0;width:148px;justify-content:space-between;gap:0;align-items:center}
.sCtrl .pv b{color:var(--cool);width:88px;text-align:center;font-size:15px;font-weight:700;font-variant-numeric:tabular-nums;letter-spacing:.01em}
.sNote{font-size:12px;color:var(--txt2);padding:10px 6px 4px;line-height:1.5;opacity:.8;font-style:italic}
.shic{width:16px;height:16px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.shead+.ph{border-top:none;padding-top:4px}
.ph{padding:13px 4px;border-top:1px solid rgba(255,255,255,.1);font-size:15px;line-height:1.7;display:flex;flex-wrap:wrap;align-items:center;column-gap:6px;row-gap:8px}
.ph b{font-weight:700}
.cv{color:var(--cool)}
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
.heroRow{margin-top:0;width:470px;flex-shrink:0;align-self:center}
.sv{font-size:40px}
.grid{grid-template-columns:repeat(4,1fr);gap:14px}
.room{min-height:132px;padding:16px}
.secTitle{font-size:20px;margin:6px 4px 14px}
}`;}
  _alertsHtml(){const c=this._c;const out=[];
    const winIc=`<svg class='ai' viewBox='0 0 24 24' fill='currentColor'><path d='M6 2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2h-2V4H6V2zm-2 4h10v16H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z'/></svg>`;
    const ecsIc=`<svg class='ai' viewBox='0 0 24 24' fill='currentColor'><path d='M12 3.5s6 6.8 6 11a6 6 0 0 1-12 0c0-4.2 6-11 6-11z'/></svg>`;
    const vacIc=`<svg class='ai' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M2 22h20M3 22l3-9M21 22l-3-9M5 13l14-3M5 13l-2-6M19 10l-2-6M11 4l4 14'/></svg>`;
    const killIc=`<svg class='ai' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round'><path d='M12 3v9'/><path d='M7 6.5a7 7 0 1 0 10 0'/></svg>`;
    const timIc=`<svg class='ai' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round'><circle cx='12' cy='13' r='8'/><path d='M12 9v4l2 2M10 2h4'/></svg>`;
    // Fenêtres ouvertes
    const wopen=c.windows.filter(w=>this._s(w.entity)==='on').map(w=>w.name);
    if(wopen.length){const t=wopen.length>1?'Fen\u00eatres ouvertes':'Fen\u00eatre ouverte';const s=`Chambre${wopen.length>1?'s':''} ${wopen.join(', ')} \u2014 clim coup\u00e9e`;out.push(`<div class='alert aWarn aStatic'>${winIc}<div class='aTxt'><span class='aT'>${t}</span><span class='aS'>${s}</span></div></div>`);}
    // Mode vacances
    if(this._s(c.vac)==='on')out.push(`<div class='alert aInfo aStatic'>${vacIc}<div class='aTxt'><span class='aT'>Mode vacances actif</span><span class='aS'>Pilotage clim suspendu \u2014 d\u00e9shu maintenue</span></div></div>`);
    // Kill switch automatisations
    if(this._s(c.auto)==='off'||this._s(c.pilotageAuto)==='off')out.push(`<div class='alert aWarn aStatic'>${killIc}<div class='aTxt'><span class='aT'>Pilotage automatique coup\u00e9</span><span class='aS'>Les automatisations clim sont d\u00e9sactiv\u00e9es</span></div></div>`);
    // ECS en chauffe
    if(this._s(c.ecs)==='DHW'||this._s(c.boost)==='on'){const subtxt=this._s(c.boost)==='on'?'Boost manuel actif \u2014 clim suspendue':'PAC en cycle ECS \u2014 clim suspendue';out.push(`<div class='alert aHeat aStatic'>${ecsIc}<div class='aTxt'><span class='aT'>Eau chaude sanitaire en cours</span><span class='aS'>${subtxt}</span></div></div>`);}
    // Minuteurs actifs
    const tims=c.rooms.filter(r=>r.timer&&this._s(r.timer)==='active').map(r=>{const fa=this._a(r.timer,'finishes_at');const d=fa?new Date(fa):null;const tt=(d&&!isNaN(d.getTime()))?d.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}):'';return r.name+(tt?` \u00b7 ${tt}`:'');});
    if(tims.length){const t=tims.length>1?`${tims.length} minuteurs actifs`:'Minuteur actif';out.push(`<div class='alert aCool aStatic'>${timIc}<div class='aTxt'><span class='aT'>${t}</span><span class='aS'>${tims.join(' \u00b7 ')}</span></div></div>`);}
    return out.join('');}
  _heroSub(){const c=this._c;
    const counts={off:0,cool:0,dry:0,fan_only:0,heat:0,heat_cool:0};
    c.rooms.forEach(r=>{const s=this._s(r.climate)||'off';if(s in counts)counts[s]++;else counts.off++;});
    const lbl={cool:'froid',dry:'d\u00e9shu',fan_only:'ventil',heat:'chauffe',heat_cool:'auto'};
    const parts=[];['cool','dry','heat','heat_cool','fan_only'].forEach(m=>{if(counts[m]>0)parts.push(counts[m]+' '+lbl[m]);});
    if(counts.off>0)parts.push(counts.off+' \u00e9teinte'+(counts.off>1?'s':''));
    if(counts.off===c.rooms.length)return 'Tout \u00e9teint';
    return parts.join(' \u00b7 ');}
  _heroHtml(){const c=this._c;const actTxt=this._heroSub();
    return `<div class='hero'><div class='heroLeft'><div class='hHead'><div class='eyebrow'>Climatisation</div><span class='gear' data-act='sopen'><svg viewBox='0 0 24 24' width='18' height='18' fill='none' stroke='currentColor' stroke-width='1.9' stroke-linecap='round'><path d='M4 7h9.4M18.6 7H20M4 12h3.4M12.6 12H20M4 17h11.4'/><circle cx='16' cy='7' r='2.3'/><circle cx='10' cy='12' r='2.3'/><circle cx='18' cy='17' r='2.3'/></svg></span></div>
      <div class='hStats'>
        <div class='stat'><div class='sv' data-p='hrdc'>${this._n(this._s(c.rdc))}\u00b0</div><div class='sl'>RDC \u00b7 <span data-p='hrdch'>${this._n(this._s(c.humRdc))}\u2009%</span></div></div>
        <div class='stat'><div class='sv' data-p='heta'>${this._n(this._s(c.etage))}\u00b0</div><div class='sl'>\u00c9tage \u00b7 <span data-p='hetah'>${this._n(this._s(c.humEtage))}\u2009%</span></div></div>
        <div class='stat out'><div class='sv' data-p='hext'>${this._n(this._s(c.ext))}\u00b0</div><div class='sl'>Ext\u00e9rieur</div></div>
      </div>
      <div class='sub' data-p='hsub'>${actTxt}</div></div>
      <div class='heroRow'>
        <div class='chip ${this._s(c.auto)==='on'?'on':''}' data-act='chip' data-e='${c.auto}'><span class='dot'></span>Automatisations</div>
        <div class='chip ${this._s(c.pre)==='on'?'on':''}' data-act='chip' data-e='${c.pre}'><span class='dot'></span>Pr\u00e9-refroid. 19h</div>
        <div class='chip ${this._s(c.deshu)==='on'?'on':''}' data-act='chip' data-e='${c.deshu}'><span class='dot'></span>D\u00e9shu auto</div>
      </div></div>`;}
  _roomHtml(r){const st=this._s(r.climate);const on=st&&st!=='off'&&st!=='unavailable';const heatOn=st==='heat';const man=this._s(r.manual)==='on';
    const tt=this._tim(r);
    const ecsBlk=this._ecsOn();
    const ic=r.key==='salon'?"<svg viewBox='0 0 24 24' width='20' height='20' fill='currentColor'><path d='M5 9V7a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v2a3 3 0 0 0-2 2.8V12H7v-.2A3 3 0 0 0 5 9z' opacity='.55'/><path d='M2 13a2 2 0 0 1 2-2 3 3 0 0 1 3 3h10a3 3 0 0 1 3-3 2 2 0 0 1 2 2v4a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-.5H5v.5a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-4z'/></svg>":"<svg viewBox='0 0 24 24' width='20' height='20' fill='currentColor'><path d='M3 6.5a1 1 0 0 1 2 0V11h13a3 3 0 0 1 3 3v3.5a1 1 0 0 1-2 0V16H5v1.5a1 1 0 0 1-2 0v-11z'/><circle cx='8.2' cy='9' r='1.9'/></svg>";
    const pwrIc=ecsBlk?"<svg viewBox='0 0 24 24' width='17' height='17' fill='none' stroke='currentColor' stroke-width='2.4' stroke-linecap='round'><circle cx='12' cy='12' r='8.5'/><path d='M5.5 5.5l13 13'/></svg>":"<svg viewBox='0 0 24 24' width='17' height='17' fill='none' stroke='currentColor' stroke-width='2.2' stroke-linecap='round'><path d='M12 3.5v7'/><path d='M7.2 6.2a7 7 0 1 0 9.6 0'/></svg>";
    return `<div class='room ${on?'on':''} ${heatOn?'heat':''} ${ecsBlk?'ecsBlocked':''}' data-act='open' data-k='${r.key}'>
      <div class='rTop'><span class='ric'>${ic}</span><span class='pwr ${ecsBlk?'pwrBlocked':''}' data-act='pwr' data-k='${r.key}'>${pwrIc}</span></div>
      <div><div class='rName'>${r.name}</div>
      <div class='rSub'><span data-p='rs${r.key}'>${this._statusTxt(r)}${(()=>{const ct=this._a(r.climate,'current_temperature');return ct!=null?` \u00b7 ${this._n(ct)}\u00b0`:'';})()}</span>${tt?` \u00b7 <span class='badgeT'>\u23f1\u2009${tt}</span>`:''}${man?" \u00b7 <span class='badgeM'>Manuel</span>":''}</div>${(()=>{const w=this._why(r);return w?`<div class='rWhy' data-p='rw${r.key}'>${w}</div>`:`<div class='rWhy' data-p='rw${r.key}' style='display:none'></div>`;})()}</div>
    </div>`;}
  _sheetHtml(){const r=this._c.rooms.find(x=>x.key===this._open);
    if(!r)return`<div class='scrim' data-act='close'></div><div class='sheet'></div>`;
    const cons=this._n(this._s(r.cons));const st=this._s(r.climate);const man=this._s(r.manual)==='on';
    const bmv=parseFloat(this._s(this._c.bande))||2;
    const cutv=this._n(Math.max(16,(parseFloat(this._s(r.cons))||20)-bmv));
    const heat=st==='heat';
    const cool=st==='cool';
    const bekoT=this._a(r.climate,'current_temperature');
    const curT=bekoT!=null?this._n(bekoT):this._n(this._s(r.temp||this._c.etage));
    let dval,dlab,steps;
    if(heat){const pd=this._pend[r.climate];dval=this._n(pd?pd.v:this._a(r.climate,'temperature'));dlab='Temp\u00e9rature de chauffe';steps=true;}
    else if(cool){dval=cons;dlab=man?'Temp\u00e9rature de refroidissement':`D\u00e9marre \u00e0 ${cons}\u00b0 \u00b7 s'arr\u00eate \u00e0 ${cutv}\u00b0`;steps=true;}
    else if(st==='dry'){dval=bekoT!=null?this._n(bekoT):curT;dlab='D\u00e9shumidification \u00b7 sonde clim (consigne ignor\u00e9e par le Beko)';steps=false;}
    else{dval=curT;dlab=bekoT!=null?'Temp\u00e9rature de la pi\u00e8ce (sonde clim)':(r.temp?'Temp\u00e9rature du RDC':'Temp\u00e9rature de l\u2019\u00e9tage');steps=false;}
    const fan=this._a(r.climate,'fan_mode')||'\u2013';const swing=this._a(r.climate,'swing_mode')||'\u2013';
    const modes=['off','cool','heat','dry','fan_only'];
    const tt=this._tim(r);
    const timHtml=st!=='off'?(tt!==null?`<div class='timRow'><span class='timOn'>\u23f1 S'\u00e9teint \u00e0 ${tt}</span><span class='timBtn timOff' data-act='timercancel' data-k='${r.key}'>Annuler</span></div>`:`<div class='timRow'><span class='timLab'>\u23f1 \u00c9teindre dans</span><span class='timBtn' data-act='timer' data-k='${r.key}' data-min='30'>30 min</span><span class='timBtn' data-act='timer' data-k='${r.key}' data-min='60'>1 h</span><span class='timBtn' data-act='timer' data-k='${r.key}' data-min='120'>2 h</span></div>`):'';
    return `<div class='scrim open' data-act='close'></div>
    <div class='sheet open'><div class='grab'></div>
      <div class='sheetHead'><h2>${r.name}</h2><button class='close closeX' data-act='close' title='Fermer'><svg viewBox='0 0 24 24' width='18' height='18' fill='none' stroke='currentColor' stroke-width='2.2' stroke-linecap='round'><path d='M6 6l12 12M18 6L6 18'/></svg></button></div>
      <div class='dial'>
        ${steps?`<button class='stepBtn' data-act='step' data-k='${r.key}' data-d='-1'>\u2212</button>`:''}
        <div class='target'><div class='tval${heat?' heatv':''}'>${dval}\u00b0</div><div class='tlab'>${dlab}</div></div>
        ${steps?`<button class='stepBtn' data-act='step' data-k='${r.key}' data-d='1'>+</button>`:''}
      </div>
      <div class='modes'>${modes.map(m=>`<div class='mode ${st===m?(m==='heat'?'sel heatSel':'sel'):''}' data-act='mode' data-k='${r.key}' data-m='${m}'>${this._ml(m)}</div>`).join('')}</div>
      ${(()=>{const w=this._why(r);return w?`<div class='whyRow'>${w}</div>`:'';})()}
      ${timHtml}
      <div class='row' data-act='fan' data-k='${r.key}'><span class='l'><span class='ic'>\ud83c\udf00</span>Ventilation</span><span class='v'>${fan} \u203a</span></div>
      <div class='row' data-act='swing' data-k='${r.key}'><span class='l'><span class='ic'>\u21c5</span>Oscillation</span><span class='v'>${swing} \u203a</span></div>
      <div class='row' data-act='man' data-k='${r.key}'><span class='l'><span class='ic'>\u270b</span>Mode manuel</span><span class='toggle ${man?'on':''}'></span></div>
      <div class='rowNote'>En manuel, les automatisations ne touchent plus cette pi\u00e8ce.</div>
    </div>`;}
  _setSheetHtml(){const c=this._c;
    const N=e=>this._n(this._s(e));
    const T=e=>(this._s(e)||'00:00:00').slice(0,5);
    const bm=parseFloat(this._s(c.bande))||2;
    const cut=e=>this._n(Math.max(16,(parseFloat(this._s(e))||20)-bm));
    const num=(e,u)=>`<span class='pv'><button class='pBtn' data-act='nstep' data-e='${e}' data-d='-1'>\u2212</button><b>${N(e)}${u}</b><button class='pBtn' data-act='nstep' data-e='${e}' data-d='1'>+</button></span>`;
    const tim=e=>`<span class='pv'><button class='pBtn' data-act='tstep' data-e='${e}' data-d='-30'>\u2212</button><b>${T(e)}</b><button class='pBtn' data-act='tstep' data-e='${e}' data-d='30'>+</button></span>`;
    const room=(nm,e)=>`<div class='ph'><b>${nm}</b> <span class='nw'>d\u00e9marre \u00e0 ${num(e,'\u00b0')}</span> <span class='nw'>et s'arr\u00eate \u00e0 <b class='cv'>${cut(e)}\u00b0</b></span></div>`;
    const ge=[c.rooms[1].cons,c.rooms[2].cons,c.rooms[3].cons];
    const gv=ge.map(e=>parseFloat(this._s(e))||20);
    const same=gv.every(v=>v===gv[0]);
    const gd=same?this._n(gv[0])+'\u00b0':'\u2014';
    const gc=same?this._n(Math.max(16,gv[0]-bm))+'\u00b0':'\u2014';
    const grp=`<div class='ph'><b>Tout l'\u00e9tage</b> (les 3 chambres) <span class='nw'>d\u00e9marre \u00e0 <span class='pv'><button class='pBtn' data-act='gstep' data-d='-1'>\u2212</button><b>${gd}</b><button class='pBtn' data-act='gstep' data-d='1'>+</button></span></span> <span class='nw'>et s'arr\u00eate \u00e0 <b class='cv'>${gc}</b></span></div>`;
    const srow=(lab,ctrl,hint)=>`<div class='sRow'><div class='sLab'>${lab}${hint?`<span class='sHint'>${hint}</span>`:''}</div><div class='sCtrl'>${ctrl}</div></div>`;
    const sCard=(body)=>`<div class='sCard'>${body}</div>`;
    const sGrp=(title)=>`<div class='sGrp'>${title}</div>`;
    const grpCtrl=`<span class='pv'><button class='pBtn' data-act='gstep' data-d='-1'>\u2212</button><b>${gd}</b><button class='pBtn' data-act='gstep' data-d='1'>+</button></span>`;
    const grpHint=same?`S'arr\u00eate \u00e0 <b class='cv'>${gc}</b>`:'Valeurs diff\u00e9rentes entre les chambres';
    const sh=(col,txt,ic,id)=>`<div class='shead' id='sec_${id}'><span class='shic' style='color:${col}'>${ic}</span>${txt}</div>`;
    const icSnow=`<svg viewBox='0 0 24 24' width='15' height='15' fill='none' stroke='currentColor' stroke-width='1.9' stroke-linecap='round'><path d='M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9M12 3l-2.2 2.2M12 3l2.2 2.2M12 21l-2.2-2.2M12 21l2.2-2.2'/></svg>`;
    const icDrop=`<svg viewBox='0 0 24 24' width='15' height='15' fill='none' stroke='currentColor' stroke-width='1.9' stroke-linecap='round' stroke-linejoin='round'><path d='M12 3.5s6 6.8 6 11a6 6 0 0 1-12 0c0-4.2 6-11 6-11z'/></svg>`;
    const icPow=`<svg viewBox='0 0 24 24' width='15' height='15' fill='none' stroke='currentColor' stroke-width='1.9' stroke-linecap='round'><path d='M12 3.5v7'/><path d='M7.2 6.2a7 7 0 1 0 9.6 0'/></svg>`;
    const icWin=`<svg viewBox='0 0 24 24' width='15' height='15' fill='none' stroke='currentColor' stroke-width='1.9' stroke-linecap='round' stroke-linejoin='round'><rect x='4' y='4' width='16' height='16' rx='2.5'/><path d='M12 4v16M4 12h16'/></svg>`;
    const icMode=`<svg viewBox='0 0 24 24' width='15' height='15' fill='none' stroke='currentColor' stroke-width='1.9' stroke-linecap='round' stroke-linejoin='round'><circle cx='12' cy='12' r='9'/><path d='M12 7v5l3 2'/></svg>`;
    const sToggle=(lab,en,hint)=>{const on=this._s(en)==='on';return `<div class='sRow sRowTgl' data-act='chip' data-e='${en}'><div class='sLab'>${lab}${hint?`<span class='sHint'>${hint}</span>`:''}</div><div class='sCtrl'><span class='sTgl ${on?'on':''}'></span></div></div>`;};
    const tab=this._setTab;
    const headTxt=tab?'R\u00e9glages':'R\u00e9glages';
    const menuItem=(t,col,ic,lab)=>`<div class='setMenuItem' data-act='snav' data-t='${t}'><span class='menuIc' style='color:${col}'>${ic}</span><span class='menuLab'>${lab}</span></div>`;
    const setMenu=`<div class='setMenu'>
      ${menuItem('modes','#c084fc',icMode,'Modes globaux')}
      ${menuItem('snow','#6fdcff',icSnow,'Froid automatique')}
      ${menuItem('drop','#79e3c0',icDrop,'D\u00e9shumidification')}
      ${menuItem('pow','#ffc35c',icPow,'Allumage manuel')}
      ${menuItem('win','rgba(255,255,255,.7)',icWin,'Fen\u00eatres')}
    </div>`;
    const backBtn=`<span class='setBack' data-act='snav' data-t=''><span class='setBackArr'>\u2039</span> Tous les r\u00e9glages</span>`;
    return `<div class='scrim open' data-act='sclose'></div>
    <div class='sheet open sheetScroll'><div class='grab'></div>
      <div class='sheetHead'>${tab?backBtn:`<h2>${headTxt}</h2>`}<button class='close closeX' data-act='sclose' title='Fermer'><svg viewBox='0 0 24 24' width='18' height='18' fill='none' stroke='currentColor' stroke-width='2.2' stroke-linecap='round'><path d='M6 6l12 12M18 6L6 18'/></svg></button></div>
      ${tab?'':setMenu}
      ${tab==='modes'?`${sh('#c084fc','Modes globaux',icMode,'modes')}
      ${sGrp('Pilotage g\u00e9n\u00e9ral')}
      ${sCard(
        sToggle('Automatisations clim',c.auto,'Kill switch ma\u00eetre des automatisations')+
        sToggle('Pilotage auto volets/clim',c.pilotageAuto,'Coupe la coordination clim/volets')+
        sToggle('Mode vacances',c.vac,'Suspend la clim, conserve la d\u00e9shu')
      )}
      ${sGrp('Modes automatiques')}
      ${sCard(
        sToggle('D\u00e9shu auto',c.deshu,'Hygrostat \u00e9tage + RDC')+
        sToggle('Pr\u00e9-refroid. 19h',c.pre,'Refroidit les chambres avant la nuit (canicule)')+
        sToggle('Freecooling nocturne',c.freecool,'A\u00e9ration naturelle au lieu de la clim')
      )}
      ${sGrp('D\u00e9lestage')}
      ${sCard(
        srow('Seuil puissance maison',num(c.seuilConso,'\u00a0W'),'La clim s\u2019arr\u00eate au-dessus de ce seuil de conso instantan\u00e9e')
      )}`:''}
      ${tab==='snow'?`${sh('#6fdcff','Froid automatique',icSnow,'snow')}
      ${sGrp('Consignes par pi\u00e8ce')}
      ${sCard(
        srow('Salon',num(c.rooms[0].cons,'\u00b0'),`S'arr\u00eate \u00e0 <b class='cv'>${cut(c.rooms[0].cons)}\u00b0</b>`)+
        srow('Chambre Parents',num(c.rooms[1].cons,'\u00b0'),`S'arr\u00eate \u00e0 <b class='cv'>${cut(c.rooms[1].cons)}\u00b0</b>`)+
        srow('Chambre Louise',num(c.rooms[2].cons,'\u00b0'),`S'arr\u00eate \u00e0 <b class='cv'>${cut(c.rooms[2].cons)}\u00b0</b>`)+
        srow('Chambre L\u00e9andre',num(c.rooms[3].cons,'\u00b0'),`S'arr\u00eate \u00e0 <b class='cv'>${cut(c.rooms[3].cons)}\u00b0</b>`)+
        srow('Tout l\u2019\u00e9tage',grpCtrl,grpHint)
      )}
      ${sGrp('Cr\u00e9neaux et seuils')}
      ${sCard(
        srow('Bande morte',num(c.bande,'\u00b0'),'Refroidit de cette valeur sous la consigne avant de couper')+
        srow('Salon : d\u00e9but',tim(c.sDeb),'')+
        srow('Salon : fin',tim(c.sFin),'')+
        srow('Chambres : d\u00e9but',tim(c.cDeb),'')+
        srow('Chambres : fin',tim(c.cFin),'')+
        srow('Pr\u00e9-refroidir \u00e0 19h',num(c.precoolT,'\u00b0'),'Cible appliqu\u00e9e aux chambres en pr\u00e9-refroidissement')+
        srow('Anti va-et-vient',num(c.antimixH,'\u00a0h'),'Pas de froid auto si la PAC a chauff\u00e9 r\u00e9cemment')+
        srow('Seuil ext\u00e9rieur',num(c.seuilExt,'\u00b0'),'Froid autoris\u00e9 seulement si dehors d\u00e9passe cette valeur')
      )}`:''}
      ${tab==='drop'?`${sh('#79e3c0','D\u00e9shumidification automatique',icDrop,'drop')}
      ${sGrp('Seuils d\u2019humidit\u00e9')}
      ${sCard(
        srow('\u00c9tage : d\u00e9marre au-dessus de',num(c.hygroH,'\u00a0%'),'')+
        srow('\u00c9tage : s\u2019arr\u00eate \u00e0',num(c.hygroB,'\u00a0%'),'')+
        srow('RDC : d\u00e9marre au-dessus de',num(c.hygroHRdc,'\u00a0%'),'')+
        srow('RDC : s\u2019arr\u00eate \u00e0',num(c.hygroBRdc,'\u00a0%'),'')
      )}
      ${sGrp('Cr\u00e9neau horaire')}
      ${sCard(
        srow('D\u00e9but en semaine',num(c.deshuDebSem,'h'),'')+
        srow('D\u00e9but le week-end',num(c.deshuDebWe,'h'),'')+
        srow('Fin (tous les jours)',num(c.deshuFin,'h'),'')
      )}
      <div class='sNote'>S\u00e9chage 10 min en ventilation \u00e0 l\u2019arr\u00eat du cycle</div>`:''}
      ${tab==='pow'?`${sh('var(--manual)','Allumage manuel',icPow,'pow')}
      ${sGrp('Temp\u00e9ratures par d\u00e9faut')}
      ${sCard(
        srow('Chaud \u2014 Salon',num(c.defChaudSalon,'\u00b0'),'Cible appliqu\u00e9e quand tu allumes manuellement en chaud')+
        srow('Chaud \u2014 Chambres',num(c.defChaudChambres,'\u00b0'),'Cible pour les 3 chambres en chaud manuel')+
        srow('Froid \u2014 Toutes pi\u00e8ces',num(c.defFroid,'\u00b0'),'Cible appliqu\u00e9e en froid manuel')
      )}`:''}
      ${tab==='win'?`${sh('rgba(255,255,255,.55)','Fen\u00eatres',icWin,'win')}
      ${sGrp('Reprise apr\u00e8s fermeture')}
      ${sCard(
        srow('D\u00e9lai de reprise',num(c.delai,'\u00a0s'),'Temps d\u2019attente avant de relancer la clim dans son mode pr\u00e9c\u00e9dent')
      )}`:''}
    </div>`;}
  _render(){
    if(!this.shadowRoot){this.attachShadow({mode:'open'});
      this.shadowRoot.addEventListener('click',e=>this._click(e));}
    const c=this._c;
    const prevSc=this.shadowRoot.querySelector('.sheetScroll');
    const sy=prevSc?prevSc.scrollTop:0;
    this.shadowRoot.innerHTML=`<style>${this._css()}</style><div class='wrap'>
      ${this._heroHtml()}
      ${this._alertsHtml()}
      <div class='secTitle'>Pi\u00e8ces</div>
      <div class='grid'>${c.rooms.map(r=>this._roomHtml(r)).join('')}</div>
    </div>${this._settings?this._setSheetHtml():this._sheetHtml()}`;
    const newSc=this.shadowRoot.querySelector('.sheetScroll');
    if(newSc&&sy)newSc.scrollTop=sy;
    this._lastStruct=this._structSig();}
  _cycle(list,cur){if(!list||!list.length)return null;const i=list.indexOf(cur);return list[(i+1)%list.length];}
  _click(e){const t=e.target.closest('[data-act]');if(!t)return;
    const act=t.dataset.act;const h=this._h;const c=this._c;
    const room=k=>c.rooms.find(x=>x.key===k);
    if(act==='sopen'){this._settings=true;this._setTab=null;this._last='';this._render();return;}
    if(act==='snav'){const nt=t.dataset.t;this._setTab=nt&&nt===this._setTab?null:(nt||null);this._last='';this._render();return;}
    if(act==='sclose'){this._settings=false;this._last='';this._render();return;}
    if(act==='gstep'){const ge=[c.rooms[1].cons,c.rooms[2].cons,c.rooms[3].cons];const gv=ge.map(en=>parseFloat(this._s(en))||20);const st2=parseFloat(this._a(ge[0],'step'))||1;const mn=parseFloat(this._a(ge[0],'min'));const mx=parseFloat(this._a(ge[0],'max'));const cur=Math.max(...gv);const d=parseInt(t.dataset.d);let v=d>0?Math.floor(cur/st2)*st2+st2:Math.ceil(cur/st2)*st2-st2;v=Math.min(mx,Math.max(mn,v));v=Math.round(v*1e6)/1e6;ge.forEach(en=>h.callService('input_number','set_value',{entity_id:en,value:v}));return;}
    if(act==='tstep'){const en=t.dataset.e;const v=(this._s(en)||'00:00:00').split(':');let m=parseInt(v[0])*60+parseInt(v[1])+parseInt(t.dataset.d);m=(m+1440)%1440;const hh=String(Math.floor(m/60)).padStart(2,'0'),mm=String(m%60).padStart(2,'0');h.callService('input_datetime','set_datetime',{entity_id:en,time:hh+':'+mm+':00'});return;}
    if(act==='nstep'){const en=t.dataset.e;const st=parseFloat(this._a(en,'step'))||1;const mn=parseFloat(this._a(en,'min'));const mx=parseFloat(this._a(en,'max'));const cur=parseFloat(this._s(en));const d=parseInt(t.dataset.d);let v=d>0?Math.floor(cur/st)*st+st:Math.ceil(cur/st)*st-st;v=Math.min(mx,Math.max(mn,v));v=Math.round(v*1e6)/1e6;h.callService('input_number','set_value',{entity_id:en,value:v});return;}
    if(act==='back'){this._nav(c.back);return;}
    if(act==='open'){if(e.target.closest("[data-act='pwr']"))return;if(this._ecsOn())return;this._open=t.dataset.k;this._last='';this._render();return;}
    if(act==='close'){this._open=null;this._last='';this._render();return;}
    if(act==='pwr'){e.stopPropagation();if(this._ecsOn())return;const k=t.dataset.k;const r=c.rooms.find(x=>x.key===k);const st=this._s(r.climate);if(st==='off'||st===null||st==='unavailable'){this._open=k;this._last='';this._render();return;}h.callService('script',c.toggle_script,{piece:k});return;}
    if(act==='chip'){h.callService('input_boolean','toggle',{entity_id:t.dataset.e});return;}
    if(act==='timercancel'){const rr=room(t.dataset.k);if(rr&&rr.timer)h.callService('timer','cancel',{entity_id:rr.timer});return;}
    const r=room(t.dataset.k);if(!r)return;
    if(act==='step'){const d=parseFloat(t.dataset.d);
      if(this._s(r.climate)==='heat'){const p=this._pend[r.climate];const cur=p?p.v:(parseFloat(this._a(r.climate,'temperature'))||20);const mn2=parseFloat(this._a(r.climate,'min_temp'))||16;const mx2=parseFloat(this._a(r.climate,'max_temp'))||30;const v2=Math.min(mx2,Math.max(mn2,cur+d));if(p&&p.t)clearTimeout(p.t);const tm=setTimeout(()=>{h.callService('climate','set_temperature',{entity_id:r.climate,temperature:v2});},700);this._pend[r.climate]={v:v2,ts:Date.now(),t:tm};this._last='';this._render();return;}
      const v=parseFloat(this._s(r.cons))+d;
      const mn=this._a(r.cons,'min')??17,mx=this._a(r.cons,'max')??28;
      h.callService('input_number','set_value',{entity_id:r.cons,value:Math.min(mx,Math.max(mn,v))});return;}
    if(act==='mode'){const m=t.dataset.m;h.callService('climate','set_hvac_mode',{entity_id:r.climate,hvac_mode:m});
      if(m==='heat'){const dv=parseFloat(this._s(r.key==='salon'?c.defChaudSalon:c.defChaudChambres))||23;h.callService('climate','set_temperature',{entity_id:r.climate,temperature:dv});}
      if(m==='cool'){const dv=parseFloat(this._s(c.defFroid))||19;h.callService('climate','set_temperature',{entity_id:r.climate,temperature:dv});}
      return;}
    if(act==='timer'){const mins=parseInt(t.dataset.min);if(r.timer)h.callService('timer','start',{entity_id:r.timer,duration:mins*60});return;}
    if(act==='fan'){const nx=this._cycle(this._a(r.climate,'fan_modes'),this._a(r.climate,'fan_mode'));
      if(nx)h.callService('climate','set_fan_mode',{entity_id:r.climate,fan_mode:nx});return;}
    if(act==='swing'){const nx=this._cycle(this._a(r.climate,'swing_modes'),this._a(r.climate,'swing_mode'));
      if(nx)h.callService('climate','set_swing_mode',{entity_id:r.climate,swing_mode:nx});return;}
    if(act==='man'){h.callService('input_boolean','toggle',{entity_id:r.manual});return;}}
  getCardSize(){return 9;}
}
customElements.define('clim-glass-card',ClimGlassCard);
window.customCards=window.customCards||[];
window.customCards.push({type:'clim-glass-card',name:'Clim Glass Card',description:'Vue climatisation Liquid Glass'});