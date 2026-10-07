const g = document.getElementById.bind(document)

dayjs.extend(dayjs_plugin_relativeTime)
dayjs.extend(dayjs_plugin_isoWeek)

const el = (tag, className, text) => {
  const e = document.createElement(tag)
  if (className) e.className = className
  if (text != null) e.textContent = text
  return e
}
const add = (parent, tag, className, text) => parent.appendChild(el(tag, className, text))
const stamp = (parent, d, className, suffix = '') => {
  const t = add(parent, 'time', className, ago(d) + suffix)
  t.title = dayjs(d).format('ddd MMM D, YYYY')
}
const ago = d => {
  const m = dayjs().diff(d, 'minute')
  const days = Math.floor(m / 1440)
  return m < 60 ? `${m}m` : m < 1440 ? `${Math.floor(m / 60)}h` : days <= 13 ? `${days}d` : `${Math.floor(days / 7)}w`
}

const linkTypes = {
  artifact: ['fa-brands fa-claude', 'Artifact'],
  browser: ['fa-solid fa-browser', 'Website'],
  figma: ['fa-brands fa-figma', 'Figma'],
  github: ['fa-brands fa-github', 'Repo'],
  prd: ['fa-solid fa-file-lines', 'PRD'],
  prototype: ['fa-brands fa-html5', 'Prototype'],
  vercel: ['fa-solid fa-triangle', 'Vercel'],
}

const latestOf = p => p.links.map(l => l.updated).filter(Boolean).sort().pop() || p.updated || ''

const createProject = p => {
  const card = add(g('projects'), 'div', 'project' + (p.inactive ? ' project-inactive' : ''))
  const head = add(card, 'div', 'project-head')
  const title = add(head, 'h2', null, p.name)
  add(title, 'span', `dot dot-${p.status}`)
  stamp(head, latestOf(p), 'project-updated', ' ago')
  if (p.aka) add(card, 'span', 'project-aka', p.aka)
  if (p.summary) {
    const summary = add(card, 'p', 'project-summary')
    const i = p.summary.indexOf('.')
    add(summary, 'strong', null, p.summary.slice(0, i + 1))
    summary.appendChild(document.createTextNode(p.summary.slice(i + 1)))
  }
  const links = add(card, 'div', 'project-links')
  if (!p.links.length) add(links, 'span', 'project-empty', 'No links, yet.')
  p.links.forEach(link => {
    const tag = link.url ? 'a' : 'span'
    const node = add(links, tag, 'project-link' + (link.url ? '' : ' project-link-disabled'))
    if (link.url) { node.href = link.url }
    const [icon, label] = linkTypes[link.type] || ['fa-solid fa-link', link.type]
    add(node, 'i', icon)
    add(node, 'span', null, label)
    if (link.updated) stamp(node, link.updated, 'link-updated')
  })
}

const createDay = (parent, d) =>
  d.items.forEach((item, i) => {
    const row = add(parent, 'div', 'row')
    add(row, 'span', 'row-date', i ? '' : dayjs(d.date).format('ddd D'))
    add(row, 'span', 'row-project', item.project)
    add(row, 'span', 'row-focus', item.focus || item.artifact || '')
    add(row, 'span', 'row-version', item.version ? `v${item.version}` : '')
    const a = add(row, 'a', 'row-action')
    a.href = item.url
    const [icon, label] = item.type === 'vercel' ? ['fa-solid fa-triangle', 'View prototype'] : ['fa-brands fa-claude', 'View artifact']
    add(a, 'i', icon)
    add(a, 'span', null, label)
  })

const renderDays = days => {
  add(g('days'), 'div', 'sort', 'Newest')
  const weeks = new Map()
  days.forEach(d => {
    const w = dayjs(d.date).format('YY') + String(dayjs(d.date).isoWeek()).padStart(2, '0')
    if (!weeks.has(w)) weeks.set(w, [])
    weeks.get(w).push(d)
  })
  const months = new Map()
  weeks.forEach((ds, w) => {
    const m = dayjs(ds[0].date).format('MMMM YYYY')
    if (!months.has(m)) months.set(m, new Map())
    months.get(m).set(w, ds)
  })
  months.forEach((ws, m) => {
    const month = add(g('days'), 'div', 'month')
    add(month, 'h2', null, m)
    ws.forEach((ds, w) => {
      const week = add(month, 'div', 'week')
      add(week, 'h3', null, w)
      const list = add(week, 'div', 'week-days')
      ds.forEach(d => createDay(list, d))
    })
  })
}

document.querySelector('header').addEventListener('click', e => {
  const btn = e.target.closest('.view')
  if (!btn) return
  document.querySelectorAll('.view').forEach(b => b.classList.toggle('on', b === btn))
  g('projects').hidden = btn.dataset.view !== 'projects'
  g('days').hidden = btn.dataset.view !== 'days'
})

g('showInactive').addEventListener('change', e => {
  g('projects').classList.toggle('show-inactive', e.target.checked)
})

const load = file => fetch(`./${file}.json`).then(r => r.json())
load('work').then(ps => ps.sort((a, b) => latestOf(b).localeCompare(latestOf(a))).forEach(createProject)).catch(console.error)
load('days').then(ds => renderDays(ds.sort((a, b) => b.date.localeCompare(a.date)))).catch(console.error)
