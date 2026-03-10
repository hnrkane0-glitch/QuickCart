import puppeteer from "puppeteer";
import admin from "firebase-admin";
import fs from "fs";

console.log("🚀 Sneaker Bot Starting...");

// FIREBASE INIT
const serviceAccount = JSON.parse(
  fs.readFileSync("./database/firebaseKey.json", "utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://chatbot-api-5941e-default-rtdb.firebaseio.com/"
});

const db = admin.database();

function addProfit(priceText) {

  const numeric = Number(priceText.replace(/[^0-9.]/g, "")) || 0;

  const withProfit = Math.round(numeric * 1.2); // 20% profit

  return {
    raw: numeric,
    final: withProfit,
    display: "₦" + withProfit.toLocaleString()
  };
}

async function saveSneaker(name, priceText, brand) {

  if (!name || !priceText) return;

  const price = addProfit(priceText);

  const id = name.replace(/\s+/g, "_").toLowerCase();

  await db.ref("sneakers/" + id).set({
    name,
    brand,
    originalPrice: price.raw,
    price: price.final,
    displayPrice: price.display,
    time: Date.now()
  });

  console.log(`Saved: ${name} - ${price.display} (${brand})`);
}


// OURSHOEPLUG SCRAPER
async function scrapeOurShoePlug(page) {

  console.log("\nScraping OurShoePlug...");

  await page.goto(
    "https://ourshoeplug.com/shop?category=df74d512-4869-4c51-a44b-b5bfa2e042a4%2C5680c1e5-7ffa-439c-8ee9-0051b5a6d066&query=&page=1&pagesize=24&sort=newest",
    { waitUntil: "networkidle2" }
  );

  await page.waitForTimeout(5000);

  const sneakers = await page.evaluate(() => {

    const items = [];

    document.querySelectorAll("div.card").forEach(product => {

      const name =
        product.querySelector("h3")?.innerText || "";

      const price =
        product.querySelector(".price")?.innerText || "";

      if (
        name &&
        price &&
        !name.toLowerCase().includes("about") &&
        !name.toLowerCase().includes("policy") &&
        !name.toLowerCase().includes("login")
      ) {
        items.push({
          name,
          price
        });
      }

    });

    return items;

  });

  for (const shoe of sneakers) {
    await saveSneaker(shoe.name, shoe.price, "OurShoePlug");
  }

  console.log(`OurShoePlug done. Found ${sneakers.length} sneakers.`);
}



// NIKE SCRAPER
async function scrapeNike(page) {

  console.log("\nScraping Nike...");

  await page.goto(
    "https://www.nike.com/w/mens-shoes-nik1zy7ok",
    { waitUntil: "networkidle2" }
  );

  await page.waitForSelector("div.product-card");

  const sneakers = await page.evaluate(() => {

    const items = [];

    document.querySelectorAll("div.product-card").forEach(card => {

      const name =
        card.querySelector("div.product-card__title")?.innerText || "";

      const price =
        card.querySelector("div.product-price")?.innerText || "";

      if (name && price) {
        items.push({
          name,
          price
        });
      }

    });

    return items;

  });

  for (const shoe of sneakers) {
    await saveSneaker(shoe.name, shoe.price, "Nike");
  }

  console.log(`Nike done. Found ${sneakers.length} sneakers.`);
}



// ADIDAS SCRAPER
async function scrapeAdidas(page) {

  console.log("\nScraping Adidas...");

  await page.goto(
    "https://www.adidas.com/us/men-shoes",
    { waitUntil: "networkidle2" }
  );

  await page.waitForTimeout(6000);

  const sneakers = await page.evaluate(() => {

    const items = [];

    document.querySelectorAll("div[data-testid='product-card']").forEach(card => {

      const name =
        card.querySelector("div[data-testid='product-card-title']")?.innerText || "";

      const price =
        card.querySelector("div[data-testid='product-card-price']")?.innerText || "";

      if (name && price) {
        items.push({
          name,
          price
        });
      }

    });

    return items;

  });

  for (const shoe of sneakers) {
    await saveSneaker(shoe.name, shoe.price, "Adidas");
  }

  console.log(`Adidas done. Found ${sneakers.length} sneakers.`);
}



// RUN BOT
async function runBot() {

  const browser = await puppeteer.launch({
    headless: true
  });

  const page = await browser.newPage();

  await scrapeOurShoePlug(page);
  await scrapeNike(page);
  await scrapeAdidas(page);

  await browser.close();

  console.log("\n✅ Bot Finished");

}

runBot();