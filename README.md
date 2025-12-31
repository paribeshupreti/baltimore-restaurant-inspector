# Baltimore Restaurant Health Inspector

Scrapes restaurant health inspection data from Baltimore City's portal so you can see which places are actually clean (or not).

## Project Structure

```
baltimore-restaurant-inspector/
├── backend/                              # Web scraper code
│   └── scraper.py                       # Main scraper script
├── frontend/                             # Dashboards & UI
│   ├── src/                             # React source (Vite)
│   │   ├── App.jsx                      # Main React component
│   │   ├── main.jsx                     # React entry point
│   │   └── index.css                    # Tailwind imports
│   ├── dashboard.html                   # Analytics dashboard
│   ├── restaurant_ui.html               # React UI (standalone)
│   ├── baltimore_resturant_scores.jsx  # JSX source (legacy)
│   ├── index.html                       # Vite HTML template
│   ├── package.json                     # npm dependencies
│   ├── vite.config.js                   # Vite config
│   └── tailwind.config.js               # Tailwind config
├── data/                                 # Restaurant data (JSON)
│   ├── analytics.json                   # Analytics/statistics
│   ├── baltimore_restaurants.json       # Production data
│   └── test_baltimore_restaurants.json  # Test data
├── logs/                                 # Scraper execution logs
│   ├── session_results/                 # Session log files
│   │   └── *.json
│   └── downloads/                       # Playwright downloads
│       └── *.pdf
├── view_dashboard.py                     # Quick launcher
├── README.md                             # Documentation
└── ANALYTICS_README.md                   # Analytics docs
```

## Quick Start

### 1. Run the Scraper

```bash
# Test mode (scrapes a few restaurants)
cd backend
python3 scraper.py --test

# Full scrape (all restaurants from zip code list)
python3 scraper.py
```

### 2. View the Dashboards

```bash
# Option A: Use the launcher (easiest)
python3 view_dashboard.py

# Option B: Start server manually
python3 -m http.server 8000
# Then open: http://localhost:8000/frontend/dashboard.html
#        or: http://localhost:8000/frontend/restaurant_ui.html
```

## Features

### Scraper (`backend/scraper.py`)
- Scrapes Baltimore restaurant health inspection data
- Automatic scoring system (100 = perfect, score decreases with violations)
- Restaurant name aliasing (handles portal name differences)
- Analytics generation
- Test mode for quick testing
- Session logging and error tracking

### Analytics Dashboard (`frontend/dashboard.html`)
- Overall statistics
- Success/failure rates
- Violation trends
- Restaurant listings
- Dark mode support

### React UI (`frontend/restaurant_ui.html`)
- Beautiful restaurant health scores interface
- Search and filter restaurants
- Detailed violation reports
- Best/worst restaurant highlights
- Fully responsive design
- Dark/light mode

## Scoring System

Restaurants are automatically scored based on violation count:

```
score = max(40, 100 - (violations_count * 10))
```

- 90-100: Excellent (A)
- 80-89: Good (B)
- 70-79: Fair (C)
- Below 70: Poor (F) - Marked as critical

## Data Files

All data lives in the `data/` folder:
- **`baltimore_restaurants.json`** - Full production data (all restaurants)
- **`test_baltimore_restaurants.json`** - Test data (from `--test` mode, just a few restaurants)
- **`analytics.json`** - Stats and analytics

## Restaurant Name Aliasing

Some restaurants have weird names in the portal compared to their actual name. You can fix this in the scraper:

```python
RESTAURANT_NAME_ALIASES = {
    "Faidley's Seafood": "FAIDLEY'S EDP SEAFOOD INC STALL 21",
    # Add more as you find them
}
```

## Setup

You need Python 3.7+ and Playwright:

```bash
pip install playwright beautifulsoup4
playwright install chromium
```

## How to Use

```bash
# Quick test (scrapes a few restaurants)
cd backend
python3 scraper.py --test

# View results in browser
cd ..
python3 view_dashboard.py

# Or start server manually
python3 -m http.server 8000
# Then go to: http://localhost:8000/frontend/dashboard.html
```

## UI Development (React + Vite)

Want to edit the React UI with hot reload? Here's how:

### First-time setup
```bash
cd frontend
npm install
```

### Start development server (with hot reload)
```bash
npm run dev
```
Opens browser at http://localhost:3000
Edit files in `src/` and see changes instantly!

**Note:** The React app uses a copy of the data from `frontend/public/data/`. If you run the scraper and want to see new data in the React app, copy it over:
```bash
cp data/test_baltimore_restaurants.json frontend/public/data/
```

### Build for production
```bash
npm run build
```
Creates optimized bundle in `frontend/dist/`

### Preview production build
```bash
npm run preview
```

## Important Notes

- The HTML files (`dashboard.html`, `restaurant_ui.html`) still work with the Python server
- The new React dev setup (`npm run dev`) runs on port 3000 with hot reload
- Always use a local server (not `file://`) - the dashboards need it to load JSON files
- Scraper logs go to `logs/session_results/`
- PDF downloads go to `logs/downloads/`
