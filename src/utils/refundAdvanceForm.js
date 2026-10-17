const digits = (value = '') => String(value).replace(/\D/g, '');

export const maskCpf = (value) => digits(value).slice(0, 11)
  .replace(/^(\d{3})(\d)/, '$1.$2')
  .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
  .replace(/(\d{3})(\d{1,2})$/, '$1-$2');

export const maskRg = (value) => digits(value).slice(0, 9)
  .replace(/^(\d{2})(\d)/, '$1.$2')
  .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
  .replace(/(\d{3})(\d)$/, '$1-$2');

export const maskDate = (value) => digits(value).slice(0, 8)
  .replace(/^(\d{2})(\d)/, '$1/$2')
  .replace(/^(\d{2})\/(\d{2})(\d)/, '$1/$2/$3');

export const dateToDisplay = (value) => {
  if (!value) return '';
  const iso = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return iso ? `${iso[3]}/${iso[2]}/${iso[1]}` : maskDate(value);
};

export const dateToIso = (value) => {
  const match = String(value).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : value;
};

export const maskCep = (value) => digits(value).slice(0, 8).replace(/^(\d{5})(\d)/, '$1-$2');
export const onlyDigits = digits;
