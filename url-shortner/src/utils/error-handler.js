const { createLogger, transports } = require('winston');
const { AppError } = require('./app-errors');


const LogErrors = createLogger({
    transports: [
      new transports.Console(),
      new transports.File({ filename: 'app_error.log' })
    ]
  });
    

class ErrorLogger {
    constructor(){}
    async logError(err){
        console.log('==================== Start Error Logger ===============');
        LogErrors.log({
            private: true,
            level: 'error',
            message: `${new Date()}-${JSON.stringify(err)}`
          });
        console.log('==================== End Error Logger ===============');
        // log error with Logger plugins
      
        return false;
    }

    isTrustError(error){
        if(error instanceof AppError){
            return error.isOperational;
        }else{
            return false;
        }
    }
}

const ErrorHandler = async(err, req, res, next) => {
    
    const errorLogger = new ErrorLogger();

    process.on('uncaughtException', (reason, promise) => {
        console.log(reason, 'UNHANDLED');
        throw reason; // need to take care
    })

    process.on('uncaughtException', (error) => {
        errorLogger.logError(error);
        if(errorLogger.isTrustError(err)){
            //process exist // need restart
        }
    })
    
    if(err) {
        await errorLogger.logError(err);
        
        // Default status code if not provided
        const statusCode = err.statusCode || 500;
        const message = err.message || 'Internal Server Error';
        
        if(errorLogger.isTrustError(err)){
            if(err.errorStack){
                const errorDescription = err.errorStack;
                return res.status(statusCode).json({'message': errorDescription});
            }
            return res.status(statusCode).json({'message': message});
        }
        
        // For untrusted errors, don't expose internal error details
        return res.status(500).json({'message': 'Internal Server Error'});
    }
    next();
}

module.exports = ErrorHandler;