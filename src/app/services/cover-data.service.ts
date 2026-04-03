import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CoverDataService {

  constructor() { }

  convertCoverDataBase64(coverData: string, extension: string): string {
    if (!coverData) {
      return '';
    }
    // If it's already a data URL, return as-is
    if (coverData.startsWith('data:')) {
      return coverData;
    }

    const ext = (extension || '').toLowerCase().replace('.', '');
    const mimeType =
      ext === 'svg' ? 'image/svg+xml' :
        ext === 'jpg' ? 'image/jpeg' :
          `image/${ext || 'png'}`;

    const trimmed = coverData.trim();

    // Some APIs return raw SVG markup instead of base64
    if (ext === 'svg' && trimmed.startsWith('<svg')) {
      return `data:${mimeType};utf8,${encodeURIComponent(trimmed)}`;
    }

    return `data:${mimeType};base64,${trimmed.replace(/\s/g, '')}`;
  }

  onCoverImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/placeholder/cover_art_placeholder.svg';
  }
}
