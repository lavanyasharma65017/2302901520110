import express from "express";
import cors from "cors";

import notificationRoutes from "./routes/notificationRoutes";

const app = express();

app.use(cors());
app.use(express.json());

app.use(
  "/notifications",
  notificationRoutes
);

app.listen(3000, () => {
  console.log(
    "Server running on port 3000"
  );
});

console.log("TOKEN EXISTS =", !!process.env.TOKEN);