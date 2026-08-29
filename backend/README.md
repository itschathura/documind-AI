docker exec -it documindai-db-1 psql -U postgres -d documind
psql -U postgres -d documind

Command	Meaning
\l	List 
\c documind	Database   switch/connect  
\dt	Describe tables  
\d documents	 
SELECT * FROM documents;	 
SELECT id, filename, status FROM documents;	 
\q	 