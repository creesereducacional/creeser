import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';

export default function CadastroFuncionario() {
  const router = useRouter();
  const { id } = router.query;
  const isEditando = id && id !== 'novo';

  const [formData, setFormData] = useState({
    // Dados Pessoais
    nome: '',
    email: '',
    cpf: '',
    funcao: '',
    rg: '',
    telefoneCelular: '',
    whatsapp: '',
    cep: '',
    endereco: '',
    
    // Endereço
    cidade: '',
    bairro: '',
    uf: '',
    
    // Datas
    dtNascimento: '',
    dtAdmissao: '',
    
    // Status
    status: 'ATIVO',
    
    // Dados Financeiros
    banco: '',
    agencia: '',
    contaCorrente: '',
    pix: '',
    obs: ''
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (isEditando) {
      carregarFuncionario();
    }
  }, [isEditando]);

  const carregarFuncionario = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/funcionarios/${id}`);
      
      if (response.ok) {
        const data = await response.json();
        setFormData(data);
      } else {
        setMessage({ type: 'error', text: 'Erro ao carregar funcionário' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const method = isEditando ? 'PUT' : 'POST';
      const url = isEditando ? `/api/funcionarios/${id}` : '/api/funcionarios';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: isEditando 
            ? 'Funcionário atualizado com sucesso!' 
            : 'Funcionário cadastrado com sucesso!' 
        });
        
        setTimeout(() => {
          router.push('/admin/funcionarios');
        }, 1500);
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.message || 'Erro ao salvar funcionário' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          <Link href="/admin/funcionarios">
            <button className="text-teal-600 hover:text-teal-700 font-medium text-sm md:text-base">
              ← Voltar
            </button>
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            {isEditando ? 'Editar Funcionário' : 'Novo Funcionário'}
          </h1>
        </div>

        {/* Mensagem */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seção: Dados Pessoais */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <div className="flex items-center gap-2 mb-6 text-teal-600">
              <span>👤</span>
              <h2 className="text-lg font-bold">Dados Pessoais</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                  Nome <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="nome"
                  value={formData.nome}
                  onChange={handleInputChange}
                  placeholder="Nome do Funcionário"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                  Grupo
                </label>
                <select
                  name="grupo"
                  value={formData.grupo || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
                >
                  <option value="">Escolha um Grupo</option>
                  <option value="ADMINISTRATIVO">Administrativo</option>
                  <option value="PEDAGOGICO">Pedagógico</option>
                  <option value="OPERACIONAL">Operacional</option>
                </select>
              </div>

              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="email@exemplo.com"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                  CPF <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="cpf"
                  value={formData.cpf}
                  onChange={handleInputChange}
                  placeholder="Somente Números"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                  Função <span className="text-red-500">*</span>
                </label>
                <select
                  name="funcao"
                  value={formData.funcao}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
                  required
                >
                  <option value="">Escolha uma Função</option>
                  <option value="AGENTE ADMINISTRATIVO">Agente Administrativo</option>
                  <option value="AUXILIAR ADMINISTRATIVO">Auxiliar Administrativo</option>
                  <option value="PROFESSOR">Professor</option>
                  <option value="COORDENADOR">Coordenador</option>
                  <option value="DIRETOR">Diretor</option>
                </select>
              </div>

              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                  RG
                </label>
                <input
                  type="text"
                  name="rg"
                  value={formData.rg}
                  onChange={handleInputChange}
                  placeholder="RG"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                  Telefone Celular
                </label>
                <input
                  type="tel"
                  name="telefoneCelular"
                  value={formData.telefoneCelular}
                  onChange={handleInputChange}
                  placeholder="(XX) XXXX-XXXX"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                  Whatsapp <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="whatsapp"
                  value={formData.whatsapp}
                  onChange={handleInputChange}
                  placeholder="(XX) XXXXX-XXXX"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Seção: Endereço */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <div className="flex items-center gap-2 mb-6 text-teal-600">
              <span>🏠</span>
              <h2 className="text-lg font-bold">Endereço</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                  CEP
                </label>
                <input
                  type="text"
                  name="cep"
                  value={formData.cep}
                  onChange={handleInputChange}
                  placeholder="CEP"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                  Endereço
                </label>
                <input
                  type="text"
                  name="endereco"
                  value={formData.endereco}
                  onChange={handleInputChange}
                  placeholder="Rua, Número, Complemento"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                  Cidade
                </label>
                <input
                  type="text"
                  name="cidade"
                  value={formData.cidade}
                  onChange={handleInputChange}
                  placeholder="Cidade"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                  Bairro
                </label>
                <input
                  type="text"
                  name="bairro"
                  value={formData.bairro}
                  onChange={handleInputChange}
                  placeholder="Bairro"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                  UF
                </label>
                <input
                  type="text"
                  name="uf"
                  value={formData.uf}
                  onChange={handleInputChange}
                  placeholder="UF"
                  maxLength="2"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Seção: Datas */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <div className="flex items-center gap-2 mb-6 text-teal-600">
              <span>📅</span>
              <h2 className="text-lg font-bold">Datas</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                  Data Nascimento
                </label>
                <input
                  type="date"
                  name="dtNascimento"
                  value={formData.dtNascimento}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                  Data Admissão
                </label>
                <input
                  type="date"
                  name="dtAdmissao"
                  value={formData.dtAdmissao}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Seção: Dados Financeiros */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <div className="flex items-center gap-2 mb-6 text-teal-600">
              <span>💰</span>
              <h2 className="text-lg font-bold">Dados Financeiros</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                  Banco
                </label>
                <select
                  name="banco"
                  value={formData.banco}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
                >
                  <option value="">Escolha um Banco</option>
                  <option value="BB">Banco do Brasil</option>
                  <option value="CEF">Caixa Econômica</option>
                  <option value="BRADESCO">Bradesco</option>
                  <option value="ITAU">Itaú</option>
                  <option value="SANTANDER">Santander</option>
                </select>
              </div>

              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                  Agência
                </label>
                <input
                  type="text"
                  name="agencia"
                  value={formData.agencia}
                  onChange={handleInputChange}
                  placeholder="Agência"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                  Conta Corrente
                </label>
                <input
                  type="text"
                  name="contaCorrente"
                  value={formData.contaCorrente}
                  onChange={handleInputChange}
                  placeholder="Conta Corrente"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                  PIX
                </label>
                <input
                  type="text"
                  name="pix"
                  value={formData.pix}
                  onChange={handleInputChange}
                  placeholder="PIX"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                  Observações
                </label>
                <textarea
                  name="obs"
                  value={formData.obs}
                  onChange={handleInputChange}
                  placeholder="Observações"
                  rows="3"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Seção: Status */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <div className="flex items-center gap-2 mb-6 text-teal-600">
              <span>✓</span>
              <h2 className="text-lg font-bold">Status</h2>
            </div>

            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
            >
              <option value="ATIVO">ATIVO</option>
              <option value="INATIVO">INATIVO</option>
            </select>
          </div>

          {/* Botões */}
          <div className="flex flex-col sm:flex-row gap-4 justify-end">
            <Link href="/admin/funcionarios">
              <button
                type="button"
                className="w-full sm:w-auto px-6 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded-lg transition font-medium"
              >
                Cancelar
              </button>
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-6 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white rounded-lg transition font-medium"
            >
              {loading ? 'Salvando...' : 'CADASTRAR'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
