import asyncio
from playwright.async_api import async_playwright, expect

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 375, "height": 667})

        await page.goto("file:///app/index.html")

        # Get menu toggle button
        toggle_btn = page.locator("#menu-toggle")

        # Check accessible name and attributes
        await expect(toggle_btn).to_have_attribute("aria-label", "Toggle navigation menu")
        await expect(toggle_btn).to_have_attribute("aria-controls", "mobile-menu")
        await expect(toggle_btn).to_have_attribute("aria-expanded", "false")

        # Click the menu toggle
        await toggle_btn.click()
        await expect(toggle_btn).to_have_attribute("aria-expanded", "true")

        # Click again to close
        await toggle_btn.click()
        await expect(toggle_btn).to_have_attribute("aria-expanded", "false")

        print("Verification passed successfully!")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
