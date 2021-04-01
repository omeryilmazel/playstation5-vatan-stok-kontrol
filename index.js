//
const axios = require("axios").default;
const cheerio = require("cheerio");
const fs = require("fs");
const say = require("say");
const colors = require("colors");
const open = require("open");
const inquirer = require("inquirer");
const yaml = require("js-yaml");
//
const DETECTION_STRING_NOT_AVAILABLE = "ÇOK YAKINDA";
const AVAILABLE_MESSAGE = "SEPETE EKLE";
//
const PRODUCTS_CHOICES_TO_CHECK = yaml.safeLoad(
  fs.readFileSync("products.yaml", "utf8")
).products;
//
let BROWSER = "google chrome";
//
async function main() {
  try {
    let inq = await inquirer.prompt([
      {
        type: "checkbox",
        choices: PRODUCTS_CHOICES_TO_CHECK,
        message: "Kontrol edilecek sürümleri seçin (space tuşu ile)",
        name: "version",
      },
      {
        name: "interval",
        type: "number",
        message: "Yenileme aralığı (saniye)",
        default: 30,
      },
      {
        name: "browser",
        type: "list",
        choices: ["google chrome", "safari", "firefox"],
        message: "Tarayıcı seçin.",
        default: "google chrome",
      },
    ]);
    BROWSER = inq.browser;

    // scrap on main run and then by interval
    inq.version.forEach(scrapProduct);
    setInterval(() => {
      inq.version.forEach(scrapProduct);
    }, inq.interval * 1000);
  } catch (error) {
    console.log("error while prompting", error);
  }
}

//
async function scrapProduct(uri) {
  //
  const AVAILABLE_SELECTOR = ".product-button--cell span:nth(1)";
  //
  try {
    const product_page = (
      await axios.get(uri, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.67 Safari/537.36",
        },
      })
    ).data;
    //
    const $ = cheerio.load(product_page);
    const title = $(".product-list__product-name").text().trim();
    const price = $(".product-list__price").text().trim();
    const availableText = $(AVAILABLE_SELECTOR).text().trim();
    //
    if (availableText === AVAILABLE_MESSAGE) {
      console.log(colors.rainbow(`Fiyatı: ${price} `));
      //
      say.speak(title + AVAILABLE_MESSAGE);
      //
      open(uri, { app: BROWSER });
    } else if (availableText === DETECTION_STRING_NOT_AVAILABLE) {
      console.log(colors.red(availableText));
    }
  } catch (error) {
    console.error(`Error while scraping ${uri}`);
    console.error(error)
  } finally {
    console.log(colors.zebra(`------------`));
  }
}
//
main();
