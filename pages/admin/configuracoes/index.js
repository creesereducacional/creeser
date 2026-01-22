import { useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '../../../components/DashboardLayout';

export default function Configuracoes() {
  const [activeTab, setActiveTab] = useState(null);

  const configuracoes = [
    {
      id: 'config-empresa',
      nome: 'Config. da Empresa',
      icon: '🏢',
      url: '/admin/configuracoes/empresa',
      descricao: 'Configurações gerais da instituição'
    },
    {
      id: 'gerenciar-usuarios',
      nome: 'Gerenciar Usuários',
      icon: '👥',
      url: '/admin/configuracoes/usuarios',
      descricao: 'Gerenciamento de usuários do sistema'
    },
    {
      id: 'rematricula',
      nome: 'Rematrícula',
      icon: '📝',
      url: '/admin/configuracoes/rematricula',
      descricao: 'Configurar período de rematrícula'
    },
    {
      id: 'gerenciar-matriculadores',
      nome: 'Gerenciar Matriculadores',
      icon: '👤',
      url: '/admin/configuracoes/matriculadores',
      descricao: 'Gerenciar usuários matriculadores'
    },
    {
      id: 'campanhas-matriculas',
      nome: 'Campanhas de Matrículas',
      icon: '📊',
      url: '/admin/configuracoes/campanhas',
      descricao: 'Configurar campanhas de matrículas'
    },
    {
      id: 'diploma-digital',
      nome: 'Diploma Digital',
      icon: '📜',
      url: '/admin/configuracoes/diploma-digital',
      descricao: 'Configurações de diploma digital'
    },
    {
      id: 'certificado-digital',
      nome: 'Certificado Digital',
      icon: '🎖️',
      url: '/admin/configuracoes/certificado-digital',
      descricao: 'Configurações de certificado digital'
    }
  ];

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 max-w-full">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">Configurações da Instituição</h1>

        {/* Grid de Botões */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {configuracoes.map((config) => (
            <Link key={config.id} href={config.url}>
              <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition cursor-pointer p-6 text-center">
                <div className="text-5xl mb-4">{config.icon}</div>
                <h3 className="text-sm font-bold text-gray-800 mb-2">{config.nome}</h3>
                <p className="text-xs text-gray-600">{config.descricao}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Instruções de Uso */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
          <h3 className="font-bold text-blue-800 mb-2">💡 Como usar</h3>
          <p className="text-sm text-blue-700">
            Clique em qualquer botão acima para acessar as configurações da sua instituição.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
