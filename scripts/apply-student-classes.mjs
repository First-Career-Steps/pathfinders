// Run once from an authorized project environment. No secrets or learner records are logged.
import {readFile} from 'node:fs/promises';
import pg from 'pg';
const ref = 'utvzeplkmadbxjnrxnlt';
const uri = process.env.DATABASE_URL || process.env.DIRECT_DATABASE_URL;
if (!uri || !uri.includes(ref)) throw new Error('Expected the FirstCareerSteps database connection.');
const url = new URL(uri);
if (!/\.supabase\.(com|co)$/.test(url.hostname)) throw new Error('Unexpected database host.');
const db = new pg.Client({connectionString:uri,connectionTimeoutMillis:15000});
try {
 await db.connect();
 await db.query('begin');
 await db.query("select pg_advisory_xact_lock(hashtext('fcs_student_classes_v1'))");
 const existing=await db.query("select to_regclass('public.student_class_progress') as name");
 if(!existing.rows[0].name) await db.query(await readFile(new URL('../supabase/migrations/20261125000953_student_classes.sql',import.meta.url),'utf8'));
 const result=await db.query(`select c.relrowsecurity as rls,
 exists(select 1 from pg_constraint where conrelid=c.oid and confrelid='auth.users'::regclass and confdeltype='c') as cascade,
 exists(select 1 from pg_policies where tablename='student_class_progress' and policyname='student_reads_own_class_progress') as owner_policy,
 not has_table_privilege('anon',c.oid,'SELECT') as private,
 not has_table_privilege('authenticated',c.oid,'UPDATE') as protected_grades,
 has_function_privilege('service_role','public.fcs_save_class_progress(uuid,text,text,text,integer)','EXECUTE') as server_grading
 from pg_class c where c.oid='public.student_class_progress'::regclass`);
 if(!Object.values(result.rows[0]||{}).every(x=>x===true)||result.rowCount!==1)throw new Error('Progress schema verification failed.');
 await db.query('commit');
 console.log('Verified student class progress, owner policy, server grading and account deletion cascade.');
} catch (err) {
 await db.query('rollback').catch(()=>{});
 console.error('Class migration failed:',err.code || err.name, String(err.message).replace(/postgres(?:ql)?:\/\/\S+/g,'[database]'));
 process.exitCode=1;
} finally {await db.end().catch(()=>{});}
