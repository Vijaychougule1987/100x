
import type { Page } from '@playwright/test';

export class Login {

    constructor(public readonly page: Page){}

    async goto(url: string){
        await this.page.goto(url)
        await this.page.waitForLoadState('load')
    }

    async getPage(){
        return this.page
    }

    async enterEmailAddress(email: string){
        await this.page.getByRole('textbox', { name: 'Enter your Email ID to get an OTP'}).fill(email)
        await this.page.getByRole('button', { name: 'Send OTP'}).click()
        await this.page.waitForTimeout(10000)// wait for mail to to arrive in inbox

    }

    async enterOtp(otp: string){
        for(let i=1; i<=otp.length; i++){
            await this.page.getByRole('textbox', { name: `Please enter OTP character ${i}`}).fill(otp[i-1])
        }
        await this.page.locator(`button[type='submit']`).click()
    }

}