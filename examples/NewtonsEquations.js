/*=============================================================================
NAME:        Newton's Equations
DESCRIPTION: This module provides a practical example of how to utilize the 
  Physical Quantity quasiquoting environment to peform a real world calculation.
  Supose we want to compute the velocity of a projectile fired from a cannon.  
  We are given the inital velocity in the vertical direction, the height of the 
  cannon above the ground, and the local acceleration due to gravity.   While 
  the canon ball is in flight the height and velocity can be described by 
  Newton's equations of motion:

  height(t) = initial height + initial velocity * t + 0.5 * gravity * t^2
  velocity(t) = inital velocity + gravity * t

  It is possible that we may be given measurments of the time, gravitational 
  acceleration and initial velocity and position in arbitrary units of measure, 
  but we want to report the computed velocity in kilometers per hour.

  Finally, we would like to guard against ill-dimensioned computations;  we 
  would like to ensure that we are given not just dimensionally consistent 
  inputs, but also that the given values have dimensions of LENGTH, VELOCITY, 
  ACCELERATION and TIME.
==============================================================================*/
'use strict';
// We begin by importing the withQuantities module.  This provides the 
// quasiquoting evironment which will let us perform computations with 
// physical quantities using famililar mathematical operators. 
const withQuantities = require('../lib/WithQuantities')
const Cast = require('../lib/dsl/Casts')

// To ensure that the results are reported in the correct unit of measure, we
// import the Unit and Prefixes constant modules.   These modules contain 
// collection of customary units of measure, and are intended for the purpose 
// of testing, and are by no means exhasutive.   We will use these definitions
// to construct our own definitions of kilogram and KPH.
const Unit = require('../lib/dsl/constants/UnitConstants')
const Prefixes = require('../lib/dsl/constants/PrefixConstants')

const myUnits = [
  { name:"kilometer", unit: Unit.meter.__multiply( Prefixes.kilo)  },
  { name:"kph", unit: Unit.hour.__divide(Unit.meter.__multiply( Prefixes.kilo) ) }
]

// Next we define the function that we want to evaluate using physical quantities.
const projectileVelocity = function(input) {
   return withQuantities( function(input) {
      // ANYTHING INSIDE THIS CODE BLOCK USES OVERLOADED MATHEMATICAL OPERATORS
      // AND CAN PERFORM COMPUTATIONS WITH PHYSICAL QUANTITIES, UNITS OF MEASURE
      // AND THEIR DIMENSIONS.

      // Cast the input values to physical quantities.   This ensures that the 
      // inputs are well formed and well dimensioned.
      const t  = toQuantity(input.duration, TIME)
      const v0 = toQuantity(input.initialVelocity, VELOCITY)
      const a0 = toQuantity(input.acceleration, ACCELERATION)
      const s0 = toQuantity(input.initialPosition,LENGTH)

      // Compute the position and velocity using Newton's equations of motion. 
      // if the projectile has hit the ground then the position and velocity 
      // are zero.
      var s = s0 + (v0 + 1/2 * a0 * t ) * t
      var v = v0 +  a0*t
      if (s < s0*0 ) v = v0*0

      // confirm that the results are well dimensioned, and return them in the 
      // requested units of measure and with 4 significant digits of precision.
      return fromQuantity( PQMath.precise(PQMath.convertTo(v, kph ),4), VELOCITY )

    }, myUnits)( input );
    // ^^ Note the use of myUnits here.  This makes my definitons available
    // inside the quasiquoting environment.
  }

// Now we can call the function with several different times, and print the 
// results 

for ( const x of Array.from(Array(65).keys()) ) {
  const velocity = projectileVelocity({ 
    duration: { magnitude: x, unitOfMeasure: Unit.second },
    initialVelocity: { magnitude: 700, unitOfMeasure: Unit.mph },
    acceleration: { magnitude: -9.8, unitOfMeasure: Unit.meterPerSecondPerSecond },
    initialPosition: { magnitude: 0, unitOfMeasure: Unit.foot }
  })
  console.log(x.toString()+"s\t,",velocity.id)
} 