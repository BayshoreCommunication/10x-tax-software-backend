const app = require('./server');
const { serverPort } = require('./secret');



app.listen(serverPort, () => {
  console.log(`app is running on http://localhost:${serverPort}`);
});
