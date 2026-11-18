(function() {
  // Red dots: places lived
  var journeyPoints = [
    { coords: [-122.3321, 47.6062], label: 'Seattle, WA — USA' },
    { coords: [8.8017,   53.0793], label: 'Bremen, Germany — 2019–2020' },
    { coords: [11.2558,  43.7696], label: 'Florence, Italy — 2021' },
    { coords: [-83.6833,  9.9000], label: 'Turrialba, Costa Rica — 2022' },
    { coords: [14.4378,  50.0755], label: 'Prague, Czech Republic — 2022–2025' },
    { coords: [5.6651,   51.9685], label: 'Wageningen, Netherlands — 2025–present' },
  ];

  // Yellow dots: single-location projects
  var projectPoints = [
    { coords: [-4.0,   57.5],  label: 'Scotland — Peatland Restoration StoryMap' },
    { coords: [27.9,  -24.1],  label: 'South Africa — Elephant Presence Dashboard' },
    { coords: [-3.5,   40.4],  label: 'Spain — MSc Thesis: Wildfire & Forest Structure' },
    { coords: [10.3,   43.7],  label: 'Italy — Pine Disease Early Detection' },
    { coords: [15.5,   49.8],  label: 'Czechia — BSc Thesis: Flood Moisture Sources' },
    { coords: [-156.7, 20.9],  label: 'Hawaii — Lahaina Wildfire Burn Severity' },
  ];

  // Yellow grouped dot: all Netherlands projects
  var nlPoint = {
    coords: [5.3, 52.3],
    projects: [
      'LiDAR Airport Obstacle Detection — Twente Airport',
      'Wastewater Pipeline Routing — Druten',
      'Wildlife Watchtower — Groenlo',
      'Land Cover Classification — Oosterbeek',
    ]
  };

  var wrap = document.getElementById('globe-el');
  var tooltip = document.getElementById('globe-tooltip');
  var W = 800, H = 500, R = 230;

  var projection = d3.geoOrthographic()
    .scale(R).translate([W/2, H/2]).clipAngle(90).rotate([10, -25, 0]);
  var path = d3.geoPath().projection(projection);

  var svg = d3.select('#globe-el').append('svg')
    .attr('viewBox', '0 0 ' + W + ' ' + H).attr('width', '100%');

  svg.append('rect').attr('width', W).attr('height', H).attr('fill', 'none');
  svg.append('circle').attr('cx', W/2).attr('cy', H/2).attr('r', R).attr('fill', '#C7E5FF');

  var graticule = d3.geoGraticule()();
  var gratPath = svg.append('path').datum(graticule)
    .attr('fill', 'none').attr('stroke', '#a8d4f0').attr('stroke-width', 0.6).attr('d', path);
  var landPath = svg.append('path')
    .attr('fill', '#93AB9F').attr('stroke', '#7a9490').attr('stroke-width', 0.5);
  var dotsG = svg.append('g');

  // NL dot references (set after fetch)
  var nlGlowEl = null, nlMainEl = null;

  function isVisible(coords) {
    var rot = projection.rotate();
    return d3.geoDistance(coords, [-rot[0], -rot[1]]) < Math.PI / 2;
  }

  function redraw() {
    gratPath.attr('d', path);
    landPath.attr('d', path);
    dotsG.selectAll('.dot-glow-j,.dot-main-j,.dot-glow-p,.dot-main-p').each(function(d) {
      var p = projection(d.coords);
      d3.select(this).attr('cx', p[0]).attr('cy', p[1])
        .attr('display', isVisible(d.coords) ? null : 'none');
    });
    if (nlGlowEl) {
      var pNl = projection(nlPoint.coords);
      var vNl = isVisible(nlPoint.coords);
      nlGlowEl.attr('cx', pNl[0]).attr('cy', pNl[1]).attr('display', vNl ? null : 'none');
      nlMainEl.attr('cx', pNl[0]).attr('cy', pNl[1]).attr('display', vNl ? null : 'none');
    }
  }

  // Hover-pause state
  var hovering = false, tooltipHovered = false;

  tooltip.addEventListener('mouseenter', function() {
    tooltipHovered = true; hovering = true;
  });
  tooltip.addEventListener('mouseleave', function() {
    tooltipHovered = false; hovering = false;
    tooltip.style.display = 'none';
    tooltip.style.pointerEvents = 'none';
  });

  function posTooltip(event, html, allowClicks) {
    var rect = document.getElementById('globe-wrap').getBoundingClientRect();
    var x = event.clientX - rect.left, y = event.clientY - rect.top;
    var left = (x + 16 + 260 > wrap.offsetWidth) ? x - 276 : x + 16;
    tooltip.style.left = left + 'px';
    tooltip.style.top = Math.max(8, y - 10) + 'px';
    tooltip.style.pointerEvents = allowClicks ? 'auto' : 'none';
    tooltip.innerHTML = html;
    tooltip.style.display = 'block';
  }

  function dotLeave() {
    setTimeout(function() {
      if (!tooltipHovered) {
        hovering = false;
        tooltip.style.display = 'none';
        tooltip.style.pointerEvents = 'none';
      }
    }, 60);
  }

  // Drag to rotate
  var dragOrigin = null, rotOrigin = null;
  svg.on('mousedown', function(event) {
    var cls = (event.target.className && event.target.className.baseVal) || '';
    if (cls.indexOf('dot-') >= 0) return;
    dragOrigin = [event.clientX, event.clientY];
    rotOrigin = projection.rotate().slice();
    svg.classed('dragging', true);
    tooltip.style.display = 'none'; hovering = false;
  });
  d3.select(document)
    .on('mousemove.globe', function(event) {
      if (!dragOrigin) return;
      var dx = event.clientX - dragOrigin[0], dy = event.clientY - dragOrigin[1];
      projection.rotate([
        rotOrigin[0] + dx * 0.35,
        Math.max(-80, Math.min(80, rotOrigin[1] - dy * 0.35)),
        rotOrigin[2]
      ]);
      redraw();
    })
    .on('mouseup.globe', function() { dragOrigin = null; svg.classed('dragging', false); });

  // Auto-spin — pauses while dragging or hovering a dot
  (function spinLoop() {
    if (!dragOrigin && !hovering) {
      var rot = projection.rotate();
      projection.rotate([rot[0] + 0.08, rot[1], rot[2]]);
      redraw();
    }
    requestAnimationFrame(spinLoop);
  })();

  fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
    .then(function(r) { return r.json(); })
    .then(function(world) {
      landPath.datum(topojson.feature(world, world.objects.land));
      redraw();

      // — Red journey glows —
      dotsG.selectAll('.dot-glow-j').data(journeyPoints).enter()
        .append('circle').attr('class', 'dot-glow-j')
        .attr('r', 13).attr('fill', '#FB2C36').attr('opacity', 0.22)
        .each(function(d) {
          var p = projection(d.coords);
          d3.select(this).attr('cx', p[0]).attr('cy', p[1])
            .attr('display', isVisible(d.coords) ? null : 'none');
        });

      // — Red journey dots —
      dotsG.selectAll('.dot-main-j').data(journeyPoints).enter()
        .append('circle').attr('class', 'dot-main-j')
        .attr('r', 7).attr('fill', '#ffffff').attr('stroke', '#FB2C36').attr('stroke-width', 2)
        .style('cursor', 'pointer')
        .each(function(d) {
          var p = projection(d.coords);
          d3.select(this).attr('cx', p[0]).attr('cy', p[1])
            .attr('display', isVisible(d.coords) ? null : 'none');
        })
        .on('mouseenter', function(event, d) { hovering = true; posTooltip(event, d.label, false); })
        .on('mousemove',  function(event) { posTooltip(event, tooltip.innerHTML, false); })
        .on('mouseleave', dotLeave);

      // — Yellow project glows —
      dotsG.selectAll('.dot-glow-p').data(projectPoints).enter()
        .append('circle').attr('class', 'dot-glow-p')
        .attr('r', 13).attr('fill', '#FBBF24').attr('opacity', 0.28)
        .each(function(d) {
          var p = projection(d.coords);
          d3.select(this).attr('cx', p[0]).attr('cy', p[1])
            .attr('display', isVisible(d.coords) ? null : 'none');
        });

      // — Yellow project dots —
      dotsG.selectAll('.dot-main-p').data(projectPoints).enter()
        .append('circle').attr('class', 'dot-main-p')
        .attr('r', 7).attr('fill', '#FBBF24').attr('stroke', '#fff').attr('stroke-width', 1.5)
        .style('cursor', 'pointer')
        .each(function(d) {
          var p = projection(d.coords);
          d3.select(this).attr('cx', p[0]).attr('cy', p[1])
            .attr('display', isVisible(d.coords) ? null : 'none');
        })
        .on('mouseenter', function(event, d) { hovering = true; posTooltip(event, d.label, false); })
        .on('mousemove',  function(event) { posTooltip(event, tooltip.innerHTML, false); })
        .on('mouseleave', dotLeave);

      // — NL grouped glow (larger) —
      var pNl0 = projection(nlPoint.coords);
      var vNl0 = isVisible(nlPoint.coords);
      nlGlowEl = dotsG.append('circle').attr('class', 'dot-glow-nl')
        .attr('r', 20).attr('fill', '#FBBF24').attr('opacity', 0.28)
        .attr('cx', pNl0[0]).attr('cy', pNl0[1]).attr('display', vNl0 ? null : 'none');

      // — NL grouped dot (larger) —
      nlMainEl = dotsG.append('circle').attr('class', 'dot-main-nl')
        .attr('r', 12).attr('fill', '#FBBF24').attr('stroke', '#fff').attr('stroke-width', 2)
        .style('cursor', 'pointer')
        .attr('cx', pNl0[0]).attr('cy', pNl0[1]).attr('display', vNl0 ? null : 'none')
        .on('mouseenter', function(event) {
          hovering = true;
          var html = '<strong style="display:block;margin-bottom:8px;color:#EEE7EF;font-size:12px;">Netherlands Projects</strong>'
            + nlPoint.projects.map(function(p) {
                return '<div style="padding:3px 0;color:#9eadc8;cursor:pointer;transition:color 0.15s;" '
                  + 'onmouseenter="this.style.color=\'#EEE7EF\'" onmouseleave="this.style.color=\'#9eadc8\'" '
                  + 'onclick="document.getElementById(\'projects\').scrollIntoView({behavior:\'smooth\'})">'
                  + p + '</div>';
              }).join('');
          posTooltip(event, html, true);
        })
        .on('mouseleave', dotLeave);
    });
})();
