# fox-ga is implementation of parallel and distributed Genetic Algorithm based on message queue paradigm

The goal of the project is to provide ability to run time consuming fitness function of genetic algorithm simultaneously on distributed environment.

Any standard MQTT broker could be used as shared genome storage. Mosquitto & [FOX-WAMP](https://github.com/kalmyk/fox-wamp) were tested.

## benefits:
* external storage is used to save population
* ability to have as many workers to compute fitness as hosts available
* ability to restart worker with no affect to calculation process
* ability to calculate simultaneously fitnesses of batch of genomes
* engine module does not limit computation process by time

## install:
```shell
npm i git+https://github.com/kalmyk/fox-ga.git
```

## usage:
Here is demo evaluation function in './demo-bin/run-mqtt.js'. The demo evaluation function use timer to show long computation time of fitness evaluation function.

### create engine
```js
const ge = new GeneticEngine({
  populationSize: <population-size>,
  seed: function () {
    ...
    return { id:<genome-identifier>, genome: <any-structure> }
  },
  mutate: function (genome) {
    ...
    return { id:<genome-identifier>, genome: <any-structure> }
  },
  crossover: function (genome, partner) {
    ...
    return { id:<genome-identifier>, genome: <any-structure> }
  }
})
```
> ! Good idea to have "genome-identifier" equal to sha1(JSON.stringify(genome)), this id must be unique for the whole cluster

### connect to queue storage
```js
  await ge.init(new BindMqtt(client, <path-to-population-store>))
```

### get genome for fitness evaluation
```js
  const { id, genome } = ge.getGenome()
```
where:
* id: genome-identifier
* genome: genome that is obtained from seed/mutate/crossover

### apply genome fitness to population
```js
ge.rank(id, fitness)
```
where:
* id: genome-identifier obtained from getGenome function
* fitness: Result of Genetic Fitness function

### calculation loop
The calculation loop need to have free time to load events from remote storage. Usually it is enough to start next iteration by setImmediate function.

```js
const computeStep = function () {
  const { id, genome } = ge.getGenome()
  const fitness = myEvaluationFunc(genome)
  ge.rank(id, fitness)
  if (isGood(fitness)) {
    console.log('best fitness found', id, fitness)
    return
  }
  setImmediate(computeStep)
}

client.on('connect', async () => {
  await ge.init(new BindMqtt(client, 'demo/ga'))
  setImmediate(computeStep)
})
```

### termination function
There is no termination function. The calculation loop and it exit condition is implemented in a custom code.

## Get current population state:
```shell
$ mosquitto_sub --retained-only -t '<path-to-population-store>/population/#' -v
```
