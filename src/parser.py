import json
import re
from datetime import datetime
from decimal import Decimal, InvalidOperation
from typing import Any, Dict, List, Optional
from urllib.parse import urljoin
from bs4 import BeautifulSoup, Tag

BASE_URL = "https://www.njuskalo.hr"

# Regex patterns
AD_ID_URL_RE = re.compile(r"-oglas-(\d+)(?:$|[/?#])")
PRICE_EUR_RE = re.compile(r"([\d\.,]+)\s*€")
AREA_M2_RE = re.compile(
    r"(?:Stambena površina|Površina|Ukupna površina)?\s*:?\s*(\d+(?:[\.,]\d+)?)\s*m(?:2|²)",
    re.IGNORECASE,
)
YEAR_RE = re.compile(r"\b(1[789]\d{2}|20\d{2})\b")


def parse_croatian_decimal(text: Optional[str]) -> Optional[Decimal]:
    """
    Parse Croatian formatted numbers like '245.000 €', '185.000,00 €', or '64,50 m²'
    into a Python Decimal.
    """
    if not text:
        return None
    # Strip currency, units, and whitespace
    cleaned = re.sub(r"[^\d,\.]", "", text.strip())
    if not cleaned:
        return None

    # Handle Croatian thousand separator '.' and decimal separator ','
    if "," in cleaned and "." in cleaned:
        if cleaned.rfind(",") > cleaned.rfind("."):
            cleaned = cleaned.replace(".", "").replace(",", ".")
        else:
            cleaned = cleaned.replace(",", "")
    elif "," in cleaned:
        cleaned = cleaned.replace(",", ".")
    elif "." in cleaned:
        # If there are multiple dots or 3 digits after dot (like 250.000), treat as thousands
        parts = cleaned.split(".")
        if len(parts) > 2 or (len(parts) == 2 and len(parts[1]) == 3):
            cleaned = "".join(parts)

    try:
        return Decimal(cleaned)
    except InvalidOperation:
        return None


def extract_njuskalo_id(url: str, element: Optional[Tag] = None) -> Optional[str]:
    """Extract numeric Njuškalo ad ID from data attribute or URL."""
    if element:
        for attr in ("data-CachedEntity-id", "data-entity-id", "data-id", "id"):
            val = element.get(attr)
            if val:
                digits = re.sub(r"\D", "", str(val))
                if digits:
                    return digits
    match = AD_ID_URL_RE.search(url)
    if match:
        return match.group(1)
    return None


def parse_datetime_iso(raw_dt: Optional[str]) -> Optional[datetime]:
    if not raw_dt:
        return None
    try:
        return datetime.fromisoformat(raw_dt.strip())
    except ValueError:
        return None


def parse_search_results_page(html: str, category_name: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Parse Njuškalo search/category listing page and return a list of card dictionaries.
    Supports both Njuškalo's modern Vue/SSR `.listings .listing` cards and legacy `.EntityList-item` cards,
    while ignoring global sidebar 'Latest ads' (`EntityList--Latest`).
    """
    soup = BeautifulSoup(html, "lxml")
    results: List[Dict[str, Any]] = []
    seen_ids = set()

    # Select modern Vue cards (.listings .listing) and non-sidebar EntityList items
    items = soup.select(
        "li.listing, article.listing, li.EntityList-item:not(.EntityList-item--Latest), article.EntityList-item:not(.EntityList-item--Latest)"
    )
    for item in items:
        classes = item.get("class") or []
        class_str = " ".join(classes)

        # Skip banner/ad placeholders or global 'Latest ads' widget items
        if "EntityList-item--Banner" in class_str or "EntityList-item--Latest" in class_str:
            continue

        # Find link & title
        title_link = (
            item.select_one("h3.title a.link")
            or item.select_one("h3.entity-title a.link")
            or item.select_one(".title a")
            or item.select_one(".entity-title a")
            or item.select_one("a[href*='-oglas-']")
        )
        if not title_link:
            continue

        href = (title_link.get("href") or title_link.get("data-href") or "").strip()
        if not href or "-oglas-" not in href:
            continue

        full_url = urljoin(BASE_URL, href.split("?")[0])
        njuskalo_id = extract_njuskalo_id(full_url, item)
        if not njuskalo_id or njuskalo_id in seen_ids:
            continue
        seen_ids.add(njuskalo_id)

        title = title_link.get_text(" ", strip=True)

        # Determine ad tier
        ad_tier = "Regular"
        parent_classes = " ".join(
            " ".join(p.get("class") or []) for p in list(item.parents)[:3]
        )
        if "featuredStore" in parent_classes:
            ad_tier = "FeaturedStore"
        elif "VauVau" in class_str:
            ad_tier = "VauVau"
        elif (
            "isPromoted" in class_str
            or "Featured" in class_str
            or "Super" in class_str
            or item.select_one(".promotedMarker")
        ):
            ad_tier = "Featured"

        # Extract price in EUR
        price_el = (
            item.select_one(".price--eur")
            or item.select_one(".entity-prices .price")
            or item.select_one(".price p")
            or item.select_one(".price")
            or item.select_one(".price-item")
        )
        price_eur: Optional[Decimal] = None
        if price_el:
            price_eur = parse_croatian_decimal(price_el.get_text(" ", strip=True))
        else:
            price_match = PRICE_EUR_RE.search(item.get_text(" ", strip=True))
            if price_match:
                price_eur = parse_croatian_decimal(price_match.group(1))

        # Description / Location / Area in card summary
        loc_el = item.select_one(".locationText, .location")
        desc_el = item.select_one(".entity-description-main, .entity-description, .description")
        desc_text = desc_el.get_text(" ", strip=True) if desc_el else ""

        location_summary: Optional[str] = None
        living_area_m2: Optional[Decimal] = None

        if loc_el:
            location_summary = loc_el.get_text(" ", strip=True)

        if desc_text:
            if not location_summary:
                loc_match = re.search(r"Lokacija:\s*([^.\n]+)", desc_text, re.IGNORECASE)
                if loc_match:
                    location_summary = loc_match.group(1).strip()
                else:
                    location_summary = desc_text[:250].strip()

            area_match = AREA_M2_RE.search(desc_text)
            if area_match:
                living_area_m2 = parse_croatian_decimal(area_match.group(1))

        # Fallback: extract m2 from title if not in card summary (e.g. "Stan: Zagreb, 56.16 m2")
        if living_area_m2 is None:
            title_area_match = AREA_M2_RE.search(title)
            if title_area_match:
                living_area_m2 = parse_croatian_decimal(title_area_match.group(1))

        # Thumbnail image
        img_el = item.select_one(
            "a.image img, img.entity-thumbnail-img, .entity-thumbnail img, img[data-src], img[src]"
        )
        image_urls: List[str] = []
        if img_el:
            img_src = img_el.get("data-src") or img_el.get("src")
            if img_src and not img_src.startswith("data:"):
                image_urls.append(urljoin(BASE_URL, img_src))

        # Publication date
        time_el = item.select_one("time.createdAt, time.date, .entity-pub-date time, time[datetime]")
        published_at_raw = time_el.get_text(" ", strip=True) if time_el else None
        published_at = parse_datetime_iso(time_el.get("datetime")) if time_el else None

        results.append(
            {
                "njuskalo_id": njuskalo_id,
                "url": full_url,
                "title": title,
                "category_name": category_name,
                "ad_tier": ad_tier,
                "price_eur": price_eur,
                "living_area_m2": living_area_m2,
                "location_summary": location_summary,
                "published_at_raw": published_at_raw,
                "published_at": published_at,
                "image_urls": image_urls,
            }
        )

    return results


def has_next_page(html: str) -> bool:
    """Check if the search result page has a 'Next' pagination button or link."""
    soup = BeautifulSoup(html, "lxml")
    next_btn = soup.select_one(
        ".pagination-item--next, .Pagination-item--next, "
        "a.pagination-link--next, a.Pagination-link--next, "
        "button[aria-label*='Sljedeća'], button[aria-label*='sljedeća'], "
        "a[aria-label*='Sljedeća'], a[aria-label*='sljedeća']"
    )
    if next_btn is not None:
        return True

    # Fallback: check if any button or link text in pagination has 'Sljedeća'
    for el in soup.select("nav.pagination button, nav.pagination a, .pagination button, .pagination a"):
        txt = el.get_text(" ", strip=True).lower()
        if "sljedeća" in txt or "sljedeca" in txt or "next" in txt:
            return True

    return False


def parse_detail_page(html: str, url: str = "") -> Dict[str, Any]:
    """
    Parse a Njuškalo real estate detail page into normalized fields and a full attributes dict.
    """
    soup = BeautifulSoup(html, "lxml")
    data: Dict[str, Any] = {
        "attributes": {},
        "image_urls": [],
    }

    # 1. Title
    title_el = (
        soup.select_one("h1.ClassifiedDetailSummary-title")
        or soup.select_one(".ClassifiedDetailSummary h1")
        or soup.select_one("h1")
    )
    if title_el:
        data["title"] = title_el.get_text(" ", strip=True)

    # 2. Price
    price_el = (
        soup.select_one("dd.ClassifiedDetailSummary-priceDomestic")
        or soup.select_one(".ClassifiedDetailSummary-priceDomestic")
        or soup.select_one(".price--eur")
    )
    if price_el:
        data["price_eur"] = parse_croatian_decimal(price_el.get_text(" ", strip=True))

    # 3. Extract key-value pairs from HighlightedAttributes, BasicDetails & PropertyGroups
    attributes: Dict[str, Any] = {}

    # Highlighted top attributes (e.g., Stambena površina, Broj soba, Kat)
    for item in soup.select(".ClassifiedDetailHighlightedAttributes-listItem"):
        lbl = item.select_one(".ClassifiedDetailHighlightedAttributes-label")
        txt = item.select_one(".ClassifiedDetailHighlightedAttributes-text")
        if lbl and txt:
            key = lbl.get_text(" ", strip=True).rstrip(":")
            val = txt.get_text(" ", strip=True)
            if key and val:
                attributes[key] = val

    # Pattern A: dl / dt / dd pairs inside ClassifiedDetailBasicDetails
    dts = soup.select(
        ".ClassifiedDetailBasicDetails-listTerm, .ClassifiedDetailBasicDetails dt, .ClassifiedDetailPropertyGroups dt"
    )
    for dt in dts:
        dd = dt.find_next_sibling("dd")
        if dd:
            key = dt.get_text(" ", strip=True).rstrip(":")
            val = dd.get_text(" ", strip=True)
            if key and val:
                attributes[key] = val

    # Pattern B: table rows or two-column attribute blocks
    for row in soup.select(".ClassifiedDetailBasicDetails tr, .table-summary tr"):
        cells = row.find_all(["th", "td"])
        if len(cells) >= 2:
            key = cells[0].get_text(" ", strip=True).rstrip(":")
            val = cells[1].get_text(" ", strip=True)
            if key and val:
                attributes[key] = val

    # Pattern C: Additional property groups (e.g., Grijanje, Dozvole, Parkiranje, Oprema)
    for group in soup.select(".ClassifiedDetailPropertyGroups-group"):
        group_title_el = group.select_one(
            ".ClassifiedDetailPropertyGroups-groupTitle, h3, h4"
        )
        group_items = [
            li.get_text(" ", strip=True)
            for li in group.select("li.ClassifiedDetailPropertyGroups-groupListItem, ul li")
            if li.get_text(" ", strip=True)
        ]
        if group_title_el and group_items:
            g_key = group_title_el.get_text(" ", strip=True).rstrip(":")
            attributes[g_key] = ", ".join(group_items)

    data["attributes"] = attributes

    # 4. Map Croatian attribute keys to structured database columns
    for raw_key, raw_val in attributes.items():
        k = raw_key.lower()
        val_str = str(raw_val).strip()

        if "županija" in k:
            data["county"] = val_str
        elif k in ("grad/općina", "grad / općina", "grad", "mjesto"):
            data["city"] = val_str
        elif "naselje" in k or "četvrt" in k or "kvart" in k:
            data["neighborhood"] = val_str
        elif k == "lokacija":
            data["location_summary"] = val_str
            parts = [p.strip() for p in val_str.split(",") if p.strip()]
            if len(parts) >= 1 and not data.get("county"):
                data["county"] = parts[0]
            if len(parts) >= 2 and not data.get("city"):
                data["city"] = parts[1]
            if len(parts) >= 3 and not data.get("neighborhood"):
                data["neighborhood"] = parts[2]
        elif "tip stana" in k or "tip kuće" in k or "tip nekretnine" in k or "vrsta zemljišta" in k:
            data["property_type"] = val_str
        elif "stambena površina" in k or "neto površina" in k or k == "površina":
            parsed_area = parse_croatian_decimal(val_str)
            if parsed_area:
                data["living_area_m2"] = parsed_area
        elif "površina okućnice" in k or "površina zemljišta" in k or "ukupna površina zemljišta" in k:
            parsed_land = parse_croatian_decimal(val_str)
            if parsed_land:
                data["land_area_m2"] = parsed_land
        elif "broj soba" in k:
            data["rooms"] = val_str
        elif k == "kat":
            data["floor"] = val_str
        elif "ukupni broj katova" in k or "broj etaža" in k:
            data["total_floors"] = val_str
        elif "godina izgradnje" in k:
            yr_match = YEAR_RE.search(val_str)
            if yr_match:
                data["year_built"] = int(yr_match.group(1))
        elif "godina zadnje adaptacije" in k or "adaptacija" in k:
            yr_match = YEAR_RE.search(val_str)
            if yr_match:
                data["year_renovated"] = int(yr_match.group(1))
        elif "energetski razred" in k:
            data["energy_class"] = val_str
        elif "grijanje" in k:
            data["heating_type"] = val_str
        elif "parkir" in k or "garaž" in k:
            data["parking"] = val_str

    # Location summary fallback from county / city / neighborhood
    loc_parts = [
        p for p in (data.get("county"), data.get("city"), data.get("neighborhood")) if p
    ]
    if loc_parts:
        data["location_summary"] = ", ".join(loc_parts)

    # 5. Description text
    desc_el = (
        soup.select_one(".ClassifiedDetailDescription-text")
        or soup.select_one(".ClassifiedDetailDescription")
        or soup.select_one(".passage-standard")
    )
    if desc_el:
        data["description"] = desc_el.get_text("\n", strip=True)

    # 6. Seller / User / Agency details (for marketing & platform metrics)
    seller_link_el = (
        soup.select_one(".ClassifiedDetailOwnerDetails-title a")
        or soup.select_one(".ClassifiedDetailOwnerDetails-logo")
        or soup.select_one(".ClassifiedDetailOwnerDetails-linkAllAds")
        or soup.select_one(".ProfileCard-title a")
    )
    seller_title_el = (
        soup.select_one(".ClassifiedDetailOwnerDetails-title")
        or soup.select_one(".ProfileCard-title")
    )
    if seller_title_el:
        data["seller_name"] = seller_title_el.get_text(" ", strip=True)

    if seller_link_el and seller_link_el.get("href"):
        s_href = seller_link_el.get("href", "").strip()
        data["seller_url"] = urljoin(BASE_URL, s_href)
        path_parts = [p for p in s_href.strip("/").split("/") if p]
        if len(path_parts) >= 2:
            # e.g. /investitor/begamont-gradenje-stanovi or /trgovina/nekretnine-xyz or /korisnik/ivan123
            prefix = path_parts[0].lower()
            data["seller_slug"] = path_parts[1]
            if prefix in ("investitor", "trgovina", "korisnik", "agencija"):
                data["seller_type"] = prefix
            else:
                data["seller_type"] = prefix
        elif len(path_parts) == 1:
            data["seller_slug"] = path_parts[0]
            data["seller_type"] = "korisnik"

    if not data.get("seller_slug") and data.get("seller_name"):
        data["seller_slug"] = re.sub(r"[^a-z0-9]+", "-", data["seller_name"].lower()).strip("-")
        data["seller_type"] = data.get("seller_type") or "korisnik"

    data["seller_is_verified"] = (
        soup.select_one(".ClassifiedDetailOwnerDetails-verification, .icon--classifiedDetailViewVerified")
        is not None
    )

    # 7. Gallery images
    images: List[str] = []
    seen_imgs = set()

    # Check JSON-LD or data attributes for high-res gallery images
    for script in soup.select('script[type="application/ld+json"]'):
        try:
            ld = json.loads(script.string or "{}")
            if isinstance(ld, dict) and "image" in ld:
                ld_imgs = ld["image"] if isinstance(ld["image"], list) else [ld["image"]]
                for img_u in ld_imgs:
                    if isinstance(img_u, str) and img_u not in seen_imgs:
                        seen_imgs.add(img_u)
                        images.append(img_u)
        except Exception:
            pass

    for img in soup.select(
        ".ClassifiedDetailGallery img, .MediaGallery img, [data-large-image-url], a.ClassifiedDetailGallery-slideLink"
    ):
        src = (
            img.get("data-large-image-url")
            or img.get("data-src")
            or img.get("href")
            or img.get("src")
        )
        if src and not src.startswith("data:") and ("njuskalo.hr" in src or src.startswith("/")):
            full_img = urljoin(BASE_URL, src)
            if full_img not in seen_imgs:
                seen_imgs.add(full_img)
                images.append(full_img)

    data["image_urls"] = images

    # 8. Published date, expiration & Views/Visits count (Oglas prikazan: N puta)
    for dt_term in soup.select(".ClassifiedDetailSystemDetails-listTerm, .ClassifiedDetailSystemDetails dt"):
        dd_val = dt_term.find_next_sibling("dd")
        if not dd_val:
            continue
        term_lower = dt_term.get_text(" ", strip=True).lower()
        dd_text = dd_val.get_text(" ", strip=True)

        if "objavljen" in term_lower:
            data["published_at_raw"] = dd_text
            time_tag = dd_val.find("time")
            if time_tag and time_tag.get("datetime"):
                data["published_at"] = parse_datetime_iso(time_tag.get("datetime"))
            else:
                # Parse Croatian date e.g. '29.09.2026. u 10:30'
                m_dt = re.search(r"(\d{2})\.(\d{2})\.(\d{4})\.?\s*(?:u\s*(\d{2}):(\d{2}))?", dd_text)
                if m_dt:
                    day, month, year = int(m_dt.group(1)), int(m_dt.group(2)), int(m_dt.group(3))
                    hour = int(m_dt.group(4)) if m_dt.group(4) else 0
                    minute = int(m_dt.group(5)) if m_dt.group(5) else 0
                    try:
                        data["published_at"] = datetime(year, month, day, hour, minute)
                    except ValueError:
                        pass
        elif "prikazan" in term_lower:
            # e.g. "192 puta" or "1.450 puta"
            digits = re.sub(r"\D", "", dd_text)
            if digits:
                data["views_count"] = int(digits)
        elif "isteka" in term_lower:
            data["expires_countdown_raw"] = dd_text

    return data
