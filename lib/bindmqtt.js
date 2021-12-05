'use strict'

class BindMqtt {
  constructor (mqttClient, rootPrefix) {
    this.client = mqttClient
    this.rootPrefix = rootPrefix
    this.populationPrefix = rootPrefix+'/population'

    this.client.on('message', function (topic, message, packet) {
      const msg = message.toString()
      if (msg) {
        // new genome message arrived
        const {genome, id, fitness} = JSON.parse(msg)
        this.loader(genome, id, fitness, packet.retain)
      } else {
        // remove message arrived
        const id = topic.substr(this.populationPrefix.length+1)
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
    this.client.subscribe(this.populationPrefix+'/#', (err) => {
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
      this.populationPrefix+'/'+id,
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

  publish (genome, id, fitness) {
    return this._eventPublish(id, JSON.stringify({id, genome, fitness}))
  }

  remove (id) {
    return this._eventPublish(id, null)
  }

}

module.exports = {
  BindMqtt
}
