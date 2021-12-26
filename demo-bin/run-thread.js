'use strict'

const cluster = require('cluster')
const geThread = require('../lib/gethread')

if (cluster.isMaster) {
  cluster.fork()

  const computeStep = async () => {
    const { id, genome } = await geThread.getGenome()

    // async calculation function started here, timer function is added for demo purposes
    setTimeout(async () => {
      const fitness = Math.sqrt(genome.any_value) // very long genome evaluation function

      // return async result to engine and save it to queue provider
      await geThread.rate(id, fitness)

      setImmediate(computeStep)
    }, 1000)
  }

  geThread.init().then(() => {
    setImmediate(computeStep)
  })

} else {

  const mqtt = require('mqtt')
  const { BindMqtt } = require('../lib/bindmqtt')
  const { GeneticEngine, toConsole } = require('../lib/ga')

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
  geThread.evaluate(ge)

  const client  = mqtt.connect('mqtt://localhost')
  client.stream.on('error', (err) => {
    console.log('mqtt-error:', err)
  });

  client.on('connect', async () => {
    await geThread.bindStorage(new BindMqtt(client, 'demo/ga'))
    console.log('queue provider connected.')
  })
}
