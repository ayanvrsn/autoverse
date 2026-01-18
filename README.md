
# Virtual Dealership - MongoDB database CRUD

![MVC](https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQqtCII6YbqnsJPzTxQVq7NJZ2nlHNl3GTwKw&s)

**It features a fully functional RESTful CRUD API integrated with MongoDB.**

---
## ⚙️ Setup
### 1. Clone the repository
### 2. Install dependencies:

```Bash
npm install
```
### Configure Environment: 
  Create a `.env` file and add your `MONGO_`.

### Run the server:


```
npm start
```
---
## Endpoints
| Method | Endpoint | Description|
|------| -------- | :-------: |
|POST | `/api/vehicles` | Create a new vehicle entry |
|GET |`/api/vehicles` |Retrieve all vehicles from DB
|GET |`/api/vehicles/:id` |Get specific vehicle by MongoDB ID
|PUT |`/api/vehicles/:id` |Update an existing record
|DELETE |`/api/vehicles/id` |Remove a record from the database


