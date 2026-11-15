/**
 * The ISBN-13 printed as a book's barcode (EAN-13 starting with 978 or 979, valid check digit),
 * or null for any other barcode (a price tag, a magazine's ISSN).
 */
export function isbnFromBarcode(data: string): string | null {
  const digits = data.replace(/\D/g, "");
  if (!/^97[89]\d{10}$/.test(digits)) return null;
  const sum = [...digits.slice(0, 12)].reduce(
    (total, digit, index) => total + Number(digit) * (index % 2 === 0 ? 1 : 3),
    0,
  );
  return (10 - (sum % 10)) % 10 === Number(digits[12]) ? digits : null;
}
