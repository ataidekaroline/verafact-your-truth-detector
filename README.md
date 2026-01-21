
<div align="center">
  
# VeraFact - Detetor de Verdade

</div>

<p align="center">
  <img src="src/assets/verafact-logo.png" alt="VeraFact Logo" width="600" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-blue?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Lovable_Cloud-black?style=for-the-badge&logo=supabase" alt="Lovable Cloud" />
  <img src="https://img.shields.io/badge/Vite-5.0-red?style=for-the-badge&logo=vite" alt="Vite" />
</p>

<p align="center">
  <strong>🛡️ Plataforma de verificação de notícias e análise de segurança de links</strong>
</p>

---

## 📋 Sobre o Projeto

O **VeraFact** é uma plataforma de deteção de fake news alimentada por inteligência artificial, projetada para ajudar os utilizadores a verificar a autenticidade de notícias e a segurança de links. O sistema utiliza fontes de confiança para detetar notícias falsas e analisar links suspeitos, protegendo contra desinformação e golpes online.

### ✨ Destaques

- 🔓 **100% Acessível** - Sem necessidade de conta ou login
- 🤖 **IA Avançada** - Verificação com modelos de linguagem de última geração
- 🔗 **Análise de Links** - Deteção de phishing e sites maliciosos
- 📰 **Feed Verificado** - Notícias em tempo real de fontes confiáveis
- 🌐 **Português (BR)** - Interface totalmente localizada

---

## 🌟 Funcionalidades

### 🔍 Verificador de Notícias
- **Análise por IA**: Verifique artigos e afirmações usando modelos avançados de machine learning
- **Pontuação de Confiança**: Receba scores detalhados (0-100%) para cada verificação
- **Evidências de Suporte**: Obtenha raciocínio, resumos factuais e links de referência
- **Resultados Instantâneos**: Processamento rápido em tempo real

### 🔗 Analisador de Links
- **Deteção de Phishing**: Identifica URLs que tentam imitar sites legítimos
- **Verificação de Encurtadores**: Alerta sobre links encurtados potencialmente perigosos
- **Análise de TLDs**: Verifica domínios de alto risco (.xyz, .tk, .cf, etc.)
- **Padrões Suspeitos**: Deteta URLs com formatação maliciosa
- **Relatório Visual**: Exibe nível de risco (Seguro, Atenção, Risco Elevado)

### 📡 Radar de Notícias
- **Feed Verificado em Tempo Real**: Notícias atualizadas automaticamente a cada 60 minutos
- **Organização por Categorias**: Política, Tecnologia, Saúde, Ciência
- **Atualização Manual**: Botão de refresh para buscar novas notícias
- **Loading Profissional**: Esqueletos de carregamento durante atualizações

### 💡 Dicas de Segurança
- **Guia Educativo**: Como identificar fake news e golpes
- **Tooltips Interativos**: Dicas rápidas em toda a interface
- **Boas Práticas**: Orientações para navegação segura

---

## 🏗️ Arquitetura

### Frontend
| Tecnologia | Propósito |
|------------|-----------|
| React 18 | Framework de UI |
| TypeScript | Tipagem estática |
| Vite 5 | Build tool e dev server |
| Tailwind CSS | Framework de estilização |
| Radix UI | Componentes acessíveis |
| React Query | Gestão de estado do servidor |
| React Router v6 | Roteamento client-side |
| Lucide React | Biblioteca de ícones |
| date-fns | Formatação de datas |

### Backend (Lovable Cloud)
| Serviço | Propósito |
|---------|-----------|
| PostgreSQL | Base de dados relacional |
| Edge Functions | Funções serverless |
| Lovable AI | Verificação por IA |
| Storage | Armazenamento de ficheiros |

### Schema da Base de Dados

```
┌─────────────────────┐     ┌─────────────────────┐
│   verified_news     │     │     categories      │
├─────────────────────┤     ├─────────────────────┤
│ id (uuid)           │────▶│ id (uuid)           │
│ title               │     │ name                │
│ snippet             │     │ slug                │
│ source_name         │     │ created_at          │
│ source_url          │     └─────────────────────┘
│ confidence_score    │
│ is_verified         │
│ category_id (fk)    │
│ published_at        │
│ verified_at         │
└─────────────────────┘

┌─────────────────────┐
│verification_history │
├─────────────────────┤
│ id (uuid)           │
│ user_id             │
│ input_text          │
│ ml_result           │
│ confidence_score    │
│ true_fact_summary   │
│ reference_sites     │
│ verified_at         │
└─────────────────────┘
```

---

## 🔐 Segurança

### Medidas Implementadas

#### Rate Limiting
- **verify-news**: 10 requisições por minuto por IP
- **fetch-cnn-news**: Cooldown de 5 minutos entre execuções

#### Validação de Input
- Validação de tipo e comprimento (10-10.000 caracteres)
- Sanitização de HTML e scripts maliciosos
- Tratamento de erros com mensagens seguras

#### Row Level Security (RLS)
- Políticas restritivas em todas as tabelas
- `verified_news` e `categories`: Leitura pública
- `verification_history`: Acesso bloqueado publicamente

#### Proteção de Dados
- Sem recolha de informações pessoais
- Logs não expõem dados sensíveis
- Mensagens de erro genéricas para o cliente

---

## 📁 Estrutura do Projeto

```
verafact/
├── src/
│   ├── assets/                 # Imagens e assets estáticos
│   ├── components/
│   │   ├── ui/                # Componentes shadcn/ui
│   │   ├── Header.tsx         # Cabeçalho com navegação
│   │   ├── BottomNav.tsx      # Navegação mobile
│   │   ├── HeroSection.tsx    # Secção hero da homepage
│   │   ├── NewsVerifier.tsx   # Verificador de notícias
│   │   ├── LinkAnalyzer.tsx   # Analisador de links
│   │   ├── VerifiedNewsFeed.tsx  # Feed de notícias
│   │   ├── SecurityTips.tsx   # Dicas de segurança
│   │   └── NewsCard.tsx       # Cartão de notícia
│   ├── hooks/                 # Custom React hooks
│   ├── integrations/
│   │   └── supabase/          # Cliente e tipos Supabase
│   ├── lib/                   # Funções utilitárias
│   ├── pages/
│   │   ├── Home.tsx           # Página principal
│   │   ├── Radar.tsx          # Feed em tempo real
│   │   ├── Dicas.tsx          # Página de dicas
│   │   └── NotFound.tsx       # Página 404
│   ├── App.tsx                # Componente principal
│   ├── index.css              # Estilos globais
│   └── main.tsx               # Entry point
├── supabase/
│   ├── functions/
│   │   ├── verify-news/       # Função de verificação IA
│   │   └── fetch-cnn-news/    # Fetcher de RSS
│   └── config.toml            # Configuração Supabase
└── package.json
```

---

## 🎨 Sistema de Design

### Paleta de Cores

O VeraFact utiliza uma paleta profissional focada em transmitir confiança e segurança:

| Cor | HSL | Uso |
|-----|-----|-----|
| **Azul Marinho** | `222 47% 11%` | Background principal |
| **Cinzento Antracite** | `215 25% 27%` | Elementos secundários |
| **Verde Esmeralda** | `160 84% 39%` | Estados de sucesso/seguro |
| **Vermelho Alerta** | `0 84% 60%` | Estados de erro/risco |
| **Âmbar** | `45 93% 47%` | Estados de atenção |

### Tokens de Design

Todas as cores são definidas como variáveis CSS HSL em `src/index.css` e configuradas em `tailwind.config.ts`.

---

## 🔧 Edge Functions

### verify-news
Verifica notícias usando Lovable AI com modelo Gemini.

**Características:**
- Rate limiting por IP (10 req/min)
- Validação de input (10-10.000 chars)
- Sanitização de HTML
- Resposta estruturada com JSON

**Request:**
```json
{
  "text": "Texto da notícia a verificar..."
}
```

**Response:**
```json
{
  "is_true": true,
  "confidence": 0.85,
  "reasoning": "Explicação da análise...",
  "fact_summary": "Resumo factual...",
  "references": ["https://..."]
}
```

### fetch-cnn-news
Busca e verifica notícias do RSS da CNN Brasil.

**Características:**
- Cooldown de 5 minutos entre execuções
- Parsing de RSS XML
- Verificação automática via verify-news
- Mapeamento de categorias
- Limpeza de notícias antigas (48h)

---

## 🚀 Começar

### Pré-requisitos
- Node.js 18+ e npm
- Git

### Instalação

1. **Clone o repositório**
```bash
git clone https://github.com/ataidekaroline/verafact-your-truth-detector.git
cd verafact
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configuração do Ambiente**
O projeto usa Lovable Cloud, então as variáveis de ambiente são configuradas automaticamente:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

4. **Inicie o servidor de desenvolvimento**
```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`

---

## 🧪 Scripts Disponíveis

```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build de produção
npm run preview      # Preview do build
npm run lint         # Executar ESLint
```

---

## 🌐 Deploy

### Plataforma Lovable
1. Clique em **Publicar** no canto superior direito
2. Clique em **Atualizar** para deploy de mudanças frontend
3. Mudanças de backend (edge functions) são deployadas automaticamente

### URLs do Projeto
- **Preview**: https://id-preview--250a6770-45a0-40a0-8fdd-1d6334c08a9e.lovable.app
- **Produção**: https://verafact-truth-finder.lovable.app

### Domínio Personalizado
Configure em Project Settings → Domains (requer plano pago)

---

## 📊 Changelog

### v2.0.0 (2026-01-21)
**Reformulação Completa**

#### 🔓 Remoção de Autenticação
- Removido sistema de login/registo
- Removidas páginas de perfil e conta
- Aplicação 100% acessível sem conta

#### 🎨 Novo Design
- Nova paleta de cores profissional
- Foco em segurança e confiança
- Interface responsiva mobile-first

#### 🔗 Analisador de Links
- Nova ferramenta de análise de URLs
- Deteção de phishing e sites maliciosos
- Relatório visual de risco

#### 🔐 Melhorias de Segurança
- Rate limiting em edge functions
- Validação robusta de inputs
- Políticas RLS restritivas
- Sanitização de dados

#### 🌍 Localização
- Interface em Português (BR)
- Mensagens de erro localizadas

### v1.0.0 (2025-11-19)
- Lançamento inicial
- Verificador de notícias com IA
- Feed de notícias verificadas
- Sistema de autenticação

---

## 🤝 Contribuir

Contribuições são bem-vindas! Siga estas orientações:

1. Fork o repositório
2. Crie uma branch de feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit as mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

---

## 📝 Licença

Este projeto faz parte da plataforma Lovable. Consulte os termos de serviço da Lovable para mais informações.

---

## 🔗 Links Úteis

- [Documentação Lovable](https://docs.lovable.dev/)
- [Comunidade Discord Lovable](https://discord.com/channels/1119885301872070706/1280461670979993613)
- [Documentação React](https://react.dev)
- [Documentação Tailwind CSS](https://tailwindcss.com)

---

## 📧 Suporte

Para questões ou problemas:
- Abra uma issue neste repositório
- Junte-se à comunidade Discord da Lovable
- Consulte a [documentação Lovable](https://docs.lovable.dev/)

---

<p align="center">
  <strong>Construído com ❤️ usando <a href="https://lovable.dev">Lovable</a></strong>
</p>

<p align="center">
  <sub>🛡️ Protegendo você contra desinformação e golpes online</sub>
</p>
