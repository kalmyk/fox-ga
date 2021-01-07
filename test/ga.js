'use strict'

const chai = require('chai')
const expect = chai.expect

const {GeneticEngine}  = require('../lib/ga')

describe('GeneticEngine', function () {
  let ge

  beforeEach(function () {
    ge = new GeneticEngine({
      mutate: function (phenotype) {
        phenotype.data++
        return phenotype
      },
      crossover: function (a,b) {
        return a
      }
    })
  })

  afterEach(function () {
  })

  it('create-one', function () {
    let a

    ge.increasePopulation({data:1})
    a = ge.getPhenotype()

    expect(a[1]).to.deep.equal({data:1})
    ge.evaluate(a[0], 1)

    a = ge.getPhenotype()
    ge.evaluate(a[0], 2)
    console.log(ge.getPopulation())
  })

  it('evaluate', function () {
    ge.increasePopulation({data:1})
    ge.increasePopulation({data:2})

    let a1 = ge.getPhenotype()
    let a2 = ge.getPhenotype()

    ge.evaluate(a1[0], 1)
    ge.evaluate(a2[0], 2)

    let a3 = ge.getPhenotype()
    ge.evaluate(a3[0], 3)

    let a4 = ge.getPhenotype()
    ge.evaluate(a4[0], 4)

    a3 = ge.getPhenotype()
    ge.evaluate(a3[0], 1)

    a3 = ge.getPhenotype()
    ge.evaluate(a3[0], 7)

    a3 = ge.getPhenotype()
    ge.evaluate(a3[0], 5)

    console.log(ge.getPopulation())
  })

})
