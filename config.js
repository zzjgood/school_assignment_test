const [email, pass] = process.env.QQ_SENDER.split("&&");
module.exports = {
  url: {
    signInApi: "https://glados.rocks/api/user/checkin",
    signInPage: "https://glados.rocks/console/checkin",
  },
  headers: { "Content-Type": "application/json;charset=utf-8" },
  body: '{"token":"glados.network"}',
  // 发送者
  sender: { user: email, pass: pass },
  // 接收者
  recipientEmail: email,
  emailTitle: "Auto SignIn ✔",
};
