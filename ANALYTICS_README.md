# Restaurant Scraper Analytics & Dashboard

## Overview

The Baltimore Restaurant Scraper now includes comprehensive analytics tracking and a beautiful web dashboard to help you understand:
- Which restaurants users are searching for
- Success/failure rates of scraping attempts
- High-demand restaurants not currently in your database
- Historical trends across scraping sessions

## New Files Created

### 1. `analytics.json` (Auto-generated)
Persistent analytics file that tracks:
- All restaurant searches across sessions
- Search counts per restaurant
- Success/failure status for each restaurant
- Timestamps for first/last success and failures
- Demand analysis (top searched, not found restaurants)

### 2. `session_results/scraper_session_*.json` (Auto-generated)
Per-session reports containing:
- Session ID and duration
- List of successfully scraped restaurants
- Restaurants already in database (skipped)
- Restaurants not found in portal
- Scraping failures with error messages
- Summary statistics and success rate

### 3. `dashboard.html`
Interactive web dashboard featuring:
- Overview statistics (total searches, sessions, success rate)
- Searchable and sortable restaurant table
- High-demand restaurants NOT in database
- Visual status breakdown charts
- Dark mode support
- Auto-refresh every 30 seconds

## How to Use

### Quick Start (3 Easy Steps)

1. **Run the scraper** to generate analytics data:
   ```bash
   python3 scraper.py --test
   ```

2. **View the dashboard**:
   ```bash
   python3 view_dashboard.py
   ```

3. **Enjoy!** The dashboard opens automatically in your browser 🎉

### Running the Scraper

The scraper works exactly as before, but now automatically tracks analytics:

```bash
# Quick test
python3 scraper.py --test

# Full scrape
python3 scraper.py
```

### What's New in Scraper Behavior

1. **Duplicate Detection**: If a restaurant already exists in `baltimore_restaurants.json`, it will be skipped and marked as "already_exists" in the session report.

2. **Analytics Tracking**: Every search attempt is recorded, whether successful or not.

3. **Session Summary**: At the end of each run, you'll see:
   ```
   📊 SCRAPING SESSION SUMMARY
   ============================================================
   Session ID: 20251222_153045
   Duration: 14m 27s

   Results:
     ✓ Successfully scraped: 8
     ⏭️  Already in database: 3
     ❌ Not found in portal: 2
     ⚠️  Scraping failed: 2

   Success Rate: 53.3%

   📈 ANALYTICS INSIGHTS
   ============================================================
   Top Searched Restaurants (All Time):
     1. Faidley's Seafood - 12 searches
     2. Ekiben - 10 searches

   High-Demand Restaurants NOT in Database:
     1. McDonalds - 8 searches
     2. Chipotle - 5 searches

   💡 Consider adding these restaurants to your scraping list!
   ============================================================
   ```

### Viewing the Dashboard

#### Easy Method (Recommended) 🚀

Just run this single command:
```bash
python3 view_dashboard.py
```

This will:
- Start a local HTTP server
- Automatically open the dashboard in your browser
- Show you the URL in case you need it
- Press Ctrl+C to stop when done

#### Manual Method

1. **Start a local HTTP server**:
   ```bash
   python3 -m http.server 8000
   ```

2. **Open the dashboard** in your browser:
   ```
   http://localhost:8000/dashboard.html
   ```

#### Dashboard Features
   - **Search**: Type in the search bar to filter restaurants
   - **Filter**: Click status buttons (All, Success, Not Found, Failed, Recovered)
   - **Sort**: Click column headers to sort the table
   - **Dark Mode**: Toggle dark/light theme
   - **Auto-Refresh**: Dashboard updates automatically every 30 seconds

## Understanding the Analytics

### Restaurant Statuses

- **Successfully Scraped** (Green ✓): Restaurant found and data extracted
- **Not Found** (Red ✗): Restaurant not found in Baltimore Portal
- **Scraping Failed** (Orange ⚠️): Found but data extraction failed
- **Recovered** (Yellow ↗): Previously failed, now successful (e.g., after fixing spelling)
- **Unknown**: Status not yet determined

### Status Transitions

The analytics tracker detects when a restaurant's status changes:
- If "McDonalds" was "not_found" in previous runs but succeeds after you fix the spelling to "McDonald's", it will be marked as "previously_failed_now_success" with a note explaining the transition.

### Using Analytics to Improve

1. **Identify Popular Restaurants**: Look at "Top Searched Restaurants" to see what users want most

2. **Find Spelling Errors**: Check "High-Demand Restaurants NOT in Database" - these might be typos
   - Example: "The Food Markt" → should be "The Food Market"

3. **Fix Persistent Failures**: Review restaurants with high failure counts to identify:
   - Spelling mistakes
   - Restaurants that closed/moved
   - Portal issues

4. **Track Improvements**: After making changes, watch the dashboard to see status transitions from "failed" to "success"

## File Locations

```
my-projects/
├── scraper.py                           # Main scraper (updated)
├── view_dashboard.py                    # Dashboard launcher (NEW) 🚀
├── analytics.json                        # Persistent analytics (auto-created)
├── baltimore_restaurants.json            # Scraped data (existing)
├── dashboard.html                        # Analytics dashboard (NEW)
├── ANALYTICS_README.md                   # This guide (NEW)
├── session_results/                      # Per-session reports (NEW)
│   ├── scraper_session_20251222_153045.json
│   ├── scraper_session_20251222_160012.json
│   └── ...
└── downloads/                            # PDF downloads (existing)
```

## Tips & Tricks

### View Recent Session Results
```bash
# List session files
ls -lt session_results/

# View latest session
cat session_results/scraper_session_*.json | jq .
```

### Analyze Analytics with jq
```bash
# Top 10 searched restaurants
cat analytics.json | jq '.demand_analysis.top_searched_restaurants'

# Restaurants not found
cat analytics.json | jq '.demand_analysis.not_found_restaurants'

# All restaurants with failure count > 0
cat analytics.json | jq '.restaurant_searches | to_entries | map(select(.value.failure_count > 0))'
```

### Reset Analytics
If you want to start fresh:
```bash
rm analytics.json
rm -rf session_results/
```

The next scraper run will create new files.

## Troubleshooting

### Dashboard shows "Analytics file not found"
- Make sure `analytics.json` exists (run the scraper at least once)
- Ensure you're accessing via HTTP server (`python3 -m http.server`), not opening the file directly
- Check browser console for CORS errors

### Session files not created
- Check that `session_results/` directory exists
- Verify write permissions in the project directory

### Analytics not updating
- Ensure the scraper completes (doesn't crash mid-run)
- Check for Python errors in terminal output
- Analytics save even on Ctrl+C interruption

## Advanced Usage

### Programmatic Access

You can load and analyze analytics in Python:

```python
import json

# Load analytics
with open('analytics.json', 'r') as f:
    analytics = json.load(f)

# Get all not-found restaurants
not_found = [
    name for name, data in analytics['restaurant_searches'].items()
    if data['status'] == 'not_found'
]

print(f"Not found: {not_found}")
```

### Custom Session Analysis

```python
# Load latest session
import glob
session_files = sorted(glob.glob('session_results/*.json'), reverse=True)
if session_files:
    with open(session_files[0], 'r') as f:
        latest_session = json.load(f)
    print(f"Last session success rate: {latest_session['summary']['success_rate']}")
```

## Questions or Issues?

If you encounter any problems or have questions about the analytics system:
1. Check the console output when running the scraper
2. Verify file permissions and directory structure
3. Look for error messages in browser console (F12) when using dashboard

---

**Enjoy your new analytics system! 📊🎉**
