
import { z } from "zod";
import { syncOfflineScans } from "../services/scan-queue.service.js";

const scanSchema = z.object({
  eventId: z.string().trim().min(1).max(128),
  token: z.string().min(1).max(4096),
  deviceId: z.string().trim().min(1).max(128),
});

const batchSchema = z.object({
  scans: z.array(scanSchema).min(1).max(100),
});

export async function syncScans(req, res, next) {
  try {
    const parsed = batchSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid scan batch.",
        errors: parsed.error.flatten(),
      });
    }

    const result = await syncOfflineScans({
      scans: parsed.data.scans,
      mealSlotId: req.params.mealSlotId,
      scannedBy: req.user.id,
    });

    if (result.status) {
      return res.status(result.status).json({
        message: result.message,
      });
    }

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
