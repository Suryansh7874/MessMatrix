import mongoose from "mongoose";
import { randomUUID } from "node:crypto";
import { SyncStatus } from "../utils/enums.js";

const schema = new mongoose.Schema({
  _id: { type: String, default: () => randomUUID() },
  checkInId: { type: String, ref: "CheckIn", required: true },
  deviceId: { type: String, required: true },
  eventId: { type: String, required: true, unique: true },
  payload: { type: mongoose.Schema.Types.Mixed, required: true },
  status: { type: String, enum: Object.values(SyncStatus), default: SyncStatus.QUEUED },
  queuedAt: { type: Date, default: Date.now },
  syncedAt: { type: Date, default: null },
  lastError: { type: String, default: null }
}, { timestamps: true, versionKey: false });
export default mongoose.model("ScanQueue", schema);
