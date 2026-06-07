export function convertLongUrlToEmbed(longUrl: string): string {
  try {
    const urlObj = new URL(longUrl);

    // If it is already an embed URL or contains output=embed, return as is
    if (longUrl.includes('/maps/embed') || longUrl.includes('output=embed') || longUrl.includes('pb=!1m')) {
      return longUrl;
    }

    // Check if it's a directions URL: /maps/dir/PointA/PointB/...
    if (urlObj.pathname.includes('/maps/dir/')) {
      const parts = urlObj.pathname.split('/maps/dir/');
      if (parts[1]) {
        const pathParts = parts[1].split('/');
        
        // Filter out empty parts, coordinates (@lat,lng), or query parameters (data=)
        const locations = pathParts.filter(part => {
          if (!part) return false;
          if (part.startsWith('@')) return false;
          if (part.startsWith('data=')) return false;
          return true;
        });

        if (locations.length >= 2) {
          const origin = locations[0];
          const destination = locations.slice(1).join('+to:');
          return `https://maps.google.com/maps?saddr=${origin}&daddr=${destination}&output=embed`;
        } else if (locations.length === 1) {
          return `https://maps.google.com/maps?q=${locations[0]}&output=embed`;
        }
      }
    }

    // Check if it's a place/search URL: /maps/place/Address/ or /maps/search/Address/
    if (urlObj.pathname.includes('/maps/place/') || urlObj.pathname.includes('/maps/search/')) {
      const typeStr = urlObj.pathname.includes('/maps/place/') ? '/maps/place/' : '/maps/search/';
      const parts = urlObj.pathname.split(typeStr);
      if (parts[1]) {
        const pathParts = parts[1].split('/');
        const place = pathParts[0];
        if (place && !place.startsWith('@')) {
          return `https://maps.google.com/maps?q=${place}&output=embed`;
        }
      }
    }

    // Check query parameter q
    if (urlObj.searchParams.has('q')) {
      return `https://maps.google.com/maps?q=${encodeURIComponent(urlObj.searchParams.get('q') || '')}&output=embed`;
    }

    // Fallback: encode the entire URL
    return `https://maps.google.com/maps?q=${encodeURIComponent(longUrl)}&output=embed`;
  } catch (e) {
    return longUrl;
  }
}

export async function resolveGoogleMapsUrl(url: string): Promise<string> {
  if (!url || typeof url !== 'string') return '';
  let trimmed = url.trim();
  
  // Add https:// if it is missing but looks like a google maps link
  if (!trimmed.startsWith('http')) {
    if (trimmed.startsWith('maps.') || trimmed.startsWith('www.') || trimmed.startsWith('goo.gl') || trimmed.startsWith('g.page')) {
      trimmed = 'https://' + trimmed;
    } else {
      return trimmed;
    }
  }

  try {
    const isShortLink = trimmed.includes('maps.app.goo.gl') || 
                        trimmed.includes('goo.gl/maps') || 
                        trimmed.includes('g.page/') || 
                        trimmed.includes('maps.page.link');
    
    if (isShortLink) {
      // Server-side fetch follows the redirects to get the long URL
      // Add a timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      try {
        const res = await fetch(trimmed, { 
          method: 'GET', 
          redirect: 'follow',
          signal: controller.signal,
          headers: {
            // Some shorteners require a User-Agent
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
          }
        });
        clearTimeout(timeoutId);
        return convertLongUrlToEmbed(res.url);
      } catch (err) {
        clearTimeout(timeoutId);
        console.error('Error resolving Google Maps URL:', err);
        return convertLongUrlToEmbed(trimmed);
      }
    }
    return convertLongUrlToEmbed(trimmed);
  } catch (e) {
    console.error('Error resolving Google Maps URL:', e);
    return convertLongUrlToEmbed(trimmed);
  }
}
