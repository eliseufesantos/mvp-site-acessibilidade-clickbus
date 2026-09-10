const toLocalIsoDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getTodayIso = () => toLocalIsoDate(new Date());

export const getDefaultTravelDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return toLocalIsoDate(date);
};

export const shiftIsoDate = (value: string, days: number) => {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return toLocalIsoDate(date);
};

export const formatTravelDate = (value: string, options?: Intl.DateTimeFormatOptions) => {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return value;
  return new Intl.DateTimeFormat('pt-BR', options ?? { day: 'numeric', month: 'long' }).format(
    new Date(year, month - 1, day),
  );
};
