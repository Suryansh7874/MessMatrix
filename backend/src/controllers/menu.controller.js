import { z } from "zod";
import Menu from "../models/Menu.js";

const schema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().max(1000).optional(),
  mealType: z.enum(["BREAKFAST", "LUNCH", "DINNER"]),
  date: z.string().datetime({ offset: true }),
  price: z.number().nonnegative(),
  imageUrl: z.string().url().or(z.literal("")).optional()
});

export async function createMenu(req, res, next) {
  try {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid menu", errors: parsed.error.issues });
    const menu = await Menu.create({ ...parsed.data, date: new Date(parsed.data.date), price: String(parsed.data.price) });
    return res.status(201).json({ message: "Menu created", menu });
  } catch (error) { next(error); }
}

export async function listMenus(req, res, next) {
  try {
    const menus = await Menu.find({ date: { $gte: new Date() } }).sort({ date: 1, mealType: 1 });
    return res.json({ count: menus.length, menus });
  } catch (error) { next(error); }
}
