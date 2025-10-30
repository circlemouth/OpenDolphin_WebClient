export const calculateAgeLabel = (birthday?: string | null) => {
  if (!birthday) {
    return '';
  }
  const parsed = new Date(birthday);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }
  const today = new Date();
  let age = today.getFullYear() - parsed.getFullYear();
  const monthDiff = today.getMonth() - parsed.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < parsed.getDate())) {
    age -= 1;
  }
  return age >= 0 ? `${age}歳` : '';
};
