from pathlib import Path
from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"


def remove_dev_toolbar(page):
    page.locator("astro-dev-toolbar").evaluate_all("(items) => items.forEach((item) => item.remove())")


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(viewport={"width": 1440, "height": 1000}, device_scale_factor=1)
    page = context.new_page()
    page.goto("http://127.0.0.1:4321/dayflow", wait_until="networkidle")
    page.evaluate("localStorage.clear()")
    page.reload(wait_until="networkidle")

    assert page.locator(".lesson").count() == 3
    assert "2 окна" in page.locator("#summary").inner_text()
    remove_dev_toolbar(page)
    page.screenshot(path=str(PUBLIC / "preview-light.png"), full_page=True)

    page.get_by_role("button", name="включить тёмную тему").click()
    page.wait_for_timeout(300)
    assert page.locator("html").get_attribute("class") == "dark"
    remove_dev_toolbar(page)
    page.screenshot(path=str(PUBLIC / "preview-dark.png"), full_page=True)

    page.get_by_role("button", name="свободное время", exact=True).click()
    assert page.locator("#preview-card").get_attribute("data-mode") == "availability"
    assert "свободно" in page.locator("#preview-card").inner_text()
    assert "design systems" not in page.locator("#preview-card").inner_text()

    page.locator("#add").click()
    assert page.locator(".lesson").count() == 4
    page.locator(".lesson").last.locator(".start").fill("10:00")
    page.locator(".lesson").last.locator(".end").fill("12:00")
    page.locator(".lesson").last.locator(".start").press("Tab")
    assert page.locator("#conflict").is_visible()
    assert "время пересекается" in page.locator("#conflict").inner_text()

    with page.expect_download() as download_info:
        page.locator("#export-json").click()
    json_path = Path("/tmp/dayflow-smoke.json")
    download_info.value.save_as(json_path)
    assert download_info.value.suggested_filename.endswith(".json")

    page.locator("#reset").click()
    page.locator("#file").set_input_files(json_path)
    page.wait_for_timeout(100)
    assert page.locator(".lesson").count() == 4

    with page.expect_download() as download_info:
        page.locator("#ics").click()
    assert download_info.value.suggested_filename.endswith(".ics")

    with page.expect_download() as download_info:
        page.locator("#png").click()
    assert download_info.value.suggested_filename.endswith("-availability.png")

    page.set_viewport_size({"width": 390, "height": 844})
    page.reload(wait_until="networkidle")
    assert page.locator("body").evaluate("(element) => element.scrollWidth") == 390

    browser.close()
