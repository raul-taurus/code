# <https://dev.mysql.com/doc/refman/8.0/en/account-management-statements.html>

Query

```sql
SHOW GRANTS;
```

Output

```sql
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, RELOAD, PROCESS, REFERENCES, INDEX, ALTER, SHOW DATABASES, CREATE TEMPORARY TABLES, LOCK TABLES, EXECUTE, REPLICATION SLAVE, REPLICATION CLIENT, CREATE VIEW, SHOW VIEW, CREATE ROUTINE, ALTER ROUTINE, CREATE USER, EVENT, TRIGGER, LOAD FROM S3, SELECT INTO S3 ON *.* TO 'master'@'%' WITH GRANT OPTION
```

Query
```
CREATE USER 'jeff'@'%' IDENTIFIED BY 'new password here';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE TEMPORARY TABLES, EXECUTE ON `dbname`.* TO 'jeff'@'%' WITH GRANT OPTION;
```

Query
```
select Host, User from mysql.user;
```

Output
```
Host  User
%     jeff
```

Query
```
SHOW GRANTS FOR 'jeff';
```

Output
```
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE TEMPORARY TABLES, EXECUTE ON `dbname`.* TO 'jeff'@'%' WITH GRANT OPTION
```

Password generator
```js
new Array(20).fill().map(i=>String.fromCharCode( parseInt( Math.random()*95)+32)).join('')
```
