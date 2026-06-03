import express from "express";

import {
  fetchNotifications,
  getTopNotifications,
} from "../services/notificationService";

const router = express.Router();
router.get("/", (req, res) => {
  res.json({
    message: "Notification API Working",
    endpoints: [
      "/notifications/all",
      "/notifications/priority",
    ],
  });
});
router.get(
  "/priority",
  async (req, res) => {
    try {
      const data =
        await fetchNotifications();

      if (!data) {
        return res.status(500).json({
          message:
            "Failed to fetch notifications",
        });
      }

      const notifications =
        data.notifications;

      const top10 =
        getTopNotifications(
          notifications,
          10
        );

      res.status(200).json(top10);
    } catch (error) {
      res.status(500).json({
        message: "Server Error",
      });
    }
  }
);

router.get(
  "/all",
  async (req, res) => {
    try {
      const data =
        await fetchNotifications();

      if (!data) {
        return res.status(500).json({
          message:
            "Failed to fetch notifications",
        });
      }

      res.status(200).json(
        data.notifications
      );
    } catch (error) {
      res.status(500).json({
        message: "Server Error",
      });
    }
  }
);

export default router;