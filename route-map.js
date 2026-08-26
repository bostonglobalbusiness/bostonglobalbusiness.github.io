/* <route-map> — Americas map (real TopoJSON geometry) with an animated USA → PERÚ route.
   Requires d3 + topojson-client loaded on the page (pinned tags). */
(function () {
  const ATLAS = 'https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json';
  let atlasPromise = null;
  const NAVY = '#053B50', BLUE = '#176B87', TURQ = '#64CCC5';

  function waitForLibs() {
    return new Promise((resolve) => {
      const t = setInterval(() => {
        if (window.d3 && window.topojson) { clearInterval(t); resolve(); }
      }, 60);
    });
  }

  class RouteMap extends HTMLElement {
    connectedCallback() {
      if (this._init) return;
      this._init = true;
      this.style.display = 'block';
      this.style.width = '100%';
      this.style.height = '100%';
      this.style.overflow = 'hidden';
      this.render();
      this._ro = new ResizeObserver(() => this.render());
      this._ro.observe(this);
    }
    disconnectedCallback() { if (this._ro) this._ro.disconnect(); }

    async render() {
      await waitForLibs();
      const d3 = window.d3, topojson = window.topojson;
      if (!atlasPromise) atlasPromise = d3.json(ATLAS);
      const topo = await atlasPromise;
      const all = topojson.feature(topo, topo.objects.countries).features;
      // Only the countries inside the USA -> Peru corridor (no Canada, Alaska side, Chile or Argentina)
      const KEEP = new Set(['United States of America', 'Mexico', 'Guatemala', 'Belize', 'Honduras',
        'El Salvador', 'Nicaragua', 'Costa Rica', 'Panama', 'Cuba', 'Jamaica', 'Haiti',
        'Dominican Rep.', 'Bahamas', 'Colombia', 'Venezuela', 'Ecuador', 'Peru']);
      const countries = all.filter((f) => KEEP.has(f.properties.name));

      const w = this.clientWidth || 800;
      const h = this.clientHeight || 560;
      if (w < 40 || h < 40) return;

      this.innerHTML = '';
      const svg = d3.select(this).append('svg')
        .attr('width', w).attr('height', h)
        .attr('viewBox', `0 0 ${w} ${h}`)
        .style('display', 'block')
        .style('overflow', 'hidden');

      const focus = {
        type: 'Polygon',
        coordinates: [[[-127, 49], [-67, 49], [-67, -19], [-127, -19], [-127, 49]]]
      };
      const projection = d3.geoConicEqualArea()
        .rotate([97, 0])
        .parallels([-10, 40])
        .fitExtent([[16, 16], [w - 16, h - 16]], focus);
      const path = d3.geoPath(projection);

      const highlight = new Set(['United States of America', 'Peru']);

      svg.append('g').selectAll('path').data(countries).join('path')
        .attr('d', path)
        .attr('fill', d => highlight.has(d.properties.name) ? 'rgba(100,204,197,0.20)' : 'rgba(255,255,255,0.055)')
        .attr('stroke', d => highlight.has(d.properties.name) ? TURQ : 'rgba(238,238,238,0.20)')
        .attr('stroke-width', d => highlight.has(d.properties.name) ? 1.1 : 0.6);

      // Routes: Seattle / Los Angeles -> Callao / Paita
      const CALLAO = [-77.15, -12.05], PAITA = [-81.11, -5.09];
      const SEATTLE = [-122.33, 47.61], LA = [-118.24, 34.05];
      const legs = [
        { from: SEATTLE, to: CALLAO, main: true },
        { from: LA, to: CALLAO, main: false },
        { from: LA, to: PAITA, main: false }
      ];
      const routes = svg.append('g');

      legs.forEach((leg, i) => {
        const p0 = projection(leg.from), p1 = projection(leg.to);
        const mx = (p0[0] + p1[0]) / 2, my = (p0[1] + p1[1]) / 2;
        const dx = p1[0] - p0[0], dy = p1[1] - p0[1];
        const len = Math.hypot(dx, dy) || 1;
        const bow = (0.16 + i * 0.07) * len;
        const cx = mx + (-dy / len) * bow, cy = my + (dx / len) * bow;
        const d = `M${p0[0]},${p0[1]} Q${cx},${cy} ${p1[0]},${p1[1]}`;
        const main = leg.main;

        routes.append('path').attr('d', d).attr('fill', 'none')
          .attr('stroke', main ? TURQ : 'rgba(100,204,197,0.35)')
          .attr('stroke-width', main ? 2 : 1.2)
          .attr('stroke-linecap', 'round')
          .attr('stroke-dasharray', main ? null : '4 7');

        const dot = routes.append('circle').attr('r', main ? 4.5 : 3)
          .attr('fill', main ? '#fff' : TURQ)
          .attr('stroke', TURQ).attr('stroke-width', main ? 2 : 0);
        const node = routes.select(function () { return this; });
        const pathEl = routes.append('path').attr('d', d).attr('fill', 'none').attr('stroke', 'none').node();
        const total = pathEl.getTotalLength();
        const dur = 5200 + i * 900;
        const start = performance.now() - i * 1400;
        const tick = (now) => {
          if (!this.isConnected) return;
          const t = ((now - start) % dur) / dur;
          const pt = pathEl.getPointAtLength(t * total);
          dot.attr('cx', pt.x).attr('cy', pt.y).attr('opacity', Math.min(1, Math.sin(t * Math.PI) * 3));
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        void node;
      });

      const labels = [
        { c: SEATTLE, t: 'Seattle', a: 'start', dx: 12, dy: -6 },
        { c: LA, t: 'Los Angeles', a: 'start', dx: 12, dy: 12 },
        { c: PAITA, t: 'Paita', a: 'start', dx: 12, dy: -4 },
        { c: CALLAO, t: 'Callao · Lima', a: 'start', dx: 12, dy: 6 }
      ];
      const g = svg.append('g');
      labels.forEach(l => {
        const p = projection(l.c);
        g.append('circle').attr('cx', p[0]).attr('cy', p[1]).attr('r', 3.5).attr('fill', TURQ);
        g.append('circle').attr('cx', p[0]).attr('cy', p[1]).attr('r', 9)
          .attr('fill', 'none').attr('stroke', TURQ).attr('stroke-opacity', 0.45);
        g.append('text').attr('x', p[0] + l.dx).attr('y', p[1] + l.dy)
          .attr('text-anchor', l.a)
          .attr('fill', '#EEEEEE')
          .attr('font-family', 'Manrope, system-ui, sans-serif')
          .attr('font-size', Math.max(11, Math.min(14, w / 55)))
          .attr('letter-spacing', '0.04em')
          .text(l.t);
      });
      void NAVY; void BLUE;
    }
  }
  if (!customElements.get('route-map')) customElements.define('route-map', RouteMap);
})();
