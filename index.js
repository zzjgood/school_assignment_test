const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });
const config = require("./config");
const emailHelper = require("./emailHelper.js");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

puppeteer.use(StealthPlugin());

const listenPageErrors = async (page) => {
  const describe = (jsHandle) => {
    return jsHandle.executionContext().evaluate((obj) => {
      return `OBJ: ${typeof obj}, ${obj}`;
    }, jsHandle);
  };

  page.on("console", async (message) => {
    const args = await Promise.all(message.args().map((arg) => describe(arg)));
    const type = message.type().substr(0, 3).toUpperCase();
    let text = "";
    for (let i = 0; i < args.length; ++i) {
      text += `[${i}] ${args[i]} `;
    }
    console.log(`CONSOLE.${type}: ${message.text()}\n${text} `);
  });
};

const rawCookie2JSON = (cookie) => {
  return cookie.split(/\s*;\s*/).reduce((pre, current) => {
    const pair = current.split(/\s*=\s*/);
    const name = pair[0];
    const value = pair.splice(1).join("=");
    return [
      ...pre,
      {
        name,
        value,
        domain: "glados.rocks",
      },
    ];
  }, []);
};

async function start() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  const cookieJSON = rawCookie2JSON(process.env.COOKIES);
  await page.setCookie(...cookieJSON);
  await listenPageErrors(page);

  await page.goto(config.url.signInPage, {
    timeout: 0,
    waitUntil: "load",
  });

  // 在无头浏览器控制台执行
  const evalResult = await page.evaluate(
    async (args) => {
      let [result, config] = args;
      const checkIn = () =>
        fetch(config.url.signInApi, {
          method: "POST",
          headers: config.headers,
          body: config.body,
        }).catch((error) => {
          console.warn("checkIn 网络错误。");
          return { reason: "网络错误" };
        });

      const checkInRes = await checkIn();
      if (!checkInRes.ok) {
        const reason = {
          code: -1,
          message: `请求失败!${checkInRes.reason || checkInRes.status}`,
        };
        console.warn(`checkIn 请求失败，${reason}`);
        result = reason;
      } else {
        console.info("checkIn 请求成功。");
        result = await checkInRes.json();
      }

      return result;
    },
    [{}, config]
  );

  let today = new Date();
  let emailTitle = "";
  const { code = -1, message = "未知消息", list = [] } = evalResult;
  console.log("evalResult: ", evalResult);
  const business = list[0] && list[0].business;
  if (business) today = business.split(":")[2];
  const emailContentMsg = `${today}：\n【Code:${code}\n【Message:${message}】`;
  console.log("emailContentMsg: ", emailContentMsg);
  if (code === 1) {
    emailTitle = "今日已签到成功！";
  } else if (code === 0) {
    emailTitle = "自动签到成功！";
    emailHelper.send({ text: emailContentMsg, subject: emailTitle });
  } else {
    emailTitle = "自动签到失败！";
    emailHelper.send({ text: emailContentMsg, subject: emailTitle });
  }
  await browser.close();
}

start();
