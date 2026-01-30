import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60000;
const MAX_REQUESTS_PER_WINDOW = 10;

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

const MAX_TEXT_LENGTH = 10000;
const MIN_TEXT_LENGTH = 10;

// ==========================================
// MAPEAMENTO DE FONTES REAIS E ESPECÍFICAS
// ==========================================

interface SourceReference {
  type: 'government' | 'factchecker' | 'media' | 'academic';
  name: string;
  description: string;
  url: string;
  relevance: string;
}

interface TopicSourceMapping {
  keywords: string[];
  sources: SourceReference[];
}

// Mapeamento rigoroso de fontes por tema
const TOPIC_SOURCE_MAPPINGS: TopicSourceMapping[] = [
  // PIX e Sistema Financeiro
  {
    keywords: ['pix', 'banco central', 'bcb', 'transferência', 'pagamento instantâneo', 'chave pix'],
    sources: [
      {
        type: 'government',
        name: 'Banco Central do Brasil - PIX',
        description: 'Portal oficial do PIX com regras, comunicados e tire-dúvidas',
        url: 'https://www.bcb.gov.br/estabilidadefinanceira/pix',
        relevance: 'Fonte oficial sobre funcionamento e regulamentação do PIX'
      },
      {
        type: 'government',
        name: 'BC - Perguntas Frequentes sobre PIX',
        description: 'FAQ oficial do Banco Central sobre o sistema de pagamentos',
        url: 'https://www.bcb.gov.br/estabilidadefinanceira/perguntasfrequentespix',
        relevance: 'Esclarece boatos comuns sobre taxas e cobranças'
      }
    ]
  },
  // Impostos e Tributação
  {
    keywords: ['imposto', 'taxa', 'tributo', 'receita federal', 'tributação', 'taxação', 'declaração'],
    sources: [
      {
        type: 'government',
        name: 'Receita Federal do Brasil',
        description: 'Portal oficial da Receita Federal com legislação tributária',
        url: 'https://www.gov.br/receitafederal/pt-br',
        relevance: 'Fonte oficial sobre impostos federais e obrigações tributárias'
      },
      {
        type: 'government',
        name: 'Portal da Legislação - Planalto',
        description: 'Acesso às leis e decretos do governo federal',
        url: 'https://www.planalto.gov.br/legislacao',
        relevance: 'Textos legais oficiais sobre tributação'
      }
    ]
  },
  // Saúde e Vacinas
  {
    keywords: ['vacina', 'vacinação', 'covid', 'saúde', 'medicamento', 'anvisa', 'tratamento', 'doença', 'vírus', 'pandemia'],
    sources: [
      {
        type: 'government',
        name: 'Ministério da Saúde',
        description: 'Portal oficial com informações sobre campanhas de vacinação',
        url: 'https://www.gov.br/saude/pt-br',
        relevance: 'Comunicados oficiais sobre políticas de saúde pública'
      },
      {
        type: 'government',
        name: 'ANVISA - Agência Nacional de Vigilância Sanitária',
        description: 'Informações sobre aprovação de medicamentos e vacinas',
        url: 'https://www.gov.br/anvisa/pt-br',
        relevance: 'Autoridade regulatória sobre medicamentos no Brasil'
      },
      {
        type: 'academic',
        name: 'Fiocruz - Fundação Oswaldo Cruz',
        description: 'Pesquisas e informações científicas sobre saúde',
        url: 'https://portal.fiocruz.br/',
        relevance: 'Instituição científica de referência em saúde pública'
      }
    ]
  },
  // Benefícios Sociais
  {
    keywords: ['benefício', 'bolsa família', 'auxílio', 'caixa', 'saque', 'bpc', 'inss', 'aposentadoria', 'pensão'],
    sources: [
      {
        type: 'government',
        name: 'Ministério do Desenvolvimento Social',
        description: 'Informações oficiais sobre programas sociais',
        url: 'https://www.gov.br/mds/pt-br',
        relevance: 'Fonte oficial sobre Bolsa Família e outros benefícios'
      },
      {
        type: 'government',
        name: 'INSS - Instituto Nacional do Seguro Social',
        description: 'Portal de serviços previdenciários',
        url: 'https://www.gov.br/inss/pt-br',
        relevance: 'Informações sobre aposentadorias, pensões e benefícios do INSS'
      },
      {
        type: 'government',
        name: 'Caixa Econômica Federal',
        description: 'Informações sobre saques e pagamentos de benefícios',
        url: 'https://www.caixa.gov.br/',
        relevance: 'Banco responsável pelo pagamento de benefícios sociais'
      }
    ]
  },
  // Eleições e Política
  {
    keywords: ['eleição', 'voto', 'urna', 'candidato', 'tse', 'fraude eleitoral', 'apuração', 'resultado'],
    sources: [
      {
        type: 'government',
        name: 'Tribunal Superior Eleitoral (TSE)',
        description: 'Portal oficial com dados eleitorais e resultados',
        url: 'https://www.tse.jus.br/',
        relevance: 'Autoridade máxima sobre processo eleitoral brasileiro'
      },
      {
        type: 'government',
        name: 'TSE - Fato ou Boato',
        description: 'Seção de checagem de desinformação eleitoral',
        url: 'https://www.justicaeleitoral.jus.br/fato-ou-boato/',
        relevance: 'Combate a fake news sobre eleições'
      }
    ]
  },
  // Economia e Inflação
  {
    keywords: ['inflação', 'ipca', 'dólar', 'economia', 'ibge', 'pib', 'desemprego', 'juros', 'selic'],
    sources: [
      {
        type: 'government',
        name: 'IBGE - Instituto Brasileiro de Geografia e Estatística',
        description: 'Dados oficiais sobre inflação, emprego e economia',
        url: 'https://www.ibge.gov.br/',
        relevance: 'Fonte primária de estatísticas econômicas do Brasil'
      },
      {
        type: 'government',
        name: 'Banco Central - Indicadores Econômicos',
        description: 'Taxa Selic, câmbio e outros indicadores',
        url: 'https://www.bcb.gov.br/estatisticas',
        relevance: 'Dados oficiais sobre política monetária'
      }
    ]
  },
  // Meio Ambiente e Clima
  {
    keywords: ['amazônia', 'desmatamento', 'clima', 'aquecimento', 'ibama', 'queimada', 'floresta'],
    sources: [
      {
        type: 'government',
        name: 'IBAMA',
        description: 'Instituto Brasileiro do Meio Ambiente',
        url: 'https://www.gov.br/ibama/pt-br',
        relevance: 'Fiscalização ambiental e dados sobre desmatamento'
      },
      {
        type: 'academic',
        name: 'INPE - Instituto Nacional de Pesquisas Espaciais',
        description: 'Monitoramento de desmatamento e queimadas',
        url: 'https://www.gov.br/inpe/pt-br',
        relevance: 'Dados científicos sobre mudanças na cobertura florestal'
      }
    ]
  }
];

// Fact-checkers brasileiros com prioridade
const FACT_CHECKERS: SourceReference[] = [
  {
    type: 'factchecker',
    name: 'Aos Fatos',
    description: 'Agência de checagem signatária do IFCN',
    url: 'https://www.aosfatos.org/',
    relevance: 'Verificações rigorosas com metodologia transparente'
  },
  {
    type: 'factchecker',
    name: 'Agência Lupa',
    description: 'Primeira agência de fact-checking do Brasil',
    url: 'https://lupa.uol.com.br/',
    relevance: 'Pioneira em checagem de fatos no país'
  },
  {
    type: 'factchecker',
    name: 'G1 Fato ou Fake',
    description: 'Núcleo de checagem do portal G1',
    url: 'https://g1.globo.com/fato-ou-fake/',
    relevance: 'Checagem vinculada ao maior portal de notícias do Brasil'
  },
  {
    type: 'factchecker',
    name: 'Estadão Verifica',
    description: 'Núcleo de verificação do jornal O Estado de S. Paulo',
    url: 'https://www.estadao.com.br/estadao-verifica/',
    relevance: 'Checagem de veículo tradicional da imprensa'
  }
];

// Veículos de mídia confiáveis
const TRUSTED_MEDIA: SourceReference[] = [
  {
    type: 'media',
    name: 'Folha de S.Paulo',
    description: 'Jornal de circulação nacional',
    url: 'https://www.folha.uol.com.br/',
    relevance: 'Um dos principais jornais do país'
  },
  {
    type: 'media',
    name: 'BBC News Brasil',
    description: 'Serviço brasileiro da BBC',
    url: 'https://www.bbc.com/portuguese',
    relevance: 'Cobertura jornalística internacional em português'
  },
  {
    type: 'media',
    name: 'The New York Times',
    description: 'Jornal internacional de referência',
    url: 'https://www.nytimes.com/',
    relevance: 'Cobertura de assuntos internacionais'
  }
];

// Extrai palavras-chave do texto
function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    'o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas', 'de', 'da', 'do', 'das', 'dos',
    'em', 'na', 'no', 'nas', 'nos', 'por', 'para', 'com', 'sem', 'sob', 'sobre',
    'que', 'se', 'não', 'mais', 'muito', 'como', 'quando', 'onde', 'quem',
    'foi', 'ser', 'são', 'está', 'estão', 'tem', 'têm', 'ter', 'pode', 'podem',
    'este', 'esta', 'esse', 'essa', 'isso', 'isto', 'aqui', 'ali', 'lá',
    'e', 'ou', 'mas', 'porém', 'porque', 'pois', 'já', 'ainda', 'também',
    'vai', 'vão', 'será', 'seria', 'governo', 'brasileiro', 'brasil'
  ]);
  
  const words = text
    .toLowerCase()
    .replace(/[^\w\sàáâãéêíóôõúç]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word));
  
  return [...new Set(words)].sort((a, b) => b.length - a.length).slice(0, 10);
}

// Identifica fontes relevantes baseado nas palavras-chave
function identifyRelevantSources(keywords: string[]): SourceReference[] {
  const keywordSet = new Set(keywords.map(k => k.toLowerCase()));
  const relevantSources: SourceReference[] = [];
  const addedUrls = new Set<string>();
  
  // Busca fontes específicas por tema
  for (const mapping of TOPIC_SOURCE_MAPPINGS) {
    const matchingKeywords = mapping.keywords.filter(k => {
      const kLower = k.toLowerCase();
      return keywords.some(keyword => 
        keyword.includes(kLower) || kLower.includes(keyword)
      );
    });
    
    if (matchingKeywords.length > 0) {
      for (const source of mapping.sources) {
        if (!addedUrls.has(source.url)) {
          relevantSources.push(source);
          addedUrls.add(source.url);
        }
      }
    }
  }
  
  // Adiciona fact-checkers (sempre relevantes)
  for (const checker of FACT_CHECKERS.slice(0, 2)) {
    if (!addedUrls.has(checker.url)) {
      relevantSources.push(checker);
      addedUrls.add(checker.url);
    }
  }
  
  // Limita a 5 fontes mais relevantes
  return relevantSources.slice(0, 5);
}

// Gera link de busca verificada para fact-checkers
function generateVerifiedSearchLink(checkerName: string, keywords: string[]): string {
  const query = encodeURIComponent(keywords.slice(0, 4).join(' '));
  
  switch (checkerName.toLowerCase()) {
    case 'aos fatos':
      return `https://www.google.com/search?q=site:aosfatos.org+${query}`;
    case 'agência lupa':
    case 'lupa':
      return `https://www.google.com/search?q=site:lupa.uol.com.br+${query}`;
    case 'g1 fato ou fake':
      return `https://www.google.com/search?q=site:g1.globo.com+fato+ou+fake+${query}`;
    case 'estadão verifica':
      return `https://www.google.com/search?q=site:estadao.com.br+verifica+${query}`;
    default:
      return `https://www.google.com/search?q=${query}+verificação`;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('cf-connecting-ip') || 'unknown';
    
    if (!checkRateLimit(clientIP)) {
      return new Response(
        JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente em alguns minutos.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
    
    if (!text || typeof text !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Texto válido é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

    const sanitizedText = cleanText
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .substring(0, MAX_TEXT_LENGTH);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Serviço temporariamente indisponível' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const keywords = extractKeywords(sanitizedText);
    const relevantSources = identifyRelevantSources(keywords);
    
    console.log('Verifying:', sanitizedText.substring(0, 100));
    console.log('Keywords:', keywords.slice(0, 5).join(', '));
    console.log('Sources identified:', relevantSources.length);

    // Prompt robusto para verificação
    const systemPrompt = `Você é um jornalista investigativo especialista em verificação de fatos do Brasil.

TAREFA: Analise a alegação e determine se é VERDADEIRA, FALSA, ou INCONCLUSIVA.

CLASSIFICAÇÃO:
- "verified" = Informação confirmada por fontes oficiais ou múltiplas fontes confiáveis
- "fake" = Desinformação clara, boato desmentido, ou informação comprovadamente falsa
- "needs_verification" = Informação ambígua, parcialmente verdadeira, ou sem fontes suficientes

FONTES DISPONÍVEIS PARA ESTA ANÁLISE:
${relevantSources.map(s => `- ${s.name}: ${s.description}`).join('\n')}

INSTRUÇÕES CRÍTICAS:
1. NUNCA invente URLs ou links. O sistema fornecerá links automaticamente.
2. Baseie sua análise em fatos verificáveis e conhecimento de domínio público.
3. Para temas sensíveis (política, saúde, economia), seja especialmente rigoroso.
4. Identifique padrões de desinformação: sensacionalismo, apelo emocional, falta de fontes.
5. Se a alegação é muito recente (últimos dias), indique que pode haver atualizações.

RESPOSTA OBRIGATÓRIA (JSON em Português do Brasil):
{
  "classification": "verified" | "fake" | "needs_verification",
  "confidence": 0.0 a 1.0,
  "headline": "Título curto e impactante do veredito (máx 10 palavras)",
  "analysis": "Análise detalhada em tom jornalístico explicando o veredito. Mínimo 3 frases.",
  "fact_correction": "Se falso: qual é o fato correto. Se verdadeiro: resumo factual.",
  "key_points": ["Ponto 1", "Ponto 2", "Ponto 3"],
  "limitations": "Limitações da análise, se houver"
}`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Verifique esta alegação:\n\n"${sanitizedText}"` }
        ],
        temperature: 0.2,
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      console.error('AI API error:', status);
      
      if (status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente mais tarde.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Erro ao processar verificação' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices[0].message.content;
    
    console.log('AI response received');

    let result;
    try {
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found');
      }
    } catch (parseError) {
      console.error('Parse error:', parseError);
      const lowerContent = aiContent.toLowerCase();
      const isFake = lowerContent.includes('falso') || lowerContent.includes('fake') || lowerContent.includes('desinformação');
      
      result = {
        classification: isFake ? 'fake' : 'needs_verification',
        confidence: 0.5,
        headline: isFake ? 'Possível Desinformação Detectada' : 'Verificação Inconclusiva',
        analysis: aiContent.substring(0, 500),
        fact_correction: '',
        key_points: [],
        limitations: 'Análise automatizada pode conter imprecisões.'
      };
    }

    // Monta resposta com fontes reais
    const sourcesWithContext = relevantSources.map(source => ({
      type: source.type,
      name: source.name,
      description: source.description,
      url: source.type === 'factchecker' 
        ? generateVerifiedSearchLink(source.name, keywords)
        : source.url,
      relevance: source.relevance
    }));

    // Se não encontrou fontes específicas, adiciona fact-checkers genéricos
    if (sourcesWithContext.length === 0) {
      sourcesWithContext.push(
        {
          type: 'factchecker' as const,
          name: 'Aos Fatos - Busca Verificada',
          description: 'Busque verificações relacionadas',
          url: generateVerifiedSearchLink('aos fatos', keywords),
          relevance: 'Agência de checagem de referência no Brasil'
        },
        {
          type: 'factchecker' as const,
          name: 'G1 Fato ou Fake - Busca',
          description: 'Checagens do portal G1',
          url: generateVerifiedSearchLink('g1 fato ou fake', keywords),
          relevance: 'Núcleo de checagem de grande veículo'
        }
      );
    }

    const response = {
      classification: result.classification || 'needs_verification',
      is_true: result.classification === 'verified',
      confidence: Math.min(Math.max(result.confidence || 0.5, 0), 1),
      headline: result.headline || (result.classification === 'fake' ? 'Possível Desinformação' : 'Verificação Inconclusiva'),
      reasoning: result.analysis || '',
      fact_summary: result.fact_correction || result.analysis?.substring(0, 200) || '',
      key_points: result.key_points || [],
      limitations: result.limitations || '',
      sources: sourcesWithContext,
      references: sourcesWithContext.map(s => s.url) // Mantém compatibilidade
    };

    return new Response(
      JSON.stringify(response),
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
