import { chromium } from 'playwright';
import type { BrowserContext } from 'playwright';
import { readFileSync } from 'fs';
import { createServer } from 'http';
import EventEmitter from 'node:events';

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
        result = (await p.locator('html').getByText(niddle).allInnerTexts());
        result = result.filter(s => s && s.length != 0);
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

async function do_search_list(urls: string[], niddle: string, ctx: BrowserContext) {
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

async function search_list(urls: string[], niddle: string) {
    const broswer = await chromium.launch({ headless: false });
    let context = await broswer.newContext();

    let results = await do_search_list(urls, niddle, context);

    await context.close();
    await broswer.close();
    return results;
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

function main(mode: 'post'|'takeout') {
    let urls: string[] = [];
    let niddle: string = "";
    const eventEmitter = new EventEmitter();
    
    if (mode === 'takeout') {
        urls = readGoogleTakeout('./myhistory/chrome.json')
            .filter(h => h.includes("baidu"))
            .slice(0, 50);
        eventEmitter.emit('startSearch');
    } else {
        let server = createServer((req, res) => {
            console.log("Request", req.url);

            if (req.method === 'POST' && req.url === '/newURL') {
                let body = '';
                req.on('data', chunk => body += chunk.toString());
                req.on('end', () => {
                    urls.push(body.trim());
                    res.writeHead(200);
                    res.end();
                });
            } else if (req.method === 'POST' && req.url === '/niddle') {
                let body = '';
                req.on('data', chunk => body += chunk.toString());
                req.on('end', () => {
                    niddle = body.trim();
                    res.writeHead(200);
                    res.end();
                });
            } else if (req.method === 'POST' && req.url === '/endURL') {
                server.close(() => console.log("Server closeing"));
                server.closeAllConnections();
                eventEmitter.emit('startSearch');
            } else {
                res.writeHead(404);
                res.end('fuck');
            }     
        });

        const PORT = 3001
        server.listen(PORT)
        console.log(`Server running on port ${PORT}`)
    }

    eventEmitter.on('startSearch', async () => {
        console.log(await search_list(urls, niddle));
    });
}

main('post');
