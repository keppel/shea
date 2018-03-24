#!/usr/bin/env node

/* 
  to connect as a lite client to a running chain, we need: 
  - genesis.json
  - initial node address

  for now, these can be passed as cli arguments.
  soon tho, the entire app should just be a single ipfs hash.
  the ipfs hash will be used to download the genesis.json
  and as the rendezvous for discovering seed nodes to run
  as a lite client of.

  might require chrome to be installed and open the client in incognito
  to prevent browser extensions from doing nasty things.

  `shea` will connect as a lite client to the specified node, then when 
  a state query comes back with a string value in `state.clientCode`, serves
  that code as javascript and opens chrome pointing at that url.

  `shea` also runs a `/sign` endpoint which will sign any data posted to it.
  `shea` manages persisting this keypair. each keypair is used only for one app.

  lotion apps can require('shea') and pass it the genesis.
  this will also announce the running node as a full-node for discovery by users.
  should this be implemented as lotion middleware? probably not. better pattern is probably
  require('shea')(app), and `app` can have methods for accessing genesis, tendermint node info, etc

*/

let { argv } = require('yargs')
let axios = require('axios')
let getPort = require('get-port')
let net = require('net')
let express = require('express')
let proxy = require('express-http-proxy')
let { json } = require('body-parser')
let { join } = require('path')
let opn = require('opn')
let fs = require('fs-extra')
let discoveryChannel = require('discovery-channel')
let defaults = require('dat-swarm-defaults')()
let os = require('os')
let mkdirp = require('mkdirp')
let { createHash, randomBytes } = require('crypto')
let tar = require('tar')

let GCI = argv._[0] || ''
let gatewayMode = argv.g || false

let { connect } = require('../../lotion') // fix this path
let clients = {}
const SHEA_HOME = join(os.homedir(), '/.shea')

function parseGCIFromHeaders(headers) {
  let referer = headers.referer
  if(!referer) {
    return false 
  }
  let gci = referer.split('/')[3]
  if(typeof gci !== 'string' || !gci.length) {
    return false
  }
  return gci
}


function getClientByHash(hash) {
  return new Promise((resolve, reject) => {
    let dc = discoveryChannel(defaults)
    dc.on('peer', (id, peer) => {
      let socket = net.connect(peer.port, peer.host)
      let bytes = Buffer.alloc(0)
      socket.on('data', chunk => {
        bytes += chunk
      })
      socket.on('end', function () {
        // check that content hashes to the expected value
        let candidateHash = createHash('sha256').update(bytes).digest('hex')
        if(candidateHash === hash) {
          resolve(bytes)
          dc.destroy(function () {})
        }
      })
      socket.on('error', e => {
        socket.destroy()
      })
    })

    dc.join(hash)
  })
}

async function main() {
  let expressPort = process.env.PORT || await getPort(7777)
  let expressApp = express()

  expressApp.use(json())

  expressApp.get('/', async (req, res) => {
    res.send('You are now connected to a Shea gateway. Make sure this gateway is operated by you or someone you trust.')
  })

  expressApp.get('/state', async (req, res) => {
    let gci = parseGCIFromHeaders(req.headers) 
    let path = req.query.path || ''
    try {
      let state = await queryByGCI(gci, path) 
      res.json(state)
    } catch(e) {
      res.status(400).send(e)
    }
  })
  expressApp.post('/txs', async (req, res) => {
    let GCI = parseGCIFromHeaders(req.headers) 
    if(!GCI) {
      return res.sendStatus(400)
    }
    try {
      res.json(await sendTxByGCI(GCI, req.body))
    } catch(e) {
      res.status(400).send(e)
    }
  })
  
  expressApp.get('/:gci/state', async (req, res) => {
    let path = req.query.path || ''
    let gci = req.params.gci
    try {
      let state = await queryByGCI(gci, path) 
      res.json(state)
    } catch(e) {
      res.status(400).send(e)
    }
  })

  expressApp.post('/:gci/txs', async (req, res) => {
    let GCI = req.params.gci
    try {
      res.json(await sendTxByGCI(GCI, req.body))
    } catch(e) {
      res.status(400).send(e)
    }
  })

  expressApp.use('/:gci', async (req, res, next) => {
    let GCI = req.params.gci
    try {
      let clientHash = await queryByGCI(GCI, '_sheaClientHash')

      // check if we already have this client bundle
      let path = join(SHEA_HOME, 'clients', GCI)
      if(await fs.exists(path)) {
        return next()
      }

      let clientArchive = await getClientByHash(clientHash)
      let tmpPath = join(os.tmpdir(), randomBytes(16).toString('hex'))
      fs.writeFileSync(tmpPath, clientArchive)
      // unpack client archive
      mkdirp.sync(path)

      await tar.extract({ cwd: path, strip: 1, file: tmpPath})
      await fs.remove(tmpPath)

      next()
    } catch(e) {
      res.status(400).send(e)
    }
  })

  expressApp.use(express.static(join(SHEA_HOME, 'clients')))

  expressApp.listen(expressPort)
  if(!gatewayMode) {
    opn('http://localhost:' + expressPort + '/' + GCI)
  }

  async function queryByGCI(GCI, path) {
    if(!clients[GCI]) {
      clients[GCI] = await connect(GCI)
      clients[GCI].bus.on('error', ()=> {
        delete clients[GCI]
      })
    }
    return await clients[GCI].getState(path)
  }
  async function sendTxByGCI(GCI, tx) {
    if(!clients[GCI]) {
      clients[GCI] = await connect(GCI)
      clients[GCI].bus.on('error', ()=> {
        delete clients[GCI]
      })
    }
    return await clients[GCI].send(tx)
  }

}

main()
