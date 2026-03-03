const MIME_TYPES: Record<string, string> = {
  'svg': 'svg+xml',
  'jpg': 'jpeg',
};

export function toImageDataUrl(base64Data: string, extension: string): string {
  if (!base64Data) {
    return '';
  }
  const mimeType = MIME_TYPES[extension.toLowerCase()] ?? extension;
  return `data:image/${mimeType};base64,${base64Data}`;
}
