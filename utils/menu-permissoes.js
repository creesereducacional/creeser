const toLower = (value) => String(value || '').trim().toLowerCase();

export const obterPerfilUsuario = (user) => {
  return toLower(user?.perfil || user?.tipo || '');
};

export const obterTipoInstituicao = (user) => {
  return toLower(user?.tipo_instituicao || user?.tipoInstituicao || '');
};

const permitePerfil = (item, perfil, isGroupAdmin) => {
  if (isGroupAdmin) return true;
  if (!item.perfis || item.perfis.length === 0) return true;

  // Normalização de aliases e equivalências
  const mapeamentoPerfil = (p) => {
    const raw = toLower(p);
    if (raw === 'admin') return 'instituicao_admin';
    if (raw === 'financeiro_admin') return 'financeiro';
    if (raw === 'comercial_master') return 'comercial';
    return raw;
  };

  const perfilNormalizado = mapeamentoPerfil(perfil);
  const perfisPermitidos = item.perfis.map(mapeamentoPerfil);

  // Administrador de Instituição local tem passe livre em permissões de "instituicao_admin"
  if (perfilNormalizado === 'instituicao_admin' && perfisPermitidos.includes('instituicao_admin')) {
    return true;
  }

  return perfisPermitidos.includes(perfilNormalizado);
};

const permiteTipoInstituicao = (item, tipoInstituicao, isGroupAdmin) => {
  if (isGroupAdmin) return true;
  if (!item.tiposInstituicao || item.tiposInstituicao.length === 0) return true;
  if (!tipoInstituicao) return true;
  return item.tiposInstituicao.map(toLower).includes(tipoInstituicao);
};

export const filtrarMenuPorContexto = (menuItems, user) => {
  const perfil = obterPerfilUsuario(user);
  const tipoInstituicao = obterTipoInstituicao(user);
  const isGroupAdmin = perfil === 'grupo_admin';

  return (menuItems || [])
    .map((item) => {
      const itemPermitido =
        permitePerfil(item, perfil, isGroupAdmin) && permiteTipoInstituicao(item, tipoInstituicao, isGroupAdmin);

      if (!itemPermitido) return null;

      if (!Array.isArray(item.submenu)) return item;

      const submenuFiltrado = item.submenu.filter((subitem) => {
        return (
          permitePerfil(subitem, perfil, isGroupAdmin) &&
          permiteTipoInstituicao(subitem, tipoInstituicao, isGroupAdmin)
        );
      });

      if (submenuFiltrado.length === 0) return null;

      return { ...item, submenu: submenuFiltrado };
    })
    .filter(Boolean);
};
