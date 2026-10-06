from pathlib import Path
from playwright.sync_api import sync_playwright

output = Path('public')
output.mkdir(exist_ok=True)
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 1000}, device_scale_factor=1)
    page.goto('http://127.0.0.1:4321', wait_until='networkidle')
    assert page.locator('.lesson').count() == 3
    assert page.get_by_role('button', name='сохранить карточку').is_visible()
    page.screenshot(path=str(output / 'preview-light.png'), full_page=True)
    page.get_by_role('button', name='сменить тему').click()
    page.screenshot(path=str(output / 'preview-dark.png'), full_page=True)
    browser.close()
