import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DashboardLayout from '../../../components/DashboardLayout';

export default function NovoTurma() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nome: '',
    unidade: '',
    curso: '',
    grade: '',
    cargaHoraria: '',
    processoSeletivo: '',
    edittalProcessoSeletivo: '',
    turno: '',
    tipo: 'Boleto',
    mensalidade: '',
    desconto: '',
    inscricao: '',
    matricula: '',
    contaRecebimento: '',
    mesesContrato: '',
    limiteCadastroAlunos: '',
    iesRegistradoraDiploma: '',
    situacao: 'ATIVO',
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/turmas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        alert('Turma cadastrada com sucesso!');
        router.push('/admin/turmas');
      } else {
        alert('Erro ao cadastrar turma');
      }
    } catch (error) {
      console.error('Erro ao cadastrar turma:', error);
      alert('Erro ao cadastrar turma');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 max-w-5xl mx-auto">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-3xl">📚</span>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Gerenciar Turmas</h1>
          </div>
        </div>

        {/* Abas - Listar e Inserir */}
        <div className="mb-6 flex gap-2 border-b border-gray-200">
          <Link href="/admin/turmas">
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
          {/* Seção: Configuração Básica */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <h3 className="text-lg font-bold text-teal-600 mb-4">Configuração Básica</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">UNIDADE *</label>
                <select
                  name="unidade"
                  value={formData.unidade}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                >
                  <option value="">Defina uma Unidade</option>
                  <option value="TESTE">TESTE</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">CURSO *</label>
                <select
                  name="curso"
                  value={formData.curso}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                >
                  <option value="">Defina um Curso</option>
                  <option value="PEDAGOGIA">PEDAGOGIA</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">GRADE *</label>
                <select
                  name="grade"
                  value={formData.grade}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                >
                  <option value="">Defina uma Grade</option>
                  <option value="-">-</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">NOME *</label>
                <input
                  type="text"
                  name="nome"
                  value={formData.nome}
                  onChange={handleChange}
                  required
                  placeholder="Nome da turma"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">TURNO *</label>
                <select
                  name="turno"
                  value={formData.turno}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                >
                  <option value="">Selecione o turno</option>
                  <option value="Matutino">Matutino</option>
                  <option value="Vespertino">Vespertino</option>
                  <option value="Noturno">Noturno</option>
                </select>
              </div>
            </div>
          </div>

          {/* Seção: Carga Horária */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <h3 className="text-lg font-bold text-teal-600 mb-4">Carga Horária</h3>
            
            <input
              type="text"
              name="cargaHoraria"
              value={formData.cargaHoraria}
              onChange={handleChange}
              placeholder="Ex: 400 horas"
              className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
            />
          </div>

          {/* Seção: Processo Seletivo */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <h3 className="text-lg font-bold text-teal-600 mb-4">Processo Seletivo</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">PROCESSO SELETIVO</label>
                <input
                  type="date"
                  name="processoSeletivo"
                  value={formData.processoSeletivo}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">EDITAL PROCESSO SELETIVO</label>
                <input
                  type="text"
                  name="edittalProcessoSeletivo"
                  value={formData.edittalProcessoSeletivo}
                  onChange={handleChange}
                  placeholder="Número do edital"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>
            </div>
          </div>

          {/* Seção: Dados Financeiros */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <h3 className="text-lg font-bold text-teal-600 mb-4">Dados Financeiros</h3>
            
            <div className="mb-4">
              <label className="text-xs font-medium text-teal-600 mb-2 block">TIPO DE COBRANÇA</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="tipo"
                    value="Boleto"
                    checked={formData.tipo === 'Boleto'}
                    onChange={handleChange}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Boleto</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="tipo"
                    value="Em mãos/Recibo"
                    checked={formData.tipo === 'Em mãos/Recibo'}
                    onChange={handleChange}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Em mãos/Recibo</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">MENSALIDADE</label>
                <input
                  type="text"
                  name="mensalidade"
                  value={formData.mensalidade}
                  onChange={handleChange}
                  placeholder="R$ 00,00"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">DESCONTO</label>
                <input
                  type="text"
                  name="desconto"
                  value={formData.desconto}
                  onChange={handleChange}
                  placeholder="R$ 00,00"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">MATRÍCULA</label>
                <input
                  type="text"
                  name="matricula"
                  value={formData.matricula}
                  onChange={handleChange}
                  placeholder="R$ 00,00"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">INSCRIÇÃO</label>
                <input
                  type="text"
                  name="inscricao"
                  value={formData.inscricao}
                  onChange={handleChange}
                  placeholder="R$ 00,00"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">CONTA DE RECEBIMENTO</label>
                <select
                  name="contaRecebimento"
                  value={formData.contaRecebimento}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                >
                  <option value="">Defina uma Conta Cedente</option>
                  <option value="Conta 1">Conta 1</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">QTD. MESES CONTRATO</label>
                <input
                  type="text"
                  name="mesesContrato"
                  value={formData.mesesContrato}
                  onChange={handleChange}
                  placeholder="Ex. 12"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">LIMITE PARA CADASTRO DE ALUNOS</label>
                <input
                  type="number"
                  name="limiteCadastroAlunos"
                  value={formData.limiteCadastroAlunos}
                  onChange={handleChange}
                  placeholder="Ex. 50"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>
            </div>
          </div>

          {/* Seção: Registro */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <h3 className="text-lg font-bold text-teal-600 mb-4">Registro</h3>
            
            <div>
              <label className="text-xs font-medium text-teal-600 mb-1 block">IES REGISTRADORA DO DIPLOMA</label>
              <select
                name="iesRegistradoraDiploma"
                value={formData.iesRegistradoraDiploma}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
              >
                <option value="">Defina uma Opção</option>
                <option value="Opção 1">Opção 1</option>
              </select>
            </div>
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
            <Link href="/admin/turmas">
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
