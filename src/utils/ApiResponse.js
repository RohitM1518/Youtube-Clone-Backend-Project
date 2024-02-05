//Used this in the controllers to send the response to the client

class ApiResponse{
    constructor(statusCode,data,message="success"){
        this.statusCode=statusCode
        this.data = data,
        this.message=message
        this.success=statusCode <400
    }
}

export {ApiResponse}