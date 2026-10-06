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
    page.locator('astro-dev-toolbar').evaluate('(element) => element.remove()')
    page.screenshot(path=str(output / 'preview-light.png'), full_page=True)
    page.get_by_role('button', name='сменить тему').click()
    page.wait_for_timeout(100)
    assert page.locator('html').get_attribute('class') == 'dark'
    assert page.locator('body').evaluate('(element) => getComputedStyle(element).backgroundColor') != 'rgb(247, 247, 243)'
    page.screenshot(path=str(output / 'preview-dark.png'), full_page=True)
    page.locator('#preset').select_option('work')
    assert page.locator('.lesson').count() == 3
    assert page.locator('.lesson input').first.input_value() == 'командная встреча'
    page.locator('#preset').select_option('empty')
    assert page.locator('.lesson').count() == 0
    page.locator('#preset').select_option('study')
    page.get_by_role('button', name='линии').click()
    assert page.locator('.export').get_attribute('data-style') == 'lines'
    with page.expect_download() as download_info:
        page.get_by_role('button', name='сохранить карточку').click()
    assert download_info.value.suggested_filename == 'dayflow-card.png'
    browser.close()
