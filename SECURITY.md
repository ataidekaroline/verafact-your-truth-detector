# 🔐 Política de Segurança - VeraFact

<p align="center">
  <img src="https://img.shields.io/badge/Segurança-Prioridade_Máxima-green?style=for-the-badge" alt="Segurança" />
  <img src="https://img.shields.io/badge/RLS-Ativo-blue?style=for-the-badge" alt="RLS" />
  <img src="https://img.shields.io/badge/Rate_Limiting-Implementado-blue?style=for-the-badge" alt="Rate Limiting" />
</p>

Este documento descreve as políticas de segurança do VeraFact, as medidas de proteção implementadas e como reportar vulnerabilidades.

---

## 📋 Índice

1. [Visão Geral](#-visão-geral)
2. [Medidas de Segurança](#-medidas-de-segurança)
3. [Proteção de Dados](#-proteção-de-dados)
4. [Reportar Vulnerabilidades](#-reportar-vulnerabilidades)
5. [Práticas de Desenvolvimento](#-práticas-de-desenvolvimento)
6. [Histórico de Atualizações](#-histórico-de-atualizações)

---

## 🛡️ Visão Geral

O VeraFact foi desenvolvido com segurança como prioridade desde o início. Como uma plataforma de verificação de notícias e análise de links, entendemos a importância de proteger os nossos utilizadores contra ameaças online.

### Princípios de Segurança

| Princípio | Descrição |
|-----------|-----------|
| **Privacidade por Design** | Não recolhemos informações pessoais desnecessárias |
| **Defesa em Profundidade** | Múltiplas camadas de proteção |
| **Mínimo Privilégio** | Acesso restrito ao estritamente necessário |
| **Transparência** | Documentação clara das nossas práticas |

---

## 🔒 Medidas de Segurança

### Rate Limiting

Implementamos limitação de taxa para prevenir abusos:

| Endpoint | Limite | Janela |
|----------|--------|--------|
| `verify-news` | 10 requisições | Por minuto, por IP |
| `fetch-cnn-news` | 1 execução | A cada 5 minutos |

**Implementação:**
```typescript
// Rate limiting baseado em IP
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minuto
const MAX_REQUESTS_PER_WINDOW = 10;
```

### Validação de Input

Todas as entradas do utilizador são validadas:

| Validação | Limite |
|-----------|--------|
| Comprimento mínimo | 10 caracteres |
| Comprimento máximo | 10.000 caracteres |
| Tipo | String obrigatória |
| Sanitização | Remoção de HTML/scripts |

**Exemplo de validação:**
```typescript
// Validação de tipo
if (!text || typeof text !== 'string') {
  return error(400, 'Texto válido é obrigatório');
}

// Validação de comprimento
if (text.length < 10 || text.length > 10000) {
  return error(400, 'Texto fora dos limites permitidos');
}

// Sanitização
const cleanText = text
  .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  .replace(/<[^>]*>/g, '');
```

### Row Level Security (RLS)

Políticas de segurança ao nível da base de dados:

| Tabela | SELECT | INSERT | UPDATE | DELETE |
|--------|--------|--------|--------|--------|
| `verified_news` | ✅ Público | ❌ Bloqueado | ❌ Bloqueado | ❌ Bloqueado |
| `categories` | ✅ Público | ❌ Bloqueado | ❌ Bloqueado | ❌ Bloqueado |
| `verification_history` | ❌ Bloqueado | ❌ Bloqueado | ❌ Bloqueado | ❌ Bloqueado |
| `profiles` | 🔐 Próprio | ❌ Bloqueado | 🔐 Próprio | ❌ Bloqueado |

### Proteção de Edge Functions

| Medida | Status |
|--------|--------|
| Rate Limiting | ✅ Implementado |
| Validação de Input | ✅ Implementado |
| Sanitização | ✅ Implementado |
| Logs de Segurança | ✅ Implementado |
| Mensagens de Erro Seguras | ✅ Implementado |

---

## 🔏 Proteção de Dados

### Dados Que NÃO Recolhemos

- ❌ Informações de identificação pessoal (PII)
- ❌ Endereços de email
- ❌ Palavras-passe
- ❌ Dados de localização
- ❌ Cookies de rastreamento
- ❌ Histórico de navegação

### Dados Armazenados

| Tipo | Propósito | Retenção |
|------|-----------|----------|
| Notícias Verificadas | Feed público | 48 horas |
| Categorias | Organização | Permanente |
| Logs de Sistema | Debugging | 7 dias |

### Tratamento de Erros

Mensagens de erro são genéricas para evitar exposição de informações:

```typescript
// ✅ Correto - Mensagem genérica
return new Response(
  JSON.stringify({ error: 'Erro interno do servidor' }),
  { status: 500 }
);

// ❌ Errado - Expõe detalhes
return new Response(
  JSON.stringify({ error: error.stack }),
  { status: 500 }
);
```

---

## 🚨 Reportar Vulnerabilidades

### Processo de Divulgação Responsável

Se descobrir uma vulnerabilidade de segurança, pedimos que:

1. **NÃO** divulgue publicamente antes de nos contactar
2. **NÃO** explore a vulnerabilidade além do necessário para demonstração
3. **Forneça** detalhes suficientes para reproduzir o problema

### Como Reportar

#### Opção 1: Issue Privada (Preferido)
1. Aceda a [Issues](https://github.com/ataidekaroline/verafact-your-truth-detector/issues)
2. Crie uma nova issue com o título: `[SEGURANÇA] Descrição breve`
3. Marque como confidencial se possível

#### Opção 2: Email
Contacte a equipa de desenvolvimento através do repositório GitHub.

### O Que Incluir no Relatório

```markdown
## Descrição da Vulnerabilidade
[Descreva o problema de forma clara]

## Passos para Reproduzir
1. [Passo 1]
2. [Passo 2]
3. [Passo 3]

## Impacto Potencial
[Descreva o que um atacante poderia fazer]

## Sugestão de Correção (Opcional)
[Se tiver uma sugestão de como corrigir]

## Evidências
[Screenshots, logs, PoC code]
```

### Tempo de Resposta Esperado

| Severidade | Resposta Inicial | Correção |
|------------|------------------|----------|
| Crítica | 24 horas | 48-72 horas |
| Alta | 48 horas | 1 semana |
| Média | 1 semana | 2 semanas |
| Baixa | 2 semanas | 1 mês |

### Categorias de Severidade

| Severidade | Descrição | Exemplos |
|------------|-----------|----------|
| **Crítica** | Compromete todo o sistema | RCE, SQL Injection, Auth Bypass |
| **Alta** | Acesso não autorizado a dados | XSS persistente, IDOR |
| **Média** | Impacto limitado | Rate limiting bypass, Info disclosure |
| **Baixa** | Risco mínimo | Configurações subótimas |

---

## 👨‍💻 Práticas de Desenvolvimento

### Checklist de Segurança

Antes de cada release, verificamos:

- [ ] Todas as entradas são validadas
- [ ] Rate limiting está ativo
- [ ] RLS policies estão corretas
- [ ] Não há secrets no código
- [ ] Logs não expõem dados sensíveis
- [ ] Mensagens de erro são genéricas
- [ ] Dependências estão atualizadas

### Ferramentas Utilizadas

| Ferramenta | Propósito |
|------------|-----------|
| Lovable Security Scanner | Análise estática |
| Supabase Linter | Verificação de RLS |
| ESLint | Qualidade de código |
| TypeScript | Tipagem estática |

### Padrões de Código Seguro

```typescript
// ✅ Boas práticas implementadas

// 1. Validação de tipos
if (typeof input !== 'string') throw new Error('Invalid input');

// 2. Sanitização
const clean = input.replace(/<[^>]*>/g, '');

// 3. Limites de comprimento
const truncated = clean.substring(0, MAX_LENGTH);

// 4. Tratamento de erros
try {
  // operação
} catch (error) {
  console.error('Operation failed:', error);
  return genericError();
}
```

---

## 📝 Histórico de Atualizações

### 2026-01-21 - v2.0.0
- ✅ Implementado rate limiting em edge functions
- ✅ Adicionada validação robusta de inputs
- ✅ Corrigidas políticas RLS permissivas
- ✅ Removido sistema de autenticação (app agora público)
- ✅ Sanitização de HTML/scripts maliciosos

### 2025-11-19 - v1.0.0
- 🚀 Lançamento inicial
- ✅ Políticas RLS básicas
- ✅ Autenticação por email

---

## 📚 Recursos Adicionais

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/database/security-best-practices)
- [Lovable Security Documentation](https://docs.lovable.dev/features/security)

---

## 📄 Licença

Este documento de segurança está licenciado sob [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

---

<p align="center">
  <strong>🛡️ A segurança é uma responsabilidade partilhada</strong>
</p>

<p align="center">
  <sub>Última atualização: Janeiro 2026</sub>
</p>
