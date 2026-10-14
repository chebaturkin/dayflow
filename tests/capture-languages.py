from pathlib import Path
from playwright.sync_api import sync_playwright
import os
ROOT=Path(__file__).resolve().parents[1]
BASE=os.environ.get('DAYFLOW_URL','http://127.0.0.1:4321/dayflow/').split('?')[0].split('#')[0]
with sync_playwright() as p:
 b=p.chromium.launch()
 for lang in ['ru','en']:
  folder=ROOT/'public'/('en' if lang=='en' else '')
  folder.mkdir(exist_ok=True)
  page=b.new_page(viewport={'width':1440,'height':1020},locale='ru-RU' if lang=='ru' else 'en-GB',reduced_motion='reduce')
  page.goto(BASE+'?lang='+lang,wait_until='networkidle')
  page.locator('#date').fill('2026-10-14');page.locator('#date').press('Tab')
  page.locator('#label').fill('учебная среда' if lang=='ru' else 'wednesday classes');page.locator('#label').press('Tab')
  page.locator('h1').click();page.evaluate('document.fonts.ready')
  page.screenshot(path=str(folder/'preview-light.png'),full_page=True)
  page.locator('#theme').click();page.locator('h1').click();page.screenshot(path=str(folder/'preview-dark.png'),full_page=True)
  page.locator('#theme').click();page.locator('h1').click();page.set_viewport_size({'width':390,'height':844})
  page.screenshot(path=str(folder/'preview-mobile.png'),full_page=True)
  page.set_viewport_size({'width':1440,'height':1020});page.locator('[data-mode="availability"]').click()
  page.locator('#preview-card').screenshot(path=str(folder/'preview-availability.png'))
  page.close()
 b.close()
print('captured dayflow: four real views in each language')
