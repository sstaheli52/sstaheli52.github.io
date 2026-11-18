fetch('data/projects.json')
  .then(function(r) { return r.json(); })
  .then(function(projects) {
    var list = document.getElementById('proj-list');
    projects.forEach(function(p, i) {
      var flip = i % 2 === 1;
      list.innerHTML += buildCard(p, flip);
    });
  });

function buildCard(p, flip) {
  return '<div class="proj-card-v">'
    + buildHeader(p)
    + buildBody(p, flip)
    + '</div>';
}

function buildHeader(p) {
  return '<div class="proj-card-header">'
    + '<div style="display:flex;align-items:baseline;gap:12px;">'
    + '<span class="proj-title">' + esc(p.title) + '</span>'
    + '<span class="proj-course-label">' + esc(p.course) + '</span>'
    + '</div>'
    + '<span class="proj-year">' + esc(p.year) + '</span>'
    + '</div>';
}

function buildBody(p, flip) {
  return '<div class="proj-card-body' + (flip ? ' flip' : '') + '">'
    + buildPhoto(p)
    + buildContent(p)
    + '</div>';
}

function buildPhoto(p) {
  if (p.image) {
    return '<div class="proj-photo"><img src="' + esc(p.image) + '" alt="' + esc(p.title) + '" /></div>';
  }
  return '<div class="proj-photo-placeholder"><span>Image coming soon</span></div>';
}

function buildContent(p) {
  return '<div class="proj-content">'
    + buildDescription(p)
    + buildChallenges(p)
    + buildSkills(p)
    + buildLinks(p)
    + '</div>';
}

function buildDescription(p) {
  return '<div>'
    + '<div class="proj-section-label">Description</div>'
    + '<p class="proj-desc-text">' + esc(p.description) + '</p>'
    + '</div>';
}

function buildChallenges(p) {
  var items = p.challenges && p.challenges.length
    ? p.challenges.map(function(c) { return '<li>' + esc(c) + '</li>'; }).join('')
    : '<li>...</li>';
  return '<div class="proj-challenges">'
    + '<div class="proj-section-label">Challenges</div>'
    + '<ul>' + items + '</ul>'
    + '</div>';
}

function buildSkills(p) {
  var tags = (p.skills || []).map(function(s) {
    return '<span class="stag">' + esc(s) + '</span>';
  }).join('');
  return '<div class="proj-skills-row">' + tags + '</div>';
}

function buildLinks(p) {
  var btns = (p.links || []).map(function(l) {
    if (l.url) {
      return '<a href="' + esc(l.url) + '" target="_blank" rel="noopener" class="proj-link-btn">' + esc(l.label) + '</a>';
    }
    return '<a href="#" class="proj-link-btn placeholder">' + esc(l.label) + '</a>';
  }).join('');
  return '<div class="proj-links">' + btns + '</div>';
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
