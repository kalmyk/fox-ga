'use strict'

const mqtt = require('mqtt')
const { GeneticEngine } = require('../lib/ga')
const { BindMqtt } = require('../lib/bindmqtt')

const client  = mqtt.connect('mqtt://localhost')

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
      return { id, phenotype: { any_label: 'NN-GN-'+id, any_value: id } }
    },
    mutate: function (phenotype) {
      const id = randId()
      console.log("mutate", phenotype, '=>', id)
      return { id, phenotype: { any_label: 'NN-MT-'+id, any_value: id} }
    },
    crossover: function (phenotype, partner) {
      const id = randId()
      console.log("crossover", phenotype, '+', partner, '=>', id)
      return { id, phenotype: { any_label: 'NN-CR-'+id, any_value: id } }
    }
  }
)

const computeStep = function () {
  // calculation step may get as many phenotypes to evaluate as it want
  const { id, phenotype } = ge.getPhenotype()

  // async calculation function started here, timer function is added for demo purposes
  setTimeout(() => {
    const fitness = Math.sqrt(phenotype.any_value) // very long phenotype evaluation function

    console.log(ge.getGeneration(), 'evaluation done', id, fitness, phenotype);

    // return async result to engine and save it to queue provider
    ge.rank(id, fitness)

    // start another iteration immediately after events processed,
    // storage population updates are loaded here
    setImmediate(computeStep)
  }, 1000);
}

client.on('connect', async () => {

  // connect to queue storage
  await ge.init(new BindMqtt(client, 'demo/ga'))

  console.log('queue provider connected.');
  setImmediate(computeStep);
})
