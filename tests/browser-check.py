import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / 'public'
URL = os.environ.get('DAYFLOW_URL', 'http://127.0.0.1:4321/dayflow')


def open_file_menu(page):
    if not page.locator('.file-menu').get_attribute('open') == '':
        page.locator('.file-menu summary').click()


def stored_document(page):
    return page.evaluate("JSON.parse(localStorage.getItem('dayflow-document'))")


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(viewport={'width': 1440, 'height': 1020}, locale='ru-RU', permissions=['clipboard-read', 'clipboard-write'])
    page = context.new_page()
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(URL, wait_until='networkidle')
    page.evaluate('localStorage.clear()')
    page.reload(wait_until='networkidle')
    assert page.locator('.lesson').count() == 3
    assert '2 окна' in page.locator('#summary').inner_text()
    assert page.locator('.eyebrow, .hint, .keyboard-note, .repo-link').count() == 0
    assert page.locator('#preview-card').inner_text().count('dayflow') == 1
    assert '10:30' in page.locator('#card-lessons').inner_text()
    assert page.locator('#undo').is_disabled()

    # Actual screenshots of a consistent example, including mobile and availability.
    page.locator('#date').fill('2026-10-14')
    page.locator('#date').press('Tab')
    page.locator('#label').fill('учебная среда')
    page.locator('#label').press('Tab')
    page.locator('h1').click()
    page.screenshot(path=str(PUBLIC / 'preview-light.png'), full_page=True)
    page.get_by_role('button', name='включить тёмную тему').click()
    assert page.locator('html').get_attribute('class') == 'dark'
    page.locator('h1').click()
    page.screenshot(path=str(PUBLIC / 'preview-dark.png'), full_page=True)
    page.get_by_role('button', name='включить светлую тему').click()
    page.locator('h1').click()
    page.set_viewport_size({'width': 390, 'height': 844})
    page.screenshot(path=str(PUBLIC / 'preview-mobile.png'), full_page=True)
    page.set_viewport_size({'width': 1440, 'height': 1020})
    page.get_by_role('button', name='свободное время', exact=True).click()
    assert 'дизайн-системы' not in page.locator('#preview-card').inner_text()
    page.locator('#preview-card').screenshot(path=str(PUBLIC / 'preview-availability.png'))
    page.locator('#copy-text').click()
    copied = page.evaluate('navigator.clipboard.readText()')
    assert '10:30 - 11:40  свободно' in copied
    assert 'дизайн-системы' not in copied
    assert 'аудитория' not in copied

    page.get_by_role('button', name='план дня', exact=True).click()
    page.locator('#copy-text').click()
    copied = page.evaluate('navigator.clipboard.readText()')
    assert '09:00 - 10:30  дизайн-системы' in copied
    assert 'аудитория 204' in copied

    # Keyboard add commits pending time edits before finding the next slot.
    last_end = page.locator('.lesson').last.locator('.end')
    last_end.fill('18:00')
    last_end.press('Control+Enter')
    assert page.locator('.lesson').last.locator('.start').input_value() == '18:00'
    assert page.locator('.lesson').last.locator('.end').input_value() == '19:00'
    page.locator('#undo').click()
    page.locator('#undo').click()
    assert page.locator('.lesson').last.locator('.end').input_value() == '15:10'
    last_end = page.locator('.lesson').last.locator('.end')
    last_end.fill('12:00')
    last_end.press('Control+Enter')
    assert page.locator('.lesson').count() == 3
    assert last_end.get_attribute('aria-invalid') == 'true'
    last_end.fill('15:10')
    last_end.press('Tab')

    # Added events follow the schedule; deleting, typing and preset replacement are undoable.
    page.locator('#add').click()
    assert page.locator('.lesson').count() == 4
    added = page.locator('.lesson').last
    assert added.locator('.start').input_value() == '15:10'
    assert added.locator('.end').input_value() == '16:10'
    added.locator('.title').press_sequentially('прогулка')
    added.locator('.title').press('Tab')
    page.locator('#undo').click()
    assert page.locator('.lesson').last.locator('.title').input_value() == ''
    page.locator('#undo').click()
    assert page.locator('.lesson').count() == 3
    page.locator('#redo').click()
    page.locator('#redo').click()
    assert page.locator('.lesson').last.locator('.title').input_value() == 'прогулка'
    page.locator('.lesson').last.locator('.remove').click()
    assert page.locator('.lesson').count() == 3
    page.locator('#undo').click()
    assert page.locator('.lesson').count() == 4
    page.locator('#preset').select_option('empty')
    assert page.locator('#empty-editor').is_visible()
    page.locator('#undo').click()
    assert page.locator('.lesson').count() == 4
    page.locator('#preview-heading').click()
    page.keyboard.press('Control+Shift+z')
    assert page.locator('#empty-editor').is_visible()
    page.keyboard.press('Control+z')
    assert page.locator('.lesson').count() == 4

    # Invalid fields never damage the saved schedule.
    added = page.locator('.lesson').last
    added.locator('.end').fill('14:00')
    added.locator('.end').press('Tab')
    assert added.locator('.end').get_attribute('aria-invalid') == 'true'
    assert stored_document(page)['lessons'][-1]['end'] == '16:10'
    added.locator('.end').fill('1710')
    added.locator('.end').press('Tab')
    assert added.locator('.end').input_value() == '17:10'
    assert stored_document(page)['lessons'][-1]['end'] == '17:10'
    added.locator('.start').fill('25:00')
    added.locator('.start').press('Tab')
    assert added.locator('.start').get_attribute('aria-invalid') == 'true'
    assert stored_document(page)['lessons'][-1]['start'] == '15:10'
    added.locator('.start').fill('15:10')
    added.locator('.start').press('Tab')

    # JSON round-trip, calendar export and all three PNG palettes.
    open_file_menu(page)
    with page.expect_download() as download_info:
        page.locator('#export-json').click()
    json_path = Path('/tmp/dayflow-smoke.json')
    download_info.value.save_as(json_path)
    assert len(json.loads(json_path.read_text())['lessons']) == 4
    open_file_menu(page)
    page.locator('#reset').click()
    page.locator('#file').set_input_files(json_path)
    assert page.locator('.lesson').count() == 4
    open_file_menu(page)
    with page.expect_download() as download_info:
        page.locator('#ics').click()
    ics_path = Path('/tmp/dayflow-smoke.ics')
    download_info.value.save_as(ics_path)
    assert ics_path.read_text().count('BEGIN:VEVENT') == 4
    for style in ['clean', 'dark', 'lines']:
        page.locator(f'button[data-style="{style}"]').click()
        with page.expect_download() as download_info:
            page.locator('#png').click()
        path = Path(f'/tmp/dayflow-card-{style}.png')
        download_info.value.save_as(path)
        assert path.read_bytes().startswith(b'\x89PNG\r\n\x1a\n')
    page.locator('#signature').uncheck()
    assert 'dayflow' not in page.locator('#preview-card').inner_text()
    page.reload(wait_until='networkidle')
    assert not page.locator('#signature').is_checked()
    assert page.locator('.lesson').count() == 4

    # Overlapping events produce merged busy blocks in the UI and copied text.
    overlap = {'version': 2, 'date': '2026-10-14', 'label': '', 'lessons': [
        {'id': 'long', 'title': 'private', 'start': '09:00', 'end': '12:00', 'status': 'planned'},
        {'id': 'short', 'title': 'private', 'start': '10:00', 'end': '11:00', 'status': 'planned'},
        {'id': 'next', 'title': 'private', 'start': '13:00', 'end': '14:00', 'status': 'planned'},
    ]}
    page.locator('#file').set_input_files({'name': 'overlap.json', 'mimeType': 'application/json', 'buffer': json.dumps(overlap).encode()})
    assert page.locator('#conflict').is_visible()
    assert '4 ч' in page.locator('#summary').inner_text()
    page.get_by_role('button', name='свободное время', exact=True).click()
    assert page.locator('.card-line.busy').count() == 2
    assert page.locator('.card-line.free').count() == 1
    with page.expect_download() as download_info:
        page.locator('#png').click()
    assert download_info.value.suggested_filename.endswith('-availability.png')

    # A denied clipboard still offers a usable selected text field.
    page.evaluate("Object.defineProperty(navigator, 'clipboard', {value: {writeText: () => Promise.reject(new Error('denied'))}})")
    page.locator('#copy-text').click()
    assert page.locator('#copy-fallback').is_visible()
    assert '12:00 - 13:00  свободно' in page.locator('#share-text').input_value()
    assert 'private' not in page.locator('#share-text').input_value()

    # Import errors and HTML in user content stay safe and recoverable.
    before = stored_document(page)
    page.locator('#file').set_input_files({'name': 'bad.json', 'mimeType': 'application/json', 'buffer': b'{}'})
    assert stored_document(page) == before
    assert 'версии 2' in page.locator('#save-status').inner_text()
    overlap['lessons'][0]['title'] = '<img src=x onerror=alert(1)>'
    page.locator('#file').set_input_files({'name': 'safe.json', 'mimeType': 'application/json', 'buffer': json.dumps(overlap).encode()})
    page.get_by_role('button', name='план дня', exact=True).click()
    assert page.locator('#preview-card img').count() == 0
    assert '<img' in page.locator('#preview-card').inner_text()
    page.set_viewport_size({'width': 320, 'height': 844})
    assert page.locator('body').evaluate('(el) => el.scrollWidth') == 320
    assert not errors, errors
    browser.close()
    print('Browser checks passed: history, clipboard, time validation, imports, exports and safe user content.')
