# Maana-NLP-Numbers
This package implements a simple, deterministic, numeric entity extractor 
suitable for finding natural language number mentions in text.   It recognizes
whole numbers between zero and 999,999,999,999, as well customary numeric 
quantities (e.g. dozen, score, ...).   The parser is built using monadic
parser combinators and can easily be extended to support additional numeric 
expressions.


# Installation
You can install the latest version of this package from npm:
```bash
npm i maana-nlp-numbers
```

# Parsing numeric entities
Given a string containing a surface form for a numeric entity, the ```parse``` 
function returns the normal form ( a.k.a. the numeric value ) of the 
entity.   If the function is not a valid surface form for a numeric entity, or
contains extra characters before or after the numeric entity mention, the parser
will fail.   Consider the following examples:

```javascript
const { parse } = require('maana-nlp-numbers')

console.log(parse("nineteen nintey nine")) // 1999
console.log(parse("sixty five thousand, five hundred and thiry five"))// 65535
console.log(parse("four score and seven")) // 87
console.log(parse("one day at a time")) // error
```

# Extracting numeric entities
Given a string containing zero or more surfaces forms for numeric entities, 
the ```extract``` function returns a list of entity mentions.   For each
numeric entity, it returns a structured object which contains the starting 
end ending position (```start``` and ```end``` fields) of the entity mention, and the 
normal form (```value``` field).  Consider the following example:

```javascript
const { extract } = require('maana-nlp-numbers')

console.log(extract(`Nine out of ten respondents would buy the product for 
fifty four dollars or less per dozen.   The optimum price point is thirty seven 
dollars.
`)).map( x => x.value )

// [9,10,54,12,37]
```

# The parser
The numeric parser is built using modadic parser combinators from the 
[parsimmon](https://github.com/jneen/parsimmon) npm package.    We export the 
numeric parser as ```parser``` to facilitate construction of more sophisticated
parsers in combination with other monadic parsers.   For example:

```javascript
const { parser } = require('maana-nlp-numbers')
const P = require('parsimmon')

/** a parser for a comma separated list of numbers */
const manyNumbers = P.sepBy( parser, P.string(","))

console.log(manyNumbers.tryParse("one,two,three"))
// [1,2,3]
```