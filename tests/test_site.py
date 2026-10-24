"""Regression tests. Run: python -m unittest discover -s tests -v."""
import json
import os
from pathlib import Path
import subprocess
import unittest

ROOT = Path(__file__).resolve().parents[1]


class CatalogTests(unittest.TestCase):
    def test_all_repository_pdfs_are_reachable_from_the_catalog(self):
        result = subprocess.run(
            ["node", "-e", "const fs=require('node:fs'),vm=require('node:vm');"
             "console.log(vm.runInNewContext(fs.readFileSync('js/data.js','utf8')"
             "+';JSON.stringify(ARTICLES.map(a=>a.pdf))'))"],
            cwd=ROOT, check=True, capture_output=True, text=True, encoding="utf-8",
        )
        catalog = json.loads(result.stdout)
        actual = {p.relative_to(ROOT).as_posix() for p in ROOT.glob("20*/*.pdf")}
        self.assertEqual(set(catalog), actual)
        self.assertEqual(len(catalog), len(actual), "Duplicate PDF entries")

    def test_every_catalog_pdf_and_thumbnail_exists(self):
        # Read the real browser data without introducing a second catalog.
        result = subprocess.run(
            ["node", "-e", "const fs=require('node:fs'),vm=require('node:vm');"
             "console.log(vm.runInNewContext(fs.readFileSync('js/data.js','utf8')"
             "+';JSON.stringify(ARTICLES)'))"],
            cwd=ROOT, check=True, capture_output=True, text=True, encoding="utf-8",
        )
        articles = json.loads(result.stdout)
        self.assertTrue(articles)
        for article in articles:
            for field in ("pdf", "img"):
                with self.subTest(article=article["id"], field=field):
                    self.assertTrue((ROOT / article[field]).is_file(), article[field])


class BrowserTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        from playwright.sync_api import sync_playwright
        cls.playwright = sync_playwright().start()
        cls.addClassCleanup(cls.playwright.stop)
        options = {"headless": True}
        if os.environ.get("CHROME_PATH"):
            options["executable_path"] = os.environ["CHROME_PATH"]
        cls.browser = cls.playwright.chromium.launch(**options)
        cls.addClassCleanup(cls.browser.close)

    def setUp(self):
        self.page = self.browser.new_page(reduced_motion="reduce")
        self.addCleanup(self.page.close)
        self.errors = []
        self.page.on("pageerror", lambda error: self.errors.append(str(error)))
        self.page.goto((ROOT / "index.html").as_uri())
        self.page.wait_for_selector(".toc-row")

    def tearDown(self):
        self.assertEqual(self.errors, [])

    def test_notification_treats_file_name_as_text(self):
        self.page.evaluate("toast('<img src=x onerror=alert(1)>')")
        self.assertEqual(self.page.locator("#toasts img").count(), 0)
        self.assertIn("<img", self.page.locator("#toasts").inner_text())

    def test_failed_copy_does_not_report_success(self):
        self.page.evaluate("""() => {
            Object.defineProperty(navigator, 'clipboard', {value: {
                writeText: () => Promise.reject(new Error('denied'))
            }, configurable: true});
            document.execCommand = () => false;
            document.querySelector('.toc-btn').click();
            document.querySelector('[data-cite="apa"]').click();
        }""")
        self.page.wait_for_selector("#toasts .toast")
        self.assertEqual(self.page.locator("#toasts .toast.warn").count(), 1)

    def test_newsletter_does_not_claim_registration_without_backend(self):
        self.page.locator("#newsEmail").fill("reader@example.org")
        self.page.locator("#newsForm").evaluate("form => form.requestSubmit()")
        self.assertEqual(self.page.locator("#newsEmail").input_value(), "reader@example.org")
        self.assertEqual(self.page.locator("#toasts .toast.warn").count(), 1)

    def test_selected_manuscript_is_not_reported_as_received(self):
        self.page.evaluate("handleFile({name:'paper.pdf', size:1024})")
        self.assertEqual(self.page.locator("#upId").inner_text(), "")
        self.assertEqual(self.page.locator("#upFill").evaluate("e => e.style.width"), "0%")
        self.assertIn("не отправлен", self.page.locator("#upStat").inner_text())

    def test_search_expands_accessible_article_row(self):
        self.page.evaluate("openSearch(); renderSearch('10.24411/2686-8842-2025-0305')")
        self.page.locator(".sr-item").click()
        self.page.wait_for_function("document.querySelector('#row-a1').classList.contains('open')")
        self.assertEqual(self.page.locator("#row-a1 .toc-btn").get_attribute("aria-expanded"), "true")

    def test_language_switch_updates_open_pdf(self):
        self.page.evaluate("openPdf(byId('c1')); setLang('en')")
        self.assertIn("Organizing Youth", self.page.locator("#pdfBody h3").inner_text())

    def test_search_close_restores_focus(self):
        self.page.locator("#searchBtn").click()
        self.page.wait_for_function("document.activeElement.id === 'searchInput'")
        self.page.locator("#searchClose").click()
        self.assertEqual(self.page.evaluate("document.activeElement.id"), "searchBtn")

    def test_older_years_display_original_pdfs_in_both_languages(self):
        for language in ("ru", "en"):
            self.page.evaluate("setLang", language)
            for year, count in ((2021, 14), (2022, 5), (2023, 6)):
                with self.subTest(language=language, year=year):
                    self.page.locator(f'#yearsList [data-y="{year}"]').evaluate("e => e.click()")
                    rows = self.page.locator("#issuePanel button.ip-row")
                    self.assertEqual(rows.count(), count)
                    rows.first.click()
                    self.assertTrue(self.page.locator("#pdfOpen").get_attribute("href").startswith(f"{year}/"))
                    self.assertTrue(self.page.locator("#pdfBody .pdf-authors").inner_text())
                    self.page.locator("#pdfClose").click()

    def test_older_documents_are_searchable(self):
        self.page.evaluate("openSearch(); renderSearch('elibrary_49799003')")
        result = self.page.locator("#searchResults button.sr-item")
        self.assertEqual(result.count(), 1)
        result.click()
        self.assertEqual(self.page.locator("#pdfOpen").get_attribute("href"), "2022/elibrary_49799003_88657662.pdf")

    def test_external_doi_citation_keeps_original_journal(self):
        citation = self.page.evaluate("apaCite(byId('d21-01'))")
        self.assertIn("Journal of Physical Education and Sport", citation)
        self.assertIn("10.7752/jpes.2021.04240", citation)
        self.assertNotIn("Горизонты", citation)

    def test_all_added_records_render_and_export_without_missing_metadata(self):
        problems = self.page.evaluate("""() => {
            const problems = [];
            for(const language of ['ru','en']) {
                LANG = language;
                for(const article of ARTICLES.filter(a => a.external)) {
                    openPdf(article);
                    const text = [document.querySelector('#pdfBody').innerText,
                        apaCite(article), bibTeX(article), risRec(article), idLabel(article)].join(' ');
                    if(/undefined|EDN null|EDN undefined|№ null/.test(text)) problems.push(article.id);
                    closePdf();
                }
            }
            return problems;
        }""")
        self.assertEqual(problems, [])

    def test_archive_layout_at_phone_tablet_and_desktop_widths(self):
        output = ROOT / "artifacts"
        output.mkdir(exist_ok=True)
        self.page.evaluate("archKey='works-2021'; renderArchive()")
        for width in (375, 768, 1440):
            with self.subTest(width=width):
                self.page.set_viewport_size({"width": width, "height": 900})
                self.page.locator("#archive").scroll_into_view_if_needed()
                self.page.screenshot(path=str(output / f"archive-{width}.png"))
                self.assertLessEqual(self.page.evaluate("document.documentElement.scrollWidth"), width)


if __name__ == "__main__":
    unittest.main()
