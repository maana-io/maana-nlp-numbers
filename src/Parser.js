
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
    P.lookahead(P.regexp(/$|\s+|[,"\-_';:!.,?`]/)),
    _ => normalForm).desc(surfaceForm)
}

const tokensep = P.alt(P.whitespace, P.newline)

const punctuation = P.regexp(/["\-_';:!\.\,?`]+/)

const anyToken = P.seq(
  P.regexp(new RegExp(/[^\s"\-_';:!\.\,?`]+/)),
  P.lookahead(P.regexp(/$|\s+|["\-_';:!\.\,?`]/))
  )


/** A parser for the hundreds token.   Returns the normal form (100) on 
 * success */
const hundred = token("hundred",100)

/** A parser for the thousands token.   Returns the normal form (1000) on 
 * success */
const thousand = token("thousand",1000)

/** A parser for the millions token.   Returns the normal form (1,000,000) on 
 * success */
const million = token("million",1000000)

/** A parser for the billions token.   Returns the normal form (1E9) on 
 * success */
const billion = token("billion",1000000000)

/*** An array of token parsers for powers of 10.  This list is used by
 * the big number parser to determine the size of number expressions of the
 * form <lessThan1000> <someNumber>.
 */
const powersOfTen = [ billion, million, thousand, P.succeed(1) ]

/** Given a power of ten, return a list of parsers for powers of ten that are 
 * smaller. 
 * @param n - an integer representing a power of ten (that is divisible by 3)
 * @returns - a subset of powersOfTen token parsers for numbers smaller than 
 *   the given power.
 * */
function smallerPowersOfTen(n) { 
  const i = 4- Math.floor(Math.log10(n)/3)
  return powersOfTen.slice(i)
}

/** given a parser, this parser combinator will optionally parse the conjunction
 * "and" followed by the given parser.   */
function and(parser) {
  return P.seqMap(
    P.regexp(/(\s+and)?,?\s+/i).desc("and, comma or space"),
    parser, 
    function (_,x) { return x })
}

/** A parser for non-zero tokens that can occur in the ones place of a natural 
 * number.   On success this parser returns the normal form.*/
const ones = P.alt(
    token("one",1), token("two",2), token("three",3),
    token("four",4), token("five",5), token("six",6), 
    token("seven",7), token("eight",8), token("nine",9)
  ).desc("ones")

/** A parser for tokens whose normal form is a number between 11 and 19. 
 * On success this parser returns the normal form.*/
const teens = P.alt(
    token("eleven",11), token("twelve",12), token("thirteen",13),
    token("fourteen",14), token("fifteen",15), token("sixteen",16),
    token("seventeen",17), token("eighteen",18), token("nineteen",19)
  ).desc("teens")

/** A parser that parses integer multiples of ten (but not ten).  On success, 
 * this parser returns the normal form */
const tens = P.seqMap(
    P.alt(
      token("twenty",20), token("thirty",30),token("forty",40),
      token("fifty",50), token("sixty",60), token("seventy",70),
      token("eighty",80), token("ninety",90)
  ).desc("tens"),
    optional(and(ones)),
    function (t,o) { return t + (o||0)}
  )

/** A parser for numbers less than one hundred. On success this parser returns
 * the normal form. */
const lessThan100 = P.alt(teens, tens, token("ten",10), ones)

/** A parser for proper hundreds (those that cannot be preceeded by a teen).  On
 * success this parser returns the normal form.
 */
const properHundreds = P.seqMap(
  ones.skip(tokensep),
  hundred,
  optional(and(lessThan100)),
  function(h, c, tensAndOnes){ return h*c + (tensAndOnes||0)}    
)

/** A parser for numbers that are less than one thousand.  ON success, this 
 * parser returns the normal form.
 */
const lessThanThousand = P.alt(properHundreds, lessThan100 )

/** Given a multiplier and a power of 10 parsed by the big number parser, 
 * return a parser that parses the numbers that are smaller than the given base.
 * @param mult - the multiplier, typically a number between one and 999, that 
 *   appeared before the base.   
 * @param base - a power of ten or special word (e.g. score, dozen)
 * @returns a parser that parses rest of the number.
 */
function tailParser( [mult,base] ) {
  // If the number is greater than 100, then we return the big number parser 
  // but passing it a list of powers of ten that are smaller
  // than the current base.
  if (base > 100 ) {
    return optional(and(
      P.alt( 
        bigNumberParser(smallerPowersOfTen(base)),
        lessThanThousand.or(P.succeed(0))
    ))).map( o => base*mult+(o||0) )  
  }
  // If the base is one, there are no more powers of ten that are smaller. 
  // Return the multiplier.
  if (base ==1 ) { 
    return P.succeed(mult)
  }
  // If the base is less than one hundred, then it was a special word
  // (score or dozen).   return a parser for the optional ones values.
  // this allows us to parse "four score and seven"
  if (base <100) return optional(and(ones)).map( o => base*mult+(o||0) )  
  // The base is 100.  If the multiplier is less than 20, then it is an 
  // improper thousand (e.g. "ninteen hundred and nintey nine")
  if (mult < 20 ) {
    return optional(and(lessThan100)).map( o => base*mult+(o||0))
  }
  // otherwise, the base is 100 and the multiplier is invalid (e.g. fifty hundred)
  return P.fail("Expected one of the following:\n\nEOF, and, billion, million, thousand")  
}

/** given an array of powers of ten parsers, parse any number that is of the 
 * form <multipler> <powerOfTen> <tail>, where multiplier is a number in the 
 * range of 1-999 and tail is a numeric expression that is smaller than the 
 * parsed power of ten.  On success the parser returns the normal form of the 
 * parsed number.
 * @param  ps - a non-empty list of powers of ten parsers.*/
function bigNumberParser(ps) { 
  return P.seq(
    lessThanThousand.skip(tokensep),
    P.alt(...ps) 
).chain(ns => tailParser(ns))
}

/** A parser that parses special number words (indefinite articles, score
 * dozen, etc).   On success, the parser returns the normal form of the 
 * parsed number.  */
const specialNumbersParser = P.seq(
  P.alt(ones, token("a",1)).skip(tokensep),
  P.alt(token("dozen",12), token("score",20)) 
).chain(ns => tailParser(ns))

/** A parser that will parse the natural language numbers between zero and 
 * 999999999999.  On success, the parser returns the normal for of the parsed
 * number.
 * @example numberParser.tryParse("four score and seven") = 87
 * @example numberParser.tryParse("one hundred and one") = 101
 * @example numberParser.tryParse("ninteen hundred and nintey nine") = 1999
 */
const numberParser = P.alt(
  specialNumbersParser,
  bigNumberParser([hundred].concat(powersOfTen)),
  lessThanThousand,
  token("zero",0)
)

/** Given a string, extract all instances of natural language numeric entities 
 * from the string, returning thier start and end locations ( offset, line, column )
 * and the extracted value.   
 */
function extract( str ) {
  return P.sepBy(
    P.alt(
      punctuation.map( _ => null), 
      numberParser.mark(), 
      anyToken.map( _ => null)
    ), optional(tokensep)
  ).tryParse( str ).filter(x => x !== null)
}

module.exports = {
  parser: numberParser,
  parse: function(str) { return numberParser.tryParse(str)},
  extract: extract
}
