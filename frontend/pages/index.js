import Head from 'next/head';
import Link from 'next/link';
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Search, MapPin, Calendar, Clock, X, Award, Filter, ChevronDown, Sun, Moon, Mail, Info, Send, ExternalLink, TrendingDown, TrendingUp, Share2, Bell, Star } from 'lucide-react';

// Helper function to map zipcode to neighborhood
const zipcodeToNeighborhood = (zipcode) => {
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
};

// Helper to guess cuisine from restaurant name
const guessCuisine = (name) => {
  const nameLower = name.toLowerCase();
  if (nameLower.includes('seafood') || nameLower.includes('oyster') || nameLower.includes('crab')) return 'Seafood';
  if (nameLower.includes('sushi') || nameLower.includes('asian')) return 'Japanese';
  if (nameLower.includes('italian') || nameLower.includes('pasta') || nameLower.includes('pizza')) return 'Italian';
  if (nameLower.includes('chinese')) return 'Chinese';
  if (nameLower.includes('mexican') || nameLower.includes('taco')) return 'Mexican';
  if (nameLower.includes('cafe') || nameLower.includes('diner') || nameLower.includes('breakfast')) return 'American';
  if (nameLower.includes('thai')) return 'Thai';
  if (nameLower.includes('burger')) return 'American';
  if (nameLower.includes('grill')) return 'American';
  return 'Unknown';
};

// Generate URL slug from restaurant name
const getRestaurantSlug = (name) => {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
};

// Count violations by severity (don't count UNKNOWN severities in badges)
const getViolationSeverityCounts = (violations) => {
  const counts = { SEVERE: 0, MAJOR: 0, MODERATE: 0, MINOR: 0 };
  violations.forEach(v => {
    if (typeof v === 'object' && v.severity) {
      // Only count known severities for badges
      if (v.severity === 'SEVERE' || v.severity === 'MAJOR' ||
          v.severity === 'MODERATE' || v.severity === 'MINOR') {
        counts[v.severity] = (counts[v.severity] || 0) + 1;
      }
    }
  });
  return counts;
};

// Transform scraped data to UI format
const transformRestaurantData = (restaurants) => {
  return restaurants.map(r => ({
    id: r.id,
    name: r.name || 'Unknown Restaurant',
    address: r.address || 'Address not available',
    starRating: r.star_rating || getStarRating(r.violations?.length || 0), // Use from JSON, fallback to calculation
    lastInspection: r.last_inspection || 'N/A',
    violations: r.violations || [], // Keep full violation objects with severity
    cuisine: guessCuisine(r.name || ''),
    trend: 'stable',
    neighborhood: zipcodeToNeighborhood(r.zipcode) || 'Baltimore',
    critical: r.star_rating ? r.star_rating <= 2 : false, // 2 stars or below is critical
    zipcode: r.zipcode || 'Unknown'
  }));
};

// Convert violation count to star rating
const getStarRating = (violationCount) => {
  if (violationCount === 0) return 5;
  if (violationCount <= 2) return 4;
  if (violationCount <= 4) return 3;
  if (violationCount <= 7) return 2;
  return 1;
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
const StarDisplay = ({ stars, size = "md", showEmpty = true }) => {
  const sizes = {
    xs: "w-3 h-3",
    sm: "w-4 h-4",
    md: "w-5 h-5 sm:w-5 sm:h-5", // Slightly bigger on mobile
    lg: "w-7 h-7 sm:w-6 sm:h-6", // Bigger on mobile
    xl: "w-9 h-9 sm:w-8 sm:h-8"  // Bigger on mobile
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

export default function Home({ darkMode, setDarkMode }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredId, setHoveredId] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);
  const [contactError, setContactError] = useState('');
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [zipcodeSearch, setZipcodeSearch] = useState('');
  const [showShareToast, setShowShareToast] = useState(false);
  const [showAlertsModal, setShowAlertsModal] = useState(false);
  const [displayCount, setDisplayCount] = useState(5);
  const [requestLoading, setRequestLoading] = useState(false);
  const [showRequestToast, setShowRequestToast] = useState(false);
  const [showRequestConfirm, setShowRequestConfirm] = useState(false);
  const [pendingRequest, setPendingRequest] = useState('');
  const searchRef = useRef(null);

  // Load restaurant data from JSON file
  useEffect(() => {
    fetch('/data/baltimore_restaurants.json')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load restaurant data');
        return res.json();
      })
      .then(data => {
        const transformed = transformRestaurantData(data);
        setRestaurants(transformed);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading restaurants:', err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset displayCount when filters change
  useEffect(() => {
    setDisplayCount(5);
  }, [activeFilter, zipcodeSearch]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (showAlertsModal || showAboutModal || showContactModal || showRequestConfirm) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showAlertsModal, showAboutModal, showContactModal, showRequestConfirm]);

  const searchResults = useMemo(() => {
    if (!searchTerm.trim() || searchTerm.length < 2 || restaurants.length === 0) return [];

    const term = searchTerm.toLowerCase().trim();
    const isZipcode = /^\d+$/.test(term); // Check if user typed only numbers

    return restaurants.filter(r => {
      if (isZipcode) {
        // If user typed numbers, search by zipcode
        return r.zipcode.includes(term);
      } else {
        // If user typed text, search by name, cuisine, or neighborhood
        return r.name.toLowerCase().includes(term) ||
               r.cuisine.toLowerCase().includes(term) ||
               r.neighborhood.toLowerCase().includes(term);
      }
    }).slice(0, 5);
  }, [searchTerm, restaurants]);

  // Track restaurant searches for analytics
  useEffect(() => {
    if (searchTerm.trim() && searchTerm.length >= 2) {
      const timer = setTimeout(() => {
        if (window.umami) {
          window.umami.track('restaurant-search', {
            query: searchTerm.trim(),
            found: searchResults.length > 0,
            result_count: searchResults.length,
            search_type: /^\d+$/.test(searchTerm.trim()) ? 'zipcode' : 'name'
          });
        }
      }, 1000); // Wait 1 second after user stops typing

      return () => clearTimeout(timer);
    }
  }, [searchTerm, searchResults]);

  // Track filter usage
  useEffect(() => {
    if (activeFilter !== 'all' && window.umami) {
      window.umami.track('filter-applied', {
        filter_type: activeFilter
      });
    }
  }, [activeFilter]);

  const filteredRestaurants = useMemo(() => {
    if (restaurants.length === 0) return [];
    let filtered = [...restaurants];

    if (zipcodeSearch.trim()) {
      filtered = filtered.filter(r => r.zipcode.includes(zipcodeSearch.trim()));
    }

    if (activeFilter === '5-stars') filtered = filtered.filter(r => r.starRating === 5);
    if (activeFilter === '4-plus') filtered = filtered.filter(r => r.starRating >= 4);
    if (activeFilter === 'needs-attention') filtered = filtered.filter(r => r.starRating <= 2);
    if (activeFilter === 'recent') filtered = filtered.sort((a, b) => new Date(b.lastInspection) - new Date(a.lastInspection));
    if (activeFilter === 'all') filtered = filtered.sort((a, b) => b.starRating - a.starRating);

    return filtered;
  }, [activeFilter, restaurants, zipcodeSearch]);

  const handleShare = (restaurant) => {
    const url = `${window.location.origin}/restaurants/${encodeURIComponent(restaurant.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'))}`;
    navigator.clipboard.writeText(url).then(() => {
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 3000);
    });
  };

  const lowestRated = restaurants.length > 0 ? restaurants.reduce((a, b) =>
    a.starRating < b.starRating ? a : b
  ) : null;
  const highestRated = restaurants.length > 0 ? restaurants.reduce((a, b) =>
    a.starRating > b.starRating ? a : b
  ) : null;

  // Get most recent inspection date from data
  const lastDataUpdate = useMemo(() => {
    if (restaurants.length === 0) return 'Recently';

    const mostRecentDate = restaurants.reduce((latest, r) => {
      const inspectionDate = new Date(r.lastInspection);
      return inspectionDate > latest ? inspectionDate : latest;
    }, new Date(0));

    return mostRecentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }, [restaurants]);

  const filters = [
    { id: 'all', label: 'All Restaurants', icon: Filter },
    { id: '5-stars', label: '5 Star Rated', icon: Award },
    { id: '4-plus', label: '4+ Star Rated', icon: Star },
    { id: 'needs-attention', label: 'Needs Attention', icon: AlertTriangle },
    { id: 'recent', label: 'Recent Inspections', icon: Clock }
  ];

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
        body: JSON.stringify(contactForm),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      setContactSubmitted(true);
      setTimeout(() => {
        setShowContactModal(false);
        setContactSubmitted(false);
        setContactForm({ name: '', email: '', message: '' });
        setContactError('');
      }, 2500);
    } catch (error) {
      console.error('Error sending contact form:', error);
      setContactError(error.message || 'Failed to send message. Please try again.');
    } finally {
      setContactLoading(false);
    }
  };

  const handleRestaurantRequest = () => {
    // Store the search term and show confirmation modal
    setPendingRequest(searchTerm.trim());
    setShowRequestConfirm(true);
  };

  const confirmRestaurantRequest = async () => {
    if (requestLoading) return; // Prevent duplicate clicks

    setRequestLoading(true);
    setShowRequestConfirm(false);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Anonymous User',
          email: 'noreply@safeeats.io',
          message: `Restaurant Request: "${pendingRequest}"\n\nA user searched for this restaurant but couldn't find it in the database.`
        }),
      });

      if (!response.ok) throw new Error('Failed to send request');

      // Track with Umami
      if (window.umami) {
        window.umami.track('restaurant-request-submitted', {
          query: pendingRequest,
          search_type: /^\d+$/.test(pendingRequest) ? 'zipcode' : 'name'
        });
      }

      // Show success toast
      setShowRequestToast(true);
      setTimeout(() => setShowRequestToast(false), 3000);

      // Close dropdown and clear search
      setShowDropdown(false);
      setSearchTerm('');
      setPendingRequest('');
    } catch (error) {
      console.error('Error submitting request:', error);
      alert('Failed to submit request. Please try again.');
    } finally {
      setRequestLoading(false);
    }
  };

  const t = {
    bg: darkMode ? 'bg-slate-900' : 'bg-slate-50',
    text: darkMode ? 'text-slate-50' : 'text-slate-900',
    muted: darkMode ? 'text-slate-400' : 'text-slate-600',
    subtle: darkMode ? 'text-slate-500' : 'text-slate-500',
    faint: darkMode ? 'text-slate-600' : 'text-slate-400',
    border: darkMode ? 'border-slate-700' : 'border-slate-300',
    borderLight: darkMode ? 'border-slate-600' : 'border-slate-200',
    card: darkMode ? 'bg-slate-800' : 'bg-white',
    cardHover: darkMode ? 'hover:border-slate-500' : 'hover:border-slate-400',
    input: darkMode ? 'bg-slate-800 border-slate-600 text-slate-50' : 'bg-white border-slate-300 text-slate-900',
    dropdown: darkMode ? 'bg-slate-800 border-slate-600' : 'bg-white border-slate-300 shadow-xl',
    adBg: darkMode ? 'bg-slate-700/50' : 'bg-slate-100',
  };

  if (loading) {
    return (
      <>
        <Head>
          <title>Baltimore Restaurant Health Inspections | Safety Ratings</title>
          <meta name="description" content="Check health inspection ratings for Baltimore restaurants. Safety scores based on official Baltimore City Health Department data." />
        </Head>
        <div className={`min-h-screen ${t.bg} ${t.text} flex items-center justify-center`}>
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-slate-300 border-t-slate-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-lg font-medium">Loading inspection data...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>SafeEats Baltimore | Restaurant Health Inspection Ratings</title>
        <meta name="description" content="Check health inspection ratings for Baltimore restaurants. Real-time safety scores based on official Baltimore City Health Department data. Find safe dining options near you." />
        <meta name="keywords" content="Baltimore restaurants, health inspections, food safety, restaurant ratings, Baltimore dining, safe restaurants, SafeEats" />

        {/* Open Graph */}
        <meta property="og:title" content="SafeEats Baltimore | Restaurant Health Inspections" />
        <meta property="og:description" content="Check health inspection ratings for Baltimore restaurants based on official city data. Find safe dining options near you." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://safeeats.io" />
        <meta property="og:site_name" content="SafeEats" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="SafeEats Baltimore | Restaurant Health Inspections" />
        <meta name="twitter:description" content="Check health inspection ratings for Baltimore restaurants based on official city data." />

        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="https://safeeats.io" />
      </Head>

      <div className={`min-h-screen ${t.bg} ${t.text}`}>
        {/* Nav */}
        <div className={`${t.card} border-b ${t.border} sticky top-0 z-40 shadow-sm`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 ${darkMode ? 'bg-slate-700' : 'bg-slate-900'} rounded-lg flex items-center justify-center`}>
                <Star className={`w-5 h-5 text-emerald-400 fill-current`} />
              </div>
              <div>
                <h1 className="font-semibold text-base sm:text-lg">SafeEats Baltimore</h1>
                <p className={`text-xs ${t.faint} hidden sm:block`}>Restaurant Health Inspections</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAboutModal(true)}
                className={`p-2 rounded-lg transition ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}
              >
                <Info className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowContactModal(true)}
                className={`p-2 rounded-lg transition ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}
              >
                <Mail className="w-5 h-5" />
              </button>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-lg transition ${darkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-100 hover:bg-slate-200'}`}
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Hero */}
        <div className={`border-b ${t.border}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-2xl sm:text-3xl lg:text-5xl font-bold mb-3 sm:mb-4 tracking-tight leading-tight">
                Is that restaurant <span className="text-emerald-600">safe</span> to eat at?
              </h2>
              <p className={`text-sm sm:text-base lg:text-lg ${t.muted} mb-6 sm:mb-8 max-w-2xl mx-auto px-2`}>
                Safety ratings based on official Baltimore City Health Department inspections.
              </p>

              {/* Search - Larger touch target on mobile */}
              <div className="relative max-w-2xl mx-auto mb-4 sm:mb-6" ref={searchRef}>
                <Search className={`absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 ${t.subtle} w-4 h-4 sm:w-5 sm:h-5 z-10`} />
                <input
                  type="text"
                  placeholder="Search by restaurant name or zip code"
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setShowDropdown(true); }}
                  onFocus={() => setShowDropdown(true)}
                  className={`w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 ${t.input} border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 transition text-base`}
                />
                {showDropdown && searchTerm.length >= 2 && (
                  <div className={`absolute top-full left-0 right-0 mt-2 ${t.dropdown} border-2 rounded-xl overflow-hidden z-50 max-h-[70vh] overflow-y-auto`}>
                    {searchResults.length > 0 ? searchResults.map((r) => {
                      const stars = r.starRating;
                      return (
                        <Link
                          key={r.id}
                          href={`/restaurants/${getRestaurantSlug(r.name)}`}
                          onClick={() => {
                            setShowDropdown(false);
                            setSearchTerm('');
                            if (window.umami) {
                              window.umami.track('restaurant-click', {
                                restaurant_name: r.name,
                                star_rating: r.starRating,
                                violation_count: r.violations.length,
                                source: 'search'
                              });
                            }
                          }}
                          className={`flex items-center gap-3 sm:gap-4 p-4 sm:p-4 ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-50'} cursor-pointer border-b ${t.borderLight} last:border-b-0 transition active:scale-98`}
                        >
                          <div className="flex flex-col items-center flex-shrink-0">
                            <StarDisplay stars={stars} size="md" />
                            <span className={`text-xs ${t.faint} mt-1`}>{stars} stars</span>
                          </div>
                          <div className="flex-1 text-left min-w-0">
                            <p className="font-semibold text-sm sm:text-base truncate">{r.name}</p>
                            <p className={`text-xs sm:text-sm ${t.subtle} truncate`}>
                              {r.cuisine !== 'Unknown' ? `${r.cuisine} • ` : ''}{r.neighborhood}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className={`text-xs ${t.muted} whitespace-nowrap`}>{r.violations.length} violation{r.violations.length !== 1 ? 's' : ''}</div>
                          </div>
                        </Link>
                      );
                    }) : (
                      <div className="p-6 text-center">
                        <p className={t.muted}>No restaurants found for "{searchTerm}"</p>
                        <p className={`${t.faint} text-sm mt-2 mb-4`}>Try searching by restaurant name or zip code</p>

                        <button
                          onClick={handleRestaurantRequest}
                          className={`mt-2 flex items-center justify-center gap-2 mx-auto px-4 py-2.5 ${
                            darkMode ? 'bg-emerald-700 hover:bg-emerald-600' : 'bg-emerald-600 hover:bg-emerald-700'
                          } text-white rounded-lg font-medium transition text-sm`}
                        >
                          <Send className="w-4 h-4" />
                          Request to add this
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Data attribution */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-2 text-sm">
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 ${darkMode ? 'bg-emerald-500' : 'bg-emerald-600'} rounded-full flex-shrink-0 self-center`}></div>
                  <span className={`${t.muted} whitespace-nowrap`}>Data updated {lastDataUpdate}</span>
                </div>
                <span className={`${t.faint} hidden sm:inline`}>•</span>
                <a
                  href="https://health.baltimorecity.gov/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${t.subtle} hover:${t.text} transition flex items-center gap-1.5`}
                >
                  <span>Source: Baltimore Health Dept</span>
                  <ExternalLink className="w-3 h-3 flex-shrink-0 self-center" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">

          {/* Featured - Highest/Lowest */}
          {lowestRated && highestRated && (
            <div className="grid grid-cols-2 gap-3 sm:gap-6 mb-8">
              {/* Highest Rated */}
              <Link
                href={`/restaurants/${getRestaurantSlug(highestRated.name)}`}
                onClick={() => {
                  if (umami) {
                    umami.track('restaurant-click', {
                      restaurant_name: highestRated.name,
                      star_rating: highestRated.starRating,
                      violation_count: highestRated.violations.length,
                      source: 'featured-highest'
                    });
                  }
                }}
                className={`${t.card} border-2 ${getStarColor(highestRated.starRating).border} rounded-xl p-3 sm:p-6 cursor-pointer transition ${t.cardHover}`}
              >
                <div className="flex items-start justify-between mb-2 sm:mb-4">
                  <div className="flex items-center gap-1 sm:gap-2 text-emerald-600">
                    <TrendingUp className="w-3.5 h-3.5 sm:w-5 sm:h-5 flex-shrink-0" />
                    <span className="text-[10px] sm:text-sm font-semibold uppercase tracking-tight sm:tracking-wide leading-tight">Highest Rated</span>
                  </div>
                </div>
                <h3 className="text-sm sm:text-xl font-bold mb-1 sm:mb-2 line-clamp-2">{highestRated.name}</h3>
                <p className={`text-xs sm:text-sm ${t.muted} mb-2 sm:mb-4 line-clamp-1`}>
                  {highestRated.cuisine !== 'Unknown' ? `${highestRated.cuisine} • ` : ''}{highestRated.neighborhood}
                </p>
                <div className="flex items-center gap-1 sm:gap-3 mb-2 sm:mb-3 overflow-hidden">
                  <StarDisplay stars={highestRated.starRating} size="sm" />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                  <span className="text-base sm:text-2xl font-bold">{highestRated.starRating} Stars</span>
                  <div className={`text-xs sm:text-sm ${t.muted}`}>
                    {highestRated.violations.length === 0 ? '✓ Zero violations' : `${highestRated.violations.length} violation${highestRated.violations.length > 1 ? 's' : ''}`}
                  </div>
                </div>
              </Link>

              {/* Lowest Rated */}
              <Link
                href={`/restaurants/${getRestaurantSlug(lowestRated.name)}`}
                onClick={() => {
                  if (umami) {
                    umami.track('restaurant-click', {
                      restaurant_name: lowestRated.name,
                      star_rating: lowestRated.starRating,
                      violation_count: lowestRated.violations.length,
                      source: 'featured-lowest'
                    });
                  }
                }}
                className={`${t.card} border-2 ${getStarColor(lowestRated.starRating).border} rounded-xl p-3 sm:p-6 cursor-pointer transition ${t.cardHover}`}
              >
                <div className="flex items-start justify-between mb-2 sm:mb-4">
                  <div className="flex items-center gap-1 sm:gap-2 text-red-600">
                    <TrendingDown className="w-3.5 h-3.5 sm:w-5 sm:h-5 flex-shrink-0" />
                    <span className="text-[10px] sm:text-sm font-semibold uppercase tracking-tight sm:tracking-wide leading-tight">Needs Attention</span>
                  </div>
                </div>
                <h3 className="text-sm sm:text-xl font-bold mb-1 sm:mb-2 line-clamp-2">{lowestRated.name}</h3>
                <p className={`text-xs sm:text-sm ${t.muted} mb-2 sm:mb-4 line-clamp-1`}>
                  {lowestRated.cuisine !== 'Unknown' ? `${lowestRated.cuisine} • ` : ''}{lowestRated.neighborhood}
                </p>
                <div className="flex items-center gap-1 sm:gap-3 mb-2 sm:mb-3 overflow-hidden">
                  <StarDisplay stars={lowestRated.starRating} size="sm" />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                  <span className="text-base sm:text-2xl font-bold">{lowestRated.starRating} Star{lowestRated.starRating !== 1 ? 's' : ''}</span>
                  <div className={`text-xs sm:text-sm ${t.muted}`}>
                    {lowestRated.violations.length} violation{lowestRated.violations.length > 1 ? 's' : ''} found
                  </div>
                </div>
              </Link>
            </div>
          )}

          {/* Ad Space 1 */}
          <div className="mb-8">
            <div className={`${t.adBg} rounded-lg flex items-center justify-center`} style={{ height: '90px' }}>
              <span className={`${t.faint} text-xs`}>Ad</span>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <h2 className={`text-base sm:text-lg font-semibold ${t.text}`}>
              {filters.find(f => f.id === activeFilter)?.label || 'All Restaurants'}
            </h2>
            <div className="flex items-center gap-2">
              {/* Zipcode Search - Compact */}
              <div className="relative flex-shrink-0">
                <MapPin className={`absolute left-2.5 top-1/2 -translate-y-1/2 ${t.subtle} w-3.5 h-3.5`} />
                <input
                  type="text"
                  placeholder="Zip code"
                  value={zipcodeSearch}
                  onChange={(e) => setZipcodeSearch(e.target.value)}
                  className={`w-28 sm:w-32 pl-8 pr-2 py-2 ${t.input} border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 transition text-sm`}
                />
                {zipcodeSearch && (
                  <button
                    onClick={() => setZipcodeSearch('')}
                    className={`absolute right-1 top-1/2 -translate-y-1/2 ${t.subtle} hover:${t.text} p-0.5`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Filter Dropdown - Compact */}
              <div className="relative flex-shrink-0">
                <button
                  onClick={() => setShowFilterMenu(!showFilterMenu)}
                  className={`flex items-center gap-1.5 ${t.card} border-2 ${t.border} rounded-lg px-3 py-2 text-sm font-medium transition ${t.cardHover}`}
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Filter</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFilterMenu ? 'rotate-180' : ''}`} />
                </button>
                {showFilterMenu && (
                  <div className={`absolute top-full left-0 sm:left-auto sm:right-0 mt-2 ${t.dropdown} border-2 rounded-xl overflow-hidden z-40 w-56 shadow-xl`}>
                    {filters.map((f) => {
                      const Icon = f.icon;
                      return (
                        <button
                          key={f.id}
                          onClick={() => { setActiveFilter(f.id); setShowFilterMenu(false); }}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-50'} ${activeFilter === f.id ? `font-semibold ${t.text}` : t.muted}`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{f.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Get Alerts Button - Compact */}
              <button
                onClick={() => setShowAlertsModal(true)}
                className={`flex items-center gap-1.5 ${t.card} border-2 ${t.border} rounded-lg px-3 py-2 text-sm font-medium transition ${t.cardHover} flex-shrink-0`}
              >
                <Bell className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Alerts</span>
              </button>
            </div>
          </div>

          {/* Restaurant List */}
          <div className="space-y-4">
            {filteredRestaurants.length === 0 ? (
              <div className={`${t.card} border-2 ${t.border} rounded-xl p-12 text-center`}>
                <Search className={`w-16 h-16 ${t.faint} mx-auto mb-4`} />
                <h3 className="text-xl font-semibold mb-2">No restaurants found</h3>
                <p className={t.muted}>
                  {zipcodeSearch
                    ? `No restaurants found in zipcode ${zipcodeSearch}. Try a different zipcode.`
                    : 'Try adjusting your filters or search criteria.'}
                </p>
                {zipcodeSearch && (
                  <button
                    onClick={() => setZipcodeSearch('')}
                    className={`mt-4 ${darkMode ? 'bg-slate-600 hover:bg-slate-500' : 'bg-slate-900 hover:bg-slate-800'} text-white px-6 py-2 rounded-lg font-medium transition`}
                  >
                    Clear zipcode filter
                  </button>
                )}
              </div>
            ) : (
              filteredRestaurants.slice(0, displayCount).map((r, i) => {
                const stars = r.starRating;
                const colors = getStarColor(stars);
                return (
                  <React.Fragment key={r.id}>
                    <div
                      onMouseEnter={() => setHoveredId(r.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      className={`${t.card} border-2 rounded-xl overflow-hidden transition-all ${
                        r.critical ? 'border-l-4 border-l-red-600' : ''
                      } ${hoveredId === r.id ? `${colors.border} shadow-lg` : t.border}`}
                    >
                      <div className="p-4 sm:p-5">
                        {/* Mobile: Stack everything vertically for clarity */}
                        <div className="space-y-3">
                          {/* Stars - Big and prominent on mobile */}
                          <Link
                            href={`/restaurants/${getRestaurantSlug(r.name)}`}
                            onClick={() => {
                              if (umami) {
                                umami.track('restaurant-click', {
                                  restaurant_name: r.name,
                                  star_rating: r.starRating,
                                  violation_count: r.violations.length,
                                  source: 'restaurant-list'
                                });
                              }
                            }}
                            className="cursor-pointer block"
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <StarDisplay stars={stars} size="lg" />
                              <span className={`text-sm sm:text-base font-semibold ${colors.text}`}>
                                {stars} Star{stars !== 1 ? 's' : ''}
                              </span>
                            </div>

                            {/* Restaurant Name - Larger on mobile */}
                            <h3 className="font-bold text-lg sm:text-xl mb-1">{r.name}</h3>
                            <p className={`text-sm ${t.muted}`}>
                              {r.cuisine !== 'Unknown' ? `${r.cuisine} • ` : ''}{r.neighborhood}
                            </p>
                          </Link>

                          {/* Violation Badge - Full width on mobile */}
                          <div className="flex flex-col gap-2">
                            <div className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs sm:text-sm font-medium ${
                              r.violations.length === 0
                                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                : colors.lightBg + ' ' + colors.text + ' border ' + colors.border
                            }`}>
                              {r.violations.length === 0 ? (
                                <>
                                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                                  Zero violations
                                </>
                              ) : (
                                <>
                                  <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4" />
                                  {r.violations.length} violation{r.violations.length > 1 ? 's' : ''}
                                </>
                              )}
                            </div>
                            {/* Severity Summary */}
                            {r.violations.length > 0 && (() => {
                              const severityCounts = getViolationSeverityCounts(r.violations);
                              const hasSeverities = severityCounts.SEVERE + severityCounts.MAJOR + severityCounts.MODERATE + severityCounts.MINOR > 0;
                              return hasSeverities ? (
                                <div className="flex flex-wrap gap-1.5">
                                  {severityCounts.SEVERE > 0 && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-600 text-white">
                                      {severityCounts.SEVERE} Severe
                                    </span>
                                  )}
                                  {severityCounts.MAJOR > 0 && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-orange-600 text-white">
                                      {severityCounts.MAJOR} Major
                                    </span>
                                  )}
                                  {severityCounts.MODERATE > 0 && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-yellow-600 text-white">
                                      {severityCounts.MODERATE} Moderate
                                    </span>
                                  )}
                                  {severityCounts.MINOR > 0 && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-600 text-white">
                                      {severityCounts.MINOR} Minor
                                    </span>
                                  )}
                                </div>
                              ) : null;
                            })()}
                          </div>

                          {/* Violation Preview - Hide on very small screens */}
                          {r.violations.length > 0 && (() => {
                            const firstViolation = r.violations[0];
                            const violationText = typeof firstViolation === 'string' ? firstViolation : firstViolation.description;
                            return (
                              <p className={`text-xs ${t.subtle} line-clamp-1 hidden xs:block`}>
                                {violationText.substring(0, 60)}{violationText.length > 60 ? '...' : ''}
                              </p>
                            );
                          })()}

                          {/* Actions Row - Better spacing on mobile */}
                          <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                            <div className={`text-xs ${t.faint} flex items-center gap-1`}>
                              <Calendar className="w-3 h-3" />
                              {new Date(r.lastInspection).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShare(r);
                              }}
                              className={`p-2 rounded-lg transition ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}
                              title="Share restaurant"
                            >
                              <Share2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* In-feed Ad */}
                    {i === 2 && (
                      <div className={`${t.adBg} rounded-lg flex items-center justify-center`} style={{ height: '120px' }}>
                        <span className={`${t.faint} text-xs`}>Ad</span>
                      </div>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </div>

          {/* Load More Button */}
          {filteredRestaurants.length > displayCount && (
            <div className="mt-6 text-center">
              <button
                onClick={() => setDisplayCount(prev => prev + 5)}
                className={`${darkMode ? 'bg-slate-600 hover:bg-slate-500' : 'bg-slate-900 hover:bg-slate-800'} text-white px-8 py-3 rounded-lg font-medium transition flex items-center gap-2 mx-auto`}
              >
                Load More
                <ChevronDown className="w-4 h-4" />
              </button>
              <p className={`${t.muted} text-sm mt-3`}>
                Showing {Math.min(displayCount, filteredRestaurants.length)} of {filteredRestaurants.length} restaurants
              </p>
            </div>
          )}

          {/* Ad Space 3 */}
          <div className="mt-12">
            <div className={`${t.adBg} rounded-lg flex items-center justify-center`} style={{ height: '90px' }}>
              <span className={`${t.faint} text-xs`}>Ad</span>
            </div>
          </div>

          {/* Stats - Moved to bottom */}
          <div className={`mt-12 sm:mt-16 pt-8 sm:pt-12 border-t ${t.border}`}>
            <h3 className={`text-xl sm:text-2xl font-bold mb-6 sm:mb-8 text-center ${t.text}`}>Baltimore Safety Overview</h3>
            <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-12">
              <div className="text-center p-3 sm:p-0">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1">{restaurants.length}</div>
                <div className={`text-xs sm:text-sm ${t.muted}`}>Total Restaurants</div>
              </div>
              <div className="text-center p-3 sm:p-0">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 text-emerald-600">{restaurants.filter(r => r.starRating === 5).length}</div>
                <div className={`text-xs sm:text-sm ${t.muted}`}>5-Star Rated</div>
              </div>
              <div className="text-center p-3 sm:p-0">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 text-green-600">{restaurants.filter(r => r.starRating >= 4).length}</div>
                <div className={`text-xs sm:text-sm ${t.muted}`}>4+ Star Rated</div>
              </div>
              <div className="text-center p-3 sm:p-0">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 text-amber-600">{restaurants.filter(r => r.violations.length === 0).length}</div>
                <div className={`text-xs sm:text-sm ${t.muted}`}>Zero Violations</div>
              </div>
            </div>

            {/* Star Distribution Chart */}
            <div className="mt-12">
              <h3 className={`text-lg font-semibold mb-6 text-center ${t.text}`}>Safety Rating Distribution</h3>
              <div className="max-w-3xl mx-auto space-y-3 sm:space-y-4">
                {[
                  { stars: 5, label: 'Perfect', count: restaurants.filter(r => r.starRating === 5).length },
                  { stars: 4, label: 'Excellent', count: restaurants.filter(r => r.starRating === 4).length },
                  { stars: 3, label: 'Good', count: restaurants.filter(r => r.starRating === 3).length },
                  { stars: 2, label: 'Fair', count: restaurants.filter(r => r.starRating === 2).length },
                  { stars: 1, label: 'Poor', count: restaurants.filter(r => r.starRating === 1).length }
                ].map((item) => {
                  const maxCount = Math.max(...[5,4,3,2,1].map(s =>
                    restaurants.filter(r => r.starRating === s).length
                  ));
                  const percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                  const colors = getStarColor(item.stars);

                  return (
                    <div key={item.stars} className="flex items-center gap-2 sm:gap-4">
                      {/* Mobile: Simplified star display */}
                      <div className="w-20 sm:w-32 flex items-center gap-1 sm:gap-2">
                        <StarDisplay stars={item.stars} size="xs" />
                        <span className={`text-xs sm:text-sm font-medium ${t.text}`}>{item.stars}</span>
                      </div>
                      <div className="flex-1">
                        <div className={`h-7 sm:h-8 ${darkMode ? 'bg-slate-700' : 'bg-slate-200'} rounded-lg overflow-hidden`}>
                          <div
                            className={`${colors.bg} h-full rounded-lg transition-all duration-500 flex items-center justify-end pr-2 sm:pr-3`}
                            style={{ width: `${percentage}%` }}
                          >
                            {item.count > 0 && (
                              <span className="text-white text-xs sm:text-sm font-semibold">{item.count}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      {/* Label hidden on mobile, shown on tablet+ */}
                      <div className={`w-16 sm:w-24 text-xs sm:text-sm ${t.muted} hidden sm:block`}>{item.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className={`mt-16 pt-8 border-t ${t.border} text-center space-y-4`}>
            <div className="flex items-center justify-center gap-2 text-sm">
              <a
                href="https://health.baltimorecity.gov/"
                target="_blank"
                rel="noopener noreferrer"
                className={`${t.muted} hover:${t.text} transition flex items-center gap-1`}
              >
                Data: Baltimore City Health Department
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex items-center justify-center gap-4 text-sm">
              <button onClick={() => setShowAboutModal(true)} className={`${t.muted} hover:${t.text} transition`}>
                About
              </button>
              <span className={t.faint}>•</span>
              <button onClick={() => setShowContactModal(true)} className={`${t.muted} hover:${t.text} transition`}>
                Contact
              </button>
              <span className={t.faint}>•</span>
              <a
                href="https://health.baltimorecity.gov/food-safety"
                target="_blank"
                rel="noopener noreferrer"
                className={`${t.muted} hover:${t.text} transition`}
              >
                Food Safety Info
              </a>
            </div>
            <p className={`${t.faint} text-xs`}>
              Community safety tool. Not affiliated with Baltimore City government.
            </p>
          </div>
        </div>

        {/* About Modal */}
        {showAboutModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50" onClick={() => setShowAboutModal(false)}>
            <div className={`${t.card} border-2 ${t.border} rounded-2xl max-w-2xl w-full max-h-[85vh] sm:max-h-[90vh] shadow-2xl overflow-hidden flex flex-col`} onClick={(e) => e.stopPropagation()}>
              <div className={`p-4 sm:p-6 border-b ${t.border} flex-shrink-0`}>
                <div className="flex justify-between items-center">
                  <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2 sm:gap-3">
                    <Info className="w-5 h-5 sm:w-6 sm:h-6" />
                    About Safety Ratings
                  </h2>
                  <button onClick={() => setShowAboutModal(false)} className={`${t.subtle} hover:${t.text} transition p-1`}>
                    <X className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </div>
              </div>
              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto flex-1">
                <div>
                  <h3 className="font-bold text-lg mb-3">Our Mission</h3>
                  <p className={t.muted}>
                    We make Baltimore's health inspection data easy to understand by converting violation counts into star ratings. This helps you quickly compare restaurants and make informed dining decisions.
                  </p>
                </div>

                <div className={`${darkMode ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'} border rounded-lg p-4`}>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Star className="w-4 h-4 text-emerald-500 fill-current" />
                    How We Calculate Star Ratings
                  </h4>
                  <p className={`text-sm ${t.muted} mb-3`}>
                    Baltimore doesn't issue numeric scores. We calculate safety ratings based on the number of violations found during official inspections:
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-lg mb-4">Star Rating Scale</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <StarDisplay stars={5} size="md" />
                      <div>
                        <div className="font-semibold text-emerald-600">5 Stars - Perfect</div>
                        <div className={`text-sm ${t.muted}`}>Zero violations found</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <StarDisplay stars={4} size="md" />
                      <div>
                        <div className="font-semibold text-green-600">4 Stars - Excellent</div>
                        <div className={`text-sm ${t.muted}`}>1-2 violations found</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <StarDisplay stars={3} size="md" />
                      <div>
                        <div className="font-semibold text-yellow-600">3 Stars - Good</div>
                        <div className={`text-sm ${t.muted}`}>3-4 violations found</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <StarDisplay stars={2} size="md" />
                      <div>
                        <div className="font-semibold text-orange-600">2 Stars - Fair</div>
                        <div className={`text-sm ${t.muted}`}>5-7 violations found</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <StarDisplay stars={1} size="md" />
                      <div>
                        <div className="font-semibold text-red-600">1 Star - Poor</div>
                        <div className={`text-sm ${t.muted}`}>8+ violations found</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-lg mb-3">Data Source</h3>
                  <p className={t.muted}>
                    All inspection data comes directly from the Baltimore City Health Department's official records. We update our database weekly to reflect the latest inspections.
                  </p>
                </div>

                <div className={`${darkMode ? 'bg-amber-900/20 border-amber-800' : 'bg-amber-50 border-amber-200'} border rounded-lg p-4`}>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Important Notice
                  </h4>
                  <p className={`text-sm ${t.muted}`}>
                    Safety ratings are calculated by this site based on official violation data. Baltimore City issues Pass/Fail status only. This is a community tool to help you make informed decisions—not an official government rating. Always verify with official sources for the most current information.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Contact Modal */}
        {showContactModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowContactModal(false)}>
            <div className={`${t.card} border-2 ${t.border} rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden`} onClick={(e) => e.stopPropagation()}>
              <div className={`p-6 border-b ${t.border}`}>
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold flex items-center gap-3">
                    <Mail className="w-6 h-6" />
                    Contact Us
                  </h2>
                  <button onClick={() => setShowContactModal(false)} className={`${t.subtle} hover:${t.text} transition p-1`}>
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
              <div className="p-6">
                {!contactSubmitted ? (
                  <div className="space-y-4">
                    <p className={t.muted}>
                      Questions, suggestions, or found an issue? Let us know.
                    </p>

                    {contactError && (
                      <div className={`${darkMode ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'} border rounded-lg p-3 flex items-start gap-2`}>
                        <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                        <p className={`text-sm ${darkMode ? 'text-red-200' : 'text-red-800'}`}>{contactError}</p>
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
                        placeholder="Your message..."
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
                  <div className="text-center py-12">
                    <CheckCircle className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">Message Sent</h3>
                    <p className={t.muted}>Thank you for contacting us. We'll respond as soon as possible.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Share Toast Notification */}
        {showShareToast && (
          <div className="fixed bottom-8 right-8 z-50">
            <div className={`${darkMode ? 'bg-slate-700' : 'bg-slate-800'} text-white px-6 py-3 rounded-lg shadow-2xl flex items-center gap-3 transition-all`}>
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <span className="font-medium">Link copied to clipboard!</span>
            </div>
          </div>
        )}

        {/* Request Toast Notification */}
        {showRequestToast && (
          <div className="fixed bottom-8 right-8 z-50">
            <div className={`${darkMode ? 'bg-slate-700' : 'bg-slate-800'} text-white px-6 py-3 rounded-lg shadow-2xl flex items-center gap-3 transition-all`}>
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <span className="font-medium">Request sent! We'll add it soon.</span>
            </div>
          </div>
        )}

        {/* Subscribe to Alerts Modal */}
        {showAlertsModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowAlertsModal(false)}>
            <div className={`${t.card} border-2 ${t.border} rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden`} onClick={(e) => e.stopPropagation()}>
              <div className={`p-6 border-b ${t.border}`}>
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold flex items-center gap-3">
                    <Bell className="w-6 h-6" />
                    Inspection Alerts
                  </h2>
                  <button onClick={() => setShowAlertsModal(false)} className={`${t.subtle} hover:${t.text} transition p-1`}>
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
              <div className="p-6 sm:p-8">
                <div className="text-center py-8">
                  <div className={`w-20 h-20 ${darkMode ? 'bg-slate-700' : 'bg-slate-100'} rounded-full flex items-center justify-center mx-auto mb-6`}>
                    <Bell className={`w-10 h-10 ${t.muted}`} />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Coming Soon!</h3>
                  <p className={`${t.muted} max-w-sm mx-auto`}>
                    We're working on a notification system that will alert you when your favorite restaurants are re-inspected or when ratings change. Check back soon for updates!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Restaurant Request Confirmation Modal */}
        {showRequestConfirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => { setShowRequestConfirm(false); setPendingRequest(''); }}>
            <div className={`${t.card} border-2 ${t.border} rounded-2xl max-w-md w-full shadow-2xl overflow-hidden`} onClick={(e) => e.stopPropagation()}>
              <div className={`p-6 border-b ${t.border}`}>
                <h2 className="text-xl font-bold">Request Restaurant</h2>
              </div>
              <div className="p-6">
                <p className={`${t.text} mb-2`}>
                  Want us to add <strong className="text-emerald-600">"{pendingRequest}"</strong> to our database?
                </p>
                <p className={`${t.muted} text-sm mb-6`}>
                  We'll add it in the next update if it's a Baltimore restaurant.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => { setShowRequestConfirm(false); setPendingRequest(''); }}
                    className={`flex-1 px-4 py-3 ${darkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-100 hover:bg-slate-200'} ${t.text} rounded-lg font-medium transition`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmRestaurantRequest}
                    disabled={requestLoading}
                    className={`flex-1 px-4 py-3 ${darkMode ? 'bg-emerald-700 hover:bg-emerald-600' : 'bg-emerald-600 hover:bg-emerald-700'} text-white rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
                      requestLoading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {requestLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Sending...
                      </>
                    ) : (
                      'Yes, request it'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
