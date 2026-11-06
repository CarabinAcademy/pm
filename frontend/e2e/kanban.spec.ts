import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("shows the sample board in Persian with exactly five columns", async ({
  page,
}) => {
  await expect(page.locator("html")).toHaveAttribute("lang", "fa");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page).toHaveTitle("مدیر پروژه | تختهٔ کانبان");
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute(
    "href",
    "/project-manager-logo.svg",
  );
  await expect(
    page.getByRole("link", { name: "مدیر پروژه، صفحهٔ اصلی" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "تختهٔ تیم محصول" })).toBeVisible();
  await expect(page.getByTestId(/^kanban-column-/)).toHaveCount(5);
  await expect(page.getByText("بازنویسی متن صفحهٔ اصلی")).toBeVisible();
});

test("adds and removes a card", async ({ page }) => {
  await page.getByRole("button", { name: "افزودن کارت به ایده‌ها" }).click();
  await page.getByLabel("عنوان کارت").fill("آزمون جریان جدید");
  await page.getByLabel("جزئیات کارت").fill("این کارت برای آزمودن رابط ساخته شده است.");
  await page.getByRole("button", { name: "ثبت کارت" }).click();

  await expect(page.getByText("آزمون جریان جدید")).toBeVisible();
  await page
    .getByRole("button", { name: "حذف کارت آزمون جریان جدید" })
    .click();
  await expect(page.getByText("آزمون جریان جدید")).toHaveCount(0);
});

test("renames a column", async ({ page }) => {
  await page.getByRole("button", { name: "تغییر نام ستون ایده‌ها" }).click();
  const nameInput = page.getByRole("textbox", { name: "نام ستون" });

  await nameInput.fill("ایده‌های تازه");
  await nameInput.press("Enter");

  await expect(
    page.getByRole("heading", { name: "ایده‌های تازه" }),
  ).toBeVisible();
  await expect(page.getByTestId(/^kanban-column-/)).toHaveCount(5);
});

test("adds a column to the left without shrinking existing columns", async ({
  page,
}) => {
  const board = page.getByTestId("board-columns");
  const ideasColumn = page.getByTestId("kanban-column-ideas");
  const doneColumn = page.getByTestId("kanban-column-done");
  const originalIdeasWidth = (await ideasColumn.boundingBox())?.width;
  const originalDoneWidth = (await doneColumn.boundingBox())?.width;

  const ideasBefore = await ideasColumn.boundingBox();
  const plannedBefore = await page
    .getByTestId("kanban-column-planned")
    .boundingBox();
  expect(ideasBefore?.x).toBeGreaterThan(plannedBefore?.x ?? 0);

  await page.getByRole("button", { name: "افزودن ستون دیگر" }).click();
  await page.getByRole("textbox", { name: "نام ستون جدید" }).fill("انتشار");
  await page.getByRole("button", { name: "افزودن", exact: true }).click();

  await expect(page.getByTestId(/^kanban-column-/)).toHaveCount(6);
  const newColumn = page.getByTestId(/^kanban-column-/).filter({
    has: page.getByRole("heading", { name: "انتشار" }),
  });
  await expect(newColumn).toBeVisible();
  await expect(page.getByTestId("card-count")).toHaveText("9");

  await expect.poll(() => board.evaluate((element) => element.scrollLeft)).toBeLessThan(0);
  const [dimensions, ideasAfter, doneAfter, newColumnAfter] = await Promise.all([
    board.evaluate((element) => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
      scrollLeft: element.scrollLeft,
    })),
    ideasColumn.boundingBox(),
    doneColumn.boundingBox(),
    newColumn.boundingBox(),
  ]);

  expect(dimensions.scrollWidth).toBeGreaterThan(dimensions.clientWidth);
  expect(dimensions.scrollLeft).toBeLessThan(0);
  expect(ideasAfter?.width).toBe(originalIdeasWidth);
  expect(doneAfter?.width).toBe(originalDoneWidth);
  expect(newColumnAfter?.x).toBeLessThan(doneAfter?.x ?? 0);
});

test("moves a card to another column", async ({ page }) => {
  const card = page.getByTestId("kanban-card-product-copy");
  const handle = card.getByTestId("drag-handle");
  const destination = page
    .getByTestId("kanban-column-review")
    .locator(".card-list");

  const sourceBox = await handle.boundingBox();
  const destinationBox = await destination.boundingBox();

  if (!sourceBox || !destinationBox) {
    throw new Error("Unable to locate the card or destination column");
  }

  const start = {
    x: sourceBox.x + sourceBox.width / 2,
    y: sourceBox.y + sourceBox.height / 2,
  };
  const end = {
    x: destinationBox.x + destinationBox.width / 2,
    y: destinationBox.y + destinationBox.height / 2,
  };

  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x + 8, start.y + 8, { steps: 2 });
  await page.mouse.move(end.x, end.y, { steps: 16 });
  await page.mouse.up();

  await expect(
    page.getByTestId("kanban-column-review").getByText("بازنویسی متن صفحهٔ اصلی"),
  ).toBeVisible();
  await expect(
    page.getByTestId("kanban-column-in-progress").getByText(
      "بازنویسی متن صفحهٔ اصلی",
    ),
  ).toHaveCount(0);
});

test("reorders cards within the same column", async ({ page }) => {
  const column = page.getByTestId("kanban-column-ideas");
  const source = page
    .getByTestId("kanban-card-onboarding")
    .getByTestId("drag-handle");
  const target = page.getByTestId("kanban-card-brand-story");
  const sourceBox = await source.boundingBox();
  const targetBox = await target.boundingBox();

  if (!sourceBox || !targetBox) {
    throw new Error("Unable to locate the cards to reorder");
  }

  const start = {
    x: sourceBox.x + sourceBox.width / 2,
    y: sourceBox.y + sourceBox.height / 2,
  };
  const end = {
    x: targetBox.x + targetBox.width / 2,
    y: targetBox.y + targetBox.height / 2,
  };

  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x + 8, start.y - 8, { steps: 2 });
  await page.mouse.move(end.x, end.y, { steps: 16 });
  await page.mouse.up();

  await expect(column.locator(".task-card").first()).toHaveAttribute(
    "data-testid",
    "kanban-card-onboarding",
  );
});

test("keeps the columns horizontally scrollable on a small screen", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });

  const dimensions = await page.locator(".board-columns").evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
  }));

  expect(dimensions.scrollWidth).toBeGreaterThan(dimensions.clientWidth);
});
