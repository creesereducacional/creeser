import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DashboardLayout from '../../../components/DashboardLayout';

export default function NovoResponsavel() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nome: '',
    profissao: '',
    sexo: '',
    dataNascimento: '',
    estadoCivil: '',
    whatsapp: '',
    telefoneComercial: '',
    endereco: '',
    complemento: '',
    cep: '',
    bairro: '',
    cidade: '',
    uf: '',
    email: '',
    senha: '',
    cpf: '',
    rg: '',
    cnpj: '',
    observacoes: '',
    situacao: 'ATIVO',
    alunoIds: [],
  });

  const [alunosDisponiveis, setAlunosDisponiveis] = useState([]);
  const [alunosSelecionados, setAlunosSelecionados] = useState([]);
  const [buscaAluno, setBuscaAluno] = useState('');
  const [loadingAlunos, setLoadingAlunos] = useState(false);
  const [loading, setLoading] = useState(false);
  const termoBuscaAluno = buscaAluno.trim().toLowerCase();
  const buscaAlunoValida = termoBuscaAluno.length >= 3;

  useEffect(() => {
    carregarAlunos();
  }, []);

  const alunosFiltrados = useMemo(() => {
    const idsSelecionados = new Set(alunosSelecionados);

    if (!buscaAlunoValida) {
      return [];
    }

    return alunosDisponiveis.filter((aluno) => {
      const alunoId = String(aluno.id);
      if (idsSelecionados.has(alunoId)) return false;

      const nome = String(aluno.nome || '').toLowerCase();
      return nome.includes(termoBuscaAluno);
    });
  }, [alunosDisponiveis, alunosSelecionados, termoBuscaAluno, buscaAlunoValida]);

  const formatarOpcaoAluno = (aluno) => {
    const nome = String(aluno.nome || `Aluno #${aluno.id}`);
    return `${nome} (ID: ${aluno.id})`;
  };

  const carregarAlunos = async () => {
    try {
      setLoadingAlunos(true);
      const res = await fetch('/api/alunos');
      if (!res.ok) return;

      const data = await res.json();
      setAlunosDisponiveis(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao carregar alunos:', error);
    } finally {
      setLoadingAlunos(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBuscaAlunoChange = (e) => {
    const valor = e.target.value;
    setBuscaAluno(valor);

    const alunoEncontrado = alunosDisponiveis.find((aluno) => {
      const alunoId = String(aluno.id);
      if (alunosSelecionados.includes(alunoId)) return false;
      return formatarOpcaoAluno(aluno) === valor;
    });

    if (alunoEncontrado) {
      adicionarAluno(alunoEncontrado.id);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        alunoIds: alunosSelecionados,
      };

      const res = await fetch('/api/responsaveis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert('Responsável cadastrado com sucesso!');
        router.push('/admin/responsaveis');
      } else {
        alert('Erro ao cadastrar responsável');
      }
    } catch (error) {
      console.error('Erro ao cadastrar responsável:', error);
      alert('Erro ao cadastrar responsável');
    } finally {
      setLoading(false);
    }
  };

  const adicionarAluno = (alunoId) => {
    const alunoIdString = String(alunoId);
    if (!alunoIdString || alunosSelecionados.includes(alunoIdString)) {
      return;
    }

    setAlunosSelecionados((prev) => [...prev, alunoIdString]);
    setBuscaAluno('');
  };

  const removerAluno = (alunoId) => {
    setAlunosSelecionados((prev) => prev.filter((id) => id !== alunoId));
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 max-w-5xl mx-auto">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-3xl">👥</span>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Gerenciar Responsáveis</h1>
          </div>
        </div>

        {/* Abas - Listar e Inserir */}
        <div className="mb-6 flex gap-2 border-b border-gray-200">
          <Link href="/admin/responsaveis">
            <button className="px-6 py-3 text-gray-500 hover:text-teal-600 font-semibold flex items-center gap-2 transition">
              📋 Listar
            </button>
          </Link>
          <button className="px-6 py-3 text-teal-600 border-b-2 border-teal-600 font-semibold flex items-center gap-2">
            ➕ Inserir
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seção: Dados Pessoais */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <h3 className="text-lg font-bold text-teal-600 mb-4">➕ Inserir Responsável</h3>
            
            <div className="mb-4">
              <label className="text-xs font-medium text-teal-600 mb-1 block">NOME *</label>
              <input
                type="text"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                required
                placeholder="Nome completo"
                className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">PROFISSÃO</label>
                <input
                  type="text"
                  name="profissao"
                  value={formData.profissao}
                  onChange={handleChange}
                  placeholder="Profissão"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">SEXO</label>
                <select
                  name="sexo"
                  value={formData.sexo}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                >
                  <option value="">Selecione</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Feminino">Feminino</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">DATA DE NASCIMENTO *</label>
                <input
                  type="date"
                  name="dataNascimento"
                  value={formData.dataNascimento}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">ESTADO CIVIL</label>
                <select
                  name="estadoCivil"
                  value={formData.estadoCivil}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                >
                  <option value="">Selecione</option>
                  <option value="Solteiro">Solteiro</option>
                  <option value="Casado">Casado</option>
                  <option value="Divorciado">Divorciado</option>
                  <option value="Viúvo">Viúvo</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">WHATSAPP</label>
                <input
                  type="text"
                  name="whatsapp"
                  value={formData.whatsapp}
                  onChange={handleChange}
                  placeholder="(XX) XXXXX-XXXX"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">TELEFONE COMERCIAL</label>
                <input
                  type="text"
                  name="telefoneComercial"
                  value={formData.telefoneComercial}
                  onChange={handleChange}
                  placeholder="(XX) XXXXX-XXXX"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>
            </div>
          </div>

          {/* Seção: Endereço */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <h3 className="text-lg font-bold text-teal-600 mb-4">Endereço</h3>
            
            <div className="mb-4">
              <label className="text-xs font-medium text-teal-600 mb-1 block">ENDEREÇO</label>
              <input
                type="text"
                name="endereco"
                value={formData.endereco}
                onChange={handleChange}
                placeholder="Rua, avenida, etc"
                className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">COMPLEMENTO</label>
                <input
                  type="text"
                  name="complemento"
                  value={formData.complemento}
                  onChange={handleChange}
                  placeholder="Apto, sala, etc"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">CEP</label>
                <input
                  type="text"
                  name="cep"
                  value={formData.cep}
                  onChange={handleChange}
                  placeholder="XXXXX-XXX"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">BAIRRO</label>
                <input
                  type="text"
                  name="bairro"
                  value={formData.bairro}
                  onChange={handleChange}
                  placeholder="Bairro"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">CIDADE</label>
                <input
                  type="text"
                  name="cidade"
                  value={formData.cidade}
                  onChange={handleChange}
                  placeholder="Cidade"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-teal-600 mb-1 block">UF</label>
              <select
                name="uf"
                value={formData.uf}
                onChange={handleChange}
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

          {/* Seção: Identificação */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <h3 className="text-lg font-bold text-teal-600 mb-4">Identificação</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">E-MAIL/USUÁRIO</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="email@exemplo.com"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">SENHA</label>
                <input
                  type="password"
                  name="senha"
                  value={formData.senha}
                  onChange={handleChange}
                  placeholder="Senha"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">CPF</label>
                <input
                  type="text"
                  name="cpf"
                  value={formData.cpf}
                  onChange={handleChange}
                  placeholder="Somente Números"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">RG</label>
                <input
                  type="text"
                  name="rg"
                  value={formData.rg}
                  onChange={handleChange}
                  placeholder="RG"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-teal-600 mb-1 block">CNPJ</label>
              <input
                type="text"
                name="cnpj"
                value={formData.cnpj}
                onChange={handleChange}
                placeholder="Somente Números"
                className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
              />
            </div>
          </div>

          {/* Seção: Alunos sob Responsabilidade */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <h3 className="text-lg font-bold text-teal-600 mb-4">Aluno(s) de Responsabilidade</h3>

            <div className="mb-4">
              <label className="text-xs font-medium text-teal-600 mb-1 block">BUSCAR ALUNO</label>
              <input
                type="text"
                list="alunos-busca-novo"
                value={buscaAluno}
                onChange={handleBuscaAlunoChange}
                placeholder="Digite 3+ letras do nome do aluno"
                disabled={loadingAlunos}
                className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
              />
              <datalist id="alunos-busca-novo">
                {alunosFiltrados.map((aluno) => (
                  <option key={aluno.id} value={formatarOpcaoAluno(aluno)} />
                ))}
              </datalist>
            </div>

            <div className="mt-4">
              <label className="text-xs font-medium text-teal-600 mb-1 block">ALUNOS VINCULADOS</label>
              <div className="w-full px-3 py-2 border border-teal-300 rounded-lg bg-white min-h-[64px]">
                {alunosSelecionados.length > 0 ? (
                  alunosSelecionados.map((alunoId) => {
                    const aluno = alunosDisponiveis.find((item) => String(item.id) === String(alunoId));
                    const nome = aluno?.nome || `Aluno #${alunoId}`;

                    return (
                      <div key={alunoId} className="px-2 py-1 bg-teal-100 text-teal-600 rounded mb-1 flex justify-between items-center text-sm">
                        <span>{nome}</span>
                        <button
                          type="button"
                          onClick={() => removerAluno(alunoId)}
                          className="text-red-600 hover:text-red-800 text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-gray-400 text-sm">Nenhum aluno vinculado</div>
                )}
              </div>
            </div>
          </div>

          {/* Seção: Observações */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <h3 className="text-lg font-bold text-teal-600 mb-4">Observações</h3>
            
            <textarea
              name="observacoes"
              value={formData.observacoes}
              onChange={handleChange}
              placeholder="Adicione observações sobre o responsável"
              rows="4"
              className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
            ></textarea>
          </div>

          {/* Seção: Status */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <h3 className="text-lg font-bold text-teal-600 mb-4">Status</h3>
            
            <select
              name="situacao"
              value={formData.situacao}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
            >
              <option value="ATIVO">ATIVO</option>
              <option value="INATIVO">INATIVO</option>
            </select>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-4 justify-start">
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold transition text-sm disabled:opacity-50"
            >
              {loading ? 'CADASTRANDO...' : 'CADASTRAR'}
            </button>
            <Link href="/admin/responsaveis">
              <button
                type="button"
                className="px-8 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded-lg font-semibold transition text-sm"
              >
                CANCELAR
              </button>
            </Link>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
