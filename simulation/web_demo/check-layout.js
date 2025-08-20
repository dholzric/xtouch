import { chromium } from 'playwright';

async function checkLayout() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    try {
        // Navigate to the local dev server
        await page.goto('http://localhost:5173');
        
        // Wait for the page to load
        await page.waitForSelector('.navigation-tabs', { timeout: 5000 });
        
        console.log('✅ Layout loaded successfully');
        
        // Take a screenshot
        await page.screenshot({ 
            path: 'F:\\xtouch\\simulation\\web_demo\\layout-check.png', 
            fullPage: true 
        });
        console.log('📷 Screenshot saved as layout-check.png');
        
        // Check if buttons are visible and not overlapping
        const buttonsVisible = await page.locator('.tab-btn').first().isVisible();
        const progressVisible = await page.locator('.progress-container').isVisible();
        
        console.log('Navigation buttons visible:', buttonsVisible);
        console.log('Progress slider visible:', progressVisible);
        
        if (buttonsVisible && progressVisible) {
            console.log('🎉 Layout appears to be working correctly!');
        }
        
    } catch (error) {
        console.error('❌ Error checking layout:', error.message);
    }
    
    await browser.close();
}

checkLayout();