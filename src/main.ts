import { chromium, BrowserContext } from 'playwright';

(async () => {
    const broswer = await chromium.launch({ headless: false });
    let context = await broswer.newContext();
    let urls = ["https://zh.javascript.info/modules-intro"];
    for (let url of urls) {
        console.log("URL: " + url);
        console.log(await page_search(url, "模块", context));
    }
    await context.close();
    await broswer.close();
})();

async function page_search(url: string, niddle: string, ctx: BrowserContext) {
    let p =  await ctx.newPage();
    await p.goto(url);
    let result = await p.locator('html').getByText(niddle).allInnerTexts();
    await p.close();
    return result;
}