# fox-ga is implementation of distributed Genetic Algorithm based on message queue paradigm

Any MQTT broker could be used as phenotype storage. Mosquitto & FOX-WAMP was tested.

## benefits:
* external storage is used to save phenotype population
* ability to have as many workers to calculate as hosts available
* ability to restart worker with no affect to calculation process
* ability to have phenotype batch calculation function

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
  },
  new BindMqtt(client, <path-to-store-population>)
)
```

### get phenotype for evaluation
```js
  const { id, limit, phenotype, parents } = ge.getPhenotype()
```
where:
* id: phenotype-identifier
* limit: Minimal fitness that is accepted for the phenotype, it is qual to max of fitness of parents. There is no sense to add to population phenotype with fitness less than parents.
* phenotype: Phenotype that is obtained from generate/mutate/crossover
* parents: Array of parents that was used for the phenotype

### apply phenotype fitness to population
```js
ge.rank(fitness, limit, id, phenotype, parents)
```
where:
* fitness: Result of Genetic Fitness function
* limit: The value obtained from getPhenotype function
* id: phenotype-identifier obtained from getPhenotype function
* phenotype: Phenotype obtained from getPhenotype function
* parents: Parents obtained from getPhenotype function, the list of phenotypes will be removed from population if phenotype fitness is accepted

## Get current population state:
```shell
$ mosquitto_sub --retained-only -t 'demo/ga/#' -v
```
