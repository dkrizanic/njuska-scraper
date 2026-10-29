from decimal import Decimal
import unittest

from src.parser import (
    extract_njuskalo_id,
    has_next_page,
    parse_croatian_decimal,
    parse_detail_page,
    parse_search_results_page,
)

SAMPLE_SEARCH_HTML = """
<html>
<body>
<ul class="EntityList EntityList--Standard">
    <li class="EntityList-item EntityList-item--VauVau" data-entity-id="41234567">
        <article class="entity-body">
            <h3 class="entity-title">
                <a class="link" href="/nekretnine/stan-zagreb-tresnjevka-65m2-oglas-41234567">
                    Stan: Zagreb (Trešnjevka), 65.00 m2, novogradnja
                </a>
            </h3>
            <div class="entity-description">
                <div class="entity-description-main">
                    Lokacija: Grad Zagreb, Trešnjevka - Sjever, Trešnjevka. Stambena površina: 65,50 m2
                </div>
            </div>
            <div class="entity-prices">
                <ul class="price-items">
                    <li class="price-item">
                        <strong class="price price--eur">245.000 €</strong>
                    </li>
                </ul>
            </div>
            <div class="entity-pub-date">
                <time class="date" datetime="2026-10-28T14:30:00+01:00">28.10.2026.</time>
            </div>
        </article>
    </li>
    <li class="EntityList-item EntityList-item--Regular">
        <article class="entity-body">
            <h3 class="entity-title">
                <a class="link" href="/nekretnine/kuca-samobor-150m2-oglas-49876543? lijst=1">
                    Kuća: Samobor, 150 m2 s okućnicom
                </a>
            </h3>
            <div class="entity-prices">
                <strong class="price price--eur">310.500,00 €</strong>
            </div>
        </article>
    </li>
</ul>
<div class="Pagination">
    <li class="Pagination-item--next"><a class="Pagination-link--next" href="?page=2">Sljedeća</a></li>
</div>
</body>
</html>
"""

SAMPLE_DETAIL_HTML = """
<html>
<body>
<div class="ClassifiedDetailSummary">
    <h1 class="ClassifiedDetailSummary-title">Stan: Zagreb (Trešnjevka), 65.50 m2, 3-sobni</h1>
    <dd class="ClassifiedDetailSummary-priceDomestic">245.000 €</dd>
</div>
<div class="ClassifiedDetailBasicDetails">
    <dl>
        <dt class="ClassifiedDetailBasicDetails-listTerm">Županija</dt>
        <dd>Grad Zagreb</dd>
        <dt class="ClassifiedDetailBasicDetails-listTerm">Grad/općina</dt>
        <dd>Grad Zagreb</dd>
        <dt class="ClassifiedDetailBasicDetails-listTerm">Naselje</dt>
        <dd>Trešnjevka</dd>
        <dt class="ClassifiedDetailBasicDetails-listTerm">Tip stana</dt>
        <dd>U stambenoj zgradi</dd>
        <dt class="ClassifiedDetailBasicDetails-listTerm">Stambena površina</dt>
        <dd>65,50 m²</dd>
        <dt class="ClassifiedDetailBasicDetails-listTerm">Broj soba</dt>
        <dd>3-sobni</dd>
        <dt class="ClassifiedDetailBasicDetails-listTerm">Kat</dt>
        <dd>3.</dd>
        <dt class="ClassifiedDetailBasicDetails-listTerm">Ukupni broj katova</dt>
        <dd>5</dd>
        <dt class="ClassifiedDetailBasicDetails-listTerm">Godina izgradnje</dt>
        <dd>2023.</dd>
        <dt class="ClassifiedDetailBasicDetails-listTerm">Energetski razred</dt>
        <dd>A+</dd>
    </dl>
</div>
<div class="ClassifiedDetailPropertyGroups">
    <div class="ClassifiedDetailPropertyGroups-group">
        <h3 class="ClassifiedDetailPropertyGroups-groupTitle">Grijanje</h3>
        <ul>
            <li class="ClassifiedDetailPropertyGroups-groupListItem">Etažno plinsko centralno</li>
        </ul>
    </div>
    <div class="ClassifiedDetailPropertyGroups-group">
        <h3 class="ClassifiedDetailPropertyGroups-groupTitle">Parkiranje</h3>
        <ul>
            <li class="ClassifiedDetailPropertyGroups-groupListItem">Garažno parkirno mjesto</li>
        </ul>
    </div>
</div>
<div class="ClassifiedDetailDescription">
    <div class="ClassifiedDetailDescription-text">Prodaje se prekrasan trosobni stan na Trešnjevci.</div>
</div>
<div class="ClassifiedDetailOwnerDetails">
    <h2 class="ClassifiedDetailOwnerDetails-title">Agencija Nekretnine d.o.o.</h2>
</div>
</body>
</html>
"""


class ParserTests(unittest.TestCase):
    def test_parse_croatian_decimal(self) -> None:
        self.assertEqual(parse_croatian_decimal("245.000 €"), Decimal("245000"))
        self.assertEqual(parse_croatian_decimal("310.500,00 €"), Decimal("310500.00"))
        self.assertEqual(parse_croatian_decimal("65,50 m²"), Decimal("65.50"))
        self.assertIsNone(parse_croatian_decimal("Na upit"))

    def test_extract_njuskalo_id(self) -> None:
        url = "https://www.njuskalo.hr/nekretnine/stan-zagreb-oglas-41234567"
        self.assertEqual(extract_njuskalo_id(url), "41234567")

    def test_parse_search_results_page(self) -> None:
        cards = parse_search_results_page(SAMPLE_SEARCH_HTML, category_name="Stanovi Zagreb")
        self.assertEqual(len(cards), 2)

        first = cards[0]
        self.assertEqual(first["njuskalo_id"], "41234567")
        self.assertEqual(first["ad_tier"], "VauVau")
        self.assertEqual(first["price_eur"], Decimal("245000"))
        self.assertEqual(first["living_area_m2"], Decimal("65.50"))
        self.assertIn("Trešnjevka", first["location_summary"])

        second = cards[1]
        self.assertEqual(second["njuskalo_id"], "49876543")
        self.assertEqual(second["ad_tier"], "Regular")
        self.assertEqual(second["price_eur"], Decimal("310500.00"))

        self.assertTrue(has_next_page(SAMPLE_SEARCH_HTML))

    def test_parse_detail_page(self) -> None:
        detail = parse_detail_page(SAMPLE_DETAIL_HTML)
        self.assertEqual(detail["price_eur"], Decimal("245000"))
        self.assertEqual(detail["county"], "Grad Zagreb")
        self.assertEqual(detail["city"], "Grad Zagreb")
        self.assertEqual(detail["neighborhood"], "Trešnjevka")
        self.assertEqual(detail["property_type"], "U stambenoj zgradi")
        self.assertEqual(detail["living_area_m2"], Decimal("65.50"))
        self.assertEqual(detail["rooms"], "3-sobni")
        self.assertEqual(detail["floor"], "3.")
        self.assertEqual(detail["total_floors"], "5")
        self.assertEqual(detail["year_built"], 2023)
        self.assertEqual(detail["energy_class"], "A+")
        self.assertEqual(detail["heating_type"], "Etažno plinsko centralno")
        self.assertEqual(detail["parking"], "Garažno parkirno mjesto")
        self.assertEqual(detail["seller_name"], "Agencija Nekretnine d.o.o.")
        self.assertIn("trosobni stan", detail["description"])


if __name__ == "__main__":
    unittest.main()
