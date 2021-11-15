'use strict'

const OP_CROSSOVER = 1
const OP_MUTATION  = 2

class GeneticEngine {
  constructor (opts, storage) {
    this.population = []
    this.generation = 0
    this.toLoad = []
    this.curItem = -1
    this.storage = storage

    this.storage.initLoader(this.loadOne.bind(this))
    this.opts = this.checkSetting(opts)
  }

  checkSetting (opts) {
    opts = opts || {}

    if (!opts.generate) throw Error('generate function is not defined')
    if (!opts.mutate) throw Error('mutate function is not defined')
    if (!opts.crossover) throw Error('crossover function is not defined')
    if (!opts.populationSize) throw Error('populationSize is not defined')

    this.populationSize = opts.populationSize

    return opts
  }

  // returns [id, phenotype]
  getPhenotype () {
    if (this.toLoad.length) {
      const {id, phenotype} = this.toLoad.shift()
      return {id, phenotype, parents: [], operation: "load"}
    }

    if (this.population.length < this.populationSize) {
      const {id, phenotype} = this.opts.generate()
      return {id, phenotype, parents: [], operation: "generate"}
    }

    while (true) {
      this.curItem++
      if (this.curItem >= this.population.length) {
        this.curItem = 0
        this.generation++
      }
      let cur = this.population[this.curItem]

      if (cur.nextOp === OP_CROSSOVER) {
        cur.nextOp = OP_MUTATION
        if (!cur.nextCross) {
          // select next to crossover
          cur.nextCross = this.curItem
        }
        cur.nextCross++
        if (cur.nextCross >= this.population.length) {
          cur.nextCross = 0
        }
        if (this.curItem === cur.nextCross) {
          // do not crossover it self
          continue
        }

        let parent = this.population[cur.nextCross]

        const {id, phenotype} = this.opts.crossover(
          parent.phenotype,
          cur.phenotype
        )
        if (!phenotype) {
          continue // unable to create crossover
        }
        return {
          id,
          phenotype,
          parents: [
            parent.sha1,
            cur.sha1
          ],
          operation: "crossover",
          limit: Math.max(parent.fitness, cur.fitness)
        }
      } else { // cur.nextOp === OP_MUTATION
        cur.nextOp = OP_CROSSOVER
        const {id, phenotype} = this.opts.mutate(cur.phenotype)
        if (!phenotype) {
          continue // unable to mutate
        }
        return {
          id,
          phenotype,
          parents: [
            cur.id
          ],
          operation: "mutate",
          limit: cur.fitness
        }
      }
    }
  }

  // remove phenotype from local copy and remote storage
  removePhenotype (id, desc, pubRemove) {
    for (let index = 0; index < this.population.length; index++) {
      let item = this.population[index]
      if (id === item.id) {
        this.population.splice(index, 1)
        if (pubRemove) {
          console.log(desc,'(', id, ')@', index, ':', item.fitness)
          this.storage.remove(id, index, item.fitness)
        }
      }
    }
  }

  trimTail() {
    while (this.population.length > this.populationSize) {
      this.removePhenotype(this.population[this.population.length-1].id, "tail-rm ", true)
    }
  }

  // maintain the local copy of population
  // returns true if population is updated
  add2Population (fitness, limit, id, phenotype) {
    if (typeof limit !== 'undefined' && fitness < limit) {
      return false
    }

    // print current position
    for (let index = 0; index < this.population.length; index++) {
      let cur = this.population[index]
      console.log('* ', index, cur.id, cur.fitness)
    }

    for (let index = 0; index < this.population.length; index++) {
      let cur = this.population[index]

      if (cur.fitness < fitness) {
        console.log('added    (', id, ')@', index, ':', fitness)
        this.population.splice(index, 0, {phenotype, id, fitness})
        return true
      }
    }

    if (this.population.length < this.populationSize) {
      console.log('tail-add (', id, ')@', this.population.length, ':', fitness)
      this.population.push({phenotype, id, fitness})
      return true
    }

    return false
  }

  // result obtained locally
  rank (fitness, limit, id, phenotype, parents) {
    // remove if id already exists
    this.removePhenotype(id, "rank-rm ", true)
    if (this.add2Population(fitness, limit, id, phenotype)) {
      this.storage.publish(phenotype, id, fitness)
      for (let p of parents) {
        this.removePhenotype(p, "prnt-rm ", true)
      }
      this.trimTail()
    }
  }

  // load from storage
  loadOne (phenotype, id, fitness, retained) {
    if (typeof phenotype === 'undefined') {
      this.removePhenotype(id, 'udf-rm', false)
    } else {
      this.removePhenotype(id, 'tmp-rm', false)
      this.add2Population(fitness, undefined, id, phenotype)
      if (retained /* && this.recomputeFitness */) {
        console.log('LOAD', id)
        this.toLoad.push({phenotype, id, fitness})
      }
    }
  }
}

module.exports = {
  GeneticEngine
}
