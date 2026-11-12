// What a world keeps of its map: only what an author changed, sheet by sheet. A world nobody has
// arranged has none, and every sheet is laid out from the place tree (sheet.ts).
import { z } from 'zod';

const cell = z.string().regex(/^-?\d{1,3},-?\d{1,3}$/);
const coordinate = z.number().int().min(-200).max(200);

export const sheetEditsSchema = z.object({
  // Set by Reroll.
  seed: z.number().int().min(0).max(1_000_000).optional(),
  // What a cell is worth on this sheet, in minutes.
  cellMinutes: z.number().min(0).max(525_600).optional(),
  // Kept once arranged, so the disc doesn't shrink under a move.
  radius: z.number().int().min(1).max(60).optional(),
  // Every child's centre, written at the sheet's first edit.
  centres: z.record(z.string().max(200), z.object({ q: coordinate, r: coordinate })).optional(),
  // Bigger and Smaller.
  sizes: z.record(z.string().max(200), z.number().int().min(1).max(400)).optional(),
  // Painted cells: a child, or '' for the sheet's own ground.
  claims: z.record(cell, z.string().max(200)).optional(),
  // Road cells.
  roads: z.array(cell).max(20_000).optional(),
  // Colour painted on cells: an index into the map's palette. A look, never a rule.
  paint: z.record(cell, z.number().int().min(0).max(7)).optional(),
});
export type SheetEdits = z.infer<typeof sheetEditsSchema>;

export const mapSchema = z.object({
  // The generator version the layout was made with.
  v: z.number().int().min(1).optional(),
  // The world's icon set, to suit its genre. Absent: old.
  icons: z.enum(['old', 'modern', 'far']).optional(),
  sheets: z.record(z.string().max(200), sheetEditsSchema).optional(),
});
export type WorldMap = z.infer<typeof mapSchema>;
