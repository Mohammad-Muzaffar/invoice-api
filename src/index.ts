import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import mainRouter from "./routes/routes";

dotenv.config({ path: "/home/am-pc-02/invoice-api/.env" }); //Path should be changed in production.
const port = process.env.PORT || 3000;
const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use("/api/", mainRouter);

app.listen(port, () => {
  console.log(`\n Server Listening at port: ${port}`);
});
