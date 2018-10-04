let fs = require('fs-extra')
let { createHash, randomBytes } = require('crypto')
let { join } = require('path')
let os = require('os')
let tar = require('tar')
let jpfs = require('jpfs')

module.exports = function(clientPath) {
  return [
    {
      type: 'initializer',
      middleware: function(state) {
        let tmpPath = join(os.tmpdir(), randomBytes(16).toString('hex'))
        tar.create({ sync: true, file: tmpPath, portable: true }, [clientPath])
        let archiveBytes = fs.readFileSync(tmpPath)
        let { hash } = jpfs.serve(archiveBytes)
        state._sheaClientHash = hash
        fs.removeSync(tmpPath)
      }
    },
    {
      type: 'post-listen',
      middleware: async function(appInfo) {
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

function serve(buf) {
  let hash = createHash('sha256')
    .update(buf)
    .digest('hex')
  let server = discoveryServer(defaults, function(socket) {
    socket.write(buf)
    socket.end()
    socket.on('error', e => {})
  })

  server.listen(hash, function() {})
}
