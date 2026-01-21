import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Lightbulb, 
  Shield, 
  Eye, 
  AlertTriangle, 
  Link, 
  Search, 
  MessageSquare, 
  Lock,
  Mail,
  CreditCard,
  Smartphone,
  Globe,
  CheckCircle,
  XCircle
} from "lucide-react";

const securityTips = [
  {
    category: "Identificar Notícias Falsas",
    icon: Search,
    color: "bg-primary/10 text-primary",
    tips: [
      {
        title: "Verifique a Fonte Original",
        description: "Procure a mesma notícia em veículos de comunicação reconhecidos. Se apenas sites desconhecidos publicaram, desconfie.",
        doList: ["Pesquisar em múltiplas fontes", "Verificar data da publicação", "Confirmar autor e credenciais"],
        dontList: ["Confiar apenas no título", "Partilhar sem verificar", "Acreditar em fontes anónimas"]
      },
      {
        title: "Analise o Conteúdo",
        description: "Erros gramaticais, imagens manipuladas e apelos emocionais exagerados são sinais de fake news.",
        doList: ["Ler o artigo completo", "Verificar imagens com busca reversa", "Procurar dados e estatísticas citadas"],
        dontList: ["Ler apenas manchetes", "Ignorar erros ortográficos", "Aceitar afirmações sem provas"]
      }
    ]
  },
  {
    category: "Proteger-se de Phishing",
    icon: Mail,
    color: "bg-destructive/10 text-destructive",
    tips: [
      {
        title: "E-mails Suspeitos",
        description: "Golpistas imitam empresas conhecidas para roubar dados. Verifique sempre o remetente real.",
        doList: ["Verificar endereço de e-mail completo", "Passar o rato sobre links antes de clicar", "Contactar a empresa por canais oficiais"],
        dontList: ["Clicar em links de e-mails urgentes", "Descarregar anexos não solicitados", "Fornecer dados pessoais por e-mail"]
      },
      {
        title: "Sites Clonados",
        description: "Criminosos criam cópias de sites bancários e de comércio para roubar credenciais.",
        doList: ["Verificar HTTPS e cadeado", "Digitar o URL manualmente", "Usar gestor de palavras-passe"],
        dontList: ["Aceder bancos via links", "Ignorar avisos do navegador", "Usar a mesma senha em vários sites"]
      }
    ]
  },
  {
    category: "Golpes no WhatsApp e Redes Sociais",
    icon: MessageSquare,
    color: "bg-success/10 text-success",
    tips: [
      {
        title: "Pedidos de Dinheiro",
        description: "Golpistas clonam perfis e pedem transferências urgentes. Sempre confirme por outro canal.",
        doList: ["Ligar para confirmar", "Verificar número de telefone", "Desconfiar de urgência"],
        dontList: ["Transferir sem confirmação", "Confiar apenas na foto do perfil", "Agir sob pressão emocional"]
      },
      {
        title: "Links Maliciosos",
        description: "Promoções falsas e prémios inexistentes são iscas comuns para roubar dados.",
        doList: ["Verificar promoções no site oficial", "Usar o VeraFact para analisar links", "Reportar mensagens suspeitas"],
        dontList: ["Clicar em links de promoções", "Partilhar dados em formulários externos", "Reencaminhar sem verificar"]
      }
    ]
  },
  {
    category: "Segurança em Compras Online",
    icon: CreditCard,
    color: "bg-warning/10 text-warning",
    tips: [
      {
        title: "Lojas Falsas",
        description: "Preços muito abaixo do mercado e sites recém-criados são sinais de fraude.",
        doList: ["Pesquisar reputação da loja", "Verificar CNPJ/dados da empresa", "Usar cartão virtual para compras"],
        dontList: ["Pagar via PIX para desconhecidos", "Ignorar reclamações online", "Confiar em preços impossíveis"]
      },
      {
        title: "Proteção de Dados",
        description: "Nunca forneça mais dados do que o necessário para a transação.",
        doList: ["Usar pagamentos seguros", "Ativar alertas do cartão", "Guardar comprovantes"],
        dontList: ["Salvar cartão em sites desconhecidos", "Enviar fotos de documentos", "Usar redes Wi-Fi públicas"]
      }
    ]
  }
];

export default function Dicas() {
  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8 safe-bottom">
      <Header />
      
      <main className="container mx-auto px-4 sm:px-6 pt-20 sm:pt-24 max-w-5xl">
        {/* Hero */}
        <section className="text-center mb-8 sm:mb-12">
          <div className="inline-flex p-4 bg-warning/10 rounded-2xl mb-4">
            <Lightbulb className="w-12 h-12 text-warning" />
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold text-foreground mb-3">
            Guia de Segurança Digital
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Aprenda a identificar golpes, notícias falsas e proteger-se online com estas dicas práticas.
          </p>
        </section>

        {/* Tips Sections */}
        <div className="space-y-8">
          {securityTips.map((section, sectionIdx) => {
            const SectionIcon = section.icon;
            return (
              <section key={sectionIdx}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-lg ${section.color}`}>
                    <SectionIcon className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground">{section.category}</h2>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  {section.tips.map((tip, tipIdx) => (
                    <Card key={tipIdx} className="p-5 border-2 hover:shadow-[var(--shadow-medium)] transition-all">
                      <h3 className="font-semibold text-lg mb-2 text-foreground">{tip.title}</h3>
                      <p className="text-sm text-muted-foreground mb-4">{tip.description}</p>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-success/5 p-3 rounded-lg border border-success/20">
                          <h4 className="text-xs font-semibold text-success mb-2 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Fazer
                          </h4>
                          <ul className="space-y-1">
                            {tip.doList.map((item, i) => (
                              <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                                <span className="text-success mt-0.5">•</span>
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div className="bg-destructive/5 p-3 rounded-lg border border-destructive/20">
                          <h4 className="text-xs font-semibold text-destructive mb-2 flex items-center gap-1">
                            <XCircle className="w-3 h-3" />
                            Evitar
                          </h4>
                          <ul className="space-y-1">
                            {tip.dontList.map((item, i) => (
                              <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                                <span className="text-destructive mt-0.5">•</span>
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        {/* Call to Action */}
        <Card className="mt-10 p-6 sm:p-8 bg-gradient-to-br from-primary/5 to-success/5 border-2 text-center">
          <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Ficou com Dúvidas?</h3>
          <p className="text-muted-foreground mb-4">
            Use o VeraFact para verificar qualquer notícia suspeita ou analisar links antes de clicar.
          </p>
          <Badge className="bg-primary text-primary-foreground">
            100% Gratuito • Sem Registo
          </Badge>
        </Card>
      </main>

      <BottomNav />
    </div>
  );
}
