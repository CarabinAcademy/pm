"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  pointerWithin,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import {
  Bell,
  CircleHelp,
  Check,
  GripVertical,
  Inbox,
  LayoutDashboard,
  Layers3,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import {
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type KeyboardEvent,
} from "react";
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
  type Column,
} from "@/lib/board";

const columnDropPrefix = "column:";

const boardCollisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);
  const cardCollisions = pointerCollisions.filter(
    ({ id }) =>
      String(id) !== String(args.active.id) &&
      !String(id).startsWith(columnDropPrefix),
  );
  if (cardCollisions.length > 0) return cardCollisions;

  const columnCollisions = pointerCollisions.filter(({ id }) =>
    String(id).startsWith(columnDropPrefix),
  );
  return columnCollisions.length > 0
    ? columnCollisions
    : closestCorners(args);
};

export default function Home() {
  const [board, setBoard] = useState<Board>(initialBoard);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const boardColumnsRef = useRef<HTMLDivElement>(null);
  const boardStyle: CSSProperties & { "--column-count": number } = {
    "--column-count": board.length + 1,
  };
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const activeCard = board
    .flatMap((column) => column.cards)
    .find((card) => card.id === activeCardId);

  function handleDragEnd(event: DragEndEvent) {
    setActiveCardId(null);
    if (!event.over) return;

    const overId = String(event.over.id);
    const destinationColumn = board.find(
      (column) =>
        `${columnDropPrefix}${column.id}` === overId ||
        column.cards.some((card) => card.id === overId),
    );
    if (!destinationColumn) return;

    const beforeCardId = destinationColumn.cards.some(
      (card) => card.id === overId,
    )
      ? overId
      : undefined;
    setBoard((currentBoard) =>
      moveCard(
        currentBoard,
        String(event.active.id),
        destinationColumn.id,
        beforeCardId,
      ),
    );
  }

  function handleAddCard(columnId: string, title: string, details: string) {
    setBoard((currentBoard) =>
      addCard(currentBoard, columnId, {
        id: crypto.randomUUID(),
        title,
        details,
      }),
    );
  }

  function handleAddColumn(name: string) {
    const columnName = name.trim();
    if (!columnName) return;

    setBoard((currentBoard) =>
      addColumn(currentBoard, {
        id: crypto.randomUUID(),
        name: columnName,
        cards: [],
      }),
    );
    setIsAddingColumn(false);
    requestAnimationFrame(() => {
      const columns = boardColumnsRef.current;
      columns?.scrollTo({ left: -columns.scrollWidth, behavior: "smooth" });
    });
  }

  return (
    <div className="app-shell" dir="ltr">
      <header className="topbar">
        <Link
          className="brand"
          href="/"
          aria-label="مدیر پروژه، صفحهٔ اصلی"
          dir="rtl"
        >
          <span className="brand-mark" aria-hidden="true">
            <Image
              className="brand-logo"
              src="/project-manager-logo.svg"
              width={34}
              height={34}
              alt=""
              priority
            />
          </span>
          <span className="brand-name">مدیر پروژه</span>
        </Link>
        <div className="topbar-context" dir="rtl">
          <span>فضای کاری</span>
          <span className="context-divider">/</span>
          <strong>استودیو محصول</strong>
        </div>
        <div className="topbar-actions">
          <span className="topbar-icon" aria-label="راهنما">
            <CircleHelp size={17} />
          </span>
          <span className="topbar-icon" aria-label="اعلان‌ها">
            <Bell size={17} />
          </span>
          <span className="workspace-avatar" aria-label="تیم محصول">
            ت
          </span>
        </div>
      </header>

      <div className="workspace-shell">
        <aside className="sidebar" dir="rtl">
          <div className="sidebar-workspace">
            <span className="sidebar-workspace-icon">
              <Layers3 size={17} />
            </span>
            <div className="sidebar-workspace-copy">
              <span className="sidebar-eyebrow">فضای کاری</span>
              <strong>استودیو محصول</strong>
            </div>
            <MoreHorizontal className="sidebar-more" size={18} />
          </div>

          <div className="sidebar-section-label">فضای کاری شما</div>
          <Link className="sidebar-board-link" href="#board">
            <span className="sidebar-link-icon">
              <Inbox size={17} />
            </span>
            <span>تختهٔ تیم محصول</span>
            <span className="sidebar-link-count">{countCards(board)}</span>
          </Link>

          <div className="sidebar-note">
            <div className="sidebar-note-mark">
              <LayoutDashboard size={16} />
            </div>
            <strong>قدم بعدی، همین‌جاست</strong>
            <p>کارت‌ها را بین ستون‌ها جابه‌جا کنید و پیشرفت تیم را ببینید.</p>
          </div>

          <div className="sidebar-bottom">
            <span className="sidebar-bottom-dot" />
            <span>یک تخته، مسیر پیشرفت</span>
          </div>
        </aside>

        <main className="workspace-main" dir="rtl" id="board">
          <div className="board-header">
            <div className="board-heading">
              <div className="board-breadcrumb">
                استودیو محصول <span>/</span> تخته‌ها
              </div>
              <h1 className="heading-title" id="page-title">
                تختهٔ تیم محصول
              </h1>
            </div>
            <div className="board-header-meta">
              <div className="member-stack" aria-label="اعضای تیم">
                <span className="member-avatar member-avatar-one">ن</span>
                <span className="member-avatar member-avatar-two">م</span>
                <span className="member-avatar member-avatar-three">آ</span>
              </div>
              <span className="board-meta-divider" />
              <div className="board-stat">
                <span>کارت‌ها</span>
                <strong data-testid="card-count">{countCards(board)}</strong>
              </div>
              <span className="board-meta-divider" />
              <div className="board-stat">
                <span>ستون‌ها</span>
                <strong>{board.length.toLocaleString("fa-IR")}</strong>
              </div>
            </div>
          </div>

          <section className="board-canvas" aria-labelledby="board-title">
            <div className="board-toolbar">
              <div className="board-title-group">
                <span className="board-title-icon">
                  <Layers3 size={17} />
                </span>
                <span>
                  <h2 className="board-title" id="board-title">
                    نمای کلی کارها
                  </h2>
                  <p className="board-subtitle">
                    {board.length.toLocaleString("fa-IR")} مرحله از ایده تا اجرا
                  </p>
                </span>
              </div>
              <div className="board-toolbar-actions">
                <p className="drag-hint">
                  <GripVertical size={15} />
                  برای جابه‌جایی، کارت را بکشید
                </p>
              </div>
            </div>

            <DndContext
              id="kanban-board"
              sensors={sensors}
              collisionDetection={boardCollisionDetection}
              onDragStart={(event) => setActiveCardId(String(event.active.id))}
              onDragCancel={() => setActiveCardId(null)}
              onDragEnd={handleDragEnd}
            >
              <div
                className="board-columns"
                data-testid="board-columns"
                ref={boardColumnsRef}
                style={boardStyle}
              >
                {board.map((column) => (
                  <KanbanColumn
                    key={column.id}
                    column={column}
                    onAddCard={handleAddCard}
                    onDeleteCard={(cardId) =>
                      setBoard((currentBoard) =>
                        deleteCard(currentBoard, cardId),
                      )
                    }
                    onRename={(name) =>
                      setBoard((currentBoard) =>
                        renameColumn(currentBoard, column.id, name),
                      )
                    }
                  />
                ))}
                <div className="add-column-slot">
                  {isAddingColumn ? (
                    <AddColumnForm
                      onSubmit={handleAddColumn}
                      onCancel={() => setIsAddingColumn(false)}
                    />
                  ) : (
                    <button
                      className="add-column-button"
                      type="button"
                      aria-label="افزودن ستون دیگر"
                      onClick={() => setIsAddingColumn(true)}
                    >
                      <Plus size={17} />
                      افزودن ستون دیگر
                    </button>
                  )}
                </div>
              </div>
              <DragOverlay>
                {activeCard ? <CardPreview card={activeCard} /> : null}
              </DragOverlay>
            </DndContext>
            <footer className="board-footer">
              <span className="board-footer-dot" />
              همه‌چیز با یک قدم کوچک شروع می‌شود.
            </footer>
          </section>
        </main>
      </div>
    </div>
  );
}

function AddColumnForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (name: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (trimmedName) onSubmit(trimmedName);
  }

  return (
    <form className="add-column-form" onSubmit={handleSubmit}>
      <input
        className="column-name-input"
        aria-label="نام ستون جدید"
        placeholder="نام ستون"
        value={name}
        onChange={(event) => setName(event.target.value)}
        autoFocus
        required
      />
      <button className="add-column-submit" type="submit">
        افزودن
      </button>
      <button
        className="add-column-cancel"
        type="button"
        aria-label="انصراف از افزودن ستون"
        onClick={onCancel}
      >
        انصراف
      </button>
    </form>
  );
}

interface KanbanColumnProps {
  column: Column;
  onAddCard: (columnId: string, title: string, details: string) => void;
  onDeleteCard: (cardId: string) => void;
  onRename: (name: string) => void;
}

function KanbanColumn({
  column,
  onAddCard,
  onDeleteCard,
  onRename,
}: KanbanColumnProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: `${columnDropPrefix}${column.id}`,
  });
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(column.name);

  function saveName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onRename(nameDraft);
    setIsEditingName(false);
  }

  function handleNameKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setNameDraft(column.name);
      setIsEditingName(false);
    }
  }

  return (
    <section
      className={`kanban-column${isOver ? " is-over" : ""}`}
      data-testid={`kanban-column-${column.id}`}
      aria-labelledby={`column-heading-${column.id}`}
    >
      <header className="column-header">
        <div className="column-name-wrap">
          <span className="column-color" />
          {isEditingName ? (
            <form
              className="column-name-form"
              onSubmit={(event) => {
                saveName(event);
              }}
            >
              <input
                aria-label="نام ستون"
                className="column-name-input"
                value={nameDraft}
                onChange={(event) => setNameDraft(event.target.value)}
                onKeyDown={handleNameKeyDown}
                autoFocus
              />
            </form>
          ) : (
            <h3 className="column-name" id={`column-heading-${column.id}`}>
              {column.name}
            </h3>
          )}
        </div>
        <span className="column-count" aria-label={`${column.cards.length} کارت`}>
          {column.cards.length}
        </span>
        <button
          className="icon-button"
          type="button"
          aria-label={`تغییر نام ستون ${column.name}`}
          title="تغییر نام ستون"
          onClick={() => {
            setNameDraft(column.name);
            setIsEditingName(true);
          }}
        >
          <Pencil size={14} />
        </button>
      </header>

      <SortableContext
        items={column.cards.map((card) => card.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          className="card-list"
          ref={setNodeRef}
          data-column-id={column.id}
          data-testid="card-list"
        >
          {column.cards.map((card) => (
            <SortableCard
              key={card.id}
              card={card}
              onDelete={() => onDeleteCard(card.id)}
            />
          ))}
          {column.cards.length === 0 && (
            <p className="empty-column">هنوز کارتی در این ستون نیست.</p>
          )}
        </div>
      </SortableContext>

      {isAddingCard ? (
        <AddCardForm
          onSubmit={(title, details) => {
            onAddCard(column.id, title, details);
            setIsAddingCard(false);
          }}
          onCancel={() => setIsAddingCard(false)}
        />
      ) : (
        <button
          className="add-card-button"
          type="button"
          aria-label={`افزودن کارت به ${column.name}`}
          onClick={() => setIsAddingCard(true)}
        >
          <Plus size={15} />
          افزودن کارت
        </button>
      )}
    </section>
  );
}

interface AddCardFormProps {
  onSubmit: (title: string, details: string) => void;
  onCancel: () => void;
}

function AddCardForm({ onSubmit, onCancel }: AddCardFormProps) {
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    onSubmit(trimmedTitle, details.trim());
  }

  return (
    <form className="add-card-form" onSubmit={handleSubmit}>
      <input
        aria-label="عنوان کارت"
        className="form-field"
        placeholder="عنوان کارت"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        required
        autoFocus
      />
      <textarea
        aria-label="جزئیات کارت"
        className="form-field details-field"
        placeholder="جزئیات"
        value={details}
        onChange={(event) => setDetails(event.target.value)}
      />
      <div className="form-actions">
        <button className="submit-button" type="submit">
          <Check size={14} />
          ثبت کارت
        </button>
        <button className="cancel-button" type="button" onClick={onCancel}>
          انصراف
        </button>
      </div>
    </form>
  );
}

interface SortableCardProps {
  card: Card;
  onDelete: () => void;
}

function SortableCard({ card, onDelete }: SortableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  return (
    <article
      className={`task-card${isDragging ? " is-dragging" : ""}`}
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      data-testid={`kanban-card-${card.id}`}
    >
      <div className="card-actions">
        <button
          className="icon-button drag-handle"
          type="button"
          aria-label={`جابجایی کارت ${card.title}`}
          data-testid="drag-handle"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={16} />
        </button>
        <button
          className="icon-button delete-button"
          type="button"
          aria-label={`حذف کارت ${card.title}`}
          title="حذف کارت"
          onClick={onDelete}
        >
          <Trash2 size={14} />
        </button>
      </div>
      <h4 className="card-title">{card.title}</h4>
      {card.details && <p className="card-details">{card.details}</p>}
    </article>
  );
}

function CardPreview({ card }: { card: Card }) {
  return (
    <article className="task-card drag-overlay" aria-hidden="true">
      <h4 className="card-title">{card.title}</h4>
      {card.details && <p className="card-details">{card.details}</p>}
    </article>
  );
}
