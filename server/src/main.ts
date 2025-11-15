import { chromium } from 'playwright';
import type { BrowserContext } from 'playwright';
import { readFileSync } from 'fs';

// async function scrollToBottom(page: Page) {
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
//     await page.mouse.wheel(0, Infinity); // scroll to the bottom
//     console.log("scroll");
//     await sleep(1);
// }

// function sleep(seconds: number) {
//   return new Promise((resolve) => setTimeout(resolve, seconds * 1000))
// }

async function url_search(url: string, niddle: string, ctx: BrowserContext) {
    let p = await ctx.newPage();
    let result: string[] = [];
    try {
        await p.goto(url);
        // await scrollToBottom(p);
        result = (await p.locator('html').getByText(niddle).allInnerTexts())
                .filter(s => s.length != 0);
    } catch (err) { 
        console.log("Error when scraping " + url + ": " + err);
    } finally {
        await p.close();
    }
    return result;
}

type Result = {
    url: string,
    niddle: string[],
}

async function search_list(urls: string[], niddle: string, ctx: BrowserContext) {
    let batch_sz = 20;
    let result: Result[] = [];
    for (let i = 0; i < urls.length; i += batch_sz) {
        let h_p = urls
            .slice(i, i + batch_sz)
            .map(async h => {
                return {
                    url: h,
                    niddle: await url_search(h, niddle, ctx)
                } as Result
        });
        let hs = await Promise.all(h_p);
        hs = hs.filter(h => h.niddle.length != 0);
        result.push(...hs);
    }
    return result;
}

function readGoogleTakeout(path: string): string[] {
    type History = {
        title: string,
        url: string,
        time_usec: string,
    }
    // './myhistory/chrome.json'
    const data = JSON.parse(readFileSync(path, 'utf8'));
    let history: History[] = data["Browser History"];
    return history.map(h => h.url);
}

async function main() {
    let urls = readGoogleTakeout('./myhistory/chrome.json')
        .filter(h => h.includes("baidu"))
        .slice(0, 50);

    const broswer = await chromium.launch({ headless: false });
    let context = await broswer.newContext();

    let results = await search_list(urls, "知乎", context);
    console.log(results);

    await context.close();
    await broswer.close();
}

await main();
