'use strict'

const cluster = require('cluster')

let genomeRequestStack = []
let geneticEngine
let communicationWorker
let communicationWorkerLoaded = false
let getGenomePendingCount = 0

if (cluster.isMaster) {
  cluster.on('online', (worker) => {
    communicationWorker = worker
  })  
  cluster.on('message', (worker, msg) => {
    if (msg.cmd == 'GE-READY') {
      communicationWorkerLoaded = true
      while (getGenomePendingCount > 0) {
        communicationWorker.send({ cmd: 'GE-GET-GENOME' })
        getGenomePendingCount--
      }
    }
    else if (msg.cmd == 'GE-GENOME') {
      genomeRequestStack.shift()(msg.body)
    }

  })
} else {
  process.on('message', (msg) => {
    if (msg.cmd == 'GE-GET-GENOME') {
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

function evaluate (ge) {
  geneticEngine = ge
}

function bindStorage (storage) {
  process.send({ cmd: 'GE-READY' })
  return geneticEngine.bindStorage(storage)
}

function getGenome () {
  if (communicationWorkerLoaded) {
    communicationWorker.send({ cmd: 'GE-GET-GENOME' })
  } else {
    getGenomePendingCount++
  }
  return new Promise((resolve) => {
    genomeRequestStack.push(resolve)
  })
}

function rate(id, fitness, info) {
  communicationWorker.send({ cmd: 'GE-RATE', body: { id, fitness, info }})
}

module.exports = {
  bindStorage,
  evaluate,
  getGenome,
  rate
}
