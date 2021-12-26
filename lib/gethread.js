'use strict'

const cluster = require('cluster')

let genomeRequestStack = []
let geneticEngine
let initResolve, initReject
let communicationWorker

if (cluster.isMaster) {
  cluster.on('online', (worker) => {
    communicationWorker = worker
    worker.send({ cmd: 'GE-INIT' })
  })  
  cluster.on('message', (worker, msg) => {
    if (msg.cmd == 'GE-READY') {
      initResolve()
    }
    else if (msg.cmd == 'GE-GENOME') {
      genomeRequestStack.shift()(msg.body)
    }

  })
} else {
  process.on('message', (msg) => {
    if (msg.cmd == 'GE-INIT') {
      process.send({ cmd: 'GE-READY' })
    }
    else if (msg.cmd == 'GE-GET-GENOME') {
      process.send({ 
        cmd: 'GE-GENOME',
        body: geneticEngine.getGenome()
      })
    } else if (msg.cmd == 'GE-RATE') {
      const {id, fitness, info} = msg.body
      geneticEngine.rate(id, fitness, info)
    }
  })
}

function init (settings) {
  return new Promise((resolve, reject) => {
    initResolve = resolve
    initReject  = reject
  })
}

function evaluate (ge) {
  geneticEngine = ge
}

function bindStorage (storage) {
  return geneticEngine.bindStorage(storage)
}

function getGenome () {
  communicationWorker.send({ cmd: 'GE-GET-GENOME' })
  return new Promise((resolve) => {
    genomeRequestStack.push(resolve)
  })
}

async function getGenomePkg (pkgSize) {
  let result = []
  for (let i = 0; i < pkgSize; i++) {
    result.push(await getGenome())
  }
  return result
}

function rate(id, fitness, info) {
  communicationWorker.send({ cmd: 'GE-RATE', body: { id, fitness, info }})
}

function ratePkg(pkg) {
  for (let i = 0; i < pkg.length; i++) {
    rate(pkg[i].id, pkg[i].fitness, pkg[i].info)
  }
}

module.exports = {
  init,
  bindStorage,
  evaluate,
  getGenome,
  getGenomePkg,
  rate,
  ratePkg,
}
