'use strict'

const chai = require('chai')
const expect = chai.expect

const {GeneticEngine}  = require('../lib/ga')

const testLoaderMock = {
  initLoader: () => null
}

describe('GeneticEngine', function () {
  let ge
  let id

  beforeEach(function () {
    id = 0
    ge = new GeneticEngine({
      populationSize: 5,
      seed: function () {
        return { id: ++id, genome: 'seed' }
      },
      mutate: function (genome) {
        genome.data++
        return { id: ++id, genome }
      },
      crossover: function (a,b) {
        return { id: ++id, a }
      }
    },
    testLoaderMock)
  })

  afterEach(function () {
  })

  it('create-one', function () {
    let {id, genome} = ge.getGenome()
    expect(id).to.equal(1)
  })

})
