import { Database } from 'bun:sqlite'

export const db = new Database("ava.db", { create: true });

db.query(`
  create table if not exists chat_sessions (
    id integer primary key,
    title text not null
  ) strict;
`).run();


//const query = db.query("select 'Hello world' as message;");
//console.log(query.get());
