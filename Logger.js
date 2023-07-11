const winston = require('winston');
let currentRequestNumber = 0;
// Define a custom log format for logger
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'DD-MM-YYYY HH:mm:ss.SSS' }),
    winston.format.printf(({ timestamp, level, message }) =>
        `${timestamp} ${level.toUpperCase()}: ${message} | request #${currentRequestNumber}`
    )
);

// Create a new logger instance
function createLoggerInstance(loggerName, logFileName, loggerLevel) {
    return winston.createLogger({
        level: loggerLevel,
        format: logFormat,
        transports: [
            new winston.transports.File({ filename: logFileName }),
            new winston.transports.Console(),
        ],
        defaultMeta: { label: loggerName },
    });
}

// Create a custom log function for request logging
function logRequest(requestLogger, resourceName, httpVerb, duration) {
    currentRequestNumber++;
    requestLogger.info(`Incoming request | #${currentRequestNumber} | resource: ${resourceName} | HTTP Verb ${httpVerb}`);
    requestLogger.debug(`request ${currentRequestNumber} duration: ${duration}ms`);
}

// Create a custom log function for creating a new TODO
function logCreateNewTodo(todoLogger, title, existingTodosCount, newTodoId) {
    todoLogger.info(`Creating new TODO with Title [${title}]`);
    todoLogger.debug(`Currently there are ${existingTodosCount} TODOs in the system. New TODO will be assigned with id ${newTodoId}`);
}

// Create a custom log function for error logging
function logError(logger, errorMessage) {
    const logMessage = `${errorMessage}`;
    logger.error(logMessage);
}

// Create a custom log function for getting TODOs count
function logGetTodosCount(getTodosCountLogger, status, todosCount) {
    getTodosCountLogger.info(`Total TODOs count for state ${status} is ${todosCount}`);
}

// Create a custom log function for getting TODOs data
function logGetTodosData(getTodosDataLogger, status, sortBy, todosCount, filteredTodosCount) {
    getTodosDataLogger.info(`Extracting todos content. Filter: ${status} | Sorting by: ${sortBy}`);
    getTodosDataLogger.debug(`There are a total of ${todosCount} todos in the system. The result holds ${filteredTodosCount} todos`);
}

// Create a custom log function for updating TODO status
function logUpdateTodoStatus(updateTodoStatusLogger, todoId, newStatus, oldStatus) {
    updateTodoStatusLogger.info(`Update TODO id [${todoId}] state to ${newStatus}`);
    updateTodoStatusLogger.debug(`Todo id [${todoId}] state change: ${oldStatus} --> ${newStatus}`);
}

// Create a custom log function for deleting a TODO
function logDeleteTodo(deleteTodoLogger, todoId, remainingTodosCount) {
    deleteTodoLogger.info(`Removing todo id ${todoId}`);
    deleteTodoLogger.debug(`After removing todo id [${todoId}] there are ${remainingTodosCount} TODOs in the system`);
}

module.exports = {
    createLoggerInstance,
    logRequest,
    logCreateNewTodo,
    logError,
    logGetTodosCount,
    logGetTodosData,
    logUpdateTodoStatus,
    logDeleteTodo,
};
