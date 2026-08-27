/* <trade-globe> — interactive 3D globe for the Boston Global Trade Network.
   Consumes trade-routes.seed.json (never hardcodes routes).
   Falls back to <route-map> (2D) when WebGL is unavailable, on low-end devices,
   or when the user prefers reduced motion. Loads globe.gl lazily, only when visible. */
(function () {
  const NAVY = '#053B50', BLUE = '#176B87', TURQ = '#64CCC5', LIGHT = '#EEEEEE';
  const GLOBE_SRC = 'https://unpkg.com/globe.gl@2.32.0/dist/globe.gl.min.js';
  const LAND_SRC = 'https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json';

  const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* "lat,lon,Name" → {lat, lon, name}. Invalid or empty input yields null. */
  function parsePoint(raw) {
    if (!raw) return null;
    const parts = String(raw).split(',');
    const lat = parseFloat(parts[0]), lon = parseFloat(parts[1]);
    if (!isFinite(lat) || !isFinite(lon)) return null;
    return { lat: lat, lon: lon, name: (parts.slice(2).join(',') || '').trim() };
  }

  function webglOk() {
    try {
      const c = document.createElement('canvas');
      return !!(c.getContext('webgl2') || c.getContext('webgl'));
    } catch (e) { return false; }
  }

  function lowEnd() {
    const cores = navigator.hardwareConcurrency || 4;
    const mem = navigator.deviceMemory || navigator.deviceMemory === 0 ? navigator.deviceMemory : null;
    return cores <= 2 || (mem !== null && mem <= 1);
  }

  let libPromise = null;

  /* Data is fetched once per page and shared by every <trade-globe>. Kicked off on
     idle right after load, so by the time the section scrolls into view the JSON is
     usually already in memory; boot() only waits for what is still in flight. A
     failed fetch clears its slot so a later boot can retry (and still fall back to
     <route-map> if it fails again). */
  let dataP = null, landP = null;
  function seedData() {
    if (!dataP) {
      dataP = fetch('./trade-routes.seed.json').then((r) => r.json())
        .catch((e) => { dataP = null; throw e; });
    }
    return dataP;
  }
  function landData() {
    if (!landP) {
      landP = fetch(LAND_SRC).then((r) => r.json())
        .catch((e) => { landP = null; throw e; });
    }
    return landP;
  }
  function prefetch() {
    try { seedData().catch(() => {}); landData().catch(() => {}); } catch (e) { /* offline */ }
  }
  if (typeof requestIdleCallback === 'function') requestIdleCallback(prefetch, { timeout: 1200 });
  else setTimeout(prefetch, 500);

  function loadGlobeLib() {
    if (libPromise) return libPromise;
    libPromise = new Promise((resolve, reject) => {
      if (window.Globe) return resolve(window.Globe);
      const s = document.createElement('script');
      s.src = GLOBE_SRC;
      s.onload = () => resolve(window.Globe);
      s.onerror = () => reject(new Error('globe.gl failed to load'));
      document.head.appendChild(s);
    });
    return libPromise;
  }

  class TradeGlobe extends HTMLElement {
    /* The host renders kebab props as lowercase attributes (opp-origin → opporigin),
       so both spellings are observed; direct HTML use keeps the hyphenated form. */
    static get observedAttributes() {
      return ['lang', 'mode', 'opp-origin', 'opp-dest', 'opporigin', 'oppdest',
        'opp-origin-code', 'opp-dest-code', 'opporigincode', 'oppdestcode'];
    }

    attributeChangedCallback(name, oldVal, newVal) {
      if (name === 'lang') {
        this._lang = newVal === 'en' ? 'en' : 'es';
        if (this._globe && this._globe.arcLabel) this._globe.arcLabel(this._globe.arcLabel());
        this.applyOpportunity();
        return;
      }
      if (name === 'mode') { this._mode = newVal === 'opportunity' ? 'opportunity' : 'bgb'; }
      if (name === 'opp-origin' || name === 'opporigin') { this._oppOrigin = parsePoint(newVal); }
      if (name === 'opp-dest' || name === 'oppdest') { this._oppDest = parsePoint(newVal); }
      if (name === 'opp-origin-code' || name === 'opporigincode') { this._oppOriginCode = newVal || ''; }
      if (name === 'opp-dest-code' || name === 'oppdestcode') { this._oppDestCode = newVal || ''; }
      this.applyOpportunity();
    }

    connectedCallback() {
      if (!this._init) {
        this._init = true;
        this.style.display = 'block';
        this.style.width = '100%';
        this.style.height = '100%';
        this.style.position = 'relative';

        this._lang = this.getAttribute('lang') === 'en' ? 'en' : 'es';
        this._mode = this.getAttribute('mode') === 'opportunity' ? 'opportunity' : 'bgb';
        this._oppOrigin = parsePoint(this.getAttribute('opp-origin') || this.getAttribute('opporigin'));
        this._oppDest = parsePoint(this.getAttribute('opp-dest') || this.getAttribute('oppdest'));
        this._oppOriginCode = this.getAttribute('opp-origin-code') || this.getAttribute('opporigincode') || '';
        this._oppDestCode = this.getAttribute('opp-dest-code') || this.getAttribute('oppdestcode') || '';

        // Reduced motion keeps the globe but disables every animation (see build()).
        if (!webglOk() || lowEnd()) { this.renderFallback(); return; }
      }
      if (this._booted) return;
      // Re-arm on every connect: a host re-render can detach the node, and
      // disconnectedCallback tears the observers down.
      this.watchForVisibility();
    }

    /* Boot triggers, deliberately redundant — a single one is not reliable:
       the intersection observer for normal scrolling, a resize observer for a panel
       going from display:none to visible, and an immediate check plus a couple of
       short retries for a globe that is already on screen when it mounts. */
    watchForVisibility() {
      this.stopWatching();

      this._io = new IntersectionObserver((entries) => {
        entries.forEach((e) => { if (e.isIntersecting) this.boot(); });
      }, { rootMargin: '200px' });
      this._io.observe(this);

      this._sizeRo = new ResizeObserver(() => this.bootIfVisible());
      this._sizeRo.observe(this);

      this._onViewport = () => this.bootIfVisible();
      // Capture phase on document: scroll does not bubble, and the page may be scrolled
      // by an inner container rather than the window.
      document.addEventListener('scroll', this._onViewport, { capture: true, passive: true });
      window.addEventListener('resize', this._onViewport);

      requestAnimationFrame(() => this.bootIfVisible());
      this._retry1 = setTimeout(() => this.bootIfVisible(), 350);
      this._retry2 = setTimeout(() => this.bootIfVisible(), 1200);

      // Final safety net: a cheap rect read twice a second until it boots. Observers and
      // scroll events are not delivered in every host, and a blank globe is not an option.
      this._poll = setInterval(() => {
        if (this._booted || this._booting) { clearInterval(this._poll); this._poll = null; return; }
        this.bootIfVisible();
      }, 500);

      // Pause rendering while offscreen (perf).
      this._visIo = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (!this._globe) return;
          const ctrls = this._globe.controls();
          if (e.isIntersecting) { this._globe.resumeAnimation && this._globe.resumeAnimation(); }
          else { this._globe.pauseAnimation && this._globe.pauseAnimation(); ctrls.autoRotate = false; }
        });
      }, { threshold: 0.01 });
      this._visIo.observe(this);
    }

    stopWatching() {
      if (this._io) { this._io.disconnect(); this._io = null; }
      if (this._sizeRo) { this._sizeRo.disconnect(); this._sizeRo = null; }
      if (this._onViewport) {
        document.removeEventListener('scroll', this._onViewport, { capture: true });
        window.removeEventListener('resize', this._onViewport);
        this._onViewport = null;
      }
      clearTimeout(this._retry1);
      clearTimeout(this._retry2);
      if (this._poll) { clearInterval(this._poll); this._poll = null; }
    }

    bootIfVisible() {
      if (this._booted || this._booting) return;
      const r = this.getBoundingClientRect();
      if (r.width < 40 || r.height < 40) return;
      const vh = window.innerHeight || 800;
      if (r.top > vh + 200 || r.bottom < -200) return;
      this.boot();
    }

    disconnectedCallback() {
      this.stopWatching();
      if (this._visIo) { this._visIo.disconnect(); this._visIo = null; }
      if (this._ro) this._ro.disconnect();
      clearTimeout(this._slowTimer);
    }

    renderFallback() {
      this._booted = true;
      this.innerHTML = '';
      const host = document.createElement('div');
      host.style.cssText = 'width:100%;height:100%';
      const map = document.createElement('route-map');
      map.style.cssText = 'display:block;width:100%;height:100%';
      host.appendChild(map);
      this.appendChild(host);
      if (!customElements.get('route-map')) {
        const s = document.createElement('script');
        s.src = './route-map.js';
        document.head.appendChild(s);
      }
    }

    setStatus(text) {
      if (!this._status) {
        this._status = document.createElement('div');
        this._status.style.cssText = 'position:absolute;inset:0;display:grid;place-items:center;' +
          'color:' + LIGHT + ';font:500 13px/1.5 Manrope,system-ui,sans-serif;letter-spacing:.04em;opacity:.7';
        this.appendChild(this._status);
      }
      this._status.textContent = text;
    }

    clearStatus() { if (this._status) { this._status.remove(); this._status = null; } }

    async boot() {
      if (this._booted || this._booting) return;
      this._booting = true;
      this.stopWatching();
      this.setStatus(this._lang === 'en' ? 'Loading globe…' : 'Cargando globo…');
      let Globe, data, land;
      try {
        [Globe, data, land] = await Promise.all([
          loadGlobeLib(),
          seedData(),
          landData()
        ]);
      } catch (e) {
        this._booting = false;
        this.renderFallback();
        return;
      }
      if (!Globe) { this._booting = false; this.renderFallback(); return; }
      this.clearStatus();
      this._data = data;
      try {
        this.build(Globe, data, land);
        this._booted = true;
      } catch (err) {
        this.renderFallback();
      }
      this._booting = false;
    }

    build(Globe, data, landTopo) {
      const portBy = {};
      data.ports.forEach((p) => { portBy[p.unlocode] = p; });

      const routes = data.routes.filter((r) => r.is_public);
      const arcs = routes.map((r) => {
        const o = portBy[r.origin_port];
        const d = r.destination_port ? portBy[r.destination_port] : null;
        const dLat = d ? d.lat : r.destination_lat;
        const dLon = d ? d.lon : r.destination_lon;
        const bgb = r.classification === 'BGB_ROUTE';
        return {
          startLat: o.lat, startLng: o.lon, endLat: dLat, endLng: dLon,
          color: bgb ? [TURQ, TURQ] : [BLUE, 'rgba(23,107,135,0.25)'],
          stroke: bgb ? 0.9 : 0.5,
          dashLength: bgb ? 0.45 : 0.25,
          dashGap: bgb ? 0.15 : 0.5,
          dashSpeed: bgb ? 1.15 : 0.5,
          route: r
        };
      });

      const usedPorts = new Set();
      routes.forEach((r) => { usedPorts.add(r.origin_port); if (r.destination_port) usedPorts.add(r.destination_port); });
      const points = data.ports.filter((p) => usedPorts.has(p.unlocode)).map((p) => ({
        lat: p.lat, lng: p.lon, name: p.name, country: p.country_code, unlocode: p.unlocode,
        bgb: routes.some((r) => r.classification === 'BGB_ROUTE' && (r.origin_port === p.unlocode || r.destination_port === p.unlocode))
      }));

      const features = window.topojson
        ? window.topojson.feature(landTopo, landTopo.objects.countries).features
        : [];
      this._features = features;

      const host = document.createElement('div');
      host.style.cssText = 'width:100%;height:100%';
      this.appendChild(host);

      const w = this.clientWidth || 700, h = this.clientHeight || 520;
      const mobile = w < 700;

      const globe = Globe()(host)
        .width(w).height(h)
        .backgroundColor(NAVY)
        .showAtmosphere(true)
        .atmosphereColor(TURQ)
        .atmosphereAltitude(0.12)
        .polygonsData(features)
        .polygonCapColor((f) => this.capColor(f))
        .polygonSideColor(() => 'rgba(5,59,80,0.6)')
        .polygonStrokeColor(() => 'rgba(238,238,238,0.16)')
        .polygonAltitude((f) => this.selectedRole(f) ? 0.012 : 0.006)
        .polygonLabel((f) => this.countryLabel(f))
        .onPolygonClick((f) => this.handleCountryClick(f))
        .arcsData(arcs)
        .arcColor('color')
        .arcStroke('stroke')
        .arcAltitudeAutoScale(0.3)
        .arcDashLength('dashLength')
        .arcDashGap('dashGap')
        .arcDashAnimateTime((d) => reduceMotion() ? 0 : 2600 / (d.dashSpeed || 0.4))
        .arcLabel((d) => d.opp ? this.oppLabel(d) : this.routeLabel(d.route, portBy))
        .onArcClick((d) => { if (d.route) this.emitSelect({ type: 'route', route: d.route }); })
        .pointsData(points)
        .pointColor((d) => d.bgb ? TURQ : BLUE)
        .pointAltitude(0.014)
        .pointRadius((d) => d.bgb ? 0.42 : 0.3)
        .pointLabel((d) => '<div style="font:600 12px Manrope,sans-serif;color:' + NAVY +
          ';background:' + LIGHT + ';padding:6px 10px;border-radius:2px">' + d.name +
          ' <span style="opacity:.6;font-weight:500">' + d.country + '</span></div>')
        .onPointClick((d) => this.emitSelect({ type: 'port', port: d }));

      this._globe = globe;
      this._bgbArcs = arcs;
      this.applyOpportunity();

      const mat = globe.globeMaterial();
      if (mat && mat.color && mat.color.set) { mat.color.set(NAVY); mat.shininess = 0.2; }

      globe.pointOfView({ lat: 8, lng: -88, altitude: mobile ? 2.5 : 2.0 }, 0);

      const ctrls = globe.controls();
      ctrls.enableZoom = true;
      ctrls.maxDistance = 620;

      /* Closest zoom is derived, not guessed: below the distance where the sphere
         (radius 100 + atmosphere shell) still fits inside the canvas, the globe
         surface floods the whole viewport and its straight canvas edges read as a
         square panel instead of a planet. Recomputed on resize. */
      const fitDistance = () => {
        const cam = globe.camera();
        const cw = this.clientWidth || w, ch = this.clientHeight || h;
        const need = 100 * 1.14 + 4; // globe radius + atmosphereAltitude + margin
        const tan = Math.tan((cam.fov || 50) * Math.PI / 360);
        const dV = need / tan;
        const dH = need / (tan * Math.max(cw / ch, 0.2));
        return Math.min(Math.max(dV, dH), ctrls.maxDistance * 0.9);
      };
      this._fitDistance = fitDistance;
      ctrls.minDistance = fitDistance();

      if (!reduceMotion()) {
        // Orbital intro: brisk rotation, easing to a slow drift after ~2.8s.
        ctrls.autoRotate = true;
        ctrls.autoRotateSpeed = 1.9;
        this._slowTimer = setTimeout(() => { if (ctrls.autoRotate) ctrls.autoRotateSpeed = 0.45; }, 2800);
        const stop = () => { ctrls.autoRotate = false; clearTimeout(this._slowTimer); };
        ['pointerdown', 'wheel', 'touchstart'].forEach((ev) => host.addEventListener(ev, stop, { passive: true }));
      } else {
        ctrls.autoRotate = false;
      }

      this._ro = new ResizeObserver(() => {
        const cw = this.clientWidth, ch = this.clientHeight;
        if (cw > 40 && ch > 40) {
          globe.width(cw).height(ch);
          ctrls.minDistance = fitDistance();
          if (globe.camera().position.length() < ctrls.minDistance) {
            globe.pointOfView({ altitude: ctrls.minDistance / 100 - 1 }, 0);
          }
        }
      });
      this._ro.observe(this);
    }

    /* --- Country polygons (opportunity mode) ---------------------------------
       A polygon is "valid" when its country has a real port in maritime-countries.js.
       Selection itself is NOT stored here: the codes arrive as attributes from the
       form, so a click on the globe and a pick in the <select> converge on one state. */
    countryCodeOf(f) {
      const idx = window.MARITIME_CODE_BY_NAME;
      const norm = window.maritimeNorm;
      if (!idx || !norm || !f || !f.properties) return null;
      const p = f.properties;
      const tries = [p.name, p.name_long, p.admin, p.sovereignt, p.name_en, p.brk_name];
      for (let i = 0; i < tries.length; i++) {
        if (!tries[i]) continue;
        const hit = idx[norm(tries[i])];
        if (hit) return hit;
      }
      return null;
    }

    selectedRole(f) {
      if (this._mode !== 'opportunity') return null;
      const code = this.countryCodeOf(f);
      if (!code) return null;
      if (code === this._oppOriginCode) return 'origin';
      if (code === this._oppDestCode) return 'destination';
      return null;
    }

    capColor(f) {
      const role = this.selectedRole(f);
      if (role === 'origin') return 'rgba(100,204,197,0.82)';
      if (role === 'destination') return 'rgba(238,238,238,0.78)';
      if (this._mode === 'opportunity' && this.countryCodeOf(f)) return 'rgba(120,150,165,0.62)';
      return 'rgba(120,150,165,0.55)';
    }

    countryLabel(f) {
      if (this._mode !== 'opportunity') return '';
      const code = this.countryCodeOf(f);
      if (!code) return '';
      const c = (window.MARITIME_BY_CODE || {})[code];
      if (!c) return '';
      const en = this._lang === 'en';
      const role = this.selectedRole(f);
      const hint = role === 'origin'
        ? (en ? 'Origin — click again to clear' : 'Origen — clic de nuevo para limpiar')
        : role === 'destination'
          ? (en ? 'Destination' : 'Destino')
          : (this._oppOriginCode
            ? (en ? 'Click to set as destination' : 'Clic para marcar como destino')
            : (en ? 'Click to set as origin' : 'Clic para marcar como origen'));
      return '<div style="background:' + LIGHT + ';color:' + NAVY + ';padding:8px 12px;' +
        'font:600 12px/1.4 Manrope,system-ui,sans-serif;border-radius:2px">' +
        (en ? c.nameEn : c.nameEs) +
        '<div style="font-weight:500;opacity:.6;margin-top:3px">' + hint + '</div></div>';
    }

    /* Order is enforced: origin first, then destination. Clicking the current origin
       clears both; clicking a third country restarts from origin. */
    handleCountryClick(f) {
      if (this._mode !== 'opportunity') return;
      const code = this.countryCodeOf(f);
      if (!code) return;
      const origin = this._oppOriginCode, dest = this._oppDestCode;
      if (!origin) {
        this.emitCountry('origin', code);
      } else if (code === origin) {
        this.emitCountry('destination', null);
        this.emitCountry('origin', null);
      } else if (!dest) {
        this.emitCountry('destination', code);
      } else {
        this.emitCountry('destination', null);
        this.emitCountry('origin', code);
      }
    }

    emitCountry(role, code) {
      this.dispatchEvent(new CustomEvent('trade-country-select', {
        detail: { role: role, code: code || null }, bubbles: true, composed: true
      }));
    }

    /* Re-running the accessors is what makes three-globe repaint the caps. */
    refreshPolygons() {
      const g = this._globe;
      if (!g || !g.polygonCapColor) return;
      g.polygonCapColor((f) => this.capColor(f));
      g.polygonAltitude((f) => this.selectedRole(f) ? 0.012 : 0.006);
      if (g.polygonLabel) g.polygonLabel((f) => this.countryLabel(f));
    }

    /* Opportunity mode: the BGB corridors stay in their own data array untouched;
       only what the globe DISPLAYS changes. A requested opportunity is drawn as a
       thin low-opacity dashed arc — never like a confirmed BGB service. */
    applyOpportunity() {
      const g = this._globe;
      if (!g || !this._bgbArcs) return;
      const en = this._lang === 'en';
      this.refreshPolygons();

      if (this._mode !== 'opportunity') {
        g.arcsData(this._bgbArcs);
        g.pointColor((p) => p.bgb ? TURQ : BLUE).pointRadius((p) => p.bgb ? 0.42 : 0.3);
        if (g.ringsData) g.ringsData([]);
        return;
      }

      // Gateways stay visible for orientation but recede, so the requested arc leads.
      g.pointColor(() => 'rgba(23,107,135,0.55)').pointRadius(() => 0.22);

      const o = this._oppOrigin, d = this._oppDest;
      const arcs = [];
      const rings = [];
      if (o) rings.push({ lat: o.lat, lng: o.lon, color: TURQ });
      if (d) rings.push({ lat: d.lat, lng: d.lon, color: LIGHT });
      if (o && d) {
        arcs.push({
          startLat: o.lat, startLng: o.lon, endLat: d.lat, endLng: d.lon,
          color: ['rgba(100,204,197,0.85)', 'rgba(238,238,238,0.35)'],
          stroke: 0.45, dashLength: 0.12, dashGap: 0.16, dashSpeed: 0.7,
          opp: {
            title: en ? 'Opportunity request' : 'Oportunidad solicitada',
            sub: en ? 'Route under evaluation — not a confirmed service' : 'Ruta por evaluar — no es un servicio confirmado',
            originLabel: en ? 'Origin' : 'Origen',
            destLabel: en ? 'Destination' : 'Destino',
            origin: o.name, dest: d.name
          }
        });
      }
      g.arcsData(arcs);
      if (g.ringsData) {
        g.ringsData(rings)
          .ringColor(() => (t) => 'rgba(100,204,197,' + (1 - t) * 0.7 + ')')
          .ringMaxRadius(3.2)
          .ringPropagationSpeed(reduceMotion() ? 0 : 3.2)
          .ringRepeatPeriod(reduceMotion() ? 0 : 620);
      }
    }

    oppLabel(d) {
      const o = d.opp;
      return '<div style="background:' + LIGHT + ';color:' + NAVY + ';padding:12px 14px;max-width:260px;' +
        'font:500 12px/1.55 Manrope,system-ui,sans-serif;border-radius:2px">' +
        '<div style="font:700 10px/1 Manrope,sans-serif;letter-spacing:.12em;margin-bottom:8px">' +
        o.title.toUpperCase() + '</div>' +
        '<div style="display:flex;gap:10px;justify-content:space-between"><span style="opacity:.55">' +
        o.originLabel + '</span><span style="font-weight:600">' + o.origin + '</span></div>' +
        '<div style="display:flex;gap:10px;justify-content:space-between"><span style="opacity:.55">' +
        o.destLabel + '</span><span style="font-weight:600">' + o.dest + '</span></div>' +
        '<div style="margin-top:8px;padding-top:8px;border-top:1px solid rgba(5,59,80,.14);opacity:.7">' +
        o.sub + '</div></div>';
    }

    routeLabel(r, portBy) {
      const en = this._lang === 'en';
      const o = portBy[r.origin_port];
      const d = r.destination_port ? portBy[r.destination_port] : null;
      const dest = d ? d.name : (en ? r.destination_label_en : r.destination_label_es) || '—';
      const cls = r.classification === 'BGB_ROUTE'
        ? (en ? 'BGB ROUTE' : 'RUTA BGB')
        : (en ? 'MARKET OPPORTUNITY' : 'OPORTUNIDAD DE MERCADO');
      const note = (en ? r.note_en : r.note_es) || '';
      const pending = en ? 'Pending verified source' : 'Pendiente de fuente verificada';
      const rows = [
        ['', '<strong style="font:700 10px/1 Manrope,sans-serif;letter-spacing:.12em;color:' +
          (r.classification === 'BGB_ROUTE' ? NAVY : '#555') + '">' + cls + '</strong>'],
        [en ? 'Origin' : 'Origen', o.name + ' (' + o.unlocode + ')'],
        [en ? 'Destination' : 'Destino', dest + (d ? ' (' + d.unlocode + ')' : '')],
        ['Carrier', r.carrier || pending],
        [en ? 'Frequency' : 'Frecuencia', r.frequency || pending],
        ['Transit time', r.transit_time || pending],
        ['Trend Score', r.trend_score != null ? String(r.trend_score) : (en ? 'Insufficient data' : 'Datos insuficientes')],
        [en ? 'Last verified' : 'Última verificación', r.last_verified || '—'],
        [en ? 'Source' : 'Fuente', r.source_name || pending]
      ];
      return '<div style="background:' + LIGHT + ';color:' + NAVY + ';padding:12px 14px;max-width:280px;' +
        'font:500 12px/1.55 Manrope,system-ui,sans-serif;border-radius:2px">' +
        rows.map((row) => row[0]
          ? '<div style="display:flex;gap:10px;justify-content:space-between"><span style="opacity:.55">' +
            row[0] + '</span><span style="text-align:right;font-weight:600">' + row[1] + '</span></div>'
          : '<div style="margin-bottom:6px">' + row[1] + '</div>').join('') +
        (note ? '<div style="margin-top:8px;padding-top:8px;border-top:1px solid rgba(5,59,80,.14);opacity:.7">' + note + '</div>' : '') +
        '</div>';
    }

    emitSelect(detail) {
      this.dispatchEvent(new CustomEvent('trade-select', { detail: detail, bubbles: true }));
    }
  }

  if (!customElements.get('trade-globe')) customElements.define('trade-globe', TradeGlobe);
})();
