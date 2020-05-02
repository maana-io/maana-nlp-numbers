const assert = require('assert');
const { parser } = require('../src/Parser')
const P = require('parsimmon')

const ones = ["One","Two","Three","Four","Five","Six","Seven","Eight","Nine"]
const tens = ["Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"]
const teens = ["Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"]



const num = (n) => {
    const b = Math.floor(n/1000000)
    const m = Math.floor(n/1000000)
    const t = Math.floor(n/1000)
    const h = Math.floor(n/100)
    switch (true) {
        case (b>0): {
           const j = n % 1000000000
           if (j>0) return `${num(b)} billion and ${num(j)}`
           else     return `${num(b)} billion`
        }
        case (m>0): {
            const j = n % 1000000
           if (j>0) return `${num(m)} million and ${num(j)}`
           else     return `${num(m)} million`
        }
        case (t>0): {
            const j = n % 1000
            if (j>0) return `${num(t)} thousand and ${num(j)}`
            else     return `${num(t)} thousand`
        }
        case (h>0): {
            const j = n%100
            if (j>0) return `${num(h)} hundred and ${num(j)}`
            else     return `${num(h)} hundred`
        }
        case (n>0): {
            if ( n < 10 ) {
                return ones[n-1]
            } else if ( n == 10 ) {
                return  "Ten"
            } else if ( n < 20 ) {
                return teens[n-11]
            } else {
                const d = Math.floor( n/10 )
                const o = n % 10 
                if (o) return `${tens[d-2]} ${ones[o-1]}`
                return tens[d-2]
            }    
        }
        default: return "zero"
    }    
}
    
describe('tryParse', function() {
    it('should parse zero', function() {
        assert.equal(parser.tryParse("zero"), 0);
        assert.equal(parser.tryParse("Zero"), 0);
        });
    it('should parse single digits', function() {    
        for (var i = 1; i<10; i++) {
            assert.equal(parser.tryParse(ones[i-1]), i);
            assert.equal(parser.tryParse(ones[i-1].toLowerCase()), i);
        }
    });
    it('should parse ten', function() {    
        assert.equal(parser.tryParse("ten"), 10);
        assert.equal(parser.tryParse("Ten"), 10);
    })
    it('should parse teens', function() {    
        for (var i = 1; i<10; i++) {
            assert.equal(parser.tryParse(teens[i-1]), i+10);
            assert.equal(parser.tryParse(teens[i-1].toLowerCase()), i+10);
        }
    });
    it('should parse tens', function() {    
        for (var i = 2; i<10; i++) {
            assert.equal(parser.tryParse(tens[i-2]), i*10);
            assert.equal(parser.tryParse(tens[i-2].toLowerCase()), i*10);
            for (var j = 1; j<10; j++) {
                assert.equal(parser.tryParse(`${tens[i-2]} ${ones[j-1]}`), i*10 + j);
                assert.equal(parser.tryParse(`${tens[i-2]} and ${ones[j-1]}`), i*10 + j);
                assert.equal(parser.tryParse(`${tens[i-2]} ${ones[j-1]}`.toUpperCase()), i*10 + j);
                assert.equal(parser.tryParse(`${tens[i-2]} and ${ones[j-1]}`.toUpperCase()), i*10 + j);
            }
        }
    });
    it('should parse hundreds', function() {    
        for (var i = 1; i<10; i++) {
            const x = `${ones[i-1]} Hundred`
            assert.equal(parser.tryParse(x), i*100);
            assert.equal(parser.tryParse(x.toLowerCase()), i*100);
            for (var j=1; j<100; j++) {
                const y = `${x} and ${num(j)}`
                assert.equal(parser.tryParse(y), i*100+j);
            }
        }
    });
    it('should parse improper thousands', function() {    
        for (var i = 11; i<19; i++) {
            const x = `${teens[i-11]} Hundred`
            assert.equal(parser.tryParse(x), i*100);
            assert.equal(parser.tryParse(x.toLowerCase()), i*100);
            for (var j=1; j<100; j++) {
                const y = `${x} and ${num(j)}`
                assert.equal(parser.tryParse(y), i*100+j);
                assert.equal(parser.tryParse(y.toLowerCase()), i*100+j);
            }
        }
    });

    it('should parse proper thousands', function() {
        for (var n = 0; n<1000; n++) {
            i = Math.floor(Math.random()*1E6)
            j = Math.floor(i/1000)*1000
            assert.equal(parser.tryParse(num(i)), i )            
            assert.equal(parser.tryParse(num(j)), j )
        }
    })
    it('should parse millions', function() {
        for (var n = 0; n<1000; n++) {
            const i = Math.floor(Math.random()*999)+1
            const j = Math.floor(Math.random()*(1e6-1))+1
            assert.equal(parser.tryParse(`${num(i)} million and ${num(j)}`), i*1000000+j )            
            assert.equal(parser.tryParse(`one million and ${num(j)}`), 1000000+j )            
            assert.equal(parser.tryParse(`${num(i)} million`), i*1000000 )
        }
    })
    it('should parse billions', function() {
        for (var n = 0; n<1000; n++) {
            const i = Math.floor(Math.random()*999)+1
            const j = Math.floor(Math.random()*999)+1
            const k = Math.floor(Math.random()*(1e6-1))+1
            assert.equal(parser.tryParse(`${num(i)} billion, ${num(j)} million and ${num(k)}`), i*1000000000+j*1000000 +k )            
            assert.equal(parser.tryParse(`${num(i)} billion and ${num(k)}`), i*1000000000+k ) 
            assert.equal(parser.tryParse(`${num(i)} billion, ${num(j)} million`), i*1000000000+j*1000000)           
            assert.equal(parser.tryParse(`${num(i)} billion`), i*1000000000)                                   
            assert.equal(parser.tryParse(`one billion, ${num(j)} million and ${num(k)}`), 1000000000+j*1000000 +k )            
            assert.equal(parser.tryParse(`one billion and ${num(k)}`), 1000000000+k ) 
            assert.equal(parser.tryParse(`one billion, ${num(j)} million`), 1000000000+j*1000000)
        }
    })
    it('should compose with another parser', function() {
        const year = P.string('year')
        assert.deepEqual(P.seq(parser,P.optWhitespace, year).tryParse('one year'),[1,"",'year'])
        assert.deepEqual(P.seq(parser,P.optWhitespace, year).tryParse('ten year'),[10,"",'year'])
        assert.deepEqual(P.seq(parser,P.optWhitespace, year).tryParse('twenty year'),[20,"",'year'])
        assert.deepEqual(P.seq(parser,P.optWhitespace, year).tryParse('twenty one year'),[21,"",'year'])
        assert.deepEqual(P.seq(parser,P.optWhitespace, year).tryParse('twenty and one year'),[21,"",'year'])
        assert.deepEqual(P.seq(parser,P.optWhitespace, year).tryParse('one dozen year'),[12," ",'year'])
        assert.deepEqual(P.seq(parser,P.optWhitespace, year).tryParse('one hundred year'),[100,"",'year'])
        assert.deepEqual(P.seq(parser,P.optWhitespace, year).tryParse('one hundred and one year'),[101,"",'year'])
        assert.deepEqual(P.seq(parser,P.optWhitespace, year).tryParse('one hundred and ten year'),[110,"",'year'])
        assert.deepEqual(P.seq(parser,P.optWhitespace, year).tryParse('one hundred and twenty year'),[120,"",'year'])
        assert.deepEqual(P.seq(parser,P.optWhitespace, year).tryParse('one hundred and twenty one year'),[121,"",'year'])
        assert.deepEqual(P.seq(parser,P.optWhitespace, year).tryParse('one hundred and twenty and one year'),[121,"",'year'])
        assert.deepEqual(P.seq(parser,P.optWhitespace, year).tryParse('twelve hundred year'),[1200," ",'year'])
        assert.deepEqual(P.seq(parser,P.optWhitespace, year).tryParse('nineteen hundred and ninety nine year'),[1999," ",'year'])
        assert.deepEqual(P.seq(parser,P.optWhitespace, year).tryParse('one thousand and one year'),[1001,"",'year'])
        assert.deepEqual(P.seq(parser,P.optWhitespace, year).tryParse('one thousand and ten year'),[1010,"",'year'])
        assert.deepEqual(P.seq(parser,P.optWhitespace, year).tryParse('one thousand and twenty year'),[1020,"",'year'])
        assert.deepEqual(P.seq(parser,P.optWhitespace, year).tryParse('one thousand and twenty one year'),[1021,"",'year'])
        assert.deepEqual(P.seq(parser,P.optWhitespace, year).tryParse('one thousand and twenty and one year'),[1021,"",'year'])
        assert.deepEqual(P.seq(parser,P.optWhitespace, year).tryParse('twelve thousand and one hundred year'),[12100,"",'year'])
        assert.deepEqual(P.seq(parser,P.optWhitespace, year).tryParse('twelve thousand one hundred and one year'),[12101,"",'year'])
        assert.deepEqual(P.seq(parser,P.optWhitespace, year).tryParse('twelve thousand one hundred and ten year'),[12110,"",'year'])
        assert.deepEqual(P.seq(parser,P.optWhitespace, year).tryParse('twelve thousand one hundred and twenty year'),[12120,"",'year'])
        assert.deepEqual(P.seq(parser,P.optWhitespace, year).tryParse('twelve thousand one hundred and twenty one year'),[12121,"",'year'])
        assert.deepEqual(P.seq(parser,P.optWhitespace, year).tryParse('twelve thousand one hundred and twenty and one year'),[12121,"",'year'])
        assert.deepEqual(P.seq(parser,P.optWhitespace, year).tryParse('two hundred and twelve million, one hundred and twenty one thousand, two hundred and twelve year'),[212121212,"",'year'])
    })

});