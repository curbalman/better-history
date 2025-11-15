chrome.runtime.onMessage.addListener(async function(request, sender, sendResponse) {
    let timeRange_ms = 24 * 60 * 60 * 1000; // one day
    timeRange_ms *= 90;
    timeRange_ms = Date.now() - timeRange_ms;
    await fetch('http://localhost:3001/niddle', {method: 'POST', body: '泰国国王'});
    chrome.history.search({
            text: '',
            startTime: timeRange_ms,
            maxResults: 0  // Retrieve as much history data as possible
    }, async data => {
        console.log(`Sending ${data.length} items`);
        data = data.map(d => d.url);
        await fetch('http://localhost:3001/newURL', {
            method: 'POST',
            body: JSON.stringify(data),
        });
        await fetch('http://localhost:3001/endURL', {method: 'POST'});
    });
    return true; // Keep the message channel open for asynchronous sendResponse
});