const fs = require('fs');
const path = require('path');

// Read restaurant data
const dataPath = path.join(__dirname, '../public/data/baltimore_restaurants.json');
const restaurants = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Generate slugs for each restaurant
const restaurantUrls = restaurants.map((restaurant) => {
  const slug = restaurant.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return `  <url>
    <loc>https://yourdomain.com/restaurants/${slug}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
}).join('\n');

// Generate sitemap XML
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://yourdomain.com/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
${restaurantUrls}
</urlset>`;

// Write sitemap to public folder
const outputPath = path.join(__dirname, '../public/sitemap.xml');
fs.writeFileSync(outputPath, sitemap);

console.log(`✅ Sitemap generated successfully with ${restaurants.length + 1} URLs`);
console.log(`   Location: ${outputPath}`);
