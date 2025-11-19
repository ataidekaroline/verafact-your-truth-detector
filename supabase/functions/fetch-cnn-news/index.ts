import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Fetching news from CNN Brasil RSS feed...');

    const rssUrl = 'https://www.cnnbrasil.com.br/feed/';
    const response = await fetch(rssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
        'Accept-Language': 'pt-BR,pt;q=0.9',
      }
    });
    const rssText = await response.text();
    
    if (rssText.includes('Checking your browser') || rssText.includes('<!DOCTYPE html>')) {
      console.log('Cloudflare blocked request');
      const { data: existing } = await supabase.from('verified_news').select('id').eq('is_verified', true).limit(10);
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Using existing verified news',
        total_fetched: 0,
        total_verified: 0,
        existing_count: existing?.length || 0
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const items: any[] = [];
    const itemMatches = Array.from(rssText.matchAll(/<item>([\s\S]*?)<\/item>/g));
    
    for (const match of itemMatches) {
      const itemXml = match[1];
      const titleMatch = itemXml.match(/<title>(.*?)<\/title>/);
      const linkMatch = itemXml.match(/<link>(.*?)<\/link>/);
      const descriptionMatch = itemXml.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/);
      const pubDateMatch = itemXml.match(/<pubDate>(.*?)<\/pubDate>/);
      const categoryMatch = itemXml.match(/<category><!\[CDATA\[(.*?)\]\]><\/category>/);
      
      if (titleMatch && linkMatch) {
        const title = titleMatch[1]
          .replace(/&quot;/g, '"')
          .replace(/&#8220;/g, '"')
          .replace(/&#8221;/g, '"')
          .replace(/&amp;/g, '&')
          .trim();
        items.push({
          title,
          url: linkMatch[1].trim(),
          snippet: descriptionMatch ? descriptionMatch[1].replace(/<[^>]*>/g, '').trim().substring(0, 200) : '',
          pubDate: pubDateMatch ? new Date(pubDateMatch[1]) : new Date(),
          category: categoryMatch ? categoryMatch[1].toLowerCase() : 'politics'
        });
      }
    }

    console.log(`Found ${items.length} news items`);

    const { data: categories } = await supabase.from('categories').select('id, slug');
    const categoryMap = new Map(categories?.map(cat => [cat.slug, cat.id]) || []);

    const categoryMapping: Record<string, string> = {
      'política': 'politics', 'politica': 'politics', 'brasil': 'politics',
      'ciência': 'science', 'ciencia': 'science',
      'tecnologia': 'tech', 'tech': 'tech',
      'saúde': 'health', 'saude': 'health',
      'entretenimento': 'politics', 'esportes': 'politics'
    };

    const verifiedNews = [];
    for (const item of items.slice(0, 10)) {
      let retries = 0;
      let verified = false;

      while (retries <= 2 && !verified) {
        try {
          if (verifiedNews.length > 0) await delay(1000);

          const verifyResponse = await fetch(`${supabaseUrl}/functions/v1/verify-news`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseKey}` },
            body: JSON.stringify({ text: `${item.title}. ${item.snippet}` })
          });

          if (verifyResponse.status === 429) {
            console.log(`Rate limited, retry ${retries + 1}`);
            await delay(2000 * (retries + 1));
            retries++;
            continue;
          }

          const verifyResult = await verifyResponse.json();
          
          if (verifyResult.is_true && verifyResult.confidence >= 0.65) {
            let categorySlug = 'politics';
            for (const [key, value] of Object.entries(categoryMapping)) {
              if (item.category.includes(key)) {
                categorySlug = value;
                break;
              }
            }

            verifiedNews.push({
              title: item.title,
              snippet: item.snippet,
              source_name: 'CNN Brasil',
              source_url: item.url,
              confidence_score: verifyResult.confidence,
              is_verified: true,
              category_id: categoryMap.get(categorySlug) || categoryMap.get('politics'),
              verified_at: new Date().toISOString(),
              published_at: item.pubDate.toISOString(),
            });
          }
          verified = true;
        } catch (error) {
          console.error('Verification error:', error);
          retries++;
        }
      }
    }

    console.log(`Verified ${verifiedNews.length} items`);

    if (verifiedNews.length > 0) {
      const twoDaysAgo = new Date();
      twoDaysAgo.setHours(twoDaysAgo.getHours() - 48);
      await supabase.from('verified_news').delete().lt('verified_at', twoDaysAgo.toISOString());

      const { error: insertError } = await supabase.from('verified_news').upsert(verifiedNews, {
        onConflict: 'source_url'
      });

      if (insertError) throw insertError;
    }

    return new Response(JSON.stringify({ 
      success: true, 
      total_fetched: items.length,
      total_verified: verifiedNews.length,
      message: `Processed ${verifiedNews.length} verified items`
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Function error:', error);
    return new Response(JSON.stringify({ success: false, error: String(error) }), { 
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
