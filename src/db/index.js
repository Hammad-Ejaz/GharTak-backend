import mongoose from "mongoose";

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`DB connected !! DB Name: ${connectionInstance.connection.name}`);
    } catch (err) {
        console.log("DB connection error", err);
        process.exit(1);
    }
};

export default connectDB;
