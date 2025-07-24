import puppeteer from 'puppeteer'
import { setTimeout } from 'node:timers/promises'

const args = ['--no-sandbox', '--disable-setuid-sandbox']
if (process.env.PROXY_SERVER) {
    const proxy_url = new URL(process.env.PROXY_SERVER)
    proxy_url.username = ''
    proxy_url.password = ''
    args.push(`--proxy-server=${proxy_url}`.replace(/\/$/, ''))
}

const browser = await puppeteer.launch({
    defaultViewport: { width: 1280, height: 768 },
    args,
})
const [page] = await browser.pages()
const userAgent = await browser.userAgent()
await page.setUserAgent(userAgent.replace('Headless', ''))
const recorder = await page.screencast({ path: 'recording.webm' })

try {
    if (process.env.PROXY_SERVER) {
        const { username, password } = new URL(process.env.PROXY_SERVER)
        if (username && password) {
            await page.authenticate({ username, password })
        }
    }

    await page.goto('https://secure.xserver.ne.jp/xapanel/login/xmgame/game/', { waitUntil: 'networkidle3' })
    await page.locator('#username').fill(process.env.USERNAME)
    await page.locator('#server_password').fill(process.env.PASSWORD)
    await page.locator('#server_identify').fill(process.env.DOMAIN)
    await page.locator('text=ログインする').click()
    await page.waitForNavigation({ waitUntil: 'networkidle3' })
    await page.locator('a[href^="/xmgame/game/freeplan/extend/index"]').click()
    await page.locator('text=期限を延長する').click()
    await page.locator('text=確認画面に進む').click()
    await page.locator('text=期限を延長する').click()
    await page.waitForNavigation({ waitUntil: 'networkidle3' })
} catch (e) {
    console.error(e)
} finally {
    await setTimeout(3000)
    await recorder.stop()
    await browser.close()
}
