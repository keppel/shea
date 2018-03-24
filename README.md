# Shea

Shea is a simple tool for building and deploying UIs for [Lotion](https://github.com/keppel/lotion) applications.

## Installation

Shea requires __node v7.6.0__ or higher.

```bash
$ npm install shea
```

## Usage

1. Write up some html to use as your Lotion app's client.

`public/client.html`:
```html
<html>
<head>
  <title>my cool app</title>
</head>
<body>
  <p>hello decentralized world</p>
  <script>
    function sendTx(tx) {
      // http post tx to '/txs' to submit it to the blockchain
    }
    function getState() {
      // http get '/state' to get latest blockchain state
    }
  </script>
</body>
</html>
```

2. Attach it to a Lotion app.

`app.js`:
```js
let lotion = require('lotion')
let shea = require('shea')

let app = lotion({ initialState: {} })

app.use(shea('public/'))

app.listen(3000).then(appInfo => {
  console.log(appInfo.GCI)
  // 'f6d671670ce307f71164c7e9b7c1d89c0cf5a6456ddf0a538d59bdbd33216ec5'
})
```

3. Run `node app.js`.

4. Now clients, on any computer in the world, can run this to connect to your blockchain and open `client.html` in their browser:

```bash
$ npm i -g shea
$ shea <GCI>
```

That's it!

## License

MIT


