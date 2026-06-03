import axios from "axios";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

console.log(process.cwd());
console.log("BASE_URL =", process.env.BASE_URL);
console.log("TOKEN =", process.env.TOKEN);

export const Log = async (
  stack: string,
  level: string,
  packageName: string,
  message: string
) => {
  try {
    const response = await axios.post(
      `${process.env.BASE_URL}/logs`,
      {
        stack,
        level,
        package: packageName,
        message,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.TOKEN}`,
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error.message);
  }
};