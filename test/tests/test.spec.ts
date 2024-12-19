import {assert} from 'chai';

describe('Startup', () => {
  it('should have plugin instance defined', () => {
    assert.equal(Zotero.Dummy, true);
  });
});
