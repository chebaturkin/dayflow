import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

URL = os.environ.get('DAYFLOW_URL', 'http://127.0.0.1:4321/dayflow/')
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(locale='en-US', viewport={'width': 1440, 'height': 1020}, permissions=['clipboard-read', 'clipboard-write'])
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(URL + '?lang=en&keep=1#my-place', wait_until='networkidle')
    expect(page.locator('html')).to_have_attribute('lang', 'en')
    expect(page.locator('h1')).to_have_text('plan your day')
    assert page.locator('.lesson .title').first.input_value() == 'design systems'
    page.locator('[data-language="ru"]').click()
    assert page.locator('.lesson .title').first.input_value() == 'дизайн-системы'
    page.locator('[data-language="en"]').click()
    assert page.locator('.lesson .title').first.input_value() == 'design systems'
    page.locator('.lesson .title').first.fill('мои собственные слова')
    page.locator('.lesson .start').first.fill('08')
    page.locator('#label').fill('личный день')
    before = page.evaluate("localStorage.getItem('dayflow-document')")
    page.locator('[data-language="ru"]').click()
    expect(page.locator('html')).to_have_attribute('lang', 'ru')
    assert page.locator('.lesson .start').first.input_value() == '08'
    assert page.locator('.lesson .title').first.input_value() == 'мои собственные слова'
    assert page.locator('#label').input_value() == 'личный день'
    assert page.evaluate("localStorage.getItem('dayflow-document')") == before
    assert 'keep=1' in page.url and '#my-place' in page.url
    page.locator('.lesson .start').first.fill('08:00')
    page.locator('.lesson .start').first.press('Tab')
    page.locator('[data-language="en"]').click()
    page.locator('#copy-text').click()
    copied = page.evaluate('navigator.clipboard.readText()')
    assert 'мои собственные слова' in copied and 'свои' not in copied
    page.get_by_role('button', name='free time', exact=True).click()
    page.locator('#copy-text').click()
    copied = page.evaluate('navigator.clipboard.readText()')
    assert 'free' in copied and 'мои собственные слова' not in copied
    page.reload(wait_until='networkidle')
    expect(page.locator('html')).to_have_attribute('lang', 'en')
    assert page.locator('#label').input_value() == 'личный день'
    page.locator('[data-language="ru"]').click()
    page.goto(URL, wait_until='networkidle')
    expect(page.locator('html')).to_have_attribute('lang', 'ru')
    for language in ['ru', 'en']:
        page.locator(f'[data-language="{language}"]').click()
        for width in [320, 390, 768, 1440]:
            page.set_viewport_size({'width': width, 'height': 1000})
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), (language, width)
    for locale, expected in [('ru-RU', 'ru'), ('en-US', 'en'), ('de-DE', 'en')]:
        context = browser.new_context(locale=locale)
        fresh = context.new_page()
        fresh.goto(URL, wait_until='networkidle')
        expect(fresh.locator('html')).to_have_attribute('lang', expected)
        context.close()
    blocked = browser.new_context(locale='en-US')
    blocked.add_init_script("Object.defineProperty(window, 'localStorage', {get(){throw new Error('blocked')}})")
    fresh = blocked.new_page()
    fresh.goto(URL, wait_until='networkidle')
    fresh.locator('[data-language="ru"]').click()
    expect(fresh.locator('html')).to_have_attribute('lang', 'ru')
    assert not errors, errors
    browser.close()
print('language checks passed: defaults, in-place pending edits, storage, URLs, clipboard, layout and blocked storage')
