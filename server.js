const app = require("./app");
const connectDatabase = require("./config/db");
const { serverPort } = require("./secret");

app.listen(serverPort, async () => {
  console.log(`Server is running at http://localhost:8000`);
  await connectDatabase();
});
