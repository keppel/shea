let shea = require('shea')

let app = require('../../../lotion')({
  initialState: { messages: [] },
  devMode: true
})

app.use((state, tx) => {
  if (typeof tx.username === 'string' && typeof tx.message === 'string') {
    state.messages.push({ username: tx.username, message: tx.message })
  }
})

app.use(shea('client.html'))

app.listen(3000)
