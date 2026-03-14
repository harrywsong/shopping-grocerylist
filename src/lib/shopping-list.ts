import fs from "fs";
import path from "path";
import { ShoppingListItem } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE_PATH = path.join(DATA_DIR, "shopping_list.json");

function ensureFile(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(FILE_PATH)) {
    fs.writeFileSync(FILE_PATH, "[]", "utf-8");
  }
}

export function getShoppingList(): ShoppingListItem[] {
  ensureFile();
  try {
    const raw = fs.readFileSync(FILE_PATH, "utf-8");
    return JSON.parse(raw) as ShoppingListItem[];
  } catch {
    return [];
  }
}

function saveList(items: ShoppingListItem[]): void {
  ensureFile();
  fs.writeFileSync(FILE_PATH, JSON.stringify(items, null, 2), "utf-8");
}

export function addToShoppingList(
  item: Omit<ShoppingListItem, "id" | "added_at">
): ShoppingListItem {
  const list = getShoppingList();
  const newItem: ShoppingListItem = {
    ...item,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    added_at: new Date().toISOString(),
    checked: false,
    quantity: item.quantity ?? 1,
  };
  list.push(newItem);
  saveList(list);
  return newItem;
}

export function setItemQuantity(id: string, quantity: number): ShoppingListItem | null {
  const list = getShoppingList();
  const idx = list.findIndex((item) => item.id === id);
  if (idx === -1) return null;
  list[idx] = { ...list[idx], quantity: Math.max(1, quantity) };
  saveList(list);
  return list[idx];
}

export function removeFromShoppingList(id: string): void {
  const list = getShoppingList();
  const filtered = list.filter((item) => item.id !== id);
  saveList(filtered);
}

export function toggleShoppingListItem(id: string): ShoppingListItem | null {
  const list = getShoppingList();
  const idx = list.findIndex((item) => item.id === id);
  if (idx === -1) return null;
  list[idx] = { ...list[idx], checked: !list[idx].checked };
  saveList(list);
  return list[idx];
}

export function clearShoppingList(): void {
  saveList([]);
}

export function updateShoppingList(items: ShoppingListItem[]): void {
  saveList(items);
}
