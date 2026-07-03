const COLORS = [
  '#4f46e5', '#dc2626', '#16a34a', '#ca8a04', '#2563eb',
  '#9333ea', '#0891b2', '#ea580c', '#db2777', '#65a30d',
  '#7c3aed', '#b91c1c', '#15803d', '#a16207', '#1d4ed8',
  '#6d28d9', '#0e7490', '#c2410c', '#be185d', '#4d7c0f'
]

const assigned = {}

export function getAvatarColor(name, peopleList) {
  if (assigned[name]) return assigned[name]
  const idx = peopleList ? peopleList.indexOf(name) : -1
  const color = idx >= 0 ? COLORS[idx % COLORS.length] : COLORS[Math.abs(hashCode(name)) % COLORS.length]
  assigned[name] = color
  return color
}

function hashCode(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return hash
}

export function getInitials(name) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || name[0].toUpperCase()
}
