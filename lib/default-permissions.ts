export const DEFAULT_MODULES_SCHEMA = {
  caixa: {
    visualizar: false,
    criarVenda: false,
    finalizarVenda: false,
    cancelarVenda: false,
    abrirFecharCaixa: false,
    sangriaSuprimento: false,
    reimprimirRecibo: false,
  },
  estoque: {
    visualizar: false,
    editar: false,
    cadastrarProduto: false,
    excluirProduto: false,
    gerarEtiquetas: false,
    ajustarEstoque: false,
    verCusto: false,
  },
  checklist: {
    visualizar: false,
    criar: false,
    editar: false,
    gerarOrcamento: false,
  },
  ordensServico: {
    visualizar: false,
    criar: false,
    editar: false,
  },
  relatorios: {
    visualizar: false,
    exportar: false,
  },
  clientes: {
    visualizar: false,
    cadastrar: false,
    editar: false,
  },
  fornecedores: {
    visualizar: false,
    cadastrar: false,
    editar: false,
  },
  configuracoes: {
    visualizar: false,
    editar: false,
  },
  gerenciamentoCargos: {
    visualizar: false,
    editar: false,
  },
  usuarios: {
    visualizar: false,
    editar: false,
  },
};

export function getSuperAdminPermissions() {
  const perms = JSON.parse(JSON.stringify(DEFAULT_MODULES_SCHEMA));
  for (const mod in perms) {
    for (const act in perms[mod]) {
      perms[mod][act] = true;
    }
  }
  return { modulos: perms };
}

export function getTecnicoPermissions() {
  const perms = JSON.parse(JSON.stringify(DEFAULT_MODULES_SCHEMA));
  perms.estoque.visualizar = true;
  perms.estoque.cadastrarProduto = true;
  
  perms.checklist.visualizar = true;
  perms.checklist.criar = true;
  perms.checklist.editar = true;
  perms.checklist.gerarOrcamento = true;
  
  perms.ordensServico.visualizar = true;
  perms.ordensServico.criar = true;
  perms.ordensServico.editar = true;
  
  perms.clientes.visualizar = true;
  perms.clientes.cadastrar = true;
  return { modulos: perms };
}

export function getOperadorCaixaPermissions() {
  const perms = JSON.parse(JSON.stringify(DEFAULT_MODULES_SCHEMA));
  perms.caixa.visualizar = true;
  perms.caixa.criarVenda = true;
  perms.caixa.finalizarVenda = true;
  perms.caixa.abrirFecharCaixa = true;
  perms.caixa.reimprimirRecibo = true;
  
  perms.estoque.visualizar = true;
  
  perms.clientes.visualizar = true;
  perms.clientes.cadastrar = true;
  return { modulos: perms };
}
