import React, { useState, useMemo, useRef, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Search, MapPin, Calendar, Clock, X, Award, AlertOctagon, ThumbsDown, Filter, ChevronDown, Sun, Moon, Mail, Info, Send } from 'lucide-react';

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
  return 'Unknown'; // Default
};

// Transform scraped data to UI format
const transformRestaurantData = (restaurants) => {
  return restaurants.map(r => ({
    id: r.id,
    name: r.name || 'Unknown Restaurant',
    address: r.address || 'Address not available',
    score: r.score || 0,
    lastInspection: r.last_inspection || 'N/A',
    violations: r.violations ? r.violations.map(v => v.description) : [],
    cuisine: guessCuisine(r.name || ''),
    trend: 'stable', // Could be enhanced later
    neighborhood: zipcodeToNeighborhood(r.zipcode) || 'Baltimore',
    critical: r.score ? r.score < 70 : false,
    zipcode: r.zipcode || 'Unknown'
  }));
};

const getScoreEmoji = (score) => {
  if (score >= 95) return "🌟";
  if (score >= 90) return "✅";
  if (score >= 80) return "👍";
  if (score >= 70) return "⚠️";
  return "🚫";
};

const getScoreLabel = (score) => {
  if (score >= 95) return "EXCELLENT";
  if (score >= 90) return "GREAT";
  if (score >= 80) return "GOOD";
  if (score >= 70) return "FAIR";
  return "POOR";
};

const getScoreBg = (score) => {
  if (score >= 90) return "from-emerald-500 to-green-600";
  if (score >= 80) return "from-yellow-500 to-amber-600";
  if (score >= 70) return "from-orange-500 to-orange-600";
  return "from-red-500 to-red-700";
};

export default function RestaurantHealthScores() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const searchRef = useRef(null);

  // Load restaurant data from JSON file
  useEffect(() => {
    fetch('../data/test_baltimore_restaurants.json')
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
        setError(err.message);
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

  const searchResults = useMemo(() => {
    if (!searchTerm.trim() || restaurants.length === 0) return [];
    return restaurants.filter(r =>
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.cuisine.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.neighborhood.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 5);
  }, [searchTerm, restaurants]);

  const filteredRestaurants = useMemo(() => {
    if (restaurants.length === 0) return [];
    let filtered = [...restaurants];
    if (activeFilter === 'excellent') filtered = filtered.filter(r => r.score >= 90);
    if (activeFilter === 'warning') filtered = filtered.filter(r => r.score < 80);
    if (activeFilter === 'recent') filtered = filtered.sort((a, b) => new Date(b.lastInspection) - new Date(a.lastInspection));
    if (activeFilter === 'all') filtered = filtered.sort((a, b) => a.score - b.score);
    return filtered;
  }, [activeFilter, restaurants]);

  const worstRestaurant = restaurants.length > 0 ? restaurants.reduce((a, b) => a.score < b.score ? a : b) : null;
  const bestRestaurant = restaurants.length > 0 ? restaurants.reduce((a, b) => a.score > b.score ? a : b) : null;

  const filters = [
    { id: 'all', label: 'All Restaurants', icon: '📋' },
    { id: 'excellent', label: 'Top Rated (90+)', icon: '🌟' },
    { id: 'warning', label: 'Needs Work (<80)', icon: '⚠️' },
    { id: 'recent', label: 'Recently Inspected', icon: '🕐' }
  ];

  const handleContactSubmit = () => {
    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      alert('Please fill in all fields');
      return;
    }
    // In production, you'd send this to your email service (EmailJS, Formspree, etc.)
    console.log('Contact form submitted:', contactForm);
    setContactSubmitted(true);
    setTimeout(() => {
      setShowContactModal(false);
      setContactSubmitted(false);
      setContactForm({ name: '', email: '', message: '' });
    }, 2000);
  };

  const t = {
    bg: darkMode ? 'bg-zinc-950' : 'bg-gray-50',
    text: darkMode ? 'text-white' : 'text-gray-900',
    muted: darkMode ? 'text-zinc-400' : 'text-gray-600',
    subtle: darkMode ? 'text-zinc-500' : 'text-gray-500',
    faint: darkMode ? 'text-zinc-600' : 'text-gray-400',
    border: darkMode ? 'border-zinc-800' : 'border-gray-200',
    borderLight: darkMode ? 'border-zinc-700' : 'border-gray-300',
    card: darkMode ? 'bg-zinc-900' : 'bg-white',
    cardHover: darkMode ? 'border-zinc-600' : 'border-gray-400',
    input: darkMode ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-300',
    dropdown: darkMode ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200 shadow-lg',
  };

  // Loading state
  if (loading) {
    return (
      <div className={`min-h-screen ${t.bg} ${t.text} flex items-center justify-center`}>
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">🦀</div>
          <p className="text-xl font-semibold">Loading Baltimore restaurants...</p>
          <p className={`${t.subtle} text-sm mt-2`}>Please wait while we fetch the data</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`min-h-screen ${t.bg} ${t.text} flex items-center justify-center`}>
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">❌</div>
          <p className="text-xl font-semibold mb-2">Unable to load restaurant data</p>
          <p className={`${t.subtle} text-sm mb-4`}>{error}</p>
          <p className={`${t.faint} text-xs`}>Make sure you're running this via a local server (e.g., <code className="bg-zinc-800 px-2 py-1 rounded">python3 -m http.server</code>)</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${t.bg} ${t.text}`}>
      {/* Nav */}
      <div className={`${t.card} border-b ${t.border} sticky top-0 z-40`}>
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🦀</span>
            <span className="font-bold text-lg hidden sm:block">Baltimore Food Safety</span>
            <span className="font-bold text-lg sm:hidden">BFS</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAboutModal(true)}
              className={`p-2 rounded-lg ${darkMode ? 'hover:bg-zinc-800' : 'hover:bg-gray-100'} transition`}
            >
              <Info className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowContactModal(true)}
              className={`p-2 rounded-lg ${darkMode ? 'hover:bg-zinc-800' : 'hover:bg-gray-100'} transition`}
            >
              <Mail className="w-5 h-5" />
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg ${darkMode ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-gray-100 hover:bg-gray-200'} transition`}
            >
              {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-600" />}
            </button>
          </div>
        </div>
      </div>

      {/* Alert */}
      {restaurants.length > 0 && restaurants.find(r => r.critical) && (
        <div className="bg-red-600 text-white py-2 px-4">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-sm font-medium text-center">
            <div className="flex items-center gap-2">
              <AlertOctagon className="w-4 h-4" />
              <span>ALERT: Critical health violations found in {restaurants.filter(r => r.critical).length} restaurant{restaurants.filter(r => r.critical).length > 1 ? 's' : ''}</span>
            </div>
            <button onClick={() => setSelectedRestaurant(restaurants.find(r => r.critical))} className="underline hover:text-red-200">
              See report
            </button>
          </div>
        </div>
      )}

      {/* Hero */}
      <div className={`border-b ${t.border}`}>
        <div className="max-w-5xl mx-auto px-4 py-8 sm:py-16 text-center">
          <div className={`inline-flex items-center gap-2 ${t.card} border ${t.borderLight} rounded-full px-3 py-1 text-sm ${t.muted} mb-4`}>
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Updated Nov 18, 2024
          </div>
          <h1 className="text-3xl sm:text-5xl font-black mb-4 tracking-tight">
            Is that restaurant <span className="text-red-500">safe</span> to eat at?
          </h1>
          <p className={`text-base sm:text-xl ${t.muted} mb-8 max-w-2xl mx-auto`}>
            Real health inspection data for Baltimore restaurants. No BS. Just facts.
          </p>

          {/* Search */}
          <div className="relative max-w-xl mx-auto" ref={searchRef}>
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${t.subtle} w-5 h-5 z-10`} />
            <input
              type="text"
              placeholder="Search any restaurant..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setShowDropdown(true); }}
              onFocus={() => setShowDropdown(true)}
              className={`w-full pl-12 pr-4 py-4 ${t.input} rounded-2xl focus:outline-none text-lg ${t.text}`}
            />
            {showDropdown && searchTerm.trim() && (
              <div className={`absolute top-full left-0 right-0 mt-2 ${t.dropdown} rounded-xl overflow-hidden z-50`}>
                {searchResults.length > 0 ? searchResults.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => { setSelectedRestaurant(r); setShowDropdown(false); setSearchTerm(''); }}
                    className={`flex items-center gap-4 p-4 ${darkMode ? 'hover:bg-zinc-800' : 'hover:bg-gray-50'} cursor-pointer border-b ${t.border} last:border-b-0`}
                  >
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${getScoreBg(r.score)} flex items-center justify-center font-bold text-lg text-white`}>
                      {r.score}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold">{r.name}</p>
                      <p className={`text-sm ${t.subtle}`}>{r.cuisine} • {r.neighborhood}</p>
                    </div>
                    <span className="text-2xl">{getScoreEmoji(r.score)}</span>
                  </div>
                )) : (
                  <div className="p-6 text-center">
                    <p className={t.muted}>No restaurants found for "{searchTerm}"</p>
                    <p className={`${t.faint} text-sm mt-1`}>🔍 We're always adding new restaurants!</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ad 1 */}
      <div className={`${t.card} border-b ${t.border} py-3`}>
        <div className="max-w-5xl mx-auto px-4 text-center">
          <div className={`${darkMode ? 'bg-blue-600/20 border-zinc-700' : 'bg-blue-100 border-gray-200'} border rounded-lg py-3`}>
            <p className={`${t.subtle} text-sm`}>📢 Advertisement - 728x90 Leaderboard</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className={`border-b ${t.border} py-6`}>
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-4 gap-4 text-center">
          <div><p className="text-2xl sm:text-3xl font-bold">{restaurants.length}</p><p className={`${t.subtle} text-xs sm:text-sm`}>Restaurants</p></div>
          <div><p className="text-2xl sm:text-3xl font-bold text-emerald-500">{restaurants.filter(r => r.score >= 90).length}</p><p className={`${t.subtle} text-xs sm:text-sm`}>A-Rated</p></div>
          <div><p className="text-2xl sm:text-3xl font-bold text-red-500">{restaurants.filter(r => r.score < 70).length}</p><p className={`${t.subtle} text-xs sm:text-sm`}>Failing</p></div>
          <div><p className="text-2xl sm:text-3xl font-bold">{restaurants.length > 0 ? Math.round(restaurants.reduce((a, b) => a + b.score, 0) / restaurants.length) : 0}</p><p className={`${t.subtle} text-xs sm:text-sm`}>Average</p></div>
        </div>
      </div>

      {/* Main */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Featured */}
        {worstRestaurant && bestRestaurant && (
          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            <div onClick={() => setSelectedRestaurant(worstRestaurant)} className={`${darkMode ? 'bg-gradient-to-br from-red-950 to-zinc-900 border-red-900/50' : 'bg-red-50 border-red-200'} border rounded-xl p-5 cursor-pointer hover:opacity-90 transition`}>
              <div className="flex items-center gap-2 text-red-500 text-sm font-semibold mb-2"><ThumbsDown className="w-4 h-4" />WORST IN BALTIMORE</div>
              <h3 className="text-xl font-bold mb-1">{worstRestaurant.name}</h3>
              <p className={t.subtle + " text-sm mb-3"}>{worstRestaurant.neighborhood}</p>
              <span className="text-4xl font-black text-red-500">{worstRestaurant.score}</span>
              <span className="text-red-400 text-sm ml-3">{worstRestaurant.violations.length} violations</span>
            </div>
            <div onClick={() => setSelectedRestaurant(bestRestaurant)} className={`${darkMode ? 'bg-gradient-to-br from-emerald-950 to-zinc-900 border-emerald-900/50' : 'bg-emerald-50 border-emerald-200'} border rounded-xl p-5 cursor-pointer hover:opacity-90 transition`}>
              <div className="flex items-center gap-2 text-emerald-500 text-sm font-semibold mb-2"><Award className="w-4 h-4" />BEST IN BALTIMORE</div>
              <h3 className="text-xl font-bold mb-1">{bestRestaurant.name}</h3>
              <p className={t.subtle + " text-sm mb-3"}>{bestRestaurant.neighborhood}</p>
              <span className="text-4xl font-black text-emerald-500">{bestRestaurant.score}</span>
              <span className="text-emerald-400 text-sm ml-3">{bestRestaurant.violations.length === 0 ? 'Zero violations' : `${bestRestaurant.violations.length} violations`}</span>
            </div>
          </div>
        )}

        {/* Ad 2 */}
        <div className={`${t.card} border ${t.border} rounded-xl p-6 mb-8 text-center`}>
          <p className={`${t.subtle} text-sm`}>📢 Advertisement - 300x250 Medium Rectangle</p>
        </div>

        {/* Filter */}
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-sm font-semibold ${t.subtle} uppercase tracking-wider`}>{filters.find(f => f.id === activeFilter)?.label}</h2>
          <div className="relative">
            <button onClick={() => setShowFilterMenu(!showFilterMenu)} className={`flex items-center gap-2 ${t.card} border ${t.borderLight} rounded-lg px-4 py-2 text-sm`}>
              <Filter className="w-4 h-4" /><span className="hidden sm:inline">Filter</span><ChevronDown className={`w-4 h-4 transition ${showFilterMenu ? 'rotate-180' : ''}`} />
            </button>
            {showFilterMenu && (
              <div className={`absolute top-full right-0 mt-2 ${t.dropdown} rounded-xl overflow-hidden z-40 w-56`}>
                {filters.map((f) => (
                  <button key={f.id} onClick={() => { setActiveFilter(f.id); setShowFilterMenu(false); }} className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm ${darkMode ? 'hover:bg-zinc-800' : 'hover:bg-gray-50'} ${activeFilter === f.id ? t.text : t.muted}`}>
                    <span>{f.icon}</span><span>{f.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* List */}
        <div className="space-y-3">
          {filteredRestaurants.map((r, i) => (
            <React.Fragment key={r.id}>
              <div
                onClick={() => setSelectedRestaurant(r)}
                onMouseEnter={() => setHoveredId(r.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`${t.card} border rounded-xl overflow-hidden cursor-pointer transition-all ${r.critical ? 'border-red-600' : hoveredId === r.id ? t.cardHover : t.border}`}
              >
                <div className="flex">
                  <div className={`w-16 sm:w-24 bg-gradient-to-b ${getScoreBg(r.score)} flex flex-col items-center justify-center py-4`}>
                    <span className="text-2xl sm:text-3xl font-black text-white">{r.score}</span>
                    <span className="text-xs font-semibold text-white/80 hidden sm:block">{getScoreLabel(r.score)}</span>
                  </div>
                  <div className="flex-1 p-3 sm:p-4">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-lg">{getScoreEmoji(r.score)}</span>
                      <h3 className="font-bold text-base sm:text-lg">{r.name}</h3>
                      {r.critical && <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded font-bold animate-pulse">CLOSED</span>}
                    </div>
                    <p className={`${t.subtle} text-xs sm:text-sm`}>{r.cuisine} • {r.neighborhood}</p>
                    {r.violations.length > 0 && (
                      <p className="text-red-400 text-xs sm:text-sm mt-2 truncate">{r.violations.length} violation{r.violations.length > 1 ? 's' : ''}: {r.violations[0].substring(0, 40)}...</p>
                    )}
                  </div>
                  <div className={`hidden sm:flex flex-col items-end justify-center p-4 ${t.subtle} text-sm`}>
                    <div className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(r.lastInspection).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                    {r.trend === 'up' && <span className="text-emerald-500 text-xs">↑ Improving</span>}
                    {r.trend === 'down' && <span className="text-red-500 text-xs">↓ Declining</span>}
                  </div>
                </div>
              </div>
              {i === 2 && (
                <div className={`${darkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-gray-100 border-gray-200'} border rounded-xl p-4 text-center`}>
                  <p className={`${t.faint} text-sm`}>📢 Advertisement - In-Feed Native Ad</p>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Ad 4 */}
        <div className={`mt-8 ${darkMode ? 'bg-purple-600/20 border-zinc-700' : 'bg-purple-100 border-gray-200'} border rounded-xl p-6 text-center`}>
          <p className={`${t.subtle} text-sm`}>📢 Advertisement - 728x90 Bottom Leaderboard</p>
        </div>

        {/* Footer */}
        <div className={`mt-12 pt-8 border-t ${t.border} text-center ${t.faint} text-sm`}>
          <p>Data from Baltimore City Health Department • Updated weekly</p>
          <div className="mt-2 flex items-center justify-center gap-4">
            <button onClick={() => setShowAboutModal(true)} className={`hover:${t.text} transition`}>About</button>
            <span>•</span>
            <button onClick={() => setShowContactModal(true)} className={`hover:${t.text} transition`}>Contact Us</button>
          </div>
          <p className="mt-2">Built for Baltimore 🦀</p>
        </div>
      </div>

      {/* About Modal */}
      {showAboutModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowAboutModal(false)}>
          <div className={`${t.card} border ${t.borderLight} rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto`} onClick={(e) => e.stopPropagation()}>
            <div className={`p-6 border-b ${t.border}`}>
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold flex items-center gap-2"><Info className="w-6 h-6" /> About Us</h2>
                <button onClick={() => setShowAboutModal(false)} className={`${t.subtle} hover:${t.text} p-1`}><X className="w-6 h-6" /></button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h3 className="font-bold text-lg mb-2">Our Mission</h3>
                <p className={t.muted}>We believe everyone deserves to know if a restaurant is safe before they eat there. Baltimore Food Safety makes public health inspection data easy to access and understand.</p>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">How It Works</h3>
                <p className={t.muted}>We collect official health inspection data from the Baltimore City Health Department and present it in a simple, searchable format. Scores are updated weekly.</p>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">Understanding Scores</h3>
                <ul className={`${t.muted} space-y-1`}>
                  <li><span className="text-emerald-500 font-semibold">90-100:</span> Excellent - minimal or no violations</li>
                  <li><span className="text-yellow-500 font-semibold">80-89:</span> Good - minor issues noted</li>
                  <li><span className="text-orange-500 font-semibold">70-79:</span> Fair - needs improvement</li>
                  <li><span className="text-red-500 font-semibold">Below 70:</span> Poor - serious violations found</li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">Disclaimer</h3>
                <p className={`${t.faint} text-sm`}>This site is not affiliated with Baltimore City government. Data is sourced from public records and may not reflect current conditions. Always verify with official sources for the most up-to-date information.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowContactModal(false)}>
          <div className={`${t.card} border ${t.borderLight} rounded-2xl max-w-lg w-full`} onClick={(e) => e.stopPropagation()}>
            <div className={`p-6 border-b ${t.border}`}>
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold flex items-center gap-2"><Mail className="w-6 h-6" /> Contact Us</h2>
                <button onClick={() => setShowContactModal(false)} className={`${t.subtle} hover:${t.text} p-1`}><X className="w-6 h-6" /></button>
              </div>
            </div>
            <div className="p-6">
              {!contactSubmitted ? (
                <div className="space-y-4">
                  <p className={t.muted}>Have a question, suggestion, or found incorrect data? Let us know!</p>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${t.subtle}`}>Your Name</label>
                    <input
                      type="text"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      placeholder="John Doe"
                      className={`w-full px-4 py-3 ${t.input} rounded-lg focus:outline-none ${t.text}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${t.subtle}`}>Your Email</label>
                    <input
                      type="email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      placeholder="john@example.com"
                      className={`w-full px-4 py-3 ${t.input} rounded-lg focus:outline-none ${t.text}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${t.subtle}`}>Message</label>
                    <textarea
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      placeholder="What would you like to tell us?"
                      rows={4}
                      className={`w-full px-4 py-3 ${t.input} rounded-lg focus:outline-none ${t.text} resize-none`}
                    />
                  </div>
                  <button
                    onClick={handleContactSubmit}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" /> Send Message
                  </button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">Message Sent!</h3>
                  <p className={t.muted}>Thanks for reaching out. We'll get back to you soon.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {selectedRestaurant && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setSelectedRestaurant(null)}>
          <div className={`${t.card} border ${t.borderLight} rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto`} onClick={(e) => e.stopPropagation()}>
            <div className={`bg-gradient-to-r ${getScoreBg(selectedRestaurant.score)} p-6 text-center`}>
              <span className="text-6xl font-black text-white">{selectedRestaurant.score}</span>
              <p className="text-white/80 font-semibold mt-1">{getScoreLabel(selectedRestaurant.score)}</p>
            </div>
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold">{selectedRestaurant.name}</h2>
                  <p className={t.subtle}>{selectedRestaurant.cuisine} • {selectedRestaurant.address}</p>
                </div>
                <button onClick={() => setSelectedRestaurant(null)} className={`${t.subtle} hover:${t.text} p-1`}><X className="w-6 h-6" /></button>
              </div>
              <div className={`flex items-center gap-4 text-sm ${t.muted} mb-6 pb-6 border-b ${t.border}`}>
                <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />Inspected {new Date(selectedRestaurant.lastInspection).toLocaleDateString()}</span>
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{selectedRestaurant.neighborhood}</span>
              </div>
              <div className={`${darkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-gray-100 border-gray-200'} border rounded-lg p-3 mb-6 text-center`}>
                <p className={`${t.faint} text-xs`}>📢 Sponsored</p>
              </div>
              {selectedRestaurant.violations.length > 0 ? (
                <div>
                  <h3 className="font-bold text-red-500 mb-3 flex items-center gap-2"><AlertTriangle className="w-5 h-5" />{selectedRestaurant.violations.length} Violation{selectedRestaurant.violations.length > 1 ? 's' : ''} Found</h3>
                  <div className="space-y-2">
                    {selectedRestaurant.violations.map((v, i) => (
                      <div key={i} className={`${darkMode ? 'bg-red-950/50 border-red-900/50' : 'bg-red-50 border-red-200'} border p-3 rounded-lg text-sm ${darkMode ? 'text-red-200' : 'text-red-700'}`}>{v}</div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className={`${darkMode ? 'bg-emerald-950/50 border-emerald-900/50' : 'bg-emerald-50 border-emerald-200'} border rounded-xl p-6 text-center`}>
                  <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                  <p className="font-bold text-emerald-500 text-lg">Passed with Flying Colors!</p>
                  <p className={`${darkMode ? 'text-emerald-600' : 'text-emerald-700'} text-sm`}>No violations during last inspection</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}