'use strict'

const mqtt = require('mqtt')
const { GeneticEngine, toConsole } = require('../lib/ga')
const { BindMqtt } = require('../lib/bindmqtt')

const client  = mqtt.connect('mqtt://localhost')

function randId() {
  return Math.floor(
    Math.random() * (9999999 - 1000000) + 9999999
  )+''
}

const ge = new GeneticEngine({
  populationSize: 10,
  events: toConsole,
  seed: function () {
    const id = randId()
    console.log("seed", id)
    return { id, genome: { any_label: 'NN-GN-'+id, any_value: id } }
  },
  mutate: function (genome) {
    const id = randId()
    console.log("mutate", genome, '=>', id)
    return { id, genome: { any_label: 'NN-MT-'+id, any_value: id} }
  },
  crossover: function (genome, partner) {
    const id = randId()
    console.log("crossover", genome, '+', partner, '=>', id)
    return { id, genome: { any_label: 'NN-CR-'+id, any_value: id } }
  }
})

const computeStep = function () {
  // calculation step may get as many genomes to evaluate as it want
  const { id, genome } = ge.getGenome()

  // async calculation function started here, timer function is added for demo purposes
  setTimeout(() => {
    const fitness = Math.sqrt(genome.any_value) // very long genome evaluation function

    console.log(ge.getGeneration(), 'evaluation done', id, fitness, genome)

    // return async result to engine and save it to queue provider
    ge.rate(id, fitness)

    // start another iteration immediately after events processed,
    // storage population updates are loaded here
    setImmediate(computeStep)
  }, 1000)
}

client.stream.on('error', (err) => {
  console.log('mqtt-error:', err)
});

client.on('connect', async () => {

  // connect to queue storage
  await ge.bindStorage(new BindMqtt(client, 'demo/ga'))

  console.log('queue provider connected.');
  setImmediate(computeStep)
})
