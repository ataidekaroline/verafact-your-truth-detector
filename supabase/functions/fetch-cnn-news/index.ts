import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Fetching news from CNN Brasil RSS feed...');

    // Fetch CNN Brasil RSS feed with proper headers to bypass Cloudflare
    const rssUrl = 'https://www.cnnbrasil.com.br/feed/';
    const response = await fetch(rssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      }
    });
    const rssText = await response.text();
    
    console.log('RSS feed fetched, length:', rssText.length);
    console.log('First 500 chars:', rssText.substring(0, 500));

    // Parse RSS feed (simple XML parsing)
    const items: any[] = [];
    const itemMatches = Array.from(rssText.matchAll(/<item>([\s\S]*?)<\/item>/g));
    
    console.log('Item matches found:', itemMatches.length);

    console.log('Item matches found:', itemMatches.length);

    for (const match of itemMatches) {
      const itemXml = match[1];
      console.log('Processing item, first 200 chars:', itemXml.substring(0, 200));
      
      // Title doesn't have CDATA wrapper, but may contain HTML entities
      const titleMatch = itemXml.match(/<title>(.*?)<\/title>/);
      const linkMatch = itemXml.match(/<link>(.*?)<\/link>/);
      
      console.log('Title match:', titleMatch ? 'found' : 'not found');
      console.log('Link match:', linkMatch ? 'found' : 'not found');
      
      const descriptionMatch = itemXml.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/);
      const pubDateMatch = itemXml.match(/<pubDate>(.*?)<\/pubDate>/);
      const categoryMatch = itemXml.match(/<category><!\[CDATA\[(.*?)\]\]><\/category>/);
      
      if (titleMatch && linkMatch) {
        // Decode HTML entities in title
        const title = titleMatch[1]
          .replace(/&quot;/g, '"')
          .replace(/&#8220;/g, '"')
          .replace(/&#8221;/g, '"')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .trim();
        const url = linkMatch[1].trim();
        const snippet = descriptionMatch ? descriptionMatch[1].replace(/<[^>]*>/g, '').trim().substring(0, 200) : '';
        const pubDate = pubDateMatch ? new Date(pubDateMatch[1]) : new Date();
        const category = categoryMatch ? categoryMatch[1].toLowerCase() : 'entretenimento';
        
        console.log('Adding item:', title.substring(0, 50));

        items.push({
          title,
          url,
          snippet,
          pubDate,
          category
        });
      }
    }

    console.log(`Found ${items.length} news items`);

    // Get categories from database
    const { data: categories } = await supabase
      .from('categories')
      .select('id, slug');

    const categoryMap = new Map(categories?.map(cat => [cat.slug, cat.id]) || []);

    // Map category names to slugs (CNN Brasil uses Portuguese categories)
    const categoryMapping: Record<string, string> = {
      'política': 'politics',
      'politica': 'politics',
      'brasil': 'politics',
      'mundo': 'politics',
      'ciência': 'science',
      'ciencia': 'science',
      'tecnologia': 'tech',
      'tech': 'tech',
      'saúde': 'health',
      'saude': 'health',
      'medicina': 'health',
      'entretenimento': 'politics', // default to politics for entertainment
      'esportes': 'politics', // default to politics for sports
      'economia': 'politics',
      'negócios': 'politics',
      'negocios': 'politics'
    };

    // Process and verify each news item
    const verifiedNews = [];
    for (const item of items.slice(0, 20)) { // Limit to 20 most recent items
      try {
        // Call verify-news function
        const verifyResponse = await fetch(`${supabaseUrl}/functions/v1/verify-news`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            text: `${item.title}. ${item.snippet}`
          })
        });

        const verifyResult = await verifyResponse.json();
        
        // Only include if verified as true with high confidence
        if (verifyResult.is_true && verifyResult.confidence >= 0.65) {
          // Map category
          let categorySlug = 'politics'; // default
          for (const [key, value] of Object.entries(categoryMapping)) {
            if (item.category.includes(key)) {
              categorySlug = value;
              break;
            }
          }

          const categoryId = categoryMap.get(categorySlug) || categoryMap.get('politics');

          verifiedNews.push({
            title: item.title,
            snippet: item.snippet,
            source_name: 'CNN Brasil',
            source_url: item.url,
            category_id: categoryId,
            is_verified: true,
            confidence_score: verifyResult.confidence,
            published_at: item.pubDate.toISOString(),
            verified_at: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('Error verifying news item:', error);
      }
    }

    console.log(`Verified ${verifiedNews.length} news items as true`);

    // Insert verified news into database (remove duplicates by URL)
    if (verifiedNews.length > 0) {
      // Delete old news (older than 48 hours)
      const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
      await supabase
        .from('verified_news')
        .delete()
        .lt('published_at', fortyEightHoursAgo);

      // Insert new verified news
      const { error: insertError } = await supabase
        .from('verified_news')
        .upsert(verifiedNews, { onConflict: 'source_url', ignoreDuplicates: true });

      if (insertError) {
        console.error('Error inserting verified news:', insertError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        total_fetched: items.length,
        total_verified: verifiedNews.length,
        message: `Successfully fetched and verified ${verifiedNews.length} news items`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in fetch-cnn-news:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});