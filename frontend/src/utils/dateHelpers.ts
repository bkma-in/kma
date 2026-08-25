export const formatDateDDMMYYYY = (dateVal: any): string => {
  if (!dateVal) return 'N/A';

  if (typeof dateVal === 'string') {
    const trimmed = dateVal.trim();
    // Match YYYY-MM-DD
    const isoMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(trimmed);
    if (isoMatch) {
      return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;
    }
    // Match YYYY/MM/DD
    const slashMatch = /^(\d{4})\/(\d{2})\/(\d{2})/.exec(trimmed);
    if (slashMatch) {
      return `${slashMatch[3]}/${slashMatch[2]}/${slashMatch[1]}`;
    }
    // If already DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}/.test(trimmed)) {
      return trimmed;
    }
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    }
    return trimmed;
  }

  let dateObj: Date | null = null;
  const seconds = dateVal._seconds ?? dateVal.seconds;
  if (seconds !== undefined) {
    dateObj = new Date(seconds * 1000);
  } else if (dateVal instanceof Date) {
    dateObj = dateVal;
  } else if (typeof dateVal === 'number') {
    dateObj = new Date(dateVal);
  }

  if (dateObj && !isNaN(dateObj.getTime())) {
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    return `${day}/${month}/${year}`;
  }

  return 'N/A';
};

export const formatDate = (dateVal: any): string => {
  return formatDateDDMMYYYY(dateVal);
};
