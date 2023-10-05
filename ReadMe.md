# HOW TO RUN

Install Node.js from [here](https://nodejs.org/en/download).

In the [backend/data/sqlite3/sqlite3-executables](./backend/data/sqlite3/executables) you will find an sqlite3 executable for Linux, Mas OS and Windows. copy the executable in to [backend/data/sqlite3](./backend/data/sqlite3).

> If you don't have the sqlite3 executable in the specified path, it won't work!

Then,

```bash
# navigate to the backend directory
cd backend

# start the server
node index.js
```

Open either http://localhost:3000/admin or http://localhost:3000/client.