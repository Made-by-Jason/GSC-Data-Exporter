import asyncio
from playwright.async_api import async_playwright, expect

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Navigate to the local index.html file
        await page.goto("file:///app/index.html")

        # Listen for console messages
        page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))

        # Click the "SEO Checker" link
        await page.get_by_role("link", name="SEO Checker").click()

        # Check if the SEO Checker section is visible
        await expect(page.get_by_text("On-Page SEO Checker")).to_be_visible()

        # Enter a URL to analyze
        await page.locator("#urlInput").fill("https://www.google.com")

        # Click the analyze button
        await page.locator("#analyzeBtn").click()

        try:
            # Wait for the results to appear
            await page.wait_for_selector("div#resultsContainer > div", timeout=30000)

            # Take a screenshot
            await page.screenshot(path="jules-scratch/verification/verification.png")
        except Exception as e:
            print(f"An error occurred: {e}")
            # Take a screenshot even on failure to see the state
            await page.screenshot(path="jules-scratch/verification/failure.png")
            # Re-raise the exception to fail the script
            raise

        await browser.close()

asyncio.run(main())
