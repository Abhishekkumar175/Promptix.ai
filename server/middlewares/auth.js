import { clerkClient } from "@clerk/express";

export const auth = async (req, res, next) => {
  try {
    const { userId } = req.auth();

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const user = await clerkClient.users.getUser(userId);

    const plan = user.privateMetadata?.plan || "free";
    const free_usage = user.privateMetadata?.free_usage || 0;

    req.plan = plan;
    req.free_usage = free_usage;

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Authentication failed",
    });
  }
};
