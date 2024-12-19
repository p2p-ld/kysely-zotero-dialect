import {assert} from 'chai';
import {createDB} from '../fixtures/db';

describe('Query', () => {
  it('Inserts and queries rows', async () => {
    const db = await createDB();
    await db
      .insertInto('table_a')
      .values([{value_a: 'hey'}, {value_a: 'sup'}])
      .returningAll()
      .execute();

    const row = await db
      .selectFrom('table_a')
      .where('value_a', '=', 'sup')
      .select(['id', 'value_a'])
      .execute();

    assert.deepEqual(row, [{id: 2, value_a: 'sup'}]);
  });
});
