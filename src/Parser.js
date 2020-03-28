
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

/** Given a parser, return a parser that will either return the result of that
 * parser, or consume no input.
 * @param parser - the given parser
 */
function optional(parser) {
  return parser.fallback(null)
}

/** Given a surface form and a normal form, return a parser that will parse the 
 * surface form and any trailing token separators, and return the normal form 
 * @param surfaceForm - the surface form of the token
 * @param normalForm - the numeric representation of the token
*/
function token(surfaceForm,normalForm) { 
  return P.seqMap(
    P.regexp(new RegExp(surfaceForm,"i")),
    P.regexp(/\s+|[,-]\s*/).desc("token break").or(P.end),
    _ => normalForm).desc(surfaceForm)
}

const hundred = token("hundred",100)
const thousand = token("thousand",1000)
const million = token("million",1000000)
const billion = token("billion",1000000000)

/*** A collection of token parsers for powers of 10.  This list is used by
 * the big number parser to determine the size of number expressions of the
 * form <lessThan1000> <someNumber>.
 */
const powersOfTen = [ billion, million, thousand, P.succeed(1) ]

/** Given a power of ten, return a list of parsers for powers of ten that are 
 * smaller. 
 * @param n - an integer representing a power of ten (that is divisible by 3)
 * @returns - a subset of powersOfTen token parsers for numbers smaller than 
 *   the given power
 * */
function smallerPowersOfTen(n) { 
  const i = 4- Math.floor(Math.log10(n)/3)
  return powersOfTen.slice(i)
}

/** given a parser, this parser combinator will optionally parse the conjunction
 * "and" followed by the given parser.   */
function and(parser) {
  return P.seqMap(
    optional(token("and",null)),
    parser, 
    function (_,x) { return x })
}

const ones = P.alt(
    token("one",1), token("two",2), token("three",3),
    token("four",4), token("five",5), token("six",6), 
    token("seven",7), token("eight",8), token("nine",9)
).desc("ones")

const teens = P.alt(
  token("eleven",11), token("twelve",12), token("thirteen",13),
  token("fourteen",14), token("fifteen",15), token("sixteen",16),
  token("seventeen",17), token("eighteen",18), token("nineteen",19)
).desc("teens")

  // Parse multiples of 10 (but not ten)  
const tens = P.seqMap(
  P.alt(
    token("twenty",20), token("thirty",30),token("forty",40),
    token("fifty",50), token("sixty",60), token("seventy",70),
    token("eighty",80), token("ninety",90)
).desc("tens"),
  optional(and(ones)),
  function (t,o) { return t + (o||0)}
)

// A parser for numbers less than one hundred. 
const lessThan100 = P.alt(teens, tens, token("ten",10), ones)

// parse proper hundreds (those that cannot be preceeded by a teen)
const properHundreds = P.seqMap(
  ones,
  hundred,
  optional(and(lessThan100)),
  function(h, c, tensAndOnes){ return h*c + (tensAndOnes||0)}    
)

const lessThanThousand = P.alt(properHundreds, lessThan100)

function tailParser( [mult,base] ) {
  if (base > 100 ) return optional(and(
    bigNumberParser(smallerPowersOfTen(base)))).map( o => base*mult+(o||0) )  
  if (base ==1 ) return P.succeed(mult)
  if (base <100) return optional(and(ones)).map( o => base*mult+(o||0) )  
  if (mult < 20 ) return optional(and(lessThan100)).map( o => base*mult+(o||0))
  return P.fail("Expected one of the following:\n\nEOF, and, billion, million, thousand")  
}

function bigNumberParser(ps) { 
  return P.seq(
    lessThanThousand, 
    P.alt(...ps) 
).chain(ns => optional(and(tailParser(ns))))
}

const specialNumbersParser = P.seq(
  P.alt(ones, token("a",1)), 
  P.alt(token("dozen",12), token("score",20), hundred, thousand, million, billion) 
).chain(ns => optional(and(tailParser(ns))))

/** A parser that will parse the natural language numbers between zero and 
 * 999999999999.
 * @param 
 */
const numberParser = P.alt(
  bigNumberParser([hundred].concat(powersOfTen)),
  specialNumbersParser,
  token("zero",0)
)

module.exports = numberParser

console.log(numberParser.tryParse("a billion and seven million"))// and Five hundred and Sixty thousand and One hundred and Eighty"))