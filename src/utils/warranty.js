export const WARRANTY_INFO_TEXT =
  'Aqui você pode controlar o prazo de garantia do seu produto. Basta informar o período de garantia e manter sua nota fiscal armazenada no sistema para consultá-la facilmente caso precise acionar a garantia.\n\n⭐ No plano básico e premium você tem a nota fiscal armazenada por um período maior que 12 meses, consequentemente, a garantia do produto acessível por um maior espaço de tempo.\n\n⭐ No Plano Premium, você também conta com modelos de documentos para solicitar o acionamento da garantia de forma prática e organizada.';

export function parseWarrantyMonths(value) {
  const parsed = Number.parseInt(String(value ?? '').replace(/\D/g, ''), 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export function getWarrantyStatus(dataEmissao, garantiaMeses) {
  const months = Number(garantiaMeses);

  if (!dataEmissao || !Number.isFinite(months) || months <= 0) {
    return 'Informe o período para ver o prazo.';
  }

  const startDate = new Date(`${dataEmissao}T00:00:00`);
  if (!Number.isFinite(startDate.getTime())) {
    return 'Informe a data de emissão para calcular.';
  }

  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + months);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil((endDate.getTime() - today.getTime()) / 86400000);
  const formattedEnd = endDate.toLocaleDateString('pt-BR');

  if (diffDays < 0) {
    return `Garantia vencida em ${formattedEnd}`;
  }

  if (diffDays === 0) {
    return `Garantia vence hoje (${formattedEnd})`;
  }

  return `Restam ${diffDays} dia${diffDays === 1 ? '' : 's'} • vence em ${formattedEnd}`;
}
