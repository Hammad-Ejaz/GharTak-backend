import mongoose from "mongoose";

const connectDB = async () => {
    try{
    const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${process.env.DB_NAME}`);
    console.log(`DB connected !! DB Host: ${connectionInstance.connection.host}`);
}
    catch (err){
        console.log('db connection error',err);
        process.exit(1);
    }
}
export default connectDB;