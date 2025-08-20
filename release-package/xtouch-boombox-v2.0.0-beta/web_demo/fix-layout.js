const { chromium } = require('playwright');

async function fixButtonOverlap() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    // Navigate to the local dev server
    await page.goto('http://localhost:5173');
    
    // Wait for the page to load
    await page.waitForSelector('.navigation-tabs', { timeout: 10000 });
    
    console.log('🔍 Inspecting layout...');
    
    // Get button positions
    const navButtons = await page.locator('.navigation-tabs');
    const progressContainer = await page.locator('.progress-container');
    
    const navButtonsBox = await navButtons.boundingBox();
    const progressBox = await progressContainer.boundingBox();
    
    console.log('Navigation buttons box:', navButtonsBox);
    console.log('Progress container box:', progressBox);
    
    // Check for overlap
    if (navButtonsBox && progressBox) {
        const overlap = navButtonsBox.y < (progressBox.y + progressBox.height);
        console.log('Buttons overlap with slider:', overlap);
        
        if (overlap) {
            console.log('🔧 Fixing overlap by adjusting CSS...');
            
            // Inject CSS to fix the overlap
            await page.addStyleTag({
                content: `
                    .navigation-tabs {
                        margin-top: 12px !important;
                        position: relative;
                        z-index: 10;
                    }
                    .progress-container {
                        margin-bottom: 8px;
                    }
                    .home-screen {
                        padding-bottom: 8px;
                    }
                `
            });
            
            console.log('✅ CSS fix applied');
            
            // Take a screenshot
            await page.screenshot({ path: 'layout-fixed.png', fullPage: true });
            console.log('📷 Screenshot saved as layout-fixed.png');
        }
    }
    
    // Keep the browser open for visual inspection
    console.log('🎯 Browser will stay open for 30 seconds for inspection...');
    await page.waitForTimeout(30000);
    
    await browser.close();
}

fixButtonOverlap().catch(console.error);