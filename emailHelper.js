const nodemailer = require("nodemailer");
const config = require("./config");
const [email] = process.env.QQ_SENDER.split("&&");

let transporter = nodemailer.createTransport({
  host: "smtp.qq.com",
  secureConnection: true,
  secure: true,
  port: 465,
  auth: config.sender,
});

let mailOptions = {
  from: `"机器人" <${email}>`, // 发件人
  to: config.recipientEmail, // 收件人
  subject: config.emailTitle, // 主题
  text: "这是一封来自 Node.js 的测试邮件", // plain text body
  // html: "<b>这是一封来自 Node.js 的测试邮件</b>", // html body
  attachments: [
    // 下面是发送附件，不需要就注释掉
    // {
    //   filename: "test.md",
    //   path: "./test.md",
    // },
  ],
};

function send(data) {
  transporter.sendMail(Object.assign(mailOptions, data), (error, info) => {
    if (error) {
      return console.log(error);
    }
    console.log(`Message: ${info.messageId}`);
    console.log(`sent: ${info.response}`);
  });
}

module.exports = { send };
