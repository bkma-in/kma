export const formatDate = (dateVal: any): string => {
  if (!dateVal) return 'N/A';
  
  if (typeof dateVal === 'string') {
    const d = new Date(dateVal);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString();
    }
    return 'N/A';
  }
  
  // Handle Firestore Timestamp objects
  const seconds = dateVal._seconds ?? dateVal.seconds;
  if (seconds !== undefined) {
    return new Date(seconds * 1000).toLocaleDateString();
  }

  // Guard: if it's an object (and didn't match Firestore timestamp), return 'N/A'
  if (typeof dateVal === 'object') {
    return 'N/A';
  }

  // Build a Date from remaining primitive types (number) and check
  const d = new Date(dateVal);
  return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString();
};
