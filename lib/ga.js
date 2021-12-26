'use strict'

const EventEmitter = require('events').EventEmitter;

const OP_CROSSOVER = 1
const OP_MUTATION  = 2

class GeneticEngine extends EventEmitter {
  constructor (opts) {
    super()
    this.population = []
    this.generation = 0
    this.toLoad = []
    this.evaluation = new Map()
    this.curItem = -1
    this.storage = null
    this.opts = this.checkSetting(opts)
  }

  checkSetting (opts) {
    opts = opts || {}

    if (!opts.seed) throw Error('seed function is not defined')
    if (!opts.mutate) throw Error('mutate function is not defined')
    if (!opts.crossover) throw Error('crossover function is not defined')
    if (!opts.populationSize) throw Error('populationSize is not defined')

    this.populationSize = opts.populationSize
    if (opts.events) {
      this.on('event', opts.events)
    }

    return opts
  }

  async bindStorage (storage) {
    this.storage = storage
    return this.storage.initLoader(this.loadOne.bind(this))
  }

  getGeneration () {
    return this.generation
  }

  // returns {id, genome, parents, operation, limit}
  buildGenomeRec () {
    if (this.toLoad.length) {
      const {id, genome} = this.toLoad.shift()
      return {id, genome, parents: [], operation: "load"}
    }

    if (this.population.length < this.populationSize) {
      const {id, genome} = this.opts.seed()
      return {id, genome, parents: [], operation: "seed"}
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

        const {id, genome} = this.opts.crossover(
          parent.genome,
          cur.genome
        )
        if (!genome) {
          continue // unable to create crossover
        }
        return {
          id,
          genome,
          parents: [ parent.id, cur.id ],
          operation: "crossover",
          limit: Math.max(parent.fitness, cur.fitness)
        }
      } else { // cur.nextOp === OP_MUTATION
        cur.nextOp = OP_CROSSOVER
        const {id, genome} = this.opts.mutate(cur.genome)
        if (!genome) {
          continue // unable to mutate
        }
        return {
          id,
          genome,
          parents: [ cur.id ],
          operation: "mutate",
          limit: cur.fitness
        }
      }
    }
  }

  isIdExists (id) {
    for (let row of this.population) {
      if (row.id == id) {
        return true
      }
    }
    return this.evaluation.has(id)
  }

  /**
   * limit  : Minimal fitness that is accepted for the genome, 
   *          it is qual to max of fitness of parents. There is no
   *          sense to add to population genome with fitness less than parents.
   * parents: Array of parents that was used for the genome.
   *          the list of genomes will be removed from population
   *          if genome fitness is accepted in rate function
  */
  getGenome () {
    do {
      let { id, genome, parents, operation, limit } = this.buildGenomeRec()
      if (!this.isIdExists(id)) {
        this.evaluation.set(id, { genome, parents, limit })
        return { id, genome, operation }
      }
      console.log('error: genome id already exists in popilation #', id)
    } while (true)
  }

  // remove genome from local copy and remote storage
  removeGenome (id, desc, pubRemove) {
    for (let index = 0; index < this.population.length; index++) {
      let item = this.population[index]
      if (id === item.id) {
        this.population.splice(index, 1)
        if (pubRemove) {
          console.log(desc,'(', id, ')@', index, ':', item.fitness)
          this.storage.remove(id)
        }
      }
    }
  }

  trimTail () {
    while (this.population.length > this.populationSize) {
      this.removeGenome(this.population[this.population.length-1].id, "tail-rm ", true)
    }
  }

  // maintain the local copy of population
  // returns true if population is updated
  add2Population (fitness, limit, id, genome) {
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
        this.emit('event', {operation: 'added', id, index, fitness})
        this.population.splice(index, 0, {genome, id, fitness})
        return true
      }
    }

    if (this.population.length < this.populationSize) {
      this.emit('event', {operation: 'tail-add', id, index:this.population.length, fitness})
      this.population.push({genome, id, fitness})
      return true
    }

    return false
  }

   /* rate the result obtained locally
    * @id genome identifier
    * @fitness value of fitness
    * @info any fitness related info such as time of evaluation or steps passed
    */
   rate (id, fitness, info) {
    // remove if suddenly id is already exists in population
    this.removeGenome(id, "rate-rm ", true)
    let item = this.evaluation.get(id)
    if (!item) {
      throw Error('genome Id is not found:', id)
    }
    this.evaluation.delete(id)
    let { genome, parents, limit } = item
    if (this.add2Population(fitness, limit, id, genome)) {
      this.storage.publish(genome, id, fitness, info)
      for (let p of parents) {
        this.removeGenome(p, "prnt-rm ", true)
      }
      this.trimTail()
    }
  }

  // load from storage
  loadOne (genome, id, fitness, retained) {
    if (typeof genome === 'undefined') {
      this.removeGenome(id, 'udf-rm', false)
    } else {
      this.removeGenome(id, 'tmp-rm', false)
      this.add2Population(fitness, undefined, id, genome)
      if (retained /* && this.recomputeFitness */) {
        console.log('LOAD', id)
        this.toLoad.push({genome, id, fitness})
      }
    }
  }
}

const toConsole = (event) => {
  console.log(event.operation.padEnd(7), event.id, '@', event.index, ':', event.fitness)
}

module.exports = {
  GeneticEngine,
  toConsole
}
