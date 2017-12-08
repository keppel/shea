let shea = require('shea')

let app = require('../../../lotion')({
  initialState: { count: 0 },
  devMode: true
})

app.use((state, tx) => {
  state.count+=2
})

app.use(shea('client.html'))

app.listen(3000)
