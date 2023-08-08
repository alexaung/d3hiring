// Handling uncaught exceptions (synchronous errors) in the application. 
// This will catch any exception that was thrown and not caught anywhere in the code.
// It's typically used as a last resort to log the exception and shut down the application gracefully.
process.on("uncaughtException", (err) => {
    console.log(err.name, err.message);
    console.log("Uncaught Exception. Shutting down...");

    process.exit(1); // 0 for success, 1 for uncaught exception

});

import app from "./app";

// Server configuration
const port = process.env.NODE_PORT || 3000;

const server = app.listen(port, () => {
    console.log(`Server is running on port http://localhost/${port}`);
});

// Handling unhandled rejections (errors outside express) in the application.
process.on("unhandledRejection", (err) => {
    
    console.log("Unhandled Rejection. Shutting down...");
    console.log(err);
    // Shutting down the server
    server.close(() => {
        process.exit(1); // 0 for success, 1 for unhandled rejection
    });
});