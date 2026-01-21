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

    console.log('Verifying news with AI:', sanitizedText.substring(0, 100));

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
            content: `Você é um assistente de IA especializado em verificação de fatos e detecção de fake news e desinformação.
IMPORTANTE: Todas as suas respostas DEVEM ser em Português do Brasil (PT-BR).

Analise o texto da notícia fornecido e determine se é VERDADEIRO (factual, verificável) ou FALSO (fake news, desinformação).

Considere:
- Plausibilidade e lógica
- Consistência com fatos conhecidos
- Sensacionalismo ou manipulação emocional
- Indicadores de credibilidade da fonte

Responda com um objeto JSON contendo (todos os textos em Português do Brasil):
{
  "is_true": boolean,
  "confidence": number (0.0 a 1.0),
  "reasoning": "Explicação detalhada da sua avaliação em português",
  "fact_summary": "Se falso, forneça a informação correta. Se verdadeiro, forneça um resumo factual breve. Sempre em português.",
  "references": ["Lista de fontes de verificação de fatos relevantes ou informações relacionadas"]
}`
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
      const isFalse = lowerContent.includes('false') || lowerContent.includes('fake') || lowerContent.includes('misinformation');
      const isTrue = lowerContent.includes('true') || lowerContent.includes('verified') || lowerContent.includes('factual');
      
      result = {
        is_true: isTrue && !isFalse,
        confidence: 0.6,
        reasoning: aiContent.substring(0, 200),
        fact_summary: aiContent,
        references: []
      };
    }

    return new Response(
      JSON.stringify({
        is_true: result.is_true || false,
        confidence: result.confidence || 0.5,
        reasoning: result.reasoning || '',
        fact_summary: result.fact_summary || '',
        references: result.references || []
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
