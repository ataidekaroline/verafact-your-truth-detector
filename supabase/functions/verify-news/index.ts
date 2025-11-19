import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();
    
    if (!text) {
      return new Response(
        JSON.stringify({ error: 'Text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Verifying news with AI:', text.substring(0, 100));

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
            content: `You are a fact-checking AI assistant specialized in detecting fake news and misinformation. 
Analyze the provided news text and determine if it appears to be TRUE (factual, verifiable) or FALSE (fake news, misinformation).

Consider:
- Plausibility and logic
- Consistency with known facts
- Sensationalism or emotional manipulation
- Source credibility indicators

Respond with a JSON object containing:
{
  "is_true": boolean,
  "confidence": number (0.0 to 1.0),
  "reasoning": "Brief explanation of your assessment",
  "fact_summary": "If false, provide the correct information. If true, provide a brief factual summary.",
  "references": ["List of relevant fact-checking sources or related information"]
}`
          },
          {
            role: 'user',
            content: `Analyze this news text and determine if it's TRUE or FALSE:\n\n${text}`
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
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices[0].message.content;
    
    console.log('AI response:', aiContent);

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
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});