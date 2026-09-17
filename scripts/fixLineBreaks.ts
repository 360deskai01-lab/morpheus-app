import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://xraapsysarhfgcqckvhs.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyYWFwc3lzYXJoZmdjcWNrdmhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwMTc5OTIsImV4cCI6MjEwMzU5Mzk5Mn0.TM3IOx9xgpnGCD3Wra2yUMpxLISJ_83QStoDi8DXbFE'
);

async function inspectAndFixBreaks() {
  console.log('[1/2] Format bozuklukları taranıyor...');
  const { data: songs, error } = await supabase
    .from('morfeus_songs')
    .select('id, title, content')
    .range(0, 1500);

  if (error || !songs) {
    console.error('Hata:', error?.message);
    return;
  }

  const brokenSongs = songs.filter(s => {
    if (!s.content) return true;
    // İçinde gerçek \n yok ama metin halinde "\\n" veya "<br>" varsa
    return !s.content.includes('\n') && (s.content.includes('\\n') || s.content.includes('<br>'));
  });

  console.log(`[Tespit] Satır sonu kaçış karakteri bozuk olan parça sayısı: ${brokenSongs.length}`);

  for (const song of brokenSongs) {
    let fixedContent = song.content || '';
    fixedContent = fixedContent.replace(/\\n/g, '\n').replace(/<br\s*[\/]?>/gi, '\n');

    await supabase
      .from('morfeus_songs')
      .update({ content: fixedContent })
      .eq('id', song.id);
  }

  console.log('[2/2] Düzeltme tamamlandı!');
}

inspectAndFixBreaks();