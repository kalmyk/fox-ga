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
      generate: function () {
        return { id: ++id, phenotype: 'generate' }
      },
      mutate: function (phenotype) {
        phenotype.data++
        return { id: ++id, phenotype }
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
    let {id, phenotype} = ge.getPhenotype()
    expect(id).to.equal(1)
  })

})
