"""
Baltimore Restaurant Health Inspection Scraper - CLEAN & BULLETPROOF
=====================================================================
Extracts only real violations from the OBSERVATIONS section.
Handles all violation formats: long, short, multiple, or none.

SETUP:
pip3 install playwright PyPDF2
playwright install chromium

RUN:
python3 scraper.py --test
"""

from playwright.sync_api import sync_playwright
import time
import json
import re
import os
import sys
from pathlib import Path
from datetime import datetime
try:
    import PyPDF2
except ImportError:
    print("Installing PyPDF2...")
    os.system("pip3 install PyPDF2")
    import PyPDF2

BASE_URL = "https://baltimoreportal.jadian.com/"
OUTPUT_FILE_JSON = "../data/baltimore_restaurants.json"
ANALYTICS_FILE = "../data/analytics.json"
SESSION_RESULTS_DIR = "../logs/session_results/"

BALTIMORE_ZIP_CODES = [
    '21201', '21202', '21205', '21206', '21209', '21210', '21211', '21212',
    '21213', '21214', '21215', '21216', '21217', '21218', '21223', '21224',
    '21225', '21226', '21227', '21229', '21230', '21231', '21234', '21236',
    '21239', '21251', '21287'
]

# Restaurant name mapping: Display Name → Portal Search Name
# For restaurants already scraped successfully, the key and value are the same.
# For restaurants with different names in the portal, map the display name to the portal name.
RESTAURANT_NAME_MAP = {
    # Already found (name same in portal)
    "The Food Market": "The Food Market",
    "Clavel": "Clavel",
    "Thames Street Oyster House": "Thames Street Oyster House",
    "Ekiben": "Ekiben",
    "The Charmery": "The Charmery",
    "The Helmand": "The Helmand",
    "Red Emma's": "Red Emma's",
    "Grano Pasta Bar": "Grano Pasta Bar",
    "Pete's Grille": "Pete's Grille",
    "Matsuri": "Matsuri",
    "Abbey Burger Bistro": "Abbey Burger Bistro",
    "Wiley Gunters": "Wiley Gunters",
    "Vaccaro's Italian Pastry Shop": "Vaccaro's Italian Pastry Shop",
    "La Tavola": "La Tavola",
    "Amicci's": "Amicci's",
    "Charleston": "Charleston",
    "Azumi": "Azumi",
    "Iron Rooster": "Iron Rooster",

    # Inner Harbor / Downtown
    "Phillips Seafood": "PHILLIPS SEAFOOD",
    "McCormick & Schmick's": "MCCORMICK & SCHMICK'S SEAFOOD",
    "Hard Rock Cafe Baltimore": "HARD ROCK CAFE",
    
    # Fells Point / Canton
    "The Horse You Came In On Saloon": "HORSE YOU CAME IN ON SALOON",
    "Sláinte Irish Pub": "SLAINTE IRISH PUB",
    "Barcocina": "BARCOCINA",
    "Di Pasquale's": "DI PASQUALE'S MARKETPLACE",
    "Of Love and Regret": "OF LOVE AND REGRET",
    
    # Little Italy
    "Sabatino's": "SABATINO'S ITALIAN RESTAURANT",
    "Chiapparelli's": "CHIAPPARELLI'S",
    "Aldo's": "ALDO'S RISTORANTE ITALIANO",
    "Ciao Bella": "CIAO BELLA",
    
    # Federal Hill
    "Ryleigh's Oyster": "RYLEIGH'S OYSTER",
    "Cross Street Market": "CROSS STREET MARKET",
    
    # Harbor East
    "The Capital Grille": "CAPITAL GRILLE",
    "Roy's Restaurant": "ROY'S RESTAURANT",
    "Ouzo Bay": "OUZO BAY",
    "Cinghiale": "CINGHIALE",
    
    # Mt. Vernon / Station North
    "The Brewer's Art": "BREWER'S ART",
    "Dooby's": "DOOBY'S",
    "Joe Squared": "JOE SQUARED PIZZA",
    
    # Hampden
    "Cafe Hon": "CAFE HON",
    "Dylan's Oyster Cellar": "DYLAN'S OYSTER CELLAR",
    "The Wine Source": "WINE SOURCE",
    
    # Charles Village / Remington
    "R House": "R HOUSE",
    "Sophomore Coffee": "SOPHOMORE COFFEE",
    
    # Power Plant / Inner Harbor
    "Medieval Times": "MEDIEVAL TIMES DINNER & TOURNAMENT",
    "Tir Na Nog Irish Bar": "TIR NA NOG IRISH BAR",
    
    # Locust Point
    "Nick's Fish House": "NICK'S FISH HOUSE",
    "Bluegrass Tavern": "BLUEGRASS TAVERN",
    
    # Popular Chains
    "Chipotle Mexican Grill": "CHIPOTLE",
    "The Cheesecake Factory": "CHEESECAKE FACTORY",
    "P.F. Chang's": "P.F. CHANG'S CHINA BISTRO",
    
    # Brunch / Diners
    "Papermoon Diner": "PAPER MOON DINER",
    
    # Pizza
    "Hersh's Pizza": "HERSH'S PIZZA & DRINKS",
    "Matthew's Pizza": "MATTHEW'S PIZZA",
    
    # Seafood
    "G&M Restaurant": "G & M RESTAURANT",
    "Bo Brooks": "BO BROOKS RESTAURANT",
    "Canton Dockside": "CANTON DOCKSIDE",

    # Aliases (display name → portal name)
    "Faidley's Seafood": "FAIDLEY'S EDP SEAFOOD INC STALL 21",
    "LP Steamers": "L.P. STEAMERS",
    "Miss Shirley's Cafe": "MISS SHIRLEY'S CAFÉ",
    "Blue Moon Cafe": "BLUE MOON CAFE",
    "Captain James": "CAPTAIN JAMES LANDING CRABSHED",
    "Max's Taphouse": "MAX'S ON BROADWAY",
    "Golden West Cafe": "GOLDEN WEST CAFÉ",
    "The Rusty Scupper": "RUSTY SCUPPER",

    # Add more mappings as you discover them from analytics
    # Format: "Display Name": "Portal Name",
}


class AnalyticsTracker:
    """Tracks restaurant search analytics across sessions"""

    def __init__(self, analytics_file=ANALYTICS_FILE):
        self.analytics_file = analytics_file
        self.analytics = self.load_analytics()

    def load_analytics(self):
        """Load analytics from JSON file or create new structure"""
        if os.path.exists(self.analytics_file):
            try:
                with open(self.analytics_file, 'r') as f:
                    return json.load(f)
            except (json.JSONDecodeError, IOError) as e:
                print(f"⚠️  Warning: Could not load analytics: {e}")
                return self._create_empty_analytics()
        else:
            return self._create_empty_analytics()

    def _create_empty_analytics(self):
        """Create empty analytics structure"""
        return {
            "metadata": {
                "created": datetime.now().isoformat(),
                "last_updated": datetime.now().isoformat(),
                "total_sessions": 0,
                "total_searches": 0
            },
            "restaurant_searches": {},
            "demand_analysis": {
                "not_found_restaurants": [],
                "top_searched_restaurants": []
            }
        }

    def save_analytics(self):
        """Save analytics to JSON file"""
        try:
            self.analytics["metadata"]["last_updated"] = datetime.now().isoformat()
            with open(self.analytics_file, 'w') as f:
                json.dump(self.analytics, f, indent=2)
        except IOError as e:
            print(f"⚠️  Warning: Could not save analytics: {e}")

    def _normalize_name(self, restaurant_name):
        """Normalize restaurant name for consistent matching"""
        return restaurant_name.strip().lower()

    def _get_or_create_restaurant_entry(self, restaurant_name):
        """Get existing restaurant entry or create new one"""
        norm_name = self._normalize_name(restaurant_name)
        searches = self.analytics["restaurant_searches"]

        # Find existing entry (case-insensitive)
        for key in searches:
            if self._normalize_name(key) == norm_name:
                return searches[key], key

        # Create new entry
        searches[restaurant_name] = {
            "search_count": 0,
            "last_searched": None,
            "status": "unknown",
            "first_success": None,
            "last_success": None,
            "failure_count": 0,
            "last_failure": None,
            "failure_reasons": [],
            "notes": []
        }
        return searches[restaurant_name], restaurant_name

    def record_search(self, restaurant_name):
        """Record a restaurant search attempt"""
        entry, key = self._get_or_create_restaurant_entry(restaurant_name)
        entry["search_count"] += 1
        entry["last_searched"] = datetime.now().isoformat()
        self.analytics["metadata"]["total_searches"] += 1

    def record_success(self, restaurant_name, violations_count=0, star_rating=None, violations=None):
        """Record successful scraping with violation details"""
        entry, key = self._get_or_create_restaurant_entry(restaurant_name)

        old_status = entry["status"]
        now = datetime.now().isoformat()

        if entry["first_success"] is None:
            entry["first_success"] = now

        entry["last_success"] = now
        entry["status"] = "successfully_scraped"

        # Save violation data
        entry["violations_count"] = violations_count
        if star_rating is not None:
            entry["star_rating"] = star_rating

        # Calculate severity breakdown from violations
        if violations:
            severity_counts = {"SEVERE": 0, "MAJOR": 0, "MODERATE": 0, "MINOR": 0, "UNKNOWN_MODERATE": 0}
            for v in violations:
                if isinstance(v, dict) and 'severity' in v:
                    severity = v['severity']
                    severity_counts[severity] = severity_counts.get(severity, 0) + 1
            entry["severity_breakdown"] = severity_counts

        # Check for status transition
        if old_status in ["not_found", "scraping_failed"]:
            entry["status"] = "previously_failed_now_success"
            entry["notes"].append(f"Status changed from '{old_status}' to 'success' at {now}")

    def record_failure(self, restaurant_name, reason):
        """Record scraping failure"""
        entry, key = self._get_or_create_restaurant_entry(restaurant_name)

        entry["failure_count"] += 1
        entry["last_failure"] = datetime.now().isoformat()
        entry["status"] = "scraping_failed"

        if reason not in entry["failure_reasons"]:
            entry["failure_reasons"].append(reason)

    def record_not_found(self, restaurant_name):
        """Record restaurant not found in portal"""
        entry, key = self._get_or_create_restaurant_entry(restaurant_name)

        entry["failure_count"] += 1
        entry["last_failure"] = datetime.now().isoformat()
        entry["status"] = "not_found"

        reason = "No restaurant found in portal"
        if reason not in entry["failure_reasons"]:
            entry["failure_reasons"].append(reason)

    def increment_session_count(self):
        """Increment total session count"""
        self.analytics["metadata"]["total_sessions"] += 1

    def sync_with_restaurant_map(self, restaurant_map):
        """
        Ensure analytics only contains restaurants from the current restaurant map.
        Removes any restaurants that are not in the map (from previous attempts).
        """
        current_restaurants = set(restaurant_map.keys())
        analytics_restaurants = set(self.analytics["restaurant_searches"].keys())

        # Find restaurants to remove (in analytics but not in current map)
        restaurants_to_remove = analytics_restaurants - current_restaurants

        if restaurants_to_remove:
            print(f"🧹 Cleaning up analytics: removing {len(restaurants_to_remove)} restaurants not in current list")
            for restaurant in restaurants_to_remove:
                del self.analytics["restaurant_searches"][restaurant]

            # Recalculate total searches based on remaining restaurants
            self.analytics["metadata"]["total_searches"] = sum(
                data["search_count"]
                for data in self.analytics["restaurant_searches"].values()
            )

    def get_demand_analysis(self):
        """Generate demand analysis for not found and top searched restaurants"""
        searches = self.analytics["restaurant_searches"]

        # Get not found restaurants
        not_found = []
        for name, data in searches.items():
            if data["status"] in ["not_found", "scraping_failed"]:
                not_found.append({
                    "name": name,
                    "search_count": data["search_count"]
                })

        # Get top searched restaurants
        top_searched = []
        for name, data in searches.items():
            top_searched.append({
                "name": name,
                "search_count": data["search_count"]
            })

        # Sort by search count
        not_found.sort(key=lambda x: x["search_count"], reverse=True)
        top_searched.sort(key=lambda x: x["search_count"], reverse=True)

        # Update demand analysis
        self.analytics["demand_analysis"]["not_found_restaurants"] = not_found[:10]
        self.analytics["demand_analysis"]["top_searched_restaurants"] = top_searched[:10]

        return {
            "not_found": not_found[:10],
            "top_searched": top_searched[:10]
        }


class SessionTracker:
    """Tracks results for the current scraping session"""

    def __init__(self, session_id):
        self.session_id = session_id
        self.start_time = datetime.now()
        self.results = {
            "successfully_scraped": [],
            "already_exists": [],
            "not_found": [],
            "scraping_failed": []
        }

    def add_result(self, restaurant_name, status, details=None):
        """Add a result to the session"""
        result_entry = {
            "name": restaurant_name,
            "status": status,
            "timestamp": datetime.now().isoformat()
        }

        if details:
            result_entry.update(details)

        if status == "success":
            self.results["successfully_scraped"].append(result_entry)
        elif status == "already_exists":
            self.results["already_exists"].append(result_entry)
        elif status == "not_found":
            self.results["not_found"].append(result_entry)
        elif status == "failed":
            self.results["scraping_failed"].append(result_entry)

    def get_summary(self):
        """Generate session summary statistics"""
        success_count = len(self.results["successfully_scraped"])
        already_exists_count = len(self.results["already_exists"])
        not_found_count = len(self.results["not_found"])
        failed_count = len(self.results["scraping_failed"])

        total_attempted = success_count + already_exists_count + not_found_count + failed_count
        success_rate = (success_count / total_attempted * 100) if total_attempted > 0 else 0

        return {
            "success_count": success_count,
            "already_exists_count": already_exists_count,
            "not_found_count": not_found_count,
            "failed_count": failed_count,
            "success_rate": f"{success_rate:.1f}%"
        }

    def save_session_report(self):
        """Save session report to JSON file"""
        # Create session_results directory if it doesn't exist
        os.makedirs(SESSION_RESULTS_DIR, exist_ok=True)

        end_time = datetime.now()
        duration_seconds = (end_time - self.start_time).total_seconds()

        report = {
            "session_id": self.session_id,
            "start_time": self.start_time.isoformat(),
            "end_time": end_time.isoformat(),
            "duration_seconds": int(duration_seconds),
            "restaurants_attempted": sum(len(v) for v in self.results.values()),
            "results": self.results,
            "summary": self.get_summary()
        }

        filename = f"{SESSION_RESULTS_DIR}scraper_session_{self.session_id}.json"
        try:
            with open(filename, 'w') as f:
                json.dump(report, f, indent=2)
            return filename
        except IOError as e:
            print(f"⚠️  Warning: Could not save session report: {e}")
            return None


class BaltimoreZipScraper:
    def __init__(self, output_file=None):
        self.restaurants = []
        self.playwright = None
        self.browser = None
        self.page = None
        self.download_dir = Path("../logs/downloads")
        self.download_dir.mkdir(exist_ok=True, parents=True)

        # Set output file (can be overridden for test mode)
        self.output_file = output_file if output_file else OUTPUT_FILE_JSON

        # Initialize analytics and session tracking
        self.analytics_tracker = AnalyticsTracker()
        self.session_tracker = SessionTracker(session_id=datetime.now().strftime("%Y%m%d_%H%M%S"))

    def start(self):
        print("Starting browser...")
        self.playwright = sync_playwright().start()
        self.browser = self.playwright.chromium.launch(
            headless=False,
            downloads_path=str(self.download_dir)
        )
        context = self.browser.new_context(accept_downloads=True)
        self.page = context.new_page()
        self.page.set_default_timeout(30000)
        print("✓ Browser ready!\n")

    def close(self):
        if self.browser:
            self.browser.close()
        if self.playwright:
            self.playwright.stop()

    def restaurant_exists_in_db(self, restaurant_name):
        """Check if restaurant already exists in baltimore_restaurants.json
        (checks both display name and portal name)"""
        if not os.path.exists(OUTPUT_FILE_JSON):
            return False

        try:
            with open(OUTPUT_FILE_JSON, 'r') as f:
                existing_restaurants = json.load(f)

            # Normalize for case-insensitive comparison
            norm_name = restaurant_name.strip().lower()
            portal_name = self.get_portal_name(restaurant_name).strip().lower()

            for restaurant in existing_restaurants:
                db_name = restaurant.get('name', '').strip().lower()
                # Check both display name and portal name
                if db_name == norm_name or db_name == portal_name:
                    return True
            return False
        except (json.JSONDecodeError, IOError):
            return False

    def get_restaurant_from_db(self, restaurant_name):
        """Retrieve existing restaurant data from baltimore_restaurants.json"""
        if not os.path.exists(OUTPUT_FILE_JSON):
            return None

        try:
            with open(OUTPUT_FILE_JSON, 'r') as f:
                existing_restaurants = json.load(f)

            # Normalize for case-insensitive comparison
            norm_name = restaurant_name.strip().lower()
            for restaurant in existing_restaurants:
                if restaurant.get('name', '').strip().lower() == norm_name:
                    return restaurant
            return None
        except (json.JSONDecodeError, IOError):
            return None

    def print_analytics_summary(self):
        """Print user-friendly analytics summary at end of session"""
        print("\n" + "=" * 60)
        print("📊 SCRAPING SESSION SUMMARY")
        print("=" * 60)

        # Session summary
        summary = self.session_tracker.get_summary()
        duration = (datetime.now() - self.session_tracker.start_time).total_seconds()
        minutes = int(duration // 60)
        seconds = int(duration % 60)

        print(f"Session ID: {self.session_tracker.session_id}")
        print(f"Duration: {minutes}m {seconds}s\n")

        print("Results:")
        print(f"  ✓ Successfully scraped: {summary['success_count']}")
        print(f"  ⏭️  Already in database: {summary['already_exists_count']}")
        print(f"  ❌ Not found in portal: {summary['not_found_count']}")
        print(f"  ⚠️  Scraping failed: {summary['failed_count']}")
        print(f"\nSuccess Rate: {summary['success_rate']}")

        # Analytics insights
        print("\n" + "=" * 60)
        print("📈 ANALYTICS INSIGHTS")
        print("=" * 60)

        demand = self.analytics_tracker.get_demand_analysis()

        # Top searched restaurants
        if demand['top_searched']:
            print("Top Searched Restaurants (All Time):")
            for i, restaurant in enumerate(demand['top_searched'][:5], 1):
                print(f"  {i}. {restaurant['name']} - {restaurant['search_count']} searches")

        # High demand restaurants not in database
        if demand['not_found']:
            print("\nHigh-Demand Restaurants NOT in Database:")
            for i, restaurant in enumerate(demand['not_found'][:5], 1):
                print(f"  {i}. {restaurant['name']} - {restaurant['search_count']} searches")
            print("\n💡 Consider adding these restaurants to your scraping list!")

        print("=" * 60)

    def get_portal_name(self, restaurant_name):
        """Get the portal search name from the map"""
        return RESTAURANT_NAME_MAP.get(restaurant_name, restaurant_name)

    def get_display_name(self, restaurant_name):
        """Get the display name from a portal name (reverse lookup)"""
        # Check if this is a portal name (value in the map)
        for display_name, portal_name in RESTAURANT_NAME_MAP.items():
            if portal_name.lower() == restaurant_name.lower():
                return display_name
        # If not found in map, return the original name
        return restaurant_name

    def search_by_restaurant_name(self, restaurant_name):
        print(f"🍽️  Searching restaurant: {restaurant_name}")

        # Record search attempt in analytics (using display name)
        self.analytics_tracker.record_search(restaurant_name)

        # Get the portal name for searching
        portal_name = self.get_portal_name(restaurant_name)

        if portal_name != restaurant_name:
            print(f"  🔄 Using portal alias: '{portal_name}'")

        try:
            self.page.goto(BASE_URL, wait_until='domcontentloaded', timeout=60000)
            time.sleep(3)  # Increased wait

            # Try to find the restaurant name input field
            # Similar to zip code, the field name might vary
            name_input = self.page.query_selector('input[name="ctl00$FeaturedContent$txtEstablishment"]')
            if not name_input:
                name_input = self.page.query_selector('input[type="text"][name*="Establishment"]')
            if not name_input:
                name_input = self.page.query_selector('input[type="text"][name*="name"]')
            if not name_input:
                print("  ❌ Cannot find restaurant name input")
                # Record as failure
                self.analytics_tracker.record_failure(restaurant_name, "Cannot find restaurant name input field")
                self.session_tracker.add_result(restaurant_name, "failed", {"error": "Cannot find restaurant name input field"})
                return

            # Use portal name for the search
            name_input.fill(portal_name)
            time.sleep(0.5)
            search_button = self.page.query_selector('input[name="ctl00$FeaturedContent$Button1"]')
            if search_button:
                search_button.click()
            else:
                name_input.press('Enter')

            print("  ⏳ Waiting for results...")
            time.sleep(5)  # Increased wait for results
            # Parse using the DISPLAY name (this is what goes in JSON)
            self.parse_restaurant_list_by_name(restaurant_name)
        except Exception as e:
            print(f"  ❌ ERROR: {e}")
            # Record as failure
            self.analytics_tracker.record_failure(restaurant_name, str(e))
            self.session_tracker.add_result(restaurant_name, "failed", {"error": str(e)})

    def search_by_zipcode(self, zipcode):
        print(f"📍 Searching zip code: {zipcode}")
        try:
            self.page.goto(BASE_URL, wait_until='domcontentloaded', timeout=60000)
            time.sleep(3)  # Increased wait

            zip_input = self.page.query_selector('input[name="ctl00$FeaturedContent$txtcode"]')
            if not zip_input:
                zip_input = self.page.query_selector('input[type="text"][name*="zip"]')
            if not zip_input:
                print("  ❌ Cannot find zip code input")
                return

            zip_input.fill(zipcode)
            time.sleep(0.5)
            search_button = self.page.query_selector('input[name="ctl00$FeaturedContent$Button1"]')
            if search_button:
                search_button.click()
            else:
                zip_input.press('Enter')

            print("  ⏳ Waiting for results...")
            time.sleep(5)  # Increased wait for slow zip codes
            self.parse_restaurant_list(zipcode)
        except Exception as e:
            print(f"  ❌ ERROR: {e}")

    def parse_restaurant_list_by_name(self, restaurant_name):
        print("  📋 Parsing restaurant results...")
        try:
            rows = self.page.query_selector_all('table tr')
            if len(rows) <= 1:
                print("  ℹ️ No restaurant found")
                # Record as not found
                self.analytics_tracker.record_not_found(restaurant_name)
                self.session_tracker.add_result(restaurant_name, "not_found", {"error": "No restaurant found in portal"})
                return

            # For name search, usually get exact match, so process first result
            for i, row in enumerate(rows[1:]):
                try:
                    cells = row.query_selector_all('td')
                    if len(cells) < 2:
                        continue
                    name = cells[0].inner_text().strip()
                    address = cells[1].inner_text().strip() if len(cells) > 1 else ''

                    # Try to extract zipcode from address field
                    zipcode_match = re.search(r'\b(\d{5})\b', address)
                    zipcode = zipcode_match.group(1) if zipcode_match else None

                    # If not in address, check if there's a separate zipcode column
                    if not zipcode and len(cells) > 2:
                        for cell in cells[2:]:
                            cell_text = cell.inner_text().strip()
                            zipcode_match = re.search(r'\b(\d{5})\b', cell_text)
                            if zipcode_match:
                                zipcode = zipcode_match.group(1)
                                break

                    inspection_link = cells[-1].query_selector('a') if len(cells) > 2 else None
                    if not inspection_link:
                        inspection_link = row.query_selector('a')

                    if inspection_link:
                        print(f"    ✓ Found: {name}")
                        inspection_link.click()
                        time.sleep(2)
                        inspection_data = self.get_latest_inspection()

                        # Try to get ZIP code from inspection data (PDF/detail page)
                        if not zipcode and inspection_data:
                            zipcode = inspection_data.get('zipcode')

                        # Last resort: try current page text
                        if not zipcode:
                            page_text = self.page.inner_text('body')
                            zipcode_match = re.search(r'\b(\d{5})(?:-\d{4})?\b', page_text)
                            if zipcode_match:
                                zipcode = zipcode_match.group(1)

                        if inspection_data:
                            # Remove zipcode from inspection_data to avoid duplication
                            inspection_data.pop('zipcode', None)
                            restaurant = {
                                'id': len(self.restaurants) + 1,
                                'name': name,
                                'address': address,
                                'zipcode': zipcode if zipcode else 'Unknown',
                                'city': 'Baltimore',
                                'state': 'MD',
                                **inspection_data
                            }
                            self.restaurants.append(restaurant)
                            violations_count = len(inspection_data.get('violations', []))
                            star_rating = inspection_data.get('star_rating', 0)
                            print(f"        ✓ Star Rating: {star_rating} stars")
                            print(f"        ✓ Violations: {violations_count}")
                            if zipcode:
                                print(f"        ✓ ZIP: {zipcode}")

                            # Record success with violation details
                            self.analytics_tracker.record_success(
                                restaurant_name,
                                violations_count,
                                star_rating=star_rating,
                                violations=inspection_data.get('violations', [])
                            )
                            self.session_tracker.add_result(restaurant_name, "success", {"violations_found": violations_count})
                        else:
                            # Inspection data extraction failed
                            self.analytics_tracker.record_failure(restaurant_name, "Inspection data extraction failed")
                            self.session_tracker.add_result(restaurant_name, "failed", {"error": "Inspection data extraction failed"})

                        self.page.go_back()
                        time.sleep(1)
                        break  # Only process first match for name search
                except Exception as e:
                    print(f"    ⚠️ Error on row {i}: {e}")
                    # Record row processing failure
                    self.analytics_tracker.record_failure(restaurant_name, f"Row processing error: {str(e)}")
                    self.session_tracker.add_result(restaurant_name, "failed", {"error": f"Row processing error: {str(e)}"})
                    continue
        except Exception as e:
            print(f"  ❌ ERROR parsing list: {e}")
            # Record parsing failure
            self.analytics_tracker.record_failure(restaurant_name, f"Parse list error: {str(e)}")
            self.session_tracker.add_result(restaurant_name, "failed", {"error": f"Parse list error: {str(e)}"})

    def parse_restaurant_list(self, zipcode):
        print("  📋 Parsing restaurant list...")
        try:
            rows = self.page.query_selector_all('table tr')
            if len(rows) <= 1:
                print("  ℹ️ No restaurants found")
                return

            count = 0
            for i, row in enumerate(rows[1:]):
                try:
                    cells = row.query_selector_all('td')
                    if len(cells) < 2:
                        continue
                    name = cells[0].inner_text().strip()
                    address = cells[1].inner_text().strip() if len(cells) > 1 else ''
                    inspection_link = cells[-1].query_selector('a') if len(cells) > 2 else None
                    if not inspection_link:
                        inspection_link = row.query_selector('a')
                    if inspection_link:
                        count += 1
                        print(f"    [{count}] {name}")
                        inspection_link.click()
                        time.sleep(2)
                        inspection_data = self.get_latest_inspection()
                        if inspection_data:
                            restaurant = {
                                'id':len(self.restaurants) + 1,
                                'name': name,
                                'address': address,
                                'zipcode': zipcode,
                                'city': 'Baltimore',
                                'state': 'MD',
                                **inspection_data
                            }
                            self.restaurants.append(restaurant)
                            print(f"        ✓ Violations: {len(inspection_data.get('violations', []))}")
                        self.page.go_back()
                        time.sleep(1)
                    if count >= 10:
                        break
                except Exception as e:
                    print(f"    ⚠️ Error on row {i}: {e}")
                    continue
            print(f"  ✓ Found {count} restaurants in {zipcode}\n")
        except Exception as e:
            print(f"  ❌ ERROR parsing list: {e}")

    def get_latest_inspection(self):
        try:
            time.sleep(1)
            date_links = self.page.query_selector_all('table tr a')
            if not date_links:
                print("        ⚠️ No inspection dates found")
                return None
            with self.page.expect_download() as download_info:
                date_links[0].click()
                time.sleep(2)
            try:
                download = download_info.value
                pdf_path = download.path()
                inspection_data = self.extract_from_pdf(pdf_path)
                os.remove(pdf_path)  # Clean up
            except Exception as e:
                print(f"        ⚠️ PDF error: {e}")
                inspection_data = self.extract_inspection_data()
            self.page.go_back()
            time.sleep(0.5)
            return inspection_data
        except Exception as e:
            print(f"        ⚠️ Error: {e}")
            return None

    # Violation severity categories (based on real Baltimore inspection data)
    SEVERE_VIOLATIONS = {
        6: "Food temperature abuse (potentially hazardous)",
        22: "Pest infestation evidence (rodents/roaches)",
        43: "Illness complaint investigation"
    }

    MAJOR_VIOLATIONS = {
        10: "Improper thawing methods",
        13: "Temperature monitoring failure",
        19: "Handwashing facility issues",
        20: "Chemical/toxic material safety",
        33: "HACCP plan deficiency"
    }

    MODERATE_VIOLATIONS = {
        16: "Food storage violations",
        21: "Sanitizer/wiping cloth compliance",
        24: "Utensil storage and handling",
        25: "Equipment standards violation",
        30: "Equipment maintenance issues"
    }

    MINOR_VIOLATIONS = {
        17: "Uncovered employee beverage",
        23: "Single-use item mishandling",
        46: "Recommendations/non-violations"
    }

    def get_violation_severity(self, code):
        """
        Determine severity level for a violation code.
        Unknown codes default to MODERATE (conservative approach).
        """
        if code in self.SEVERE_VIOLATIONS:
            return "SEVERE"
        elif code in self.MAJOR_VIOLATIONS:
            return "MAJOR"
        elif code in self.MODERATE_VIOLATIONS:
            return "MODERATE"
        elif code in self.MINOR_VIOLATIONS:
            return "MINOR"
        else:
            return "UNKNOWN_MODERATE"

    def calculate_star_rating(self, violations):
        """
        Calculate star rating (1-5) based on violation severity, not just count.

        Severity-weighted system:
        - Any SEVERE violation (pest/illness/temp abuse) = 1 star
        - Considers both severity type and quantity
        - Unknown codes default to MODERATE severity

        Returns: Integer 1-5 (number of stars)
        """
        if len(violations) == 0:
            return 5

        # Count violations by severity
        severe_count = 0
        major_count = 0
        moderate_count = 0
        minor_count = 0
        unknown_codes = []

        for v in violations:
            code = v.get('code', 0)
            severity = self.get_violation_severity(code)

            if severity == "SEVERE":
                severe_count += 1
            elif severity == "MAJOR":
                major_count += 1
            elif severity == "MODERATE":
                moderate_count += 1
            elif severity == "MINOR":
                minor_count += 1
            elif severity == "UNKNOWN_MODERATE":
                moderate_count += 1
                unknown_codes.append(code)

        # Log unknown codes for review
        if unknown_codes:
            print(f"        ⚠️  Unknown violation codes: {set(unknown_codes)} (treated as MODERATE)")

        total_violations = len(violations)

        # Any severe violation = automatic 1 star
        if severe_count > 0:
            return 1

        # Weighted rating based on severity mix
        if total_violations == 1 and minor_count == 1:
            return 5  # Single minor violation = still perfect
        elif total_violations <= 2 and major_count == 0:
            return 4  # 1-2 moderate/minor violations
        elif total_violations <= 3:
            return 3  # 3 moderate violations or mix
        elif total_violations <= 5:
            return 2  # 4-5 violations
        else:
            return 1  # 6+ violations = serious problems

    def extract_from_pdf(self, pdf_path):
        data = {
            'star_rating': None,
            'last_inspection': None,
            'violations': [],
            'zipcode': None
        }

        try:
            with open(pdf_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                text = "".join([p.extract_text() for p in pdf_reader.pages if p.extract_text()])

            if not text:
                return data

            # Extract date
            date_match = re.search(r'(\d{1,2}/\d{1,2}/\d{4})', text)
            if date_match:
                data['last_inspection'] = date_match.group(1)

            # Extract ZIP code
            zipcode_match = re.search(r'\b(\d{5})(?:-\d{4})?\b', text)
            if zipcode_match:
                data['zipcode'] = zipcode_match.group(1)

            # Extract violations
            data['violations'] = self.parse_violations(text)

            # Calculate star rating based on violation severity
            data['star_rating'] = self.calculate_star_rating(data['violations'])

        except Exception as e:
            print(f"        ⚠️ PDF extraction error: {e}")

        return data

    def extract_inspection_data(self):
        data = {
            'star_rating': None,
            'last_inspection': None,
            'violations': [],
            'zipcode': None
        }
        try:
            page_text = self.page.inner_text('body')
            date_match = re.search(r'(\d{1,2}/\d{1,2}/\d{4})', page_text)
            if date_match:
                data['last_inspection'] = date_match.group(1)

            # Extract ZIP code
            zipcode_match = re.search(r'\b(\d{5})(?:-\d{4})?\b', page_text)
            if zipcode_match:
                data['zipcode'] = zipcode_match.group(1)

            data['violations'] = self.parse_violations(page_text)

            # Calculate star rating based on violation severity
            data['star_rating'] = self.calculate_star_rating(data['violations'])
        except Exception as e:
            print(f"        ⚠️ Error: {e}")
        return data

    def parse_violations(self, text):
        """
        BULLETPROOF violation parser.
        Handles: long violations, short violations, multiple violations, no violations.
        """
        violations = []
        
        # Step 1: Find the OBSERVATIONS section
        # Use lookahead to capture everything until the signature line
        patterns = [
            r'OBSERVATIONS AND CORRECTIVE ACTIONS(.+?)(?=Person-in-charge\s*\(Signature\))',
            r'OBSERVATIONS AND CORRECTIVE ACTIONS(.+?)(?=Inspector \(Print\))',
            r'OBSERVATIONS(.+?)(?=Person-in-charge\s*\(Signature\))',
        ]
        
        obs_section = None
        for pattern in patterns:
            match = re.search(pattern, text, re.DOTALL | re.IGNORECASE)
            if match:
                obs_section = match.group(1)
                break
        
        if not obs_section:
            return []  # No observations section found
        
        # Step 2: Split into lines and parse
        lines = obs_section.split('\n')
        current_violation = None
        
        for line in lines:
            line = line.strip()
            
            # Skip very short or empty lines
            if len(line) < 5:
                continue
            
            # Skip known junk headers
            junk_keywords = ['Item', 'Number', 'Corrected', 'Violations cited', 
                           'Repeat', 'must be corrected', 'frame.Repeat', 
                           'within the specified']
            if any(junk in line for junk in junk_keywords):
                continue
            
            # Check if this line starts a NEW violation (number at start)
            # Handles both "19 The" and "19The" (with or without space)
            violation_start = re.match(r'^(\d+)\s*(.+)', line)
            
            if violation_start:
                # Save the previous violation if it exists
                if current_violation:
                    violations.append(current_violation)
                
                # Start new violation
                code = int(violation_start.group(1))
                description = violation_start.group(2).strip()
                
                # Only create a violation if the description looks real
                # Real violations have meaningful text, not just "Violations" or "Item"
                if len(description) > 10:
                    current_violation = {
                        'code': code,
                        'description': description,
                        'severity': self.get_violation_severity(code),
                        'corrected_on_site': False
                    }
                else:
                    current_violation = None
            
            elif current_violation:
                # This line continues the current violation
                
                # Check for "Corrected On Site" marker
                if 'Corrected On Site:' in line:
                    if '[X]' in line or '[x]' in line.lower():
                        current_violation['corrected_on_site'] = True
                    continue  # Don't add this line to description
                
                # Append continuation text
                current_violation['description'] += ' ' + line
        
        # Don't forget the last violation
        if current_violation:
            violations.append(current_violation)
        
        # Step 3: Combine violations with the same code
        # Group by code and merge descriptions with numbering
        violations_by_code = {}
        for v in violations:
            code = v['code']
            if code not in violations_by_code:
                violations_by_code[code] = {
                    'code': code,
                    'descriptions': [v['description']],
                    'status': v['status'],
                    'corrected_on_site': v['corrected_on_site']
                }
            else:
                # Append to existing violation with same code
                violations_by_code[code]['descriptions'].append(v['description'])
        
        # Convert back to list with numbered descriptions
        violations = []
        for code, data in violations_by_code.items():
            if len(data['descriptions']) == 1:
                # Single violation - no numbering needed
                description = data['descriptions'][0]
            else:
                # Multiple violations - number them
                description = ' '.join([
                    f"({i+1}) {desc}" 
                    for i, desc in enumerate(data['descriptions'])
                ])
            
            violations.append({
                'code': code,
                'description': description,
                'status': data['status'],
                'corrected_on_site': data['corrected_on_site']
            })
        
        # Step 4: Clean up all violations
        for violation in violations:
            # Remove "Corrected On Site: []" markers
            violation['description'] = re.sub(
                r'Corrected On Site:\s*\[.*?\]', 
                '', 
                violation['description'], 
                flags=re.IGNORECASE
            )
            
            # Remove extra whitespace
            violation['description'] = ' '.join(violation['description'].split())
            
            # Check if this is a "no violations" entry
            if 'no violations observed' in violation['description'].lower():
                # Don't include "no violations" as actual violations
                violations.remove(violation)
                continue
            
            # Truncate if absurdly long (keep 1500 chars for LLM)
            if len(violation['description']) > 1500:
                violation['description'] = violation['description'][:1500] + '...'
        
        return violations

    def save_to_json(self):
        if not self.restaurants:
            print("\n⚠️ No restaurants found!")
            return
        with open(self.output_file, 'w', encoding='utf-8') as f:
            json.dump(self.restaurants, f, indent=2)
        print(f"\n✅ Saved {len(self.restaurants)} restaurants to {self.output_file}")

        total_violations = sum(len(r.get('violations', [])) for r in self.restaurants)
        print(f"📊 Total violations found: {total_violations}")

    def run(self, restaurants=None, zip_codes=None):
        """
        Run scraper by restaurant names OR zip codes.
        Priority: restaurants > zip_codes
        """
        if restaurants is None and zip_codes is None:
            restaurants = list(RESTAURANT_NAME_MAP.keys())[:5]  # Default to first 5 restaurants

        print("="*60)
        print("🦀 Baltimore Restaurant Health Scraper")
        print("="*60)

        # Sync analytics with current restaurant map (removes old restaurants from analytics)
        self.analytics_tracker.sync_with_restaurant_map(RESTAURANT_NAME_MAP)

        # Increment session count
        self.analytics_tracker.increment_session_count()

        self.start()
        try:
            if restaurants:
                print(f"📋 Searching {len(restaurants)} restaurants by name...\n")
                for restaurant_name in restaurants:
                    # Check if restaurant already exists in database
                    if self.restaurant_exists_in_db(restaurant_name):
                        print(f"🍽️  Restaurant: {restaurant_name}")
                        print("  ⏭️  Already in database, skipping...\n")
                        self.session_tracker.add_result(restaurant_name, "already_exists", {"reason": "Already in database with data"})
                        # Still record the search attempt
                        self.analytics_tracker.record_search(restaurant_name)
                    else:
                        # Proceed with scraping
                        self.search_by_restaurant_name(restaurant_name)
                    time.sleep(1)
            elif zip_codes:
                print(f"📍 Searching {len(zip_codes)} ZIP codes...\n")
                for zipcode in zip_codes:
                    self.search_by_zipcode(zipcode)
                    time.sleep(1)

            # Save scraped data
            self.save_to_json()

            # Save session report
            session_file = self.session_tracker.save_session_report()
            if session_file:
                print(f"\n📄 Session report saved: {session_file}")

            # Save analytics
            self.analytics_tracker.save_analytics()
            print(f"📊 Analytics updated: {ANALYTICS_FILE}")

        except KeyboardInterrupt:
            print("\n⏸️ Interrupted")
            self.save_to_json()
            # Still save session and analytics on interrupt
            self.session_tracker.save_session_report()
            self.analytics_tracker.save_analytics()
        except Exception as e:
            print(f"\n❌ Fatal error: {e}")
            # Save session and analytics even on error
            self.session_tracker.save_session_report()
            self.analytics_tracker.save_analytics()
        finally:
            self.close()

        print("\n" + "="*60)
        print(f"✅ DONE! {len(self.restaurants)} restaurants")
        print("="*60)

        # Print analytics summary
        self.print_analytics_summary()

def quick_test():
    print("🧪 Quick test with a few restaurants...\n")
    # Use separate test output file
    scraper = BaltimoreZipScraper(output_file="../data/test_baltimore_restaurants.json")
    test_restaurants = ["Faidley's Seafood", "The Food Market", "Ekiben",
    "Golden West Cafe",
    "The Corner Pantry"]
    scraper.run(restaurants=test_restaurants)
    if scraper.restaurants:
        print("\n📋 Sample results:")
        for r in scraper.restaurants[:5]:
            print(f"\n{r['name']}")
            print(f"  Date: {r.get('last_inspection', 'N/A')}")
            print(f"  Star Rating: {r.get('star_rating', 'N/A')} stars")
            print(f"  Violations: {len(r.get('violations', []))}")
            for v in r.get('violations', [])[:2]:
                print(f"    [{v['code']}] {v['description'][:80]}...")

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == '--test':
        quick_test()
    else:
        scraper = BaltimoreZipScraper()
        # Run all restaurants from the map
        scraper.run(restaurants=list(RESTAURANT_NAME_MAP.keys()))

        # To use ZIP codes instead, uncomment this:
        # scraper.run(zip_codes=BALTIMORE_ZIP_CODES)
