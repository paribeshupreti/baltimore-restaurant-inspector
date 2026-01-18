/**
 * Generate URL-safe slug from restaurant name
 * @param {string} name - Restaurant name
 * @returns {string} URL-safe slug
 */
export function getRestaurantSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')  // Replace non-alphanumeric with dashes
    .replace(/(^-|-$)/g, '');      // Remove leading/trailing dashes
}
