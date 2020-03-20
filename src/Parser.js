
/*=============================================================================
NAME: Numbers
DESCRIPTION: This module exports a monadic parser for natural language numbers.
  The parser can be used by calling either the "parse" or "tryParse" methods of
  the parser:

  NLNumber.parse("four score and seven")
  NLNumber.parse("a billion")
==============================================================================*/
'use strict';
const P = require('parsimmon')

/** Given a parser, this parser combinator will return a parser that will either 
 * parse that value or return null without consuming any input.
 */
const optional = p => P.alt(p, P.succeed(null))

/** Given a surface form and a normal form, return a parser that will parse the 
 * surface form and any trailing token separators, and return the normal form 
*/
const token = (surfaceForm,normalForm) => 
  P.seq(P.string(surfaceForm),
        P.regexp( /\s+|[,.!?;-]\s*/ ).or(P.eof)
    ).map( _ => normalForm)

/** given a parser, this parser combinator will optionally parse the conjunction
 * "and" followed by the given parser.   */
const and =  p => P.seq(optional(token("and",null)),p).map( xs => xs[1])

/** Given a parser that returns a triple containing the leading numeric value,
 * the power of ten and the trailing numeric value, this combinator returns
 * the combined numeric value of the parse. */
const combineParsedValues = p => p.map( xs => xs[0]*xs[1] + (xs[2] || 0))

/** This object defines the recursive numeric parsers for parsing natural 
 * language numbers.   The main entry point for parsing is the field 
 * "number" */
var L = P.createLanguage({
  /** given a self reference, return a parser that will parse any natural 
   * language number between zero and 1 trillion - 1. 
   */
  number: r => 
    r.billions
    .or(r.millions)
    .or(r.thousands)
    .or(r.hundreds)
    .or(r.teens)
    .or(r.tens)
    .or(r.dozens)
    .or(r.scores)
    .or(r.ones)
    .or(r.ten)
    .or(r.zero)
    .or(r.aNumber),
  /** Parse a number with a leading "a" */
  aNumber: r => 
    P.seq(
      token("a",1),
      r.billion.or(r.million).or(r.thousand).or(r.hundred).or(r.dozen).or(r.score),
      P.succeed(0)
    ).thru( combineParsedValues ),
  /** Parse Various Number tokens. */  
  ten: _ => token("ten",10),
  zero: _ => token("zero",0),
  billion: _ => token("billion",1000000000),
  million: _ => token("million",1000000),
  thousand: _ => token("thousand",1000),
  hundred: _ => token("hundred",100),
  score: _ => token("score",20),
  dozen: _ => token("dozen",12),
  // parsers for single digits 
  ones: _  => 
    token("one",1)
    .or(token("two",2))
    .or(token("three",3))
    .or(token("four",4))
    .or(token("five",5))
    .or(token("six",6))
    .or(token("seven",7))
    .or(token("eight",8))
    .or(token("nine",9))
    .desc("ones"),
  // parsers for numbers between 11 and 19.  
  teens: _  => 
    token("eleven",11)
    .or(token("twelve",12))
    .or(token("thirteen",13))
    .or(token("fourteen",14))
    .or(token("fifteen",15))
    .or(token("sixteen",16))
    .or(token("seventeen",17))
    .or(token("eighteen",18))
    .or(token("nineteen",19))
    .desc("teens"),
  // Parse multiples of 10 (but not ten)  
  tens: r => P.seq(
    token("twenty",2)
    .or(token("thirty",3))
    .or(token("forty",4))
    .or(token("fifty",5))
    .or(token("sixty",6))
    .or(token("seventy",7))
    .or(token("eighty",8))
    .or(token("ninety",9)),
    P.succeed(10),
    optional(and( r.ones))
  ).thru( combineParsedValues ),
  // parse dozenes
  dozens: r => P.seq(
    r.ones, 
    r.dozen, 
    optional(and(r.ones))
    ).thru(combineParsedValues),
  // parse scores  
  scores: r => P.seq(
    r.ones, 
    r.score, 
    optional(and(r.ones))
    ).thru(combineParsedValues),
  // parse hundreds, including those preceeded by teens  
  hundreds: r => P.seq( 
    r.teens.or(r.ones),
    r.hundred,
    optional(and(r.teens.or(r.tens).or(r.ten).or(r.ones)))    
    ).thru( combineParsedValues ),
  // parse proper hundreds (those that cannot be preceeded by a teen)
  properHundreds: r => P.seq( 
    r.ones,
    r.hundred,
    optional(and(r.teens.or(r.tens).or(r.ones)))    
    ).thru(combineParsedValues),
 // parse thousands   
 thousands: r => P.seq(
    r.properHundreds.or(r.teens).or(r.tens).or(r.ten).or(r.ones),
    r.thousand,
    optional(and(r.properHundreds.or(r.teens.or(r.tens).or(r.ten).or(r.ones))))
  ).thru( combineParsedValues ),
  // parse millions
  millions: r => P.seq(
    r.hundreds.or(r.teens).or(r.tens).or(r.ten).or(r.ones),
    r.million,
    optional(and(r.thousands.or(r.hundreds).or(r.teens).or(r.tens).or(r.ten).or(r.ones)))
  ).thru( combineParsedValues),
  //parse billions
  billions: r => P.seq(
    r.teens.or(r.tens).or(r.ten).or(r.ones),
    r.billion,
    optional(and(r.millions.or(r.thousands).or(r.hundreds).or(r.teens).or(r.tens).or(r.ten).or(r.ones)))
  ).thru( combineParsedValues )
});

module.exports = L.number