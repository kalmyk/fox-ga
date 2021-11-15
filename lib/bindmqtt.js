'use strict'

class BindMqtt {
  constructor (mqttClient, prefix) {
    this.client = mqttClient
    this.prefix = prefix

    this.client.on('message', function (topic, message, packet) {
      const msg = message.toString()
      if (msg) {
        // new phenotype message arrived
        const {phenotype, id, fitness} = JSON.parse(msg)
        this.loader(phenotype, id, fitness, packet.retain)
      } else {
        // remove message arrived
        const id = topic.substr(this.prefix.length+1)
        this.loader(undefined, id, undefined, false)
      }
    }.bind(this))
  }

  initLoader(loader) {
    this.loader = loader
    this.client.subscribe(this.prefix+'/#')
  }

  publish (phenotype, id, fitness) {
    this.client.publish(
      this.prefix+'/'+id,
      JSON.stringify({phenotype, id, fitness}),
      {retain: true}
    )
  }

  remove (id) {
    this.client.publish(
      this.prefix+'/'+id,
      null,
      {retain: true}
    )
  }

}

module.exports = {
  BindMqtt
}
