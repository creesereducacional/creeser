import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';

export default function EditarProfessor() {
  const router = useRouter();
  const { id } = router.query;

  const [formData, setFormData] = useState({
    // Dados Pessoais
    nome: '',
    areaAtuacao: '',
    nivelInstrucao: '',
    latim: '',
    email: '',
    senha: '',
    nomeSocial: '',
    cpf: '',
    rg: '',
    dtNascimento: '',
    telefoneCelular: '',
    telefoneResidencial: '',
    
    // Endereço
    cep: '',
    endereco: '',
    numero: '',
    bairro: '',
    cidade: '',
    uf: '',
    naturalidade: '',
    
    // Contrato
    inicioContrato: '',
    fimContrato: '',
    valorHoraAula: '',
    regimeTrabalho: '',
    
    // Status
    status: 'ATIVO',
    obs: ''
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (id && id !== 'novo') {
      carregarProfessor();
    }
  }, [id]);

  const carregarProfessor = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/professores/${id}`);
      
      if (response.ok) {
        const data = await response.json();
        setFormData(data);
      } else {
        setMessage({ type: 'error', text: 'Erro ao carregar professor' });
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

  // Auto-preenchimento de endereço ao inserir CEP
  const buscarEnderecoPorCEP = async (cepValue) => {
    if (!cepValue || cepValue.length !== 8) return;

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepValue}/json/`);
      const data = await response.json();

      if (data.erro) {
        setMessage({ type: 'error', text: 'CEP não encontrado' });
        return;
      }

      setFormData(prev => ({
        ...prev,
        endereco: data.logradouro || '',
        bairro: data.bairro || '',
        cidade: data.localidade || '',
        uf: data.uf || ''
      }));

      setMessage({ type: 'success', text: 'Endereço preenchido automaticamente!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 2000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao buscar CEP: ' + error.message });
    }
  };

  // Handle para CEP com limpeza e formatação
  const handleCepChange = (e) => {
    let value = e.target.value.replace(/\D/g, ''); // Remove não-dígitos
    if (value.length > 8) value = value.slice(0, 8);
    
    setFormData(prev => ({
      ...prev,
      cep: value
    }));

    // Buscar endereço quando CEP estiver completo
    if (value.length === 8) {
      buscarEnderecoPorCEP(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch(`/api/professores/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: 'Professor atualizado com sucesso!'
        });
        
        setTimeout(() => {
          router.push('/admin/professores');
        }, 1500);
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.message || 'Erro ao salvar professor' });
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
          <Link href="/admin/professores">
            <button className="text-teal-600 hover:text-teal-700 font-medium text-sm md:text-base">
              ← Voltar
            </button>
          </Link>
          <div className="flex items-center gap-2">
            <span>👨‍🏫</span>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              Editar Professor
            </h1>
          </div>
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

        {/* Abas - Listar e Inserir */}
        <div className="mb-6 flex gap-2 border-b border-gray-200">
          <Link href="/admin/professores">
            <button className="px-6 py-3 text-gray-500 hover:text-teal-600 font-semibold">
              📋 Listar
            </button>
          </Link>
          <button className="px-6 py-3 text-teal-600 border-b-2 border-teal-600 font-semibold">
            ✏️ Editar
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seção: Dados Pessoais */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <div className="flex items-center gap-2 mb-6 text-teal-600">
              <span>👤</span>
              <h2 className="text-lg font-bold">Dados Pessoais</h2>
            </div>

            <div className="space-y-4">
              {/* Linha 1: Nome e Matrícula */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                    Nome <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="nome"
                    value={formData.nome}
                    onChange={handleInputChange}
                    placeholder="Nome do professor"
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                    Matrícula <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="matricula"
                    value={formData.matricula || ''}
                    onChange={handleInputChange}
                    placeholder="Número de matrícula"
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                    required
                  />
                </div>
              </div>

              {/* Linha 2: Área de Atuação, Nível de Instrução e Latim */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                    Área de Atuação
                  </label>
                  <input
                    type="text"
                    name="areaAtuacao"
                    value={formData.areaAtuacao}
                    onChange={handleInputChange}
                    placeholder="Ex: Matemática"
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                  />
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                    Nível de Instrução <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="nivelInstrucao"
                    value={formData.nivelInstrucao}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                    required
                  >
                    <option value="">- Escolha um nível -</option>
                    <option value="GRADUAÇÃO">Graduação</option>
                    <option value="ESPECIALIZAÇÃO">Especialização</option>
                    <option value="MESTRADO">Mestrado</option>
                    <option value="DOUTORADO">Doutorado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                    Latim
                  </label>
                  <input
                    type="text"
                    name="latim"
                    value={formData.latim}
                    onChange={handleInputChange}
                    placeholder="Latim"
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                  />
                </div>
              </div>

              {/* Linha 3: Email e Senha */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                    E-Mail <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="email@exemplo.com"
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-yellow-50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                    Senha <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    name="senha"
                    value={formData.senha}
                    onChange={handleInputChange}
                    placeholder="Deixe em branco para manter a atual"
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-yellow-50"
                  />
                </div>
              </div>

              {/* Linha 4: Nome Social */}
              <div>
                <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                  Nome social
                </label>
                <input
                  type="text"
                  name="nomeSocial"
                  value={formData.nomeSocial}
                  onChange={handleInputChange}
                  placeholder="Nome social"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>

              {/* Linha 5: CPF, RG e Data de Nascimento */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                    CPF
                  </label>
                  <input
                    type="text"
                    name="cpf"
                    value={formData.cpf}
                    onChange={handleInputChange}
                    placeholder="Somente Números"
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                  />
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                    RG
                  </label>
                  <input
                    type="text"
                    name="rg"
                    value={formData.rg}
                    onChange={handleInputChange}
                    placeholder="RG"
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                  />
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                    Data de Nascimento <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="dtNascimento"
                    value={formData.dtNascimento}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                    required
                  />
                </div>
              </div>

              {/* Linha 6: Telefone Celular e Telefone Residencial */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                    Telefone Celular
                  </label>
                  <input
                    type="tel"
                    name="telefoneCelular"
                    value={formData.telefoneCelular}
                    onChange={handleInputChange}
                    placeholder="(XX) XXXXX-XXXX"
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                  />
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                    Telefone Residencial
                  </label>
                  <input
                    type="tel"
                    name="telefoneResidencial"
                    value={formData.telefoneResidencial}
                    onChange={handleInputChange}
                    placeholder="(XX) XXXX-XXXX"
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                  />
                </div>
              </div>

              {/* Linha 7: CEP, Endereço e Número */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                    CEP
                  </label>
                  <input
                    type="text"
                    name="cep"
                    value={formData.cep}
                    onChange={handleCepChange}
                    placeholder="CEP"
                    maxLength="8"
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                  />
                  <p className="text-xs text-gray-500 mt-1">💡 Preencha automaticamente</p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                    Endereço
                  </label>
                  <input
                    type="text"
                    name="endereco"
                    value={formData.endereco}
                    onChange={handleInputChange}
                    placeholder="Rua, Avenida, etc"
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                  />
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                    Número
                  </label>
                  <input
                    type="text"
                    name="numero"
                    value={formData.numero}
                    onChange={handleInputChange}
                    placeholder="Nº"
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                  />
                </div>
              </div>

              {/* Linha 8: Bairro, Cidade e UF */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                    Bairro
                  </label>
                  <input
                    type="text"
                    name="bairro"
                    value={formData.bairro}
                    onChange={handleInputChange}
                    placeholder="Bairro"
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                  />
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                    Cidade
                  </label>
                  <input
                    type="text"
                    name="cidade"
                    value={formData.cidade}
                    onChange={handleInputChange}
                    placeholder="Cidade"
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                  />
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                    UF
                  </label>
                  <select
                    name="uf"
                    value={formData.uf}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                  >
                    <option value="">Selecione</option>
                    <option value="AC">AC</option>
                    <option value="AL">AL</option>
                    <option value="AP">AP</option>
                    <option value="AM">AM</option>
                    <option value="BA">BA</option>
                    <option value="CE">CE</option>
                    <option value="DF">DF</option>
                    <option value="ES">ES</option>
                    <option value="GO">GO</option>
                    <option value="MA">MA</option>
                    <option value="MT">MT</option>
                    <option value="MS">MS</option>
                    <option value="MG">MG</option>
                    <option value="PA">PA</option>
                    <option value="PB">PB</option>
                    <option value="PR">PR</option>
                    <option value="PE">PE</option>
                    <option value="PI">PI</option>
                    <option value="RJ">RJ</option>
                    <option value="RN">RN</option>
                    <option value="RS">RS</option>
                    <option value="RO">RO</option>
                    <option value="RR">RR</option>
                    <option value="SC">SC</option>
                    <option value="SP">SP</option>
                    <option value="SE">SE</option>
                    <option value="TO">TO</option>
                  </select>
                </div>
              </div>

              {/* Linha 9: Naturalidade */}
              <div>
                <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                  Naturalidade
                </label>
                <input
                  type="text"
                  name="naturalidade"
                  value={formData.naturalidade}
                  onChange={handleInputChange}
                  placeholder="Naturalidade"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>

              {/* Linha 10: Observações */}
              <div>
                <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                  Observações
                </label>
                <textarea
                  name="obs"
                  value={formData.obs}
                  onChange={handleInputChange}
                  placeholder="Observações"
                  rows="3"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>
            </div>
          </div>

          {/* Seção: Contrato */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <div className="flex items-center gap-2 mb-6 text-teal-600">
              <span>📋</span>
              <h2 className="text-lg font-bold">Contrato</h2>
            </div>

            <div className="space-y-4">
              {/* Linha 1: Início e Fim do Contrato */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                    Inicio do Contrato
                  </label>
                  <input
                    type="date"
                    name="inicioContrato"
                    value={formData.inicioContrato}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                  />
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                    Fim do Contrato
                  </label>
                  <input
                    type="date"
                    name="fimContrato"
                    value={formData.fimContrato}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                  />
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                    Valor da Hora Aula
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="valorHoraAula"
                    value={formData.valorHoraAula}
                    onChange={handleInputChange}
                    placeholder="R$ 0.00"
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                  />
                </div>
              </div>

              {/* Linha 2: Regime de Trabalho e Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                    Regime de Trabalho
                  </label>
                  <select
                    name="regimeTrabalho"
                    value={formData.regimeTrabalho}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                  >
                    <option value="">Selecione</option>
                    <option value="CLT">CLT</option>
                    <option value="PJ">PJ</option>
                    <option value="AUTÔNOMO">Autônomo</option>
                    <option value="TEMPORÁRIO">Temporário</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-medium text-teal-600 mb-2">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                  >
                    <option value="ATIVO">ATIVO</option>
                    <option value="INATIVO">INATIVO</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-3 justify-center">
            <button
              type="submit"
              disabled={loading}
              className="px-12 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Atualizar'}
            </button>
            <Link href="/admin/professores">
              <button
                type="button"
                className="px-12 py-3 bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold rounded-lg transition-all"
              >
                Cancelar
              </button>
            </Link>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
