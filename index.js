let fs = require('fs')
// let ipfs = require('./lib/ipfs.js')
let getPort = require('get-port')
let axios = require('axios')

module.exports = function(htmlPath) {
  return [
    {
      type: 'initializer',
      middleware: function(state) {
        let code = fs.readFileSync(htmlPath, 'utf8')
        state._sheaClientCode = code
      }
    },
    {
      type: 'post-listen',
      middleware: async function(appInfo) {
        console.log(appInfo)
        console.log(
          `\n\n
<===================================================================>
             
         users can connect with:   
                    
         $ npm i -g shea
         $ shea ${appInfo.GCI}
 
<===================================================================>
`
        )
      }
    }
  ]
}
