import { describe, expect, it } from "vitest";
import {
  addColumn,
  addCard,
  countCards,
  deleteCard,
  initialBoard,
  moveCard,
  renameColumn,
  type Board,
  type Card,
} from "./board";

const card: Card = {
  id: "new-card",
  title: "عنوان تازه",
  details: "جزئیات تازه",
};

function createBoard(): Board {
  return [
    { id: "first", name: "اول", cards: [{ id: "a", title: "الف", details: "" }] },
    {
      id: "second",
      name: "دوم",
      cards: [{ id: "b", title: "ب", details: "" }],
    },
    { id: "third", name: "سوم", cards: [] },
    { id: "fourth", name: "چهارم", cards: [] },
    { id: "fifth", name: "پنجم", cards: [] },
  ];
}

describe("initial board", () => {
  it("starts with exactly five named columns and sample cards", () => {
    expect(initialBoard).toHaveLength(5);
    expect(initialBoard.every((column) => column.cards.length > 0)).toBe(true);
    expect(countCards(initialBoard)).toBe(9);
  });
});

describe("column updates", () => {
  it("adds a named column without changing existing columns", () => {
    const board = createBoard();
    const updated = addColumn(board, {
      id: "sixth",
      name: "  انتشار  ",
      cards: [],
    });

    expect(updated).toHaveLength(6);
    expect(updated[5]).toEqual({
      id: "sixth",
      name: "انتشار",
      cards: [],
    });
    expect(board).toHaveLength(5);
  });

  it("does not add a column with a blank name", () => {
    const board = createBoard();

    expect(addColumn(board, { id: "sixth", name: " ", cards: [] })).toBe(board);
  });

  it("renames a column without changing the others", () => {
    const board = createBoard();
    const renamed = renameColumn(board, "second", "  در حال انجام  ");

    expect(renamed[1].name).toBe("در حال انجام");
    expect(renamed.map((column) => column.name)).toEqual([
      "اول",
      "در حال انجام",
      "سوم",
      "چهارم",
      "پنجم",
    ]);
  });

  it("ignores a blank name or an unknown column", () => {
    const board = createBoard();

    expect(renameColumn(board, "first", "  ")).toBe(board);
    expect(renameColumn(board, "missing", "نام تازه")).toEqual(board);
  });
});

describe("card updates", () => {
  it("adds a card to the requested column", () => {
    const board = createBoard();
    const updated = addCard(board, "third", card);

    expect(updated[2].cards).toEqual([card]);
    expect(updated[0].cards).toHaveLength(1);
    expect(countCards(updated)).toBe(3);
  });

  it("does not add a card to an unknown column", () => {
    const board = createBoard();

    expect(addCard(board, "missing", card)).toEqual(board);
  });

  it("deletes a card and leaves other cards intact", () => {
    const board = createBoard();
    const updated = deleteCard(board, "a");

    expect(updated[0].cards).toEqual([]);
    expect(updated[1].cards).toEqual(board[1].cards);
    expect(countCards(updated)).toBe(1);
  });

  it("does not change the board for an unknown card", () => {
    const board = createBoard();

    expect(deleteCard(board, "missing")).toBe(board);
  });

  it("moves a card between columns and inserts it before the target card", () => {
    const board = createBoard();
    const updated = moveCard(board, "a", "second", "b");

    expect(updated[0].cards).toEqual([]);
    expect(updated[1].cards.map((item) => item.id)).toEqual(["a", "b"]);
    expect(countCards(updated)).toBe(2);
  });

  it("moves a card to an empty column", () => {
    const updated = moveCard(createBoard(), "b", "third");

    expect(updated[1].cards).toEqual([]);
    expect(updated[2].cards.map((item) => item.id)).toEqual(["b"]);
  });

  it("reorders cards within their column", () => {
    const board = createBoard();
    board[0].cards.push({ id: "c", title: "ج", details: "" });

    const updated = moveCard(board, "c", "first", "a");

    expect(updated[0].cards.map((item) => item.id)).toEqual(["c", "a"]);
    expect(board[0].cards.map((item) => item.id)).toEqual(["a", "c"]);
  });

  it("ignores unknown card or destination ids", () => {
    const board = createBoard();

    expect(moveCard(board, "missing", "second")).toBe(board);
    expect(moveCard(board, "a", "missing")).toBe(board);
  });
});
