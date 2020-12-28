'use strict'

const mqtt = require('mqtt')
const { GeneticEngine } = require('../lib/ga')
const { BindMqtt } = require('../lib/bindmqtt')

const client  = mqtt.connect('mqtt://192.168.2.34')

function randId() {
  return Math.floor(
    Math.random() * (9999999 - 1000000) + 9999999
  )+''
}

const ge = new GeneticEngine(
  {
    populationSize: 10,
    generate: function () {
      const id = randId()
      console.log("generated", id)
      return { id, phenotype:'NN' }
    },
    mutate: function (phenotype) {
      const id = randId()
      console.log("mutate", id)
      return { id, phenotype:'NN' }
    },
    crossover: function (phenotype, partner) {
      const id = randId()
      console.log("crossover", id)
      return { id, phenotype:'NN' }
    }
  },
  new BindMqtt(client, 'demo/ga')
)

const computeStep = function () {
  const { id, limit, phenotype, parents } = ge.getPhenotype()

  setTimeout(() => {
    const fitness = Math.random() // evaluate(phenotype)
    ge.rank(fitness, limit, id, phenotype, parents)

    setImmediate(computeStep)
  }, 1000);
}

client.on('connect', function () {
  setImmediate(computeStep);
})
