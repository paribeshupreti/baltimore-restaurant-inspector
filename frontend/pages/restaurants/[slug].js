import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, MapPin, Calendar, X, Star, Share2, Home, ArrowLeft, Mail, Send } from 'lucide-react';
import fs from 'fs';
import path from 'path';

// Helper functions
const getStarLabel = (stars) => {
  const labels = {
    5: "Perfect",
    4: "Excellent",
    3: "Good",
    2: "Fair",
    1: "Poor"
  };
  return labels[stars] || "Unknown";
};

const getStarColor = (stars) => {
  if (stars === 5) return {
    fill: "text-emerald-500",
    bg: "bg-emerald-500",
    lightBg: "bg-emerald-50",
    border: "border-emerald-300",
    darkBg: "bg-emerald-900/30",
    darkBorder: "border-emerald-700",
    text: "text-emerald-700"
  };
  if (stars === 4) return {
    fill: "text-green-500",
    bg: "bg-green-500",
    lightBg: "bg-green-50",
    border: "border-green-300",
    darkBg: "bg-green-900/30",
    darkBorder: "border-green-700",
    text: "text-green-700"
  };
  if (stars === 3) return {
    fill: "text-yellow-500",
    bg: "bg-yellow-500",
    lightBg: "bg-yellow-50",
    border: "border-yellow-300",
    darkBg: "bg-yellow-900/30",
    darkBorder: "border-yellow-700",
    text: "text-yellow-700"
  };
  if (stars === 2) return {
    fill: "text-orange-500",
    bg: "bg-orange-500",
    lightBg: "bg-orange-50",
    border: "border-orange-300",
    darkBg: "bg-orange-900/30",
    darkBorder: "border-orange-700",
    text: "text-orange-700"
  };
  return {
    fill: "text-red-500",
    bg: "bg-red-500",
    lightBg: "bg-red-50",
    border: "border-red-300",
    darkBg: "bg-red-900/30",
    darkBorder: "border-red-700",
    text: "text-red-700"
  };
};

// Star display component
const StarDisplay = ({ stars, size = "md" }) => {
  const sizes = {
    xs: "w-3 h-3",
    sm: "w-4 h-4",
    md: "w-5 h-5 sm:w-5 sm:h-5",
    lg: "w-7 h-7 sm:w-6 sm:h-6",
    xl: "w-9 h-9 sm:w-8 sm:h-8"
  };

  const sizeClass = sizes[size];
  const color = getStarColor(stars);

  return (
    <div className="flex items-center gap-0.5 sm:gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sizeClass} ${star <= stars ? `${color.fill} fill-current` : 'text-slate-300'}`}
        />
      ))}
    </div>
  );
};

export default function RestaurantPage({ restaurant, darkMode, setDarkMode }) {
  const router = useRouter();
  const [showShareToast, setShowShareToast] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [contactLoading, setContactLoading] = useState(false);
  const [contactError, setContactError] = useState('');
  const [contactSuccess, setContactSuccess] = useState(false);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (showContactModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showContactModal]);

  if (router.isFallback) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-slate-300 border-t-slate-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Restaurant Not Found</h1>
          <a href="/" className="text-emerald-600 hover:underline">Return to Home</a>
        </div>
      </div>
    );
  }

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 3000);
    });
  };

  const handleContactSubmit = async () => {
    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      setContactError('Please fill in all fields');
      return;
    }

    setContactLoading(true);
    setContactError('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...contactForm,
          message: `[Restaurant: ${restaurant.name}]\n\n${contactForm.message}`
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      setContactSuccess(true);
      setContactForm({ name: '', email: '', message: '' });
    } catch (error) {
      setContactError(error.message || 'Failed to send message. Please try again.');
    } finally {
      setContactLoading(false);
    }
  };

  const colors = getStarColor(restaurant.starRating);

  // Theme
  const t = {
    bg: darkMode ? 'bg-slate-900' : 'bg-slate-50',
    card: darkMode ? 'bg-slate-800' : 'bg-white',
    text: darkMode ? 'text-slate-100' : 'text-slate-900',
    muted: darkMode ? 'text-slate-400' : 'text-slate-600',
    border: darkMode ? 'border-slate-700' : 'border-slate-300',
    borderLight: darkMode ? 'border-slate-800' : 'border-slate-200',
    input: darkMode ? 'bg-slate-700 text-slate-100 border-slate-600' : 'bg-white text-slate-900 border-slate-300',
  };
  const violationCount = restaurant.violations.length;

  // Generate structured data for SEO (JSON-LD)
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": restaurant.name,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": restaurant.address,
      "addressLocality": "Baltimore",
      "addressRegion": "MD",
      "postalCode": restaurant.zipcode,
      "addressCountry": "US"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": restaurant.starRating,
      "bestRating": "5",
      "worstRating": "1",
      "reviewCount": "1"
    }
  };

  const pageTitle = `${restaurant.name} - Health Inspection ${restaurant.starRating} Stars | Baltimore`;
  const pageDescription = violationCount === 0
    ? `${restaurant.name} has a perfect 5-star health inspection rating with zero violations. View the latest Baltimore Health Department inspection report.`
    : `${restaurant.name} has a ${restaurant.starRating}-star health inspection rating with ${violationCount} violation${violationCount > 1 ? 's' : ''}. View the latest Baltimore Health Department inspection report.`;

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="keywords" content={`${restaurant.name}, Baltimore restaurant, health inspection, food safety, ${restaurant.neighborhood}`} />

        {/* Open Graph */}
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="restaurant" />
        <meta property="og:url" content={`https://yourdomain.com/restaurants/${restaurant.slug}`} />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />

        <link rel="canonical" content={`https://yourdomain.com/restaurants/${restaurant.slug}`} />

        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </Head>

      <div className={`min-h-screen ${t.bg}`}>
        {/* Navigation */}
        <div className={`${t.card} border-b ${t.border} sticky top-0 z-40 shadow-sm`}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => router.back()}
                className={`flex items-center gap-2 ${t.muted} hover:${t.text} transition`}
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Back</span>
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowContactModal(true)}
                  className={`flex items-center gap-2 px-4 py-2 ${darkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-100 hover:bg-slate-200'} rounded-lg transition`}
                >
                  <Mail className="w-4 h-4" />
                  <span className="hidden sm:inline">Report Issue</span>
                </button>
                <button
                  onClick={handleShare}
                  className={`flex items-center gap-2 px-4 py-2 ${darkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-100 hover:bg-slate-200'} rounded-lg transition`}
                >
                  <Share2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Share</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Restaurant Header */}
        <div className={`${darkMode ? colors.darkBg : colors.lightBg} border-b-4 ${darkMode ? colors.darkBorder : colors.border}`}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <StarDisplay stars={restaurant.starRating} size="xl" />
              </div>
              <div className={`text-4xl sm:text-5xl font-bold mb-2 ${t.text}`}>{restaurant.starRating} Stars</div>
              <div className={`text-lg sm:text-xl font-medium ${colors.text} mb-6`}>
                {getStarLabel(restaurant.starRating)} Safety Rating
              </div>
              <h1 className={`text-3xl sm:text-4xl font-bold mb-3 ${t.text}`}>{restaurant.name}</h1>
              <p className={`${t.muted} text-lg mb-4`}>{restaurant.address}</p>
              <div className={`flex flex-wrap items-center justify-center gap-4 ${t.muted}`}>
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {restaurant.neighborhood}
                </span>
                <span>•</span>
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Inspected {new Date(restaurant.lastInspection).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Violations Section */}
          {restaurant.violations.length > 0 ? (
            <div className="mb-12">
              <h2 className={`text-2xl font-bold mb-6 flex items-center gap-3 ${t.text}`}>
                <AlertTriangle className="w-6 h-6 text-red-600" />
                {restaurant.violations.length} Violation{restaurant.violations.length > 1 ? 's' : ''} Found
              </h2>
              <div className="space-y-4">
                {restaurant.violations.map((v, i) => {
                  const bullets = v.summary_bullets || [typeof v === 'string' ? v : v.description];
                  const severity = typeof v === 'object' ? v.severity : null;
                  const showSeverityBadge = severity && !severity.includes('UNKNOWN');

                  return (
                    <div
                      key={i}
                      className={`${darkMode ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'} border rounded-lg p-4 sm:p-6`}
                    >
                      {showSeverityBadge && (
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3 ${
                          severity === 'SEVERE' ? 'bg-red-600 text-white' :
                          severity === 'MAJOR' ? 'bg-orange-600 text-white' :
                          severity === 'MODERATE' ? 'bg-yellow-600 text-white' :
                          severity === 'MINOR' ? 'bg-blue-600 text-white' :
                          'bg-gray-600 text-white'
                        }`}>
                          {severity}
                        </span>
                      )}
                      <ul className={`list-disc list-inside space-y-2 text-sm sm:text-base ${darkMode ? 'text-red-200' : 'text-red-800'}`}>
                        {bullets.map((bullet, idx) => (
                          <li key={idx} className="leading-relaxed">{bullet}</li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className={`${darkMode ? 'bg-emerald-900/20 border-emerald-800' : 'bg-emerald-50 border-emerald-200'} border rounded-xl p-8 sm:p-12 text-center mb-12`}>
              <CheckCircle className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-emerald-600 mb-3">Perfect Inspection!</h2>
              <p className={`${darkMode ? 'text-emerald-300' : 'text-emerald-700'} text-lg`}>
                Zero violations found during the most recent health inspection.
              </p>
            </div>
          )}

          {/* Info Box */}
          <div className={`${darkMode ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'} border rounded-lg p-6 mb-8`}>
            <h3 className={`font-bold text-lg mb-3 ${t.text}`}>About This Rating</h3>
            <p className={`${t.muted} mb-3`}>
              This {restaurant.starRating}-star rating is calculated based on health inspection data from the Baltimore City Health Department.
            </p>
            <p className={`text-sm ${t.muted}`}>
              Ratings are based on the number of violations found during official inspections. This is a community tool and not an official government rating.
            </p>
          </div>

          {/* CTA */}
          <div className="text-center">
            <a
              href="/"
              className={`inline-flex items-center gap-2 ${darkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-900 hover:bg-slate-800'} text-white px-8 py-3 rounded-lg font-semibold transition`}
            >
              <Home className="w-5 h-5" />
              View All Baltimore Restaurants
            </a>
          </div>
        </div>

        {/* Contact Modal */}
        {showContactModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50" onClick={() => { setShowContactModal(false); setContactSuccess(false); setContactError(''); }}>
            <div className={`${t.card} border-2 ${t.border} rounded-2xl max-w-md w-full shadow-2xl overflow-hidden`} onClick={(e) => e.stopPropagation()}>
              <div className={`${darkMode ? 'bg-slate-700' : 'bg-slate-100'} p-4 sm:p-6 flex items-center justify-between border-b ${t.border} rounded-t-2xl`}>
                <h2 className={`text-lg sm:text-xl font-bold ${t.text}`}>Report an Issue</h2>
                <button
                  onClick={() => { setShowContactModal(false); setContactSuccess(false); setContactError(''); }}
                  className={`p-2 rounded-lg ${darkMode ? 'hover:bg-slate-600' : 'hover:bg-slate-200'} transition`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 sm:p-6">
                {!contactSuccess ? (
                  <div className="space-y-4">
                    <p className={`text-sm ${t.muted}`}>
                      Report inaccuracies or issues with <strong>{restaurant.name}</strong>
                    </p>
                    {contactError && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                        {contactError}
                      </div>
                    )}
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${t.text}`}>Name</label>
                      <input
                        type="text"
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        placeholder="Your name"
                        disabled={contactLoading}
                        className={`w-full px-4 py-3 ${t.input} border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 transition ${contactLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${t.text}`}>Email</label>
                      <input
                        type="email"
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        placeholder="your.email@example.com"
                        disabled={contactLoading}
                        className={`w-full px-4 py-3 ${t.input} border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 transition ${contactLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${t.text}`}>Message</label>
                      <textarea
                        value={contactForm.message}
                        onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                        placeholder="Describe the issue..."
                        rows={4}
                        disabled={contactLoading}
                        className={`w-full px-4 py-3 ${t.input} border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 transition resize-none ${contactLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      />
                    </div>
                    <button
                      onClick={handleContactSubmit}
                      disabled={contactLoading}
                      className={`w-full ${darkMode ? 'bg-slate-600 hover:bg-slate-500' : 'bg-slate-900 hover:bg-slate-800'} text-white py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${contactLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {contactLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Send Message
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">Message Sent</h3>
                    <p className={t.muted}>Thank you for your feedback!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Share Toast */}
        {showShareToast && (
          <div className="fixed bottom-8 right-8 z-50">
            <div className={`${darkMode ? 'bg-slate-700' : 'bg-slate-800'} text-white px-6 py-3 rounded-lg shadow-2xl flex items-center gap-3`}>
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <span className="font-medium">Link copied to clipboard!</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// Generate static paths for all restaurants
export async function getStaticPaths() {
  const filePath = path.join(process.cwd(), 'public/data/baltimore_restaurants.json');
  const jsonData = fs.readFileSync(filePath, 'utf8');
  const restaurants = JSON.parse(jsonData);

  const paths = restaurants.map((restaurant) => ({
    params: {
      slug: restaurant.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    }
  }));

  return {
    paths,
    fallback: false
  };
}

// Fetch restaurant data for each page
export async function getStaticProps({ params }) {
  const filePath = path.join(process.cwd(), 'public/data/baltimore_restaurants.json');
  const jsonData = fs.readFileSync(filePath, 'utf8');
  const restaurants = JSON.parse(jsonData);

  const restaurant = restaurants.find(
    (r) => r.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') === params.slug
  );

  if (!restaurant) {
    return {
      notFound: true
    };
  }

  // Add slug to restaurant object
  const restaurantWithSlug = {
    ...restaurant,
    slug: params.slug,
    starRating: restaurant.star_rating,
    lastInspection: restaurant.last_inspection,
    neighborhood: restaurant.zipcode ? getNeighborhood(restaurant.zipcode) : 'Baltimore'
  };

  return {
    props: {
      restaurant: restaurantWithSlug
    }
  };
}

// Helper to get neighborhood from zipcode
function getNeighborhood(zipcode) {
  const neighborhoods = {
    '21201': 'Downtown', '21202': 'Inner Harbor', '21205': 'East Baltimore',
    '21206': 'Northeast', '21209': 'Mt. Washington', '21210': 'Hampden',
    '21211': 'Remington', '21212': 'Govans', '21213': 'Clifton Park',
    '21214': 'Hamilton', '21215': 'Park Heights', '21216': 'Mondawmin',
    '21217': 'Druid Heights', '21218': 'Charles Village', '21223': 'Pigtown',
    '21224': 'Canton', '21225': 'Brooklyn', '21226': 'Curtis Bay',
    '21227': 'Halethorpe', '21229': 'Westgate', '21230': 'Federal Hill',
    '21231': 'Fells Point', '21234': 'Parkville', '21236': 'Dundalk'
  };
  return neighborhoods[zipcode] || 'Baltimore';
}
