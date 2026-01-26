import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting storage
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 15; // requests per minute
const RATE_WINDOW = 60 * 1000; // 1 minute in ms

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = requestCounts.get(ip);
  
  if (!record || now > record.resetTime) {
    requestCounts.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }
  
  if (record.count >= RATE_LIMIT) {
    return false;
  }
  
  record.count++;
  return true;
}

// Known official domains for brand squatting detection
const OFFICIAL_BRANDS: Record<string, string[]> = {
  'gov.br': ['governo', 'federal', 'brasil', 'gov'],
  'bb.com.br': ['banco', 'brasil', 'bb'],
  'caixa.gov.br': ['caixa', 'cef', 'economica'],
  'itau.com.br': ['itau', 'itaú'],
  'bradesco.com.br': ['bradesco'],
  'santander.com.br': ['santander'],
  'nubank.com.br': ['nubank', 'nu'],
  'mercadolivre.com.br': ['mercado', 'livre', 'ml'],
  'amazon.com.br': ['amazon', 'amazônia'],
  'correios.com.br': ['correios', 'correio'],
  'receita.fazenda.gov.br': ['receita', 'federal', 'imposto'],
  'bcb.gov.br': ['banco', 'central', 'bacen', 'bcb'],
  'inss.gov.br': ['inss', 'previdencia', 'aposentadoria'],
  'detran': ['detran', 'transito', 'cnh', 'multa'],
};

// Scam keywords in Portuguese
const SCAM_KEYWORDS = [
  'resgate', 'urgente', 'pix', 'ganhe', 'gratis', 'grátis', 'premio', 'prêmio',
  'dinheiro', 'valores', 'bloqueado', 'liberado', 'imediato', 'agora', 'confirme',
  'atualize', 'cadastro', 'suspensa', 'cancelada', 'verificar', 'atualizar',
  'bonus', 'bônus', 'promoção', 'promocao', 'sorteio', 'ganhador', 'vencedor',
  'saque', 'transferencia', 'transferência', 'cliqueaqui', 'acesse', 'confirmar',
  'cpf', 'rg', 'senha', 'cartao', 'cartão', 'credito', 'crédito', 'debito', 'débito'
];

// Suspicious TLDs
const SUSPICIOUS_TLDS = ['.site', '.online', '.top', '.xyz', '.click', '.link', '.buzz', '.tk', '.ml', '.ga', '.cf', '.gq'];

// URL shorteners
const URL_SHORTENERS = ['bit.ly', 'tinyurl.com', 'goo.gl', 't.co', 'ow.ly', 'is.gd', 'buff.ly', 'adf.ly', 'shorte.st', 'cutt.ly'];

interface AnalysisResult {
  status: 'safe' | 'warning' | 'danger' | 'scam';
  score: number;
  domain: string;
  issues: string[];
  recommendations: string[];
  modusOperandi?: string;
  scamType?: string;
  aiAnalysis?: string;
  isBrandSquatting: boolean;
  isUrlShortener: boolean;
  targetedBrand?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    
    if (!checkRateLimit(clientIP)) {
      return new Response(
        JSON.stringify({ error: 'Limite de requisições excedido. Aguarde um momento.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { url } = await req.json();

    if (!url || typeof url !== 'string') {
      return new Response(
        JSON.stringify({ error: 'URL inválida' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
    } catch {
      return new Response(
        JSON.stringify({ error: 'Formato de URL inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const domain = parsedUrl.hostname.replace('www.', '').toLowerCase();
    const fullUrl = parsedUrl.href.toLowerCase();
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 100;
    let modusOperandi: string | undefined;
    let scamType: string | undefined;
    let isBrandSquatting = false;
    let isUrlShortener = false;
    let targetedBrand: string | undefined;

    // 1. Check HTTPS - CRITICAL (50 points penalty)
    if (parsedUrl.protocol !== 'https:') {
      score -= 50;
      issues.push('⚠️ CONEXÃO NÃO SEGURA: Este site não usa HTTPS, seus dados podem ser interceptados');
      recommendations.push('NUNCA insira dados pessoais ou bancários em sites sem HTTPS');
    }

    // 2. Check for URL shorteners
    if (URL_SHORTENERS.some(shortener => domain.includes(shortener))) {
      isUrlShortener = true;
      score -= 30;
      issues.push('🔗 URL ENCURTADA: O destino real está oculto. Encurtadores são frequentemente usados para esconder links maliciosos');
      recommendations.push('Use serviços como CheckShortURL para revelar o destino antes de clicar');
    }

    // 3. Check suspicious TLDs
    const hasSuspiciousTld = SUSPICIOUS_TLDS.some(tld => domain.endsWith(tld));
    if (hasSuspiciousTld) {
      score -= 30;
      issues.push(`🚨 EXTENSÃO SUSPEITA: Domínios ${SUSPICIOUS_TLDS.join(', ')} são frequentemente usados em golpes`);
    }

    // 4. Check for scam keywords
    const foundScamKeywords = SCAM_KEYWORDS.filter(keyword => 
      fullUrl.includes(keyword) || domain.includes(keyword)
    );
    if (foundScamKeywords.length > 0) {
      // CRITICAL: More aggressive scoring for scam keywords
      const keywordPenalty = Math.min(foundScamKeywords.length * 15, 60);
      score -= keywordPenalty;
      issues.push(`🎣 PALAVRAS DE ALERTA: "${foundScamKeywords.join('", "')}" são comuns em golpes de phishing`);
      
      // Determine scam type based on keywords
      if (foundScamKeywords.some(k => ['resgate', 'valores', 'saque', 'bloqueado', 'liberado'].includes(k))) {
        scamType = 'Golpe do Falso Resgate';
        modusOperandi = 'Criminosos alegam que você tem valores a receber para roubar seus dados bancários e CPF. Órgãos oficiais NUNCA solicitam dados por links.';
        // If suspicious TLD + scam keywords = CONFIRMED SCAM
        if (hasSuspiciousTld) {
          score = 0;
          issues.unshift('🚫 GOLPE CONFIRMADO: Combinação de extensão suspeita (.site) com palavras típicas de fraude ("resgate", "valores")');
        }
      } else if (foundScamKeywords.some(k => ['pix', 'transferencia', 'transferência'].includes(k))) {
        scamType = 'Golpe do PIX';
        modusOperandi = 'Sites falsos que prometem transferências ou cadastro de chaves PIX para roubar credenciais bancárias.';
        if (hasSuspiciousTld) {
          score = 0;
          issues.unshift('🚫 GOLPE CONFIRMADO: Link de PIX em domínio suspeito');
        }
      } else if (foundScamKeywords.some(k => ['premio', 'prêmio', 'ganhe', 'sorteio', 'ganhador'].includes(k))) {
        scamType = 'Golpe de Promoção/Sorteio Falso';
        modusOperandi = 'Promessas de prêmios inexistentes para coletar dados pessoais ou instalar malware no dispositivo.';
        if (hasSuspiciousTld) {
          score = 0;
          issues.unshift('🚫 GOLPE CONFIRMADO: Promoção falsa em domínio suspeito');
        }
      } else if (foundScamKeywords.some(k => ['atualize', 'confirme', 'verificar', 'suspensa'].includes(k))) {
        scamType = 'Phishing de Atualização Cadastral';
        modusOperandi = 'E-mails e sites falsos que imitam bancos ou empresas pedindo para "atualizar cadastro" e roubam senhas.';
        if (hasSuspiciousTld) {
          score = 0;
          issues.unshift('🚫 GOLPE CONFIRMADO: Phishing em domínio não oficial');
        }
      }
    }
    
    // Extra check: Suspicious TLD + multiple scam keywords = always scam
    if (hasSuspiciousTld && foundScamKeywords.length >= 2 && score > 0) {
      score = 0;
      if (!scamType) {
        scamType = 'Fraude Digital';
        modusOperandi = 'Este link combina múltiplos indicadores de golpe: extensão suspeita e palavras-chave típicas de fraude.';
      }
      issues.unshift('🚫 GOLPE CONFIRMADO: Múltiplos indicadores de fraude detectados');
    }

    // 5. Brand Squatting Detection
    for (const [officialDomain, keywords] of Object.entries(OFFICIAL_BRANDS)) {
      const domainKeywords = keywords.filter(keyword => 
        domain.includes(keyword) && !domain.endsWith(officialDomain)
      );
      
      if (domainKeywords.length > 0) {
        // Check if it's trying to impersonate
        const isImpersonating = domain.includes('-') || 
                                domain.includes('oficial') || 
                                domain.includes('online') ||
                                domain.includes('br') ||
                                hasSuspiciousTld;
        
        if (isImpersonating) {
          isBrandSquatting = true;
          targetedBrand = officialDomain;
          score -= 40;
          issues.push(`🏴‍☠️ BRAND SQUATTING: Este domínio tenta imitar "${officialDomain}". O site oficial é ${officialDomain}`);
          scamType = 'Brand Squatting / Clone de Site Oficial';
          modusOperandi = `Este link tenta se passar pelo site oficial "${officialDomain}" para enganar vítimas. SEMPRE acesse sites oficiais digitando o endereço diretamente no navegador.`;
        }
      }
    }

    // 6. Government/Banking + Suspicious TLD = CONFIRMED SCAM
    const isClaimingOfficial = domain.includes('gov') || domain.includes('banco') || 
                               domain.includes('caixa') || domain.includes('federal') ||
                               domain.includes('receita') || domain.includes('inss') ||
                               domain.includes('detran');
    
    if (isClaimingOfficial && hasSuspiciousTld) {
      score = 0;
      issues.unshift('🚫 GOLPE CONFIRMADO: Sites governamentais e bancários NUNCA usam extensões como .site, .online, .xyz');
      scamType = 'Golpe de Falso Órgão Governamental';
      modusOperandi = 'Criminosos criam sites falsos imitando órgãos públicos (Gov.br, Receita Federal, INSS) para roubar dados. Sites oficiais sempre terminam em .gov.br';
    }

    // 7. IP-based URLs
    if (/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(domain)) {
      score -= 35;
      issues.push('🔢 URL COM IP NUMÉRICO: Sites legítimos usam nomes de domínio, não endereços IP');
    }

    // 8. Excessive subdomains
    const subdomainCount = domain.split('.').length - 2;
    if (subdomainCount > 2) {
      score -= 15;
      issues.push('📊 MUITOS SUBDOMÍNIOS: Estrutura de URL complexa, comum em sites de phishing');
    }

    // 9. Special characters in domain
    if (domain.includes('--') || domain.includes('__') || /@/.test(parsedUrl.href)) {
      score -= 20;
      issues.push('⚡ CARACTERES SUSPEITOS: Uso de caracteres incomuns para ofuscar o verdadeiro destino');
    }

    // Ensure score is within bounds
    score = Math.max(0, Math.min(100, score));

    // Determine status
    let status: 'safe' | 'warning' | 'danger' | 'scam';
    if (score === 0 || scamType?.includes('CONFIRMADO') || isBrandSquatting) {
      status = 'scam';
    } else if (score < 30) {
      status = 'danger';
    } else if (score < 60) {
      status = 'warning';
    } else {
      status = 'safe';
    }

    // Add recommendations based on issues
    if (issues.length > 0 && !isUrlShortener) {
      recommendations.push('Não clique em links recebidos por mensagem ou e-mail sem verificar');
      recommendations.push('Acesse sites oficiais digitando o endereço diretamente no navegador');
      recommendations.push('Em caso de dúvida, entre em contato com a empresa pelos canais oficiais');
    }

    if (status === 'scam' || status === 'danger') {
      recommendations.unshift('❌ NÃO ACESSE ESTE LINK. Risco elevado de fraude.');
    }

    // Call AI for additional analysis if score is questionable
    let aiAnalysis: string | undefined;
    if (score < 80 && score > 0) {
      try {
        const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
        if (LOVABLE_API_KEY) {
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
                  content: `Você é um especialista em segurança cibernética focado em detectar golpes e phishing.
IMPORTANTE: Responda APENAS em Português do Brasil (PT-BR).

Analise URLs suspeitas e forneça:
1. Uma avaliação clara se é golpe ou não
2. Qual técnica de engenharia social está sendo usada
3. O que a vítima perderia se caísse no golpe

Seja direto e educativo. Use linguagem acessível para leigos.`
                },
                {
                  role: 'user',
                  content: `Analise este link suspeito: ${url}

Domínio: ${domain}
Problemas detectados: ${issues.join('; ')}
Pontuação de segurança: ${score}/100

Forneça uma análise breve e direta em português sobre os riscos deste link.`
                }
              ],
              temperature: 0.3,
              max_tokens: 300,
            }),
          });

          if (aiResponse.ok) {
            const aiData = await aiResponse.json();
            aiAnalysis = aiData.choices?.[0]?.message?.content;
          }
        }
      } catch (error) {
        console.error('AI analysis error:', error);
      }
    }

    const result: AnalysisResult = {
      status,
      score,
      domain,
      issues,
      recommendations,
      modusOperandi,
      scamType,
      aiAnalysis,
      isBrandSquatting,
      isUrlShortener,
      targetedBrand,
    };

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Link analysis error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro ao analisar o link' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
