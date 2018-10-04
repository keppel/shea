let fs = require('fs-extra')
let { createHash, randomBytes } = require('crypto')
let { join } = require('path')
let os = require('os')
let tar = require('tar')
let jpfs = require('jpfs')
let path = require('path')

module.exports = function(clientPath) {
  return [
    {
      type: 'initializer',
      middleware: function(state) {
        let tmpPath = join(os.tmpdir(), randomBytes(16).toString('hex'))
        tar.create(
          { sync: true, file: tmpPath, cwd: clientPath, portable: true },
          ['.']
        )
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
