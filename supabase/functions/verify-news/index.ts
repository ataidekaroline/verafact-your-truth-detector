import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple in-memory rate limiting (resets on function cold start)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10; // 10 requests per minute per IP

function checkRateLimit(clientIP: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(clientIP);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(clientIP, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  
  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  
  record.count++;
  return true;
}

// Input validation constants
const MAX_TEXT_LENGTH = 10000;
const MIN_TEXT_LENGTH = 10;

// Trusted fact-checking sources for reference generation
const TRUSTED_FACT_CHECKERS = [
  { name: 'Lupa', domain: 'lupa.uol.com.br', searchUrl: 'https://www.google.com/search?q=site:lupa.uol.com.br+' },
  { name: 'Aos Fatos', domain: 'aosfatos.org', searchUrl: 'https://www.google.com/search?q=site:aosfatos.org+' },
  { name: 'G1 Fato ou Fake', domain: 'g1.globo.com/fato-ou-fake', searchUrl: 'https://www.google.com/search?q=site:g1.globo.com+fato+ou+fake+' },
  { name: 'Estadão Verifica', domain: 'estadao.com.br/estadao-verifica', searchUrl: 'https://www.google.com/search?q=site:estadao.com.br+verifica+' },
  { name: 'UOL Confere', domain: 'noticias.uol.com.br/confere', searchUrl: 'https://www.google.com/search?q=site:noticias.uol.com.br+confere+' },
];

// Generate verified search links instead of potentially fake direct URLs
function generateVerifiedSearchLinks(topic: string, keywords: string[]): string[] {
  const searchQuery = encodeURIComponent(keywords.slice(0, 5).join(' '));
  
  return TRUSTED_FACT_CHECKERS.slice(0, 3).map(checker => 
    `${checker.searchUrl}${searchQuery}`
  );
}

// Extract main keywords from text for search
function extractKeywords(text: string): string[] {
  // Remove common stop words and extract significant terms
  const stopWords = new Set([
    'o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas', 'de', 'da', 'do', 'das', 'dos',
    'em', 'na', 'no', 'nas', 'nos', 'por', 'para', 'com', 'sem', 'sob', 'sobre',
    'que', 'se', 'não', 'mais', 'muito', 'como', 'quando', 'onde', 'quem',
    'foi', 'ser', 'são', 'está', 'estão', 'tem', 'têm', 'ter', 'pode', 'podem',
    'este', 'esta', 'esse', 'essa', 'isso', 'isto', 'aqui', 'ali', 'lá',
    'e', 'ou', 'mas', 'porém', 'porque', 'pois', 'já', 'ainda', 'também'
  ]);
  
  const words = text
    .toLowerCase()
    .replace(/[^\w\sàáâãéêíóôõúç]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word));
  
  // Return unique keywords, prioritizing longer words (more specific)
  const unique = [...new Set(words)];
  return unique.sort((a, b) => b.length - a.length).slice(0, 8);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('cf-connecting-ip') || 
                     'unknown';
    
    if (!checkRateLimit(clientIP)) {
      console.warn(`Rate limit exceeded for IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente em alguns minutos.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse and validate request body
    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Corpo da requisição inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { text } = body;
    
    // Type validation
    if (!text || typeof text !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Texto válido é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Trim and validate length
    const cleanText = text.trim();
    
    if (cleanText.length < MIN_TEXT_LENGTH) {
      return new Response(
        JSON.stringify({ error: `Texto muito curto. Mínimo de ${MIN_TEXT_LENGTH} caracteres.` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (cleanText.length > MAX_TEXT_LENGTH) {
      return new Response(
        JSON.stringify({ error: `Texto excede o limite máximo de ${MAX_TEXT_LENGTH} caracteres.` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize: remove any potential script injection patterns
    const sanitizedText = cleanText
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .substring(0, MAX_TEXT_LENGTH);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'Serviço temporariamente indisponível' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract keywords for verified search links
    const keywords = extractKeywords(sanitizedText);
    console.log('Verifying news with AI:', sanitizedText.substring(0, 100));
    console.log('Extracted keywords:', keywords.slice(0, 5).join(', '));

    // Call Lovable AI for verification
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `Você é um assistente de IA especializado em verificação de fatos e detecção de fake news.

REGRAS CRÍTICAS DE FONTES E REFERÊNCIAS:
1. NUNCA invente ou fabrique URLs. Isso é PROIBIDO.
2. Se você não tem 100% de certeza sobre um link específico, NÃO o inclua.
3. Em vez de URLs diretas, forneça o NOME da fonte confiável (ex: "Agência Lupa", "Aos Fatos", "G1 Fato ou Fake").
4. Deixe o campo "references" VAZIO (array vazio []) - o sistema gerará links de busca verificados automaticamente.

ANÁLISE:
- Determine se a informação é VERDADEIRA ou FALSA
- Avalie a plausibilidade, lógica e consistência
- Identifique sensacionalismo ou manipulação emocional
- Considere o contexto histórico e factual

RESPOSTA (em Português do Brasil):
{
  "is_true": boolean,
  "confidence": number (0.0 a 1.0),
  "reasoning": "Análise detalhada explicando sua avaliação",
  "fact_summary": "Se falso, a correção. Se verdadeiro, resumo factual.",
  "source_names": ["Lista de fontes de checagem consultadas, ex: Agência Lupa, Aos Fatos"],
  "references": []
}

IMPORTANTE: O campo "references" DEVE ser um array VAZIO. O sistema irá gerar links de busca verificados automaticamente baseados nas palavras-chave da notícia.`
          },
          {
            role: 'user',
            content: `Analise este texto de notícia e determine se é VERDADEIRO ou FALSO:\n\n${sanitizedText}`
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente mais tarde.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Serviço temporariamente indisponível.' }),
          { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Erro ao processar verificação' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices[0].message.content;
    
    console.log('AI response received successfully');

    // Parse AI response
    let result;
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in AI response');
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      // Fallback: analyze text for keywords
      const lowerContent = aiContent.toLowerCase();
      const isFalse = lowerContent.includes('false') || lowerContent.includes('fake') || lowerContent.includes('falso');
      const isTrue = lowerContent.includes('true') || lowerContent.includes('verified') || lowerContent.includes('verdadeiro');
      
      result = {
        is_true: isTrue && !isFalse,
        confidence: 0.6,
        reasoning: aiContent.substring(0, 500),
        fact_summary: aiContent,
        source_names: [],
        references: []
      };
    }

    // Generate verified search links (NEVER use AI-generated URLs)
    const verifiedReferences = generateVerifiedSearchLinks(sanitizedText, keywords);
    
    // Add source names as informational text
    const sourceInfo = result.source_names && result.source_names.length > 0
      ? `Fontes consultadas: ${result.source_names.join(', ')}`
      : '';

    return new Response(
      JSON.stringify({
        is_true: result.is_true || false,
        confidence: result.confidence || 0.5,
        reasoning: result.reasoning || '',
        fact_summary: sourceInfo 
          ? `${result.fact_summary || ''}\n\n${sourceInfo}`
          : (result.fact_summary || ''),
        references: verifiedReferences // Always use system-generated search links
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in verify-news:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
