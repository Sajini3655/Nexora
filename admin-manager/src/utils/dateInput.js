export function getLocalDateInputValue(date = new Date()) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
}

export function isBeforeDate(dateValue, referenceDate) {
  return Boolean(dateValue) && String(dateValue) < String(referenceDate);
}

export function isAfterDate(dateValue, referenceDate) {
  return Boolean(dateValue) && String(dateValue) > String(referenceDate);
}
