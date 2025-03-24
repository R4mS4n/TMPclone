const express = require("express");
const router = express.Router();
const db = require("../config/db");  // Make sure this is correct for your DB connection

// Handle GET request for all tournaments
router.get("/", async (req, res) => {
  try {
    const [results] = await db.execute("SELECT * FROM Tournament");
    console.log("DB result:", results);  // Debugging: Check what you get from the DB
    res.json(results);
  } catch (error) {
    console.error("Error fetching tournaments:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;

