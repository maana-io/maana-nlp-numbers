const assert = require('assert');
const parser = require('../src/Parser')

describe('tryParse', function() {
    it('should parse zero', function() {
        assert.equal(parser.tryParse("zero"), 0);
        assert.equal(parser.tryParse("Zero"), 0);
        });



});