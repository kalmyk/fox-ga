# fox-ga is implementation of parallel and distributed Genetic Algorithm based on message queue paradigm

Any standard MQTT broker could be used as phenotype storage. Mosquitto & [FOX-WAMP](https://github.com/kalmyk/fox-wamp) was tested.

## benefits:
* external storage is used to save phenotype population
* ability to have as many workers to calculate as hosts available
* ability to restart worker with no affect to calculation process
* ability to have phenotype batch calculation function
* engine module does not limit computation process by time

## usage:
Here is demo evaluation function in './demo-bin/run-mqtt.js'. The demo evaluation function use timer to show long computation time of phenotype evaluation function.

### create engine
```js
const ge = new GeneticEngine(
  {
    populationSize: <population-size>,
    generate: function () {
      ...
      return { id:<phenotype-identifier>, phenotype: <any-structure> }
    },
    mutate: function (phenotype) {
      ...
      return { id:<phenotype-identifier>, phenotype: <any-structure> }
    },
    crossover: function (phenotype, partner) {
      ...
      return { id:<phenotype-identifier>, phenotype: <any-structure> }
    }
  }
)
```
! good idea to have "phenotype-identifier" equal to sha1(JSON.stringify(phenotype))

### connect to queue storage
```js
  await ge.init(new BindMqtt(client, <path-to-population-store>))
```

### get phenotype for evaluation
```js
  const { id, phenotype } = ge.getPhenotype()
```
where:
* id: phenotype-identifier
* phenotype: Phenotype that is obtained from generate/mutate/crossover

### apply phenotype fitness to population
```js
ge.rank(id, fitness)
```
where:
* id: phenotype-identifier obtained from getPhenotype function
* fitness: Result of Genetic Fitness function

## Get current population state:
```shell
$ mosquitto_sub --retained-only -t '<path-to-population-store>/#' -v
```
