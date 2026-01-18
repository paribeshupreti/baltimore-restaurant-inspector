/**
 * @jest-environment node
 */

import { getRestaurantSlug } from '../utils/slugify.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Restaurant Slug Generation', () => {
  let restaurants;

  beforeAll(() => {
    const dataPath = path.join(__dirname, '../public/data/baltimore_restaurants.json');
    const data = fs.readFileSync(dataPath, 'utf8');
    restaurants = JSON.parse(data);
  });

  describe('Slug Generation Logic', () => {
    test('should handle basic restaurant names', () => {
      expect(getRestaurantSlug('The Food Market')).toBe('the-food-market');
      expect(getRestaurantSlug('Ekiben')).toBe('ekiben');
    });

    test('should remove special characters', () => {
      expect(getRestaurantSlug("Joe's Pizza")).toBe('joe-s-pizza');
      expect(getRestaurantSlug("McDonald's")).toBe('mcdonald-s');
    });

    test('should handle names with periods and commas', () => {
      expect(getRestaurantSlug("AMICCI'S, INC.")).toBe('amicci-s-inc');
      expect(getRestaurantSlug("Restaurant, LLC.")).toBe('restaurant-llc');
    });

    test('should remove trailing dashes', () => {
      const slug = getRestaurantSlug("Test Restaurant-");
      expect(slug).not.toMatch(/-$/);
      expect(slug).toBe('test-restaurant');
    });

    test('should remove leading dashes', () => {
      const slug = getRestaurantSlug("-Test Restaurant");
      expect(slug).not.toMatch(/^-/);
      expect(slug).toBe('test-restaurant');
    });

    test('should handle multiple special characters in a row', () => {
      expect(getRestaurantSlug("Test & Co.")).toBe('test-co');
      expect(getRestaurantSlug("A&W!!!")).toBe('a-w');
    });

    test('should convert to lowercase', () => {
      expect(getRestaurantSlug('THE FOOD MARKET')).toBe('the-food-market');
      expect(getRestaurantSlug('AMICCI\'S')).toBe('amicci-s');
    });

    test('should not have consecutive dashes', () => {
      const slug = getRestaurantSlug("Test & & Restaurant");
      expect(slug).not.toMatch(/--/);
    });
  });

  describe('All Restaurant URLs', () => {
    test('should have valid data loaded', () => {
      expect(restaurants).toBeDefined();
      expect(Array.isArray(restaurants)).toBe(true);
      expect(restaurants.length).toBeGreaterThan(0);
    });

    test('all restaurant slugs should be valid', () => {
      restaurants.forEach((restaurant) => {
        const slug = getRestaurantSlug(restaurant.name);

        // Should not be empty
        expect(slug.length).toBeGreaterThan(0);

        // Should not have trailing dash
        expect(slug).not.toMatch(/-$/);

        // Should not have leading dash
        expect(slug).not.toMatch(/^-/);

        // Should not have consecutive dashes
        expect(slug).not.toMatch(/--/);

        // Should only contain lowercase letters, numbers, and single dashes
        expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      });
    });

    test('all restaurant URLs should be unique', () => {
      const slugs = restaurants.map(r => getRestaurantSlug(r.name));
      const uniqueSlugs = new Set(slugs);

      expect(uniqueSlugs.size).toBe(slugs.length);
    });

    test('should generate valid URLs for all restaurants', () => {
      const urls = restaurants.map(r => {
        const slug = getRestaurantSlug(r.name);
        return `/restaurants/${slug}`;
      });

      urls.forEach((url, index) => {
        // URL should start with /restaurants/
        expect(url).toMatch(/^\/restaurants\//);

        // URL should not end with a dash
        expect(url).not.toMatch(/-$/);

        // Print problematic URLs for debugging
        if (url.endsWith('-') || url.includes('--') || url.match(/-\//)) {
          console.error(`Invalid URL for ${restaurants[index].name}: ${url}`);
        }
      });
    });

    test('specific edge case: AMICCI\'S, INC.', () => {
      const restaurant = restaurants.find(r => r.name === "AMICCI'S, INC.");
      if (restaurant) {
        const slug = getRestaurantSlug(restaurant.name);
        expect(slug).toBe('amicci-s-inc');
        expect(slug).not.toMatch(/-$/);
      }
    });
  });

  describe('URL Path Generation', () => {
    test('generated paths match sitemap format', () => {
      restaurants.forEach((restaurant) => {
        const slug = getRestaurantSlug(restaurant.name);
        const url = `https://safeeats.io/restaurants/${slug}`;

        // Should be valid URL format
        expect(url).toMatch(/^https:\/\/safeeats\.io\/restaurants\/[a-z0-9-]+$/);

        // Should not have trailing dash before end
        expect(url).not.toMatch(/-$/);
      });
    });
  });
});
