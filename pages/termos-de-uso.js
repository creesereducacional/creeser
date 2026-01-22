import Link from 'next/link';
import { useState } from 'react';

export default function TermosDeUso() {
  const [expandido, setExpandido] = useState(null);

  const secoes = [
    {
      id: 'aceitacao',
      titulo: '1. Aceitação dos Termos',
      conteudo: `Ao acessar e usar a plataforma EAD IGEPPS, você concorda em cumprir estes Termos de Uso. 
Se não concordar com qualquer parte destes termos, não use a plataforma.

Estes termos constituem um acordo vinculante entre você e a IGEPPS Academy.`
    },
    {
      id: 'licenca',
      titulo: '2. Licença de Uso',
      conteudo: `Concedemos a você uma licença pessoal, não transferível e limitada para acessar e usar a plataforma.

Você pode:
• Acessar cursos que está inscrito
• Baixar materiais para uso pessoal
• Participar de fóruns e discussões

Você NÃO pode:
• Reproduzir ou distribuir conteúdo sem permissão
• Usar a plataforma para fins comerciais
• Tentar contornar segurança ou acesso
• Transmitir vírus ou código malicioso
• Fazer scraping ou coletar dados automaticamente`
    },
    {
      id: 'conteudo',
      titulo: '3. Propriedade de Conteúdo',
      conteudo: `Todo conteúdo (vídeos, aulas, documentos, imagens) é propriedade intelectual da IGEPPS ou de seus criadores.

Você recebe direito de acesso limitado apenas para fins educacionais pessoais.

Não é permitido:
• Copiar ou reproduzir conteúdo
• Modificar ou criar obras derivadas
• Comercializar o conteúdo
• Publicar em outras plataformas sem consentimento`
    },
    {
      id: 'responsabilidades',
      titulo: '4. Responsabilidades do Usuário',
      conteudo: `Você concorda em:

• Fornecer informações verdadeiras e precisas no cadastro
• Manter segura sua senha e não compartilhá-la
• Ser responsável por todas as atividades em sua conta
• Notificar-nos imediatamente de acesso não autorizado
• Respeitar a propriedade intelectual dos outros
• Não usar a plataforma para assédio, spam ou ilegalidades
• Cumprir todas as leis aplicáveis`
    },
    {
      id: 'suspensao',
      titulo: '5. Suspensão de Conta',
      conteudo: `Podemos suspender ou encerrar sua conta se você:

• Violar estes termos
• Fornecermos informações falsas
• Enviar conteúdo ofensivo, ilegal ou prejudicial
• Violar direitos de propriedade intelectual
• Tentar comprometer a segurança do sistema
• Não pagar por serviços pagos

Notificaremos sobre suspensão quando possível.`
    },
    {
      id: 'certificados',
      titulo: '6. Certificados e Credenciais',
      conteudo: `Os certificados são emitidos após conclusão dos cursos com aprovação.

Condições:
• Certificado é documento pessoal e intransferível
• Não pode ser vendido ou compartilhado
• IGEPPS pode revogar certificado se fraude detectada
• Certificado representa apenas aprovação no curso
• Não substitui qualificação profissional oficial

A IGEPPS não garante aceitação de certificados por terceiros.`
    },
    {
      id: 'limitacao',
      titulo: '7. Limitação de Responsabilidade',
      conteudo: `A plataforma é oferecida "COMO ESTÁ" sem garantias expressas ou implícitas.

NÃO SOMOS RESPONSÁVEIS POR:
• Interrupções ou indisponibilidade do serviço
• Erros, vírus ou componentes prejudiciais
• Perda de dados ou documentos
• Danos diretos ou indiretos
• Perda de lucros ou dados
• Condutas de outros usuários

Você usa por sua conta e risco.`
    },
    {
      id: 'indenizacao',
      titulo: '8. Indenização',
      conteudo: `Você concorda em indenizar e defender a IGEPPS de:

• Reivindicações por violação destes termos
• Violação de direitos de terceiros
• Conteúdo ofensivo ou ilegal enviado por você
• Violação de leis aplicáveis
• Atividades não autorizadas em sua conta`
    },
    {
      id: 'modificacoes',
      titulo: '9. Modificações dos Termos',
      conteudo: `Podemos modificar estes termos a qualquer momento. 

Notificaremos sobre alterações significativas:
• Via email
• Aviso destacado no site
• Renovação de aceitação pode ser solicitada

O uso continuado após alterações constitui aceitação dos novos termos.`
    },
    {
      id: 'rescisao',
      titulo: '10. Rescisão',
      conteudo: `Você pode encerrar sua conta a qualquer momento acessando as configurações de perfil.

A IGEPPS pode rescindir sua conta por qualquer motivo com aviso prévio.

Após rescisão:
• Você perde acesso a toda a plataforma
• Dados serão deletados conforme Política de Privacidade
• Disposições permanentes continuam aplicáveis`
    },
    {
      id: 'lei',
      titulo: '11. Lei Aplicável',
      conteudo: `Estes termos são regidos pelas leis da República Federativa do Brasil.

Qualquer disputa será resolvida:
• Por arbitragem
• Ou nos tribunais competentes do Brasil

Você concorda em submeter-se à jurisdição brasileira.`
    },
    {
      id: 'contato',
      titulo: '12. Contato',
      conteudo: `Se tiver dúvidas sobre estes Termos de Uso, entre em contato:

Email: suporte@igepps.com.br
Horário: Segunda a Sexta, 8h às 18h (Horário de Brasília)

Tempo de resposta: Até 2 dias úteis`
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-blue-900 text-white py-6 shadow-md">
        <div className="container mx-auto px-4">
          <Link href="/">
            <button className="flex items-center gap-2 hover:opacity-80 transition mb-4">
              <span>←</span> Voltar
            </button>
          </Link>
          <h1 className="text-4xl font-bold">Termos de Uso</h1>
          <p className="text-blue-100 mt-2">IGEPPS Academy - Condições de Uso da Plataforma</p>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Aviso Importante */}
          <div className="bg-red-50 border-l-4 border-red-400 p-6 mb-8 rounded">
            <div className="flex gap-3">
              <span className="text-3xl">⚖️</span>
              <div>
                <h2 className="font-bold text-red-900 mb-2">Leia Atentamente</h2>
                <p className="text-red-800 text-sm">
                  Estes são os Termos e Condições de Uso obrigatórios. Ao usar a plataforma, 
                  você concorda integralmente com todos os termos abaixo.
                </p>
              </div>
            </div>
          </div>

          {/* Índice */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">📋 Índice</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {secoes.map((secao) => (
                <button
                  key={secao.id}
                  onClick={() => setExpandido(expandido === secao.id ? null : secao.id)}
                  className="text-left p-3 rounded hover:bg-blue-50 transition text-blue-600 hover:text-blue-800 font-medium text-sm"
                >
                  {secao.titulo}
                </button>
              ))}
            </div>
          </div>

          {/* Seções */}
          <div className="space-y-4">
            {secoes.map((secao) => (
              <div
                key={secao.id}
                className="bg-white rounded-lg shadow overflow-hidden"
              >
                <button
                  onClick={() => setExpandido(expandido === secao.id ? null : secao.id)}
                  className="w-full p-6 text-left hover:bg-gray-50 transition flex justify-between items-center"
                >
                  <h2 className="text-xl font-bold text-gray-800">{secao.titulo}</h2>
                  <span className="text-2xl">{expandido === secao.id ? '−' : '+'}</span>
                </button>

                {expandido === secao.id && (
                  <div className="border-t border-gray-200 p-6 bg-gray-50">
                    <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                      {secao.conteudo}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Aceitar Termos */}
          <div className="bg-green-50 rounded-lg p-8 mt-12 border border-green-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">✓ Você Concorda?</h2>
            <p className="text-gray-700 mb-6">
              Ao usar a plataforma EAD IGEPPS, você confirma que:
            </p>
            <ul className="space-y-2 text-gray-700 mb-6">
              <li className="flex items-center gap-2">
                <span className="text-green-600 font-bold">✓</span> Leu e compreendeu estes Termos
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600 font-bold">✓</span> Concorda em cumprir todos os termos
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600 font-bold">✓</span> Forneceu informações verdadeiras
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600 font-bold">✓</span> É responsável por sua conta
              </li>
            </ul>
            <p className="text-sm text-gray-600">
              Se não concorda, não use a plataforma.
            </p>
          </div>

          {/* Contato */}
          <div className="bg-blue-50 rounded-lg p-8 mt-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">📞 Dúvidas sobre os Termos?</h2>
            <p className="text-gray-700 mb-4">
              Entre em contato com nosso suporte:
            </p>
            <div className="bg-white p-4 rounded border border-blue-200">
              <p className="font-semibold text-gray-800">📧 Email:</p>
              <p className="text-blue-600 mb-4">termos@igepps.com.br</p>
              
              <p className="font-semibold text-gray-800">📅 Última Atualização:</p>
              <p className="text-gray-700">09 de dezembro de 2025</p>
            </div>
          </div>

          {/* Links Relacionados */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Documentos Relacionados</h3>
            <div className="flex gap-4">
              <Link href="/politica-privacidade">
                <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition">
                  🔒 Política de Privacidade
                </button>
              </Link>
              <Link href="/">
                <button className="bg-gray-300 text-gray-700 px-6 py-2 rounded hover:bg-gray-400 transition">
                  🏠 Início
                </button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm">
            © 2025 IGEPPS Academy. Todos os direitos reservados. | 
            <Link href="/politica-privacidade" className="text-blue-400 hover:text-blue-300 mx-1">Privacidade</Link> | 
            <Link href="/termos-de-uso" className="text-blue-400 hover:text-blue-300 mx-1">Termos</Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
