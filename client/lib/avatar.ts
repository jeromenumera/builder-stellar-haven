export function nameToColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h} 60% 30%)`;
}

export function initials(name: string) {
  const parts = name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0]?.toUpperCase() || "");
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0];
  return (parts[0] + parts[1]).slice(0, 2);
}

export function avatarDataUrl(name: string, size = 256) {
  const bg = nameToColor(name);
  const text = initials(name);
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 ${size} ${size}'>
    <rect width='100%' height='100%' fill='${bg}' rx='20' />
    <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='white' font-family='Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial' font-size='${Math.floor(
      size / 2.8,
    )}' font-weight='700'>${text}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
