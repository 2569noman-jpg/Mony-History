import { NextResponse } from 'next/server';
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // IP ডিটেকশন (Prioritize server headers, fallback to client-sent IP)
    let ip = request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || 'unknown';
    if (ip === 'unknown' || ip === '::1' || ip === '127.0.0.1') {
      ip = data.ipAddress && data.ipAddress !== 'Unknown' ? data.ipAddress : ip;
    }
    
    // Vercel Country Header (Very reliable fallback)
    const countryHeader = request.headers.get('x-vercel-ip-country') || 'unknown';

    // Localhost IP handling for debugging
    if (ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
      ip = '103.147.111.1'; // Test IP (Bangladesh)
    }

    let finalLocation = (data.location && data.location !== 'Unknown') ? data.location : null;
    
    // যদি লোকেশন Unknown হয়, তবে সার্ভার থেকে জোরপূর্বক বের করার চেষ্টা
    if (!finalLocation || finalLocation.includes('Unknown')) {
      if (ip !== 'unknown') {
        try {
    // ১. ipwho.is (Primary - High success rate)
    try {
      const fbRes = await fetch(`https://ipwho.is/${ip}`, { 
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(10000) 
      });
      const fbData = await fbRes.json();
      if (fbData && fbData.success) {
        const coords = (fbData.latitude && fbData.longitude) ? ` (${fbData.latitude}, ${fbData.longitude})` : '';
        finalLocation = `${fbData.city || ''}, ${fbData.region || ''}, ${fbData.country || ''}${coords} (Verified)`;
      }
    } catch (e) { console.error("ipwho.is failed or timed out"); }
    
    // ২. ipapi.co (Fallback 1)
    if (!finalLocation || finalLocation.includes('Unknown')) {
      try {
        const geoRes = await fetch(`https://ipapi.co/${ip}/json/`, { signal: AbortSignal.timeout(10000) });
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          if (geoData.city) {
            const coords = (geoData.latitude && geoData.longitude) ? ` (${geoData.latitude}, ${geoData.longitude})` : '';
            finalLocation = `${geoData.city}, ${geoData.region}, ${geoData.country_name}${coords} (Backup)`;
          }
        }
      } catch (e) { console.error("ipapi.co failed or timed out"); }
    }

    // ৩. ip-api.com (Fallback 2 - No HTTPS but very stable)
    if (!finalLocation || finalLocation.includes('Unknown')) {
      try {
        const res3 = await fetch(`http://ip-api.com/json/${ip}?fields=status,city,regionName,country,lat,lon`, { signal: AbortSignal.timeout(10000) });
        if (res3.ok) {
          const d3 = await res3.json();
          if (d3.status === 'success') {
            finalLocation = `${d3.city}, ${d3.regionName}, ${d3.country} (${d3.lat}, ${d3.lon}) (Final)`;
          }
        }
      } catch (e) { console.error("ip-api.com failed or timed out"); }
    }
        } catch (e) {
          console.error('[SYNC-ERROR] Server-side geo lookup failed:', e);
        }
      }
    }

    // Final Fallback: Never let it be just "Unknown"
    if (!finalLocation || finalLocation.toLowerCase().includes('unknown')) {
      const countryStr = countryHeader !== 'unknown' ? `Country: ${countryHeader}` : 'Global';
      finalLocation = `${countryStr} (IP: ${ip})`;
    }

    // We sync with their deviceId
    const userIdentifier = data.deviceId || "anonymous";

    console.log(`=== [SYNC-LOG] ${new Date().toISOString()} ===`);
    console.log("IP:", ip);
    console.log("Country Header:", countryHeader);
    console.log("Final Location:", finalLocation);

    // Actual database saving logic with Supabase
    const { error } = await supabase
      .from('user_sync_data')
      .upsert({ 
        device_id: data.deviceId, 
        display_name: data.displayName,
        location: finalLocation,
        ip_address: data.ipAddress && data.ipAddress !== 'Unknown' ? data.ipAddress : ip,
        setup_data: data.setup,
        expenses_data: data.expenses,
        last_sync: new Date().toISOString(),
        sync_code: data.syncCode || null
      }, {
        onConflict: 'device_id'
      });

    if (error) {
      console.error("Supabase Error:", error);
      throw error;
    }

    return NextResponse.json({ 
      success: true, 
      message: "Data synced successfully",
      syncedAt: new Date().toISOString(),
      user: userIdentifier,
      enrichedLocation: finalLocation
    });
  } catch (error) {
    console.error("Sync Error:", error);
    return NextResponse.json({ success: false, error: "Failed to sync data" }, { status: 500 });
  }
}
