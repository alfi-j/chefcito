export function escapeXml(value: string | number): string {
  return String(value).replace(/[<>&'"]/g, (char) => {
    switch (char) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case "'":
        return '&apos;';
      case '"':
        return '&quot;';
      default:
        return char;
    }
  });
}

export function openTag(name: string, attrs: Record<string, string | number> = {}): string {
  const attrString = Object.entries(attrs)
    .map(([key, value]) => ` ${key}="${escapeXml(value)}"`)
    .join('');
  return `<${name}${attrString}>`;
}

export function closeTag(name: string): string {
  return `</${name}>`;
}

export function element(name: string, value: string | number): string {
  return `${openTag(name)}${escapeXml(value)}${closeTag(name)}`;
}

export function elementIf(name: string, value?: string | number | null): string {
  if (value === undefined || value === null || value === '') return '';
  return element(name, value);
}