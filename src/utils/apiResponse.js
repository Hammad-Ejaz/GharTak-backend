class apiResponse{
    constructor(statusCode,data,message='success'){
        this.statusCode = statusCode;
        this.data = data;
        this.message = message;
        this.succcess = statusCode < 400;
    }
}
export {apiResponse}