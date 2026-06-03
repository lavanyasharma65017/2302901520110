import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

export async function fetchNotifications() {
  try {
    const response = await axios.get(
      "http://4.224.186.213/evaluation-service/notifications",
      {
        headers: {
          Authorization: `Bearer ${process.env.TOKEN}`,
        },
      }
    );

    return response.data;
  } catch (error: any) {
  console.log("========== ERROR ==========");
  console.log("STATUS:", error.response?.status);
  console.log("DATA:", error.response?.data);
  console.log("MESSAGE:", error.message);
  console.log("===========================");
  return null;
}
}

export function getPriorityWeight(
  type: string
): number {
  switch (type) {
    case "Placement":
      return 3;

    case "Result":
      return 2;

    case "Event":
      return 1;

    default:
      return 0;
  }
}

export function calculateScore(
  notification: any
): number {
  const weight = getPriorityWeight(
    notification.Type
  );

  const timestamp = new Date(
    notification.Timestamp
  ).getTime();

  return weight * 1000000000 + timestamp;
}

export function sortByPriority(
  notifications: any[]
) {
  return notifications.sort(
    (a, b) =>
      calculateScore(b) -
      calculateScore(a)
  );
}

export function getTopNotifications(
  notifications: any[],
  count: number
) {
  return sortByPriority(
    notifications
  ).slice(0, count);
}