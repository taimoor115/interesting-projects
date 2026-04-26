import express from "express";
import db  from "./db/index.js";
import { jobsTable } from "./db/schema.js";
const app = express();
app.use(express.json());
app.post("/create-job", async (req, res, next) => {
  const { image, cmd = null } = req.body || {};
  if (!image) {
    return res.status(400).json({ error: "Image is required" });
  }

  const [insertResult]  = await db.insert(jobsTable).values({ image, cmd }).returning({
    id: jobsTable.id,
  });


  return res.json({jobId: insertResult.id});
});

app.get("/health", (req, res) => {
  res.status(200).send("ok");
});

app.listen(7000, () => {
  console.log("Server is running on port 7000");
});
