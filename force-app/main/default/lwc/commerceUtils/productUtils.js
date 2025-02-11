/** @typedef {import("coveo").Product} Product */
/** @typedef {import("coveo").ProductTemplatesHelpers} ProductTemplatesHelpers */

export class FieldValueIsNaNError extends Error {
  /**
  * @param {string} field
  * @param {object} value
  */
  constructor(field, value) {
    super(`Could not parse "${value}" from field "${field}" as a number.`);
    this.name = 'FieldValueIsNaNError';
  }
}

/**
* @param {Product} product
* @param {string} field
*/
export function parseValue(product, field) {
  // eslint-disable-next-line no-undef
  const value = CoveoHeadlessCommerce.ProductTemplatesHelpers.getProductProperty(product, field);
  if (value === null) {
    return null;
  }
  const valueAsNumber = parseFloat(`${value}`);
  if (Number.isNaN(valueAsNumber)) {
    throw new FieldValueIsNaNError(field, value);
  }
  return valueAsNumber;
}

/**
* @param {string} currency
* @return {(value: number, languages: string[]) => string}
*/
export const defaultCurrencyFormatter = (currency) => (value, languages) => {
  return value.toLocaleString(languages, {
    style: 'currency',
    currency,
  });
};
