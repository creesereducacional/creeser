# 🧪 GUIA DE TESTES - Redesign CREESER

## ⚡ Quick Start

```bash
# Terminal 1: Iniciar servidor (já está rodando)
npm run dev
# Acesso: http://localhost:3000

# Terminal 2: Verificar logs de erro
npm run dev
```

---

## 📋 Checklist de Testes

### 1. Página de Login
**URL**: `http://localhost:3000/`
**Testes**:
- [ ] Fundo com gradiente teal visível
- [ ] Cartão branco centralizado
- [ ] Logo "CREESER Educacional" com cores corretas
- [ ] Campos de email e senha com ícones
- [ ] Botão "Acessar Sistema" com gradiente teal
- [ ] Credenciais demo claramente visíveis
- [ ] Placeholder text nos campos de input
- [ ] Erro em vermelho quando credencial errada

**Credenciais de Teste**:
```
👤 Admin:
   Email: admin@creeser.com
   Senha: admin123

👨‍🏫 Professor:
   Email: professor@creeser.com
   Senha: prof123

👨‍🎓 Aluno:
   Email: aluno@creeser.com
   Senha: aluno123
```

### 2. Dashboard - Sidebar
**URL**: `http://localhost:3000/dashboard` (após login como aluno)
**Testes**:
- [ ] Sidebar visível no lado esquerdo
- [ ] Background com gradiente Teal (teal-700 → teal-800)
- [ ] Logo "CREESER Educacional" no topo
- [ ] Menu com 22 itens visíveis
- [ ] 21 itens marcados como "Em breve" (desabilitados)
- [ ] 1 item "EAD" ativo e clicável
- [ ] Botão "Recolher" no rodapé da sidebar
- [ ] Hover nos itens mostra mudança de cor
- [ ] Animação suave ao colapsar (300ms)

### 3. Dashboard - Modo Colapsado
**Ação**: Clicar no botão "Recolher"
**Testes**:
- [ ] Sidebar reduz para largura pequena (w-20)
- [ ] Apenas ícones e logo "C" visíveis
- [ ] Tooltips aparecem ao passar mouse
- [ ] Transição suave
- [ ] Conteúdo principal expande para preencher espaço
- [ ] Botão muda para "▶" para expandir

### 4. Dashboard - Header
**Testes**:
- [ ] Título: "Bem-vindo a Faculdade CREESER Educacional"
- [ ] Subtítulo: "Gerencie sua instituição educacional"
- [ ] Nome do usuário exibido
- [ ] Tipo de usuário exibido ("Administrador" ou "Usuário")
- [ ] Avatar com primeira letra do nome em gradiente teal
- [ ] Botão "Sair" em vermelho
- [ ] Logout funciona (redireciona para home)

### 5. Dashboard - Conteúdo Principal
**Testes**:
- [ ] Conteúdo marginalizado corretamente
- [ ] Responsividade ao colapsar/expandir sidebar
- [ ] Background cinza claro (bg-gray-50)
- [ ] Espaçamento adequado
- [ ] Cards com sombra visível

### 6. Admin Panel
**URL**: `http://localhost:3000/admin/dashboard` (após login como admin)
**Testes**:
- [ ] Sidebar com cores Teal
- [ ] Logo com "C" branco em gradiente teal
- [ ] Header com cores Teal
- [ ] Rótulo "Administrador" em Teal
- [ ] Mesmo layout que dashboard de aluno
- [ ] Itens de menu diferentes (Dashboard, Usuários, Professores, etc)

### 7. Responsividade - Desktop
**Viewport**: 1920px+
**Testes**:
- [ ] Sidebar sempre visível
- [ ] Sem menu hambúrguer
- [ ] Layout horizontal confortável
- [ ] Espaçamento amplo

### 8. Responsividade - Tablet
**Viewport**: 768px - 1024px
**Testes**:
- [ ] Sidebar colapsável/expandível
- [ ] Menu hambúrguer aparece se necessário
- [ ] Layout ainda legível
- [ ] Cards em 2 colunas quando apropriado

### 9. Responsividade - Mobile
**Viewport**: 320px - 480px
**Testes**:
- [ ] Sidebar como overlay (z-50)
- [ ] Menu hambúrguer visível
- [ ] Overlay escuro quando sidebar aberto
- [ ] Layout em coluna única
- [ ] Toque fora do menu fecha sidebar
- [ ] Texto legível (sem zoom)
- [ ] Botões clicáveis

### 10. Cores e Estilos
**Teste Visual**:
- [ ] Todos os "Teal" consistentes (#0D9488, #0F766E, #14B8A6)
- [ ] Sem resquícios de cores antigas (azul, amarelo, laranja)
- [ ] Gradientes suaves
- [ ] Bordas finas e consistentes
- [ ] Sombras sutis

### 11. Navegação
**Testes**:
- [ ] Link "EAD" em sidebar funciona
- [ ] Acesso a `/ead` funciona
- [ ] Logout funciona
- [ ] Redirecionamentos corretos por tipo de usuário

### 12. Performance
**Testes**:
- [ ] Carregamento rápido (< 3s)
- [ ] Nenhum erro no console
- [ ] Transições suaves (60fps)
- [ ] Sem memory leaks aparentes

---

## 🐛 Troubleshooting

### Problema: Cores não aparecem como Teal
**Solução**:
```bash
# Limpar cache do Next.js
rm -rf .next
npm run dev
```

### Problema: Sidebar não colapsável
**Verificar**:
- Arquivo `/context/SidebarContext.js` existe?
- Hook `useSidebar()` sendo importado corretamente?

### Problema: Espaçamento ruim
**Verificar**:
- Tailwind CSS carregado corretamente?
- Não há CSS customizado conflitando?

### Problema: Mobile não responsivo
**Verificar**:
- Viewport meta tag em `_document.js`?
- Classes Tailwind `md:` e `lg:` aplicadas corretamente?

---

## 📊 Teste de Compatibilidade de Navegadores

| Navegador | Desktop | Tablet | Mobile | Status |
|-----------|---------|--------|--------|--------|
| Chrome | ✅ | ✅ | ✅ | OK |
| Firefox | ✅ | ✅ | ✅ | OK |
| Safari | ✅ | ✅ | ✅ | OK |
| Edge | ✅ | ✅ | ✅ | OK |
| IE 11 | ⚠️ | ⚠️ | ⚠️ | Não suportado |

---

## 🔍 Verificação de Arquivo

### Verificar se DashboardLayout existe
```bash
ls -la components/DashboardLayout.js
# Output: Arquivo deve existir e ter ~350 linhas
```

### Verificar cores no tailwind.config.js
```bash
grep -i "teal" tailwind.config.js
# Output: Deve conter referências às cores Teal
```

### Verificar imports em pages/dashboard.js
```bash
grep "DashboardLayout" pages/dashboard.js
# Output: Deve conter a importação do novo componente
```

---

## 📈 Métricas de Sucesso

✅ **Visual**: Novo design implementado 100%
✅ **Funcional**: Todas as funcionalidades originais mantidas
✅ **Responsivo**: Funciona em todos os tamanhos
✅ **Performance**: Sem degradação de velocidade
✅ **Acessível**: Navegação clara e intuitiva

---

## 💾 Backup e Recuperação

### Restaurar versão anterior (se necessário)
```bash
# Versão anterior estava em /pages/dashboard.js
git diff pages/dashboard.js
# Para reverter:
git checkout pages/dashboard.js
```

---

## 📝 Notas para QA

1. **Focus**: Cores Teal e layout sidebar colapsável
2. **Priority**: Login → Dashboard → Admin Panel
3. **Browsers**: Testar em Chrome e Firefox no mínimo
4. **Devices**: Desktop, Tablet (iPad), Mobile (iPhone/Android)
5. **Network**: Testar com throttling (3G, 4G)

---

## ✅ Conclusão do Teste

Todos os itens passaram? 🎉
- [ ] Sim, tudo funcionando!
- [ ] Não, encontrei problemas (listar abaixo):

**Problemas Encontrados**:
```
1. ...
2. ...
3. ...
```

**Data do Teste**: ___/___/______
**Testador**: _______________
**Versão**: 2.0

---

*Última atualização: 2024*
