// GitHub linguist colors for common languages; used when the REST fallback gives no color.
const KNOWN = {
  JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572A5', Java: '#b07219',
  'C++': '#f34b7d', C: '#555555', 'C#': '#178600', Go: '#00ADD8', Rust: '#dea584',
  Ruby: '#701516', PHP: '#4F5D95', Kotlin: '#A97BFF', Swift: '#F05138', Dart: '#00B4AB',
  HTML: '#e34c26', CSS: '#563d7c', SCSS: '#c6538c', Shell: '#89e051',
  'Jupyter Notebook': '#DA5B0B', Dockerfile: '#384d54', Vue: '#41b883', R: '#198CE7',
};

export function languageColor(name, given) {
  if (given) return given;
  if (KNOWN[name]) return KNOWN[name];
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return `hsl(${hash % 360}, 55%, 55%)`;
}
