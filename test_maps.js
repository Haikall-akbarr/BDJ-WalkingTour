const { convertLongUrlToEmbed, resolveGoogleMapsUrl } = require('./src/lib/maps.ts'); // wait, I will just write the function without requiring

function convertLongUrl(longUrl) {
  try {
    const urlObj = new URL(longUrl);

    if (longUrl.includes('/maps/embed') || longUrl.includes('output=embed')) {
      return longUrl;
    }

    if (urlObj.pathname.includes('/maps/dir/')) {
      const parts = urlObj.pathname.split('/maps/dir/');
      if (parts[1]) {
        const pathParts = parts[1].split('/');
        
        const locations = pathParts.filter(part => {
          if (!part) return false;
          if (part.startsWith('@')) return false;
          if (part.startsWith('data=')) return false;
          return true;
        });

        if (locations.length >= 2) {
          const origin = locations[0];
          const destination = locations.slice(1).join('+to:');
          return "https://maps.google.com/maps?saddr=" + origin + "&daddr=" + destination + "&output=embed";
        } else if (locations.length === 1) {
          return "https://maps.google.com/maps?q=" + locations[0] + "&output=embed";
        }
      }
    }

    if (urlObj.pathname.includes('/maps/place/')) {
      const parts = urlObj.pathname.split('/maps/place/');
      if (parts[1]) {
        const pathParts = parts[1].split('/');
        const place = pathParts[0];
        if (place) {
          return "https://maps.google.com/maps?q=" + place + "&output=embed";
        }
      }
    }

    if (urlObj.searchParams.has('q')) {
      return "https://maps.google.com/maps?q=" + encodeURIComponent(urlObj.searchParams.get('q') || '') + "&output=embed";
    }

    return "https://maps.google.com/maps?q=" + encodeURIComponent(longUrl) + "&output=embed";
  } catch (e) {
    return longUrl;
  }
}

async function resolveGMapUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed.startsWith('http')) return trimmed;

  try {
    if (trimmed.includes('maps.app.goo.gl') || trimmed.includes('goo.gl/maps')) {
      const res = await fetch(trimmed, { method: 'GET', redirect: 'follow' });
      return convertLongUrl(res.url);
    }
    return convertLongUrl(trimmed);
  } catch (e) {
    return convertLongUrl(trimmed);
  }
}

async function run() {
  const urls = [
    'https://maps.app.goo.gl/zrodgHpn79BCvTAW6', // User's first url
    'https://maps.app.goo.gl/G7eAwa4Jj1j2t6gq8', // Random link from Maps (Museum Waja Sampai Kaputing)
  ];
  for (const u of urls) {
     console.log('Testing:', u);
     console.log('Resolved:', await resolveGMapUrl(u));
  }
}
run();
