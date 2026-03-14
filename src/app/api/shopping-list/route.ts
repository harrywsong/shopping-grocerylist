import { NextRequest, NextResponse } from "next/server";
import {
  getShoppingList,
  addToShoppingList,
  removeFromShoppingList,
  toggleShoppingListItem,
  setItemQuantity,
  clearShoppingList,
} from "@/lib/shopping-list";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const items = getShoppingList();
    return NextResponse.json({ items });
  } catch (error) {
    console.error("Shopping list GET error:", error);
    return NextResponse.json({ items: [], error: "Failed to read shopping list" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, store_name, price, image_url } = body;

    if (!name || !store_name) {
      return NextResponse.json({ error: "name and store_name are required" }, { status: 400 });
    }

    const item = addToShoppingList({
      name,
      store_name,
      price: price ?? null,
      image_url: image_url ?? null,
      checked: false,
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error("Shopping list POST error:", error);
    return NextResponse.json({ error: "Failed to add item" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, quantity } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    // quantity update
    if (typeof quantity === "number") {
      const item = setItemQuantity(id, quantity);
      if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });
      return NextResponse.json({ item });
    }

    // toggle checked
    const item = toggleShoppingListItem(id);
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }
    return NextResponse.json({ item });
  } catch (error) {
    console.error("Shopping list PATCH error:", error);
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, clear } = body;

    if (clear === true) {
      clearShoppingList();
      return NextResponse.json({ success: true });
    }

    if (!id) {
      return NextResponse.json({ error: "id or clear:true is required" }, { status: 400 });
    }

    removeFromShoppingList(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Shopping list DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 });
  }
}
