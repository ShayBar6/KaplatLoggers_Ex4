const express = require('express');
const app = express();
const port = 9583;
const cors = require("cors");
let TodoCounter = 0;
const todos = [];
let result = "";
let errorMessage = "";
let currentNumOfTodos = 1;
const bodyParser = require('body-parser');
app.use(bodyParser.json());

const{
    createLoggerInstance,
    logRequest,
    logCreateNewTodo,
    logError,
    logGetTodosCount,
    logGetTodosData,
    logUpdateTodoStatus,
    logDeleteTodo,
} = require("./Logger")

const requestDurationMiddleware = (req, res, next) => {
    req.startTime = Date.now();
    next();
};

let requestLogger = createLoggerInstance(`request-logger`, `requests.log`, `info`);
let todoLogger = createLoggerInstance(`todo-logger`, `todos.log`, `debug`);

app.use(requestDurationMiddleware);
app.use(
    cors({origin: "*", }));


app.get('/todo/health', healthEndpoint);
app.post('/todo', createTodoEndpoint);
app.get('/todo/size', getTodoSizeEndpoint);
app.get('/todo/content', getTodoContentEndpoint);
app.put('/todo', updateTodoStatusEndpoint);
app.delete('/todo', deleteTodoEndpoint);
app.get('/logs/level', getLoggerLevel);
app.put('/logs/level', setLoggerLevel);


function healthEndpoint(req, res) {
    result = "OK";
    res.status(200).json({ result, errorMessage });
}
function createTodoEndpoint(req, res) {
    InitializeResponseParameters();
    const duration = Date.now() - req.startTime;
    logRequest(requestLogger, `\\todo`, `POST`, duration);

    const jsonBody = req.body;
    const title = jsonBody.title;
    const content = jsonBody.content;
    const dueDate = jsonBody.dueDate;

    // Check if TODO with the same title already exists
    const existingTodo = todos.find((todo) => todo.title === title);
    if (existingTodo) {
        errorMessage = `TODO with the title [${title}] already exists in the system`;
        logError(todoLogger, errorMessage);
        todoLogger.level = 'ERROR';
        res.status(409).json({ result, errorMessage });
        return;
    }

    const currentDate = Date.now();
    if (dueDate <= currentDate) {
        errorMessage = 'Can’t create new TODO with a due date in the past';
        logError(todoLogger, errorMessage);
        todoLogger.level = 'ERROR';
        res.status(409).json({ result, errorMessage });
        return;
    }

    logCreateNewTodo(todoLogger, title, todos.length, ++TodoCounter);

    const newTodo = {
        id: TodoCounter,
        title,
        content,
        dueDate,
        status: 'PENDING',
    };

    todos.push(newTodo);
    res.status(200).json({ result: newTodo.id, errorMessage });
}
function getTodoSizeEndpoint(req, res) {
    InitializeResponseParameters();
    const duration = Date.now() - req.startTime;
    logRequest(requestLogger, `\\todo\\size`, `GET`, duration);

    const { status } = req.query;
    let filteredTodos;
    const { valid, errorStatusMessage } = checkStatusValidation(status);
    if (!valid) {
        logError(todoLogger, errorStatusMessage);
        todoLogger.level = 'ERROR';
        res.status(400).json({ result, errorStatusMessage });
        return;
    }
    if (status !== 'ALL') {
        filteredTodos = todos.filter((todo) => todo.status === status);
    }
    else{
        filteredTodos = todos;
    }
    logGetTodosCount(todoLogger, status, todos.length);
    res.status(200).json({ result: filteredTodos.length, errorMessage });
}

function getTodoContentEndpoint(req, res) {
    InitializeResponseParameters();
    const duration = Date.now() - req.startTime;
    logRequest(requestLogger,`\\todo\\content`, `GET`, duration);

    const { status, sortBy } = req.query;
    const { valid, errorStatusMessage } = checkStatusValidation(status);
    if (!valid) {
        logError(todoLogger, errorStatusMessage);
        todoLogger.level = 'ERROR';
        res.status(400).json({ result, errorStatusMessage });
        return;
    }

    const validSortByOptions = ['ID', 'DUE_DATE', 'TITLE'];
    if (!validSortByOptions.includes(sortBy)) {
        errorMessage = 'Bad Request: Invalid sortBy parameter.';
        logError(todoLogger, errorMessage);
        todoLogger.level = 'ERROR';
        res.status(400).json({ result, errorMessage });
        return;
    }

    let filteredTodos = todos;
    if (status !== 'ALL') {
        filteredTodos = todos.filter((todo) => todo.status === status);
    }

    filteredTodos.sort((a, b) => {
        if (sortBy === 'ID') {
            return a.id - b.id;
        } else if (sortBy === 'DUE_DATE') {
            return a.dueDate - b.dueDate;
        } else if (sortBy === 'TITLE') {
            return a.title.localeCompare(b.title);
        }
    });

    logGetTodosData(todoLogger, status, sortBy, todos.length, filteredTodos.length);
    res.status(200).json(filteredTodos);
}
function updateTodoStatusEndpoint(req, res) {
    InitializeResponseParameters();
    const duration = Date.now() - req.startTime;
    logRequest(requestLogger,`\\todo`, `GET`, duration);

    const { id, status } = req.query;
    const { valid, errorStatusMessage } = checkStatusValidation(status);
    if (!valid) {
        logError(todoLogger, errorStatusMessage);
        todoLogger.level = 'ERROR';
        res.status(400).json({ result, errorStatusMessage });
        return;
    }

    const todo = todos.find((todo) => todo.id === parseInt(id));
    // If the TODO exists, update its status
    if (todo) {
        const oldStatus = todo.status;
        todo.status = status;
        logUpdateTodoStatus(todoLogger, id, status, oldStatus);
        res.status(200).json({ result: oldStatus, errorMessage });
    } else {
        errorMessage = `no such TODO with id ${id}`;
        logError(todoLogger, errorMessage);
        todoLogger.level = 'ERROR';
        res.status(404).json({ result, errorMessage });
    }
}

function deleteTodoEndpoint(req, res) {
    InitializeResponseParameters();
    const duration = Date.now() - req.startTime;
    logRequest(requestLogger,`\\todo`, `DELETE`, duration);
    const { id } = req.query;
    const index = todos.findIndex((todo) => todo.id === parseInt(id));

    // If the TODO exists, delete it
    if (index !== -1) {
        todos.splice(index, 1);
        logDeleteTodo(todoLogger, id, todos.length);
        res.status(200).json({ result: todos.length, errorMessage });
    } else {
        errorMessage = `Error: no such TODO with id ${id}`;
        logError(todoLogger, errorMessage);
        todoLogger.level = 'ERROR';
        res.status(404).json({ result, errorMessage});
    }
}

function getLoggerLevel(req, res) {
    InitializeResponseParameters();
    const duration = Date.now() - req.startTime;
    logRequest(requestLogger,`\\logs\\level`, `GET`, duration);

    const { loggerName } = req.query;
    if(loggerName !== `request-logger` &&  loggerName !== `todo-logger`) {
        errorMessage = `Failure: There is no such logger with this name`;
        logError(todoLogger, errorMessage);
        todoLogger.level = 'ERROR';
        res.status(404).json({ result, errorMessage});
    }
    else {
        result = `Success: ` + todoLogger.level.toUpperCase();
        res.status(200).json({result,errorMessage});
    }
}

function setLoggerLevel(req, res) {
    InitializeResponseParameters();
    const duration = Date.now() - req.startTime;
    logRequest(requestLogger,`\\logs\\level`, `PUT`, duration);

    const { loggerName, loggerLevel } = req.query;
    if(loggerName !== `request-logger` &&  loggerName !== `todo-logger`) {
        errorMessage = `Failure: There is no such logger with this name`;
        logError(todoLogger, errorMessage);
        todoLogger.level = 'ERROR';
        res.status(404).json({ result, errorMessage});
    }
    else if(loggerLevel !== `INFO` && loggerLevel !== `DEBUG` && loggerLevel !== `ERROR`) {
        errorMessage = `Failure: There is no such logger level`;
        logError(todoLogger, errorMessage);
        todoLogger.level = 'ERROR';
        res.status(404).json({ result, errorMessage});
    }
    else {
        todoLogger.level = loggerLevel.toLowerCase();
        result = `Success: ` + loggerLevel.toUpperCase();
        res.status(200).json({result,errorMessage});
    }
}

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

function checkStatusValidation(status) {
    const validStatusOptions = ['ALL', 'PENDING', 'LATE', 'DONE'];
    if (!validStatusOptions.includes(status)) {
        return { valid: false, errorStatusMessage: 'Bad Request: Invalid status parameter.' };
    }
    return { valid: true, errorStatusMessage: "" };
}

function InitializeResponseParameters() {
    result = "";
    errorMessage = "";
    if(todoLogger.level === 'error' || requestLogger.level === 'error') {
        todoLogger.level = 'debug';
        requestLogger.level = 'info';
    }
}
