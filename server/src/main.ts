import { chromium } from 'playwright';
import type { BrowserContext, Page } from 'playwright';
import { readFileSync } from 'fs';

let niddle = "的";

async function scrollToBottom(page: Page) {
    // const window: any = await page.evaluateHandle('window');
    // const [_, scrollHeight] = await page.evaluate(() => [
    //     window.scrollY,
    //     window.document.documentElement.scrollHeight,
    // ])

    // for (let i = 0; i < scrollHeight; i += 100) {
    //     await page.evaluate((i) => {
    //         window.scrollTo(0, i, { behavior: 'smooth' })
    //         }, i)
    //     console.log(i, scrollHeight);
    //     await sleep(1)
    // }
    await page.mouse.wheel(0, Infinity); // scroll to the bottom
    console.log("scroll");
    await sleep(1);
}

function sleep(seconds: number) {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000))
}

async function url_search(url: string, niddle: string, ctx: BrowserContext) {
    let p = await ctx.newPage();
    let result: string[] = [];
    try {
        await p.goto(url);
        await scrollToBottom(p);
        result = (await p.locator('html').getByText(niddle).allInnerTexts())
                .filter(s => s.length != 0);
    } catch (err) { 
        console.log("Error when scraping " + url + ": " + err);
    } finally {
        await p.close();
    }
    return result;
}

async function page_search(entry: History, niddle: string, ctx: BrowserContext) {
    return {
        ...entry,
        niddle: await url_search(entry.url, niddle, ctx),
    } as Result;
}

type History = {
    title: string,
    url: string,
    time_usec: string,
}

type Result = {
    title: string,
    url: string,
    time_usec: string,
    niddle: string[],
}

const data = JSON.parse(readFileSync('./myhistory/chrome.json', 'utf8'));
let all_history: History[] = data["Browser History"];
all_history = all_history.map(h => { return {
        title: h.title,
        url: h.url,
        time_usec: h.time_usec, 
    }})
    .filter(h => h.url.includes("baidu"))
    .slice(0, 1);

const broswer = await chromium.launch({ headless: false });
let context = await broswer.newContext();
let batch_sz = 20;

for (let i = 0; i < all_history.length; i += batch_sz) {
    let h_p = all_history
        .slice(i, i + batch_sz)
        .map(h => page_search(h, niddle, context));
    let hs = await Promise.all(h_p);
    hs = hs.filter(h => h.niddle.length != 0);
    console.log(hs);
}

await context.close();
await broswer.close();
