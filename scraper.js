// scraper.js
import puppeteer from 'puppeteer';
import fs from 'fs';
import fetch from 'node-fetch';

const firebaseUrl = "https://sneakerai-c96f0-default-rtdb.firebaseio.com/products";

const jumiaSneakersUrl = "https://www.jumia.com.ng/men-sneakers/";

(async () => {
    const browser = await puppeteer.launch({ headless: false, defaultViewport: null });
    const page = await browser.newPage();

    await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
    );

    console.log("Opening Jumia men’s sneakers page...");
    await page.goto(jumiaSneakersUrl, { waitUntil: 'networkidle2', timeout: 60000 });

    console.log("Scrolling to load products...");
    await autoScroll(page);

    console.log("Extracting sneaker products...");
    const products = await page.evaluate(() => {
        const productCards = document.querySelectorAll('article.c-prd');
        return Array.from(productCards).map(card => {
            const name = card.querySelector('h3.name')?.innerText.trim() || 'Unknown Sneaker';
            const priceText = card.querySelector('div.prc')?.innerText.trim() || '₦0';
            const price = priceText.replace(/\D/g, ''); // keep numeric only
            const image = card.querySelector('img.img')?.src || '';
            return {
                name,
                brand: "Sneakz Set",
                price: Number(price), // NGN number exact
                image,
                sizes: [] // placeholder for admin to edit
            };
        });
    });

    console.log("Sneakers scraped:", products.length);

    fs.writeFileSync('jumia_sneakers_men.json', JSON.stringify(products, null, 2));

    // Push each sneaker using a unique ID so it doesn't overwrite
    for (let p of products) {
        const id = `${p.brand}-${p.name}`.replace(/\s+/g, "-").toLowerCase();
        await fetch(`${firebaseUrl}/${id}.json`, {
            method: 'PUT', // ensures update/add, not random key
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(p)
        });
    }

    console.log("Men’s sneakers pushed to Firebase under Sneakz Set ✅");

    await browser.close();
})();

async function autoScroll(page) {
    await page.evaluate(async () => {
        await new Promise(resolve => {
            let totalHeight = 0;
            const distance = 300;
            const timer = setInterval(() => {
                const scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;
                if (totalHeight >= scrollHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 300);
        });
    });
}