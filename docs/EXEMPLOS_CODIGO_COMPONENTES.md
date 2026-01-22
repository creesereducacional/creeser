# Exemplos de Código - Componentes de Formulários e Tabelas
## Sistema CREESER Educacional

---

## 📋 Índice
1. [Seções de Formulário](#seções-de-formulário)
2. [Componentes de Input](#componentes-de-input)
3. [Tabelas Completas](#tabelas-completas)
4. [Filtros de Busca](#filtros-de-busca)
5. [Validações](#validações)

---

## Seções de Formulário

### Seção Padrão com Título

```jsx
<div className="bg-white rounded-lg shadow-md p-4 md:p-6">
  <h2 className="text-lg font-bold text-teal-600 mb-4">
    Identificação
  </h2>
  
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
    {/* Campos aqui */}
  </div>
</div>
```

### Seção com Múltiplas Linhas

```jsx
<div className="bg-white rounded-lg shadow-md p-4 md:p-6">
  <h2 className="text-lg font-bold text-teal-600 mb-4">
    Dados Pessoais
  </h2>
  
  {/* Linha 1 */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
    {/* Campos da linha 1 */}
  </div>

  {/* Linha 2 */}
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
    {/* Campos da linha 2 */}
  </div>

  {/* Linha 3 */}
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    {/* Campos da linha 3 */}
  </div>
</div>
```

---

## Componentes de Input

### Input Texto Básico

```jsx
<div>
  <label className="text-xs font-medium text-teal-600 mb-1 block">
    NOME *
  </label>
  <input
    type="text"
    name="nome"
    value={formData.nome}
    onChange={handleInputChange}
    placeholder="Nome do aluno"
    required
    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
  />
</div>
```

### Input com Máscara (CPF)

```jsx
<div>
  <label className="text-xs font-medium text-teal-600 mb-1 block">
    CPF
  </label>
  <input
    type="text"
    name="cpf"
    value={formData.cpf}
    onChange={(e) => {
      const valor = e.target.value
        .replace(/\D/g, '')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1');
      setFormData({ ...formData, cpf: valor });
    }}
    placeholder="XXX.XXX.XXX-XX"
    maxLength="14"
    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
  />
</div>
```

### Input com Máscara (Telefone)

```jsx
<div>
  <label className="text-xs font-medium text-teal-600 mb-1 block">
    TELEFONE CELULAR
  </label>
  <input
    type="text"
    name="telefoneCelular"
    value={formData.telefoneCelular}
    onChange={(e) => {
      const valor = e.target.value
        .replace(/\D/g, '')
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .replace(/(-\d{4})\d+?$/, '$1');
      setFormData({ ...formData, telefoneCelular: valor });
    }}
    placeholder="(XX) XXXXX-XXXX"
    maxLength="15"
    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
  />
</div>
```

### Input com Máscara (CEP)

```jsx
<div>
  <label className="text-xs font-medium text-teal-600 mb-1 block">
    CEP
  </label>
  <input
    type="text"
    name="cep"
    value={formData.cep}
    onChange={(e) => {
      const valor = e.target.value
        .replace(/\D/g, '')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .replace(/(-\d{3})\d+?$/, '$1');
      setFormData({ ...formData, cep: valor });
      
      // Buscar endereço se CEP completo
      if (valor.length === 9) buscarEnderecoPorCEP(valor.replace('-', ''));
    }}
    placeholder="XXXXX-XXX"
    maxLength="9"
    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
  />
</div>
```

### Input Data

```jsx
<div>
  <label className="text-xs font-medium text-teal-600 mb-1 block">
    DATA DE NASCIMENTO *
  </label>
  <input
    type="date"
    name="dtNascimento"
    value={formData.dtNascimento}
    onChange={handleInputChange}
    required
    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
  />
</div>
```

### Input Número

```jsx
<div>
  <label className="text-xs font-medium text-teal-600 mb-1 block">
    ANO LETIVO
  </label>
  <input
    type="number"
    name="anoLetivo"
    value={formData.anoLetivo}
    onChange={handleInputChange}
    min="1900"
    max="2100"
    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
  />
</div>
```

### Select Simples

```jsx
<div>
  <label className="text-xs font-medium text-teal-600 mb-1 block">
    ESTADO CIVIL
  </label>
  <select
    name="estadoCivil"
    value={formData.estadoCivil}
    onChange={handleInputChange}
    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-white"
  >
    <option value="">Selecione</option>
    <option value="SOLTEIRO">Solteiro</option>
    <option value="CASADO">Casado</option>
    <option value="DIVORCIADO">Divorciado</option>
    <option value="VIÚVO">Viúvo</option>
  </select>
</div>
```

### Select com Background Teal

```jsx
<div>
  <label className="text-xs font-medium text-teal-600 mb-1 block">
    INSTITUIÇÃO
  </label>
  <select
    name="instituicao"
    value={formData.instituicao}
    onChange={handleInputChange}
    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
  >
    <option value="CREESER">CREESER</option>
  </select>
</div>
```

### Checkbox

```jsx
<div>
  <label className="text-xs font-medium text-teal-600 mb-1 block">
    Turno Integral?
  </label>
  <input
    type="checkbox"
    name="turnoIntegral"
    checked={formData.turnoIntegral}
    onChange={handleInputChange}
    className="w-5 h-5 text-teal-600 rounded cursor-pointer"
  />
</div>
```

### Checkbox com Label ao Lado

```jsx
<div className="flex items-center gap-3">
  <input
    type="checkbox"
    id="nomeSocial"
    name="nomeSocial"
    checked={formData.nomeSocial}
    onChange={handleInputChange}
    className="w-5 h-5 text-teal-600 rounded cursor-pointer"
  />
  <label htmlFor="nomeSocial" className="text-xs font-medium text-teal-600">
    Nome social?
  </label>
</div>
```

### Textarea

```jsx
<div>
  <label className="text-xs font-medium text-teal-600 mb-1 block">
    OBSERVAÇÕES
  </label>
  <textarea
    name="observacoes"
    value={formData.observacoes}
    onChange={handleInputChange}
    rows="4"
    placeholder="Digite aqui..."
    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
  />
</div>
```

### Input File (Foto)

```jsx
<div>
  <label className="text-xs font-medium text-teal-600 mb-1 block">
    FOTO DO ALUNO
  </label>
  <div className="flex items-center gap-4">
    {formData.foto && (
      <img 
        src={formData.foto} 
        alt="Foto" 
        className="h-24 w-24 rounded-full object-cover border-2 border-gray-300"
      />
    )}
    <input
      type="file"
      accept="image/*"
      onChange={(e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            setFormData({ ...formData, foto: event.target.result });
          };
          reader.readAsDataURL(file);
        }
      }}
      className="text-sm"
    />
  </div>
</div>
```

---

## Tabelas Completas

### Tabela Básica com Ações

```jsx
<div className="bg-white rounded-lg shadow-md overflow-hidden">
  {/* Cabeçalho */}
  <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200">
    <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
      📖 Listagem das disciplinas
    </h2>
    <div className="flex items-center gap-4">
      <span className="text-sm text-gray-600">
        Quantidade de Disciplinas: <strong>{dados.length}</strong>
      </span>
      <button 
        onClick={() => window.print()}
        className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-semibold transition text-sm"
      >
        IMPRIMIR
      </button>
    </div>
  </div>

  {/* Tabela */}
  <div className="overflow-x-auto">
    <table className="w-full border-collapse">
      {/* Header */}
      <thead>
        <tr className="bg-teal-100 border-b border-teal-300">
          <th className="text-left px-4 py-3 text-xs font-semibold text-teal-800 border-r border-teal-300">#</th>
          <th className="text-left px-4 py-3 text-xs font-semibold text-teal-800 border-r border-teal-300">Período</th>
          <th className="text-left px-4 py-3 text-xs font-semibold text-teal-800 border-r border-teal-300">Disciplina</th>
          <th className="text-left px-4 py-3 text-xs font-semibold text-teal-800 border-r border-teal-300">Curso</th>
          <th className="text-left px-4 py-3 text-xs font-semibold text-teal-800 border-r border-teal-300">Carga horária</th>
          <th className="text-left px-4 py-3 text-xs font-semibold text-teal-800 border-r border-teal-300">Matriz?</th>
          <th className="text-left px-4 py-3 text-xs font-semibold text-teal-800 border-r border-teal-300">Grade</th>
          <th className="text-center px-4 py-3 text-xs font-semibold text-teal-800">Ações</th>
        </tr>
      </thead>
      
      {/* Body */}
      <tbody>
        {dados.length === 0 ? (
          <tr>
            <td colSpan="8" className="px-4 py-6 text-center text-gray-500">
              Nenhum registro encontrado
            </td>
          </tr>
        ) : (
          dados.map((item) => (
            <tr key={item.id} className="border-b border-gray-200 hover:bg-teal-50 transition">
              <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200">{item.codigo}</td>
              <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200">{item.periodo}</td>
              <td className="px-4 py-3 text-sm text-gray-800 font-semibold border-r border-gray-200">{item.nome}</td>
              <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200">{item.curso}</td>
              <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200">{item.cargaHoraria}</td>
              <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200">{item.matriz ? 'Sim' : 'Não'}</td>
              <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200">{item.grade}</td>
              <td className="px-4 py-3 text-center">
                <div className="flex items-center justify-center gap-2">
                  <button className="p-2 text-orange-600 hover:text-orange-800 transition" title="Imprimir">📝</button>
                  <button className="p-2 text-blue-600 hover:text-blue-800 transition" title="Link">🔗</button>
                  <button className="p-2 text-gray-600 hover:text-gray-800 transition" title="Configurar">⚙️</button>
                  <button className="p-2 text-purple-600 hover:text-purple-800 transition" title="Cloud">☁️</button>
                  <button className="p-2 text-blue-600 hover:text-blue-800 transition" title="Editar">✏️</button>
                  <button onClick={() => deletar(item.id)} className="p-2 text-red-600 hover:text-red-800 transition" title="Deletar">❌</button>
                </div>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
</div>
```

---

## Filtros de Busca

### Filtro Completo em 2 Linhas

```jsx
<div className="bg-teal-50 border border-teal-200 rounded-lg p-4 md:p-6 mb-6">
  <div className="flex items-center gap-2 mb-4">
    <span className="text-teal-600 text-xl">🔍</span>
    <h2 className="text-lg font-semibold text-gray-700">Filtro de Busca</h2>
  </div>

  <div className="space-y-4">
    {/* Linha 1 */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label className="text-xs font-medium text-teal-600 mb-1 block">CURSO</label>
        <select
          value={searchCurso}
          onChange={(e) => setSearchCurso(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-white"
        >
          <option value="">- Selecione um Curso -</option>
          <option value="ADMINISTRAÇÃO EAD">ADMINISTRAÇÃO EAD</option>
        </select>
      </div>

      <div>
        <label className="text-xs font-medium text-teal-600 mb-1 block">PERÍODO</label>
        <select
          value={searchPeriodo}
          onChange={(e) => setSearchPeriodo(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-white"
        >
          <option value="">- Selecione um Período -</option>
          <option value="01º Período">01º Período</option>
          <option value="02º Período">02º Período</option>
          <option value="03º Período">03º Período</option>
        </select>
      </div>

      <div>
        <label className="text-xs font-medium text-teal-600 mb-1 block">GRADE</label>
        <div className="flex gap-2">
          <select
            value={searchGrade}
            onChange={(e) => setSearchGrade(e.target.value)}
            className="flex-1 px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-white"
          >
            <option value="">ADM EAD</option>
          </select>
          <button
            onClick={() => setSearchGrade('')}
            className="px-3 py-2 text-gray-500 hover:text-gray-700 text-lg"
          >
            ✕
          </button>
        </div>
      </div>
    </div>

    {/* Linha 2 */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label className="text-xs font-medium text-teal-600 mb-1 block">NOME</label>
        <input
          type="text"
          placeholder="Nome da Disciplina"
          value={searchNome}
          onChange={(e) => setSearchNome(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-white"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-teal-600 mb-1 block">SITUAÇÃO</label>
        <select
          value={searchSituacao}
          onChange={(e) => setSearchSituacao(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-white"
        >
          <option value="">- Selecione -</option>
          <option value="ATIVO">ATIVO</option>
          <option value="INATIVO">INATIVO</option>
        </select>
      </div>

      <div className="flex items-end">
        <button
          onClick={() => {
            setSearchCurso('');
            setSearchPeriodo('');
            setSearchGrade('');
            setSearchNome('');
            setSearchSituacao('');
          }}
          className="w-full px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold transition text-sm"
        >
          LIMPAR
        </button>
      </div>
    </div>
  </div>
</div>
```

---

## Validações

### Validação Simples

```jsx
const handleSubmit = (e) => {
  e.preventDefault();
  
  // Validações básicas
  if (!formData.nome.trim()) {
    setMessage({ type: 'error', text: 'Nome é obrigatório' });
    return;
  }
  
  if (!formData.dtNascimento) {
    setMessage({ type: 'error', text: 'Data de nascimento é obrigatória' });
    return;
  }
  
  // Se passou em todas as validações
  salvar();
};
```

### Validação de CPF

```jsx
const validarCPF = (cpf) => {
  const cpfLimpo = cpf.replace(/\D/g, '');
  
  if (cpfLimpo.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpfLimpo)) return false;
  
  let soma = 0;
  let resto;
  
  for (let i = 1; i <= 9; i++) {
    soma += parseInt(cpfLimpo.substring(i - 1, i)) * (11 - i);
  }
  
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpfLimpo.substring(9, 10))) return false;
  
  soma = 0;
  for (let i = 1; i <= 10; i++) {
    soma += parseInt(cpfLimpo.substring(i - 1, i)) * (12 - i);
  }
  
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpfLimpo.substring(10, 11))) return false;
  
  return true;
};
```

### Busca de CEP com ViaCEP

```jsx
const buscarEnderecoPorCEP = async (cep) => {
  if (!cep || cep.length !== 8) return;

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
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
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  } catch (error) {
    console.error('Erro ao buscar CEP:', error);
    setMessage({ type: 'error', text: 'Erro ao buscar CEP' });
  }
};
```

### Mensagem de Feedback

```jsx
{message.text && (
  <div className={`p-4 rounded-lg mb-4 text-sm font-medium ${
    message.type === 'error' 
      ? 'bg-red-50 border-l-4 border-l-red-400 text-red-700'
      : 'bg-green-50 border-l-4 border-l-green-400 text-green-700'
  }`}>
    {message.text}
  </div>
)}
```

### Botões de Ação (Salvar/Cancelar)

```jsx
<div className="flex gap-3 justify-end mt-6">
  <button
    type="button"
    onClick={() => router.back()}
    className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition"
  >
    Cancelar
  </button>
  
  <button
    type="submit"
    disabled={loading}
    className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold transition disabled:opacity-50"
  >
    {loading ? 'Salvando...' : 'Salvar'}
  </button>
</div>
```

---

**Última atualização**: 14 de janeiro de 2026
