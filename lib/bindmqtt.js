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

  initLoader (loader) {
    let resolve, reject
    let resultPromise = new Promise((aResolve, aReject) => {
      resolve = aResolve
      reject = aReject
    })
    this.loader = loader
    this.client.subscribe(this.prefix+'/#', (err) => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
    return resultPromise
  }

  _eventPublish (id, data) {
    let resolve, reject
    let resultPromise = new Promise((aResolve, aReject) => {
      resolve = aResolve
      reject = aReject
    })
    this.client.publish(
      this.prefix+'/'+id,
      data,
      {retain: true},
      (err) => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      }
    )
    return resultPromise
  }

  publish (phenotype, id, fitness) {
    return this._eventPublish(id, JSON.stringify({id, phenotype, fitness}))
  }

  remove (id) {
    return this._eventPublish(id, null)
  }

}

module.exports = {
  BindMqtt
}
