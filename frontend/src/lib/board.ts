export interface Card {
  id: string;
  title: string;
  details: string;
}

export interface Column {
  id: string;
  name: string;
  cards: Card[];
}

export type Board = Column[];

export const initialBoard: Board = [
  {
    id: "ideas",
    name: "ایده‌ها",
    cards: [
      {
        id: "brand-story",
        title: "روایت تازه برای برند",
        details: "یک داستان کوتاه که دلیل شکل‌گیری محصول را روشن کند.",
      },
      {
        id: "onboarding",
        title: "ایده‌های ورود کاربران",
        details: "تجربهٔ اولین برخورد را ساده‌تر و دلنشین‌تر کنیم.",
      },
    ],
  },
  {
    id: "planned",
    name: "برنامه‌ریزی",
    cards: [
      {
        id: "mobile-research",
        title: "بررسی تجربهٔ موبایل",
        details: "بازخوردهای کاربران را در یک فهرست کوتاه جمع‌بندی کنیم.",
      },
      {
        id: "design-system",
        title: "مرتب‌سازی اجزای طراحی",
        details: "رنگ‌ها و فاصله‌ها را برای نسخهٔ بعدی یکدست کنیم.",
      },
    ],
  },
  {
    id: "in-progress",
    name: "در حال انجام",
    cards: [
      {
        id: "product-copy",
        title: "بازنویسی متن صفحهٔ اصلی",
        details: "متن معرفی را کوتاه‌تر و روشن‌تر بازنویسی کنیم.",
      },
      {
        id: "prototype",
        title: "ساخت نمونهٔ اولیه",
        details: "مسیر اصلی کاربر را در یک نمونهٔ قابل کلیک نشان دهیم.",
      },
    ],
  },
  {
    id: "review",
    name: "بازبینی",
    cards: [
      {
        id: "signup-flow",
        title: "بازبینی مسیر ثبت‌نام",
        details: "مراحل غیرضروری را پیدا و حذف کنیم.",
      },
    ],
  },
  {
    id: "done",
    name: "انجام‌شده",
    cards: [
      {
        id: "visual-language",
        title: "تعریف زبان بصری",
        details: "رنگ‌ها و سبک کلی رابط کاربری مشخص شد.",
      },
      {
        id: "team-workshop",
        title: "جلسهٔ هم‌فکری تیم",
        details: "نیازهای اصلی محصول را با هم مرور کردیم.",
      },
    ],
  },
];

export function renameColumn(board: Board, columnId: string, name: string): Board {
  const trimmedName = name.trim();
  if (!trimmedName) return board;

  return board.map((column) =>
    column.id === columnId ? { ...column, name: trimmedName } : column,
  );
}

export function addColumn(board: Board, column: Column): Board {
  const name = column.name.trim();
  if (!name) return board;

  return [...board, { ...column, name }];
}

export function addCard(board: Board, columnId: string, card: Card): Board {
  return board.map((column) =>
    column.id === columnId
      ? { ...column, cards: [...column.cards, card] }
      : column,
  );
}

export function deleteCard(board: Board, cardId: string): Board {
  if (!board.some((column) => column.cards.some((card) => card.id === cardId))) {
    return board;
  }

  return board.map((column) => ({
    ...column,
    cards: column.cards.filter((card) => card.id !== cardId),
  }));
}

export function moveCard(
  board: Board,
  cardId: string,
  destinationColumnId: string,
  beforeCardId?: string,
): Board {
  const sourceColumn = board.find((column) =>
    column.cards.some((card) => card.id === cardId),
  );
  const destinationColumn = board.find(
    (column) => column.id === destinationColumnId,
  );

  if (!sourceColumn || !destinationColumn) return board;
  if (beforeCardId === cardId) return board;

  const movedCard = sourceColumn.cards.find((card) => card.id === cardId);
  if (!movedCard) return board;

  const nextBoard = board.map((column) => ({
    ...column,
    cards: column.cards.filter((card) => card.id !== cardId),
  }));
  const destination = nextBoard.find(
    (column) => column.id === destinationColumnId,
  );

  if (!destination) return board;

  const insertionIndex = beforeCardId
    ? destination.cards.findIndex((card) => card.id === beforeCardId)
    : destination.cards.length;

  destination.cards.splice(
    insertionIndex < 0 ? destination.cards.length : insertionIndex,
    0,
    movedCard,
  );

  return nextBoard;
}

export function countCards(board: Board): number {
  return board.reduce((total, column) => total + column.cards.length, 0);
}
