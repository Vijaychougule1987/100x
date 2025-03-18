import { test as base } from '@playwright/test';
import { Login } from './../pages/login.page'
import { chromium } from 'playwright';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { authorize, getInbox } from './gmail.auth'

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

interface PageObjects{
    login: Login
}

export const test = base.extend<PageObjects>({
    login: async({}, use)=>{
        //load extension
        const page = await loadExtension()
        //enter OTP
        
        const login = new Login(page)
        login.enterEmailAddress('thananjob@gmail.com')
        const client = await authorize()
        const otp = await getInbox(client)
        login.enterOtp(otp)
        await use(login)
    }
})

async function loadExtension () {
    const ROOT_DIR = process.cwd(); 
    const pathToExtension = join(ROOT_DIR, 'build-beta-63283ba');
    const browserContext = await chromium.launchPersistentContext('', {
     // channel: 'chrome',
      headless: false,
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`
      ]
    });
  
    let [background] = browserContext.serviceWorkers();
      if (!background)
        background = await browserContext.waitForEvent('serviceworker');
  
      const extensionId = background.url().split('/')[2];
      console.log(extensionId)
    const backgroundPage = await browserContext.newPage()
    
    await backgroundPage.goto(`chrome-extension://${extensionId}/sidepanel.html/#signin`)
    await backgroundPage.reload(); 
    await backgroundPage.waitForTimeout(4000)
  
    return backgroundPage
  }

  export { expect } from '@playwright/test';