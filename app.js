const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");

const format = require("date-fns/format");
const isMatch = require("date-fns/isMatch");
const isValid = require("date-fns/isValid");

const app = express();
app.use(express.json());

let db = null;

initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

hasStatus = (requestQuery) => {
  return requestQuery.status !== undefined;
};

hasPriority = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

hasPriorityAndStatus = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

hasSearch = (requestQuery) => {
  return requestQuery.search_q !== undefined;
};

hasCategoryAndStatus = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

hasCategory = (requestQuery) => {
  return requestQuery.category !== undefined;
};

hasCategoryAndPriority = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

const convertObject = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
    category: dbObject.category,
    dueDate: dbObject.due_date,
  };
};

const isStatus = (status) => {
  return status === "TO DO" || status === "IN PROGRESS" || status === "DONE";
};

const isPriority = (priority) => {
  return priority === "HIGH" || priority === "MEDIUM" || priority === "LOW";
};

const isCategory = (category) => {
  return category === "WORK" || category === "HOME" || category === "LEARNING";
};

app.get("/todos/", async (request, response) => {
  const requestQuery = request.query;
  console.log(requestQuery);
  const { search_q = "", status, priority, category } = requestQuery;

  let todoQuery = null;
  let getTodoQuery = "";

  switch (true) {
    case hasStatus(requestQuery):
      if (isStatus(status)) {
        getTodoQuery = `
              SELECT * FROM todo
              WHERE 
              status like "%${status}%";`;
        todoQuery = await db.all(getTodoQuery);
        response.send(
          todoQuery.map((eachTodo) => {
            return convertObject(eachTodo);
          })
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    case hasPriority(requestQuery):
      if (isPriority(priority)) {
        getTodoQuery = `
              SELECT * FROM todo
              WHERE 
              priority like "%${priority}%";`;
        todoQuery = await db.all(getTodoQuery);
        response.send(
          todoQuery.map((eachTodo) => {
            return convertObject(eachTodo);
          })
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    case hasPriorityAndStatus(requestQuery):
      if (isPriority(priority)) {
        if (isStatus(status)) {
          getTodoQuery = `
            SELECT * FROM todo
            WHERE 
            priority like "%${priority}%"
            AND 
            status like "%${status}%";`;
          todoQuery = await db.all(getTodoQuery);
          response.send(
            todoQuery.map((eachTodo) => {
              convertObject(eachTodo);
            })
          );
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    case hasSearch(requestQuery):
      getTodoQuery = `
        SELECT * FROM todo
        WHERE todo LIKE "%${search_q}%";`;
      todoQuery = await db.all(getTodoQuery);
      response.send(
        todoQuery.map((eachTodo) => {
          return convertObject(eachTodo);
        })
      );
      break;

    case hasCategoryAndStatus(requestQuery):
      if (isCategory(category)) {
        if (isStatus(status)) {
          getTodoQuery = `
                SELECT * FROM todo
                WHERE
                category LIKE "%${category}%"
                AND
                LIKE "%${status}%";`;
          todoQuery = await db.all(getTodoQuery);
          response.send(
            todoQuery.map((eachTodo) => {
              convertObject(eachTodo);
            })
          );
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    case hasCategory(requestQuery):
      if (isCategory(category)) {
        getTodoQuery = `
              SELECT * FROM todo
              WHERE
                category LIKE "%${category}%";`;
        todoQuery = await db.all(getTodoQuery);
        response.send(
          todoQuery.map((eachTodo) => {
            return convertObject(eachTodo);
          })
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    case hasCategoryAndPriority(requestQuery):
      if (isCategory(category)) {
        if (isPriority(priority)) {
          getTodoQuery = `
                  SELECT * FROM todo
                  WHERE category LIKE "%${category}%"
                  AND 
                  priority LIKE "%${priority}%";`;
          todoQuery = await db.all(getTodoQuery);
          response.send(
            todoQuery.map((eachTodo) => {
              return convertObject(eachTodo);
            })
          );
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    default:
      console.log("default");
      getTodoQuery = `
      SELECT * FROM todo`;
      todoQuery = await db.all(getTodoQuery);
      response.send(
        todoQuery.map((eachTodo) => {
          return convertObject(eachTodo);
        })
      );
  }
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoItem = `
    SELECT * FROM todo
    WHERE id="${todoId}"`;
  const todoItem = await db.get(getTodoItem);
  response.send(convertObject(todoItem));
});

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  const isMatched = isMatch(date, "yyyy-MM-dd");
  if (isMatched === true) {
    const newDate = format(new Date(date), "yyyy-MM-dd");
    console.log(newDate);
    const getTodoDueDateQuery = `
    SELECT * FROM todo
    WHERE due_date = "${newDate}"`;
    const getTodoDueDate = await db.all(getTodoDueDateQuery);
    console.log(getTodoDueDate);
    response.send(
      getTodoDueDate.map((eachTodo) => {
        return convertObject(eachTodo);
      })
    );
  } else {
    response.status(400);
    response.end("Invalid Due Date");
  }
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  if (isPriority(priority)) {
    if (isStatus(status)) {
      if (isCategory(category)) {
        if (isMatch(dueDate, "yyyy-MM-dd")) {
          const newDate = format(new Date(dueDate), "yyyy-MM-dd");
          const postTodoQuery = `
                    INSERT INTO
                    todo(id,todo,priority,status,category,due_date)
                    VALUES (
                        ${id},
                        '${todo}',
                        '${priority}',
                        "${status}",
                        "${category}",
                        "${newDate}"
                        )`;
          const postTodo = await db.run(postTodoQuery);
          console.log(postTodo);
          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateTodo;

  const previousTodoQuery = `
  SELECT * 
  FROM todo 
  WHERE id = ${todoId}`;

  const previousTodo = await db.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = previousTodo.dueDate,
  } = request.body;

  const requestBody = request.body;

  let updateTodoQuery;
  switch (true) {
    case requestBody.status !== undefined:
      if (isStatus(requestBody.status)) {
        updateTodoQuery = `
      UPDATE todo
      SET 
      todo = '${todo}',
      priority = '${priority}',
      status = '${status}',
      category = '${category}',
      due_date = '${dueDate}'
      WHERE id = ${todoId}`;

        updateTodo = await db.run(updateTodoQuery);
        response.send("Status Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    case requestBody.priority !== undefined:
      if (isPriority(requestBody.priority)) {
        updateTodoQuery = `
      UPDATE todo
      SET 
      todo = '${todo}',
      priority = '${priority}',
      status = '${status}',
      category = '${category}',
      due_date = '${dueDate}'
      WHERE id = ${todoId}`;

        updateTodo = await db.run(updateTodoQuery);
        response.send("Priority Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }

      break;

    case requestBody.category !== undefined:
      if (isCategory(requestBody.category)) {
        updateTodoQuery = `
      UPDATE todo
      SET 
      todo = '${todo}',
      priority = '${priority}',
      status = '${status}',
      category = '${category}',
      due_date = '${dueDate}'
      WHERE id = ${todoId}`;

        updateTodo = await db.run(updateTodoQuery);
        response.send("Category Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }

      break;

    case requestBody.dueDate !== undefined:
      if (isMatch(dueDate, "yyyy-MM-dd")) {
        const newDate = format(new Date(dueDate), "yyyy-MM-dd");

        updateTodoQuery = `
      UPDATE todo
      SET 
      todo = '${todo}',
      priority = '${priority}',
      status = '${status}',
      category = '${category}',
      due_date = '${newDate}'
      WHERE id = ${todoId}`;

        updateTodo = await db.run(updateTodoQuery);
        response.send("Due Date Updated");
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }

      break;

    case requestBody.todo !== undefined:
      updateTodoQuery = `
      UPDATE todo
      SET 
      todo = '${todo}',
      priority = '${priority}',
      status = '${status}',
      category = '${category}',
      due_date = '${dueDate}'
      WHERE id = ${todoId}`;

      updateTodo = await db.run(updateTodoQuery);
      response.send("Todo Updated");

      break;
  }
});

app.delete("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
    DELETE FROM todo
    WHERE id="${todoId}";`;
  const deleteTodo = await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
