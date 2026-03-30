"use client";

import styles from "../SmartEditor.module.scss";

import { Icon } from "@atoms/Icons/Icon";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
	$computeTableMapSkipCellCheck,
	$deleteTableColumn__EXPERIMENTAL,
	$deleteTableRow__EXPERIMENTAL,
	$getTableCellNodeFromLexicalNode,
	$getTableColumnIndexFromTableCellNode,
	$getTableNodeFromLexicalNodeOrThrow,
	$getTableRowIndexFromTableCellNode,
	$getTableRowNodeFromTableCellNodeOrThrow,
	$insertTableColumn__EXPERIMENTAL,
	$insertTableRow__EXPERIMENTAL,
	$isTableCellNode,
	$isTableRowNode,
	$isTableSelection,
	getTableElement,
	getTableObserverFromTableElement,
	TableCellHeaderStates,
	type TableCellNode,
} from "@lexical/table";
import clsx from "clsx";
import {
	$getNodeByKey,
	$getSelection,
	$isRangeSelection,
	COMMAND_PRIORITY_CRITICAL,
	type NodeKey,
	SELECTION_CHANGE_COMMAND,
} from "lexical";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type TableActionMenuPluginProps = {
	anchorElem: HTMLElement;
};

type SelectionCounts = {
	columns: number;
	rows: number;
};

const DEFAULT_SELECTION_COUNTS: SelectionCounts = {
	columns: 1,
	rows: 1,
};

const TABLE_ROW_HEIGHT_STEP = 24;
const MIN_TABLE_ROW_HEIGHT = 48;
const MAX_TABLE_ROW_HEIGHT = 320;

function getSelectionCounts(): SelectionCounts {
	const selection = $getSelection();
	if (!$isTableSelection(selection)) {
		return DEFAULT_SELECTION_COUNTS;
	}

	const shape = selection.getShape();
	return {
		columns: shape.toX - shape.fromX + 1,
		rows: shape.toY - shape.fromY + 1,
	};
}

function getActiveTableCellNode(): TableCellNode | null {
	const selection = $getSelection();
	if ($isRangeSelection(selection)) {
		return $getTableCellNodeFromLexicalNode(selection.anchor.getNode());
	}

	if ($isTableSelection(selection)) {
		const anchorNode = $getTableCellNodeFromLexicalNode(selection.anchor.getNode());
		return $isTableCellNode(anchorNode) ? anchorNode : null;
	}

	return null;
}

function getSelectedTableRowBounds(cellNode: TableCellNode) {
	const selection = $getSelection();
	if (!$isTableSelection(selection)) {
		const rowIndex = $getTableRowIndexFromTableCellNode(cellNode);
		return {
			endRowIndex: rowIndex,
			startRowIndex: rowIndex,
		};
	}

	const shape = selection.getShape();
	return {
		endRowIndex: Math.max(shape.fromY, shape.toY),
		startRowIndex: Math.min(shape.fromY, shape.toY),
	};
}

function clampTableRowHeight(height: number) {
	return Math.min(MAX_TABLE_ROW_HEIGHT, Math.max(MIN_TABLE_ROW_HEIGHT, Math.round(height)));
}

export default function TableActionMenuPlugin({ anchorElem }: TableActionMenuPluginProps) {
	const [editor] = useLexicalComposerContext();
	const actionButtonRef = useRef<HTMLButtonElement | null>(null);
	const actionButtonContainerRef = useRef<HTMLDivElement | null>(null);
	const menuRef = useRef<HTMLDivElement | null>(null);
	const [activeCellKey, setActiveCellKey] = useState<NodeKey | null>(null);
	const [isButtonVisible, setIsButtonVisible] = useState(false);
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [selectionCounts, setSelectionCounts] = useState<SelectionCounts>(DEFAULT_SELECTION_COUNTS);
	const [menuPosition, setMenuPosition] = useState<{ left: number; top: number } | null>(null);
	const [activeCellHeaderState, setActiveCellHeaderState] = useState(TableCellHeaderStates.NO_STATUS);
	const [activeRowHeight, setActiveRowHeight] = useState<number | null>(null);

	const moveActionButton = useCallback(() => {
		editor.getEditorState().read(() => {
			const nextCell = getActiveTableCellNode();
			const nextCounts = getSelectionCounts();
			const buttonContainer = actionButtonContainerRef.current;

			setSelectionCounts(nextCounts);

			if (!nextCell || !buttonContainer) {
				setIsButtonVisible(false);
				setActiveCellKey(null);
				setActiveCellHeaderState(TableCellHeaderStates.NO_STATUS);
				setActiveRowHeight(null);
				setIsMenuOpen(false);
				return;
			}

			const cellElement = editor.getElementByKey(nextCell.getKey());
			if (!(cellElement instanceof HTMLElement)) {
				setIsButtonVisible(false);
				setActiveCellKey(null);
				setActiveCellHeaderState(TableCellHeaderStates.NO_STATUS);
				setActiveRowHeight(null);
				setIsMenuOpen(false);
				return;
			}

			const tableNode = $getTableNodeFromLexicalNodeOrThrow(nextCell);
			const tableElement = getTableElement(tableNode, editor.getElementByKey(tableNode.getKey()));
			if (tableElement === null) {
				setIsButtonVisible(false);
				setActiveCellKey(null);
				setActiveCellHeaderState(TableCellHeaderStates.NO_STATUS);
				setActiveRowHeight(null);
				setIsMenuOpen(false);
				return;
			}

			const tableObserver = getTableObserverFromTableElement(tableElement);
			if (tableObserver?.isSelecting) {
				setIsButtonVisible(false);
				setActiveRowHeight(null);
				setIsMenuOpen(false);
				return;
			}

			const rowNode = $getTableRowNodeFromTableCellNodeOrThrow(nextCell);
			const rowElement = editor.getElementByKey(rowNode.getKey());
			const storedRowHeight = rowNode.getHeight();
			const nextRowHeight = rowElement instanceof HTMLElement
				? Math.round(rowElement.getBoundingClientRect().height)
				: (typeof storedRowHeight === "number" ? Math.round(storedRowHeight) : null);

			const anchorRect = anchorElem.getBoundingClientRect();
			const cellRect = cellElement.getBoundingClientRect();
			const buttonSize = 28;
			const horizontalInset = 6;
			const left = cellRect.right - anchorRect.left - buttonSize - horizontalInset;
			const top = cellRect.top - anchorRect.top + ((cellRect.height - buttonSize) / 2);

			buttonContainer.style.transform = `translate(${left}px, ${top}px)`;
			setActiveCellHeaderState(nextCell.getHeaderStyles());
			setActiveRowHeight(nextRowHeight);
			setActiveCellKey((currentKey) => {
				if (currentKey !== nextCell.getKey()) {
					setIsMenuOpen(false);
				}
				return nextCell.getKey();
			});
			setIsButtonVisible(true);
		});
	}, [anchorElem, editor]);

	const updateMenuPosition = useCallback(() => {
		const triggerRect = actionButtonRef.current?.getBoundingClientRect();
		if (!triggerRect) {
			setMenuPosition(null);
			return;
		}

		const viewportPadding = 12;
		const menuWidth = 232;
		let left = triggerRect.right + 10;
		if (left + menuWidth > window.innerWidth - viewportPadding) {
			left = triggerRect.left - menuWidth - 10;
		}
		left = Math.max(viewportPadding, left);

		setMenuPosition({
			left,
			top: Math.max(viewportPadding, triggerRect.top),
		});
	}, []);

	useEffect(() => {
		moveActionButton();

		const unregisterUpdate = editor.registerUpdateListener(() => {
			window.requestAnimationFrame(moveActionButton);
		});
		const unregisterSelection = editor.registerCommand(
			SELECTION_CHANGE_COMMAND,
			() => {
				window.requestAnimationFrame(moveActionButton);
				return false;
			},
			COMMAND_PRIORITY_CRITICAL,
		);
		const unregisterRoot = editor.registerRootListener((rootElement) => {
			if (!rootElement) {
				return undefined;
			}

			const handlePointerUp = () => {
				window.requestAnimationFrame(moveActionButton);
			};

			rootElement.addEventListener("pointerup", handlePointerUp);
			return () => {
				rootElement.removeEventListener("pointerup", handlePointerUp);
			};
		});

		window.addEventListener("resize", moveActionButton);
		window.addEventListener("scroll", moveActionButton, true);

		return () => {
			unregisterUpdate();
			unregisterSelection();
			unregisterRoot();
			window.removeEventListener("resize", moveActionButton);
			window.removeEventListener("scroll", moveActionButton, true);
		};
	}, [editor, moveActionButton]);

	useEffect(() => {
		if (!isMenuOpen) {
			setMenuPosition(null);
			return;
		}

		updateMenuPosition();
		window.addEventListener("resize", updateMenuPosition);
		window.addEventListener("scroll", updateMenuPosition, true);

		return () => {
			window.removeEventListener("resize", updateMenuPosition);
			window.removeEventListener("scroll", updateMenuPosition, true);
		};
	}, [isMenuOpen, updateMenuPosition]);

	useEffect(() => {
		if (!isMenuOpen) return;

		const handlePointerDown = (event: MouseEvent) => {
			const target = event.target as Node | null;
			if (target && actionButtonRef.current?.contains(target)) return;
			if (target && menuRef.current?.contains(target)) return;
			setIsMenuOpen(false);
		};

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				setIsMenuOpen(false);
			}
		};

		document.addEventListener("mousedown", handlePointerDown);
		document.addEventListener("keydown", handleKeyDown);

		return () => {
			document.removeEventListener("mousedown", handlePointerDown);
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [isMenuOpen]);

	const insertTableRow = useCallback((shouldInsertAfter: boolean) => {
		editor.update(() => {
			for (let index = 0; index < selectionCounts.rows; index += 1) {
				$insertTableRow__EXPERIMENTAL(shouldInsertAfter);
			}
		});
		setIsMenuOpen(false);
	}, [editor, selectionCounts.rows]);

	const insertTableColumn = useCallback((shouldInsertAfter: boolean) => {
		editor.update(() => {
			for (let index = 0; index < selectionCounts.columns; index += 1) {
				$insertTableColumn__EXPERIMENTAL(shouldInsertAfter);
			}
		});
		setIsMenuOpen(false);
	}, [editor, selectionCounts.columns]);

	const adjustTableRowHeight = useCallback((delta: number) => {
		editor.update(() => {
			if (!activeCellKey) return;
			const node = $getNodeByKey(activeCellKey);
			if (!$isTableCellNode(node)) return;

			const tableNode = $getTableNodeFromLexicalNodeOrThrow(node);
			const { startRowIndex, endRowIndex } = getSelectedTableRowBounds(node);

			for (let rowIndex = startRowIndex; rowIndex <= endRowIndex; rowIndex += 1) {
				const rowNode = tableNode.getChildAtIndex(rowIndex);
				if (!$isTableRowNode(rowNode)) continue;

				const rowElement = editor.getElementByKey(rowNode.getKey());
				const currentHeight = rowElement instanceof HTMLElement
					? rowElement.getBoundingClientRect().height
					: (rowNode.getHeight() ?? activeRowHeight ?? MIN_TABLE_ROW_HEIGHT);

				rowNode.setHeight(clampTableRowHeight(currentHeight + delta));
			}
		});

		window.requestAnimationFrame(updateMenuPosition);
	}, [activeCellKey, activeRowHeight, editor, updateMenuPosition]);

	const deleteTableRow = useCallback(() => {
		editor.update(() => {
			$deleteTableRow__EXPERIMENTAL();
		});
		setIsMenuOpen(false);
	}, [editor]);

	const deleteTableColumn = useCallback(() => {
		editor.update(() => {
			$deleteTableColumn__EXPERIMENTAL();
		});
		setIsMenuOpen(false);
	}, [editor]);

	const deleteTable = useCallback(() => {
		editor.update(() => {
			if (!activeCellKey) return;
			const node = $getNodeByKey(activeCellKey);
			if (!$isTableCellNode(node)) return;

			const tableNode = $getTableNodeFromLexicalNodeOrThrow(node);
			tableNode.remove();
		});
		setIsMenuOpen(false);
	}, [activeCellKey, editor]);

	const toggleRowHeader = useCallback(() => {
		editor.update(() => {
			if (!activeCellKey) return;
			const node = $getNodeByKey(activeCellKey);
			if (!$isTableCellNode(node)) return;

			const tableNode = $getTableNodeFromLexicalNodeOrThrow(node);
			const rowIndex = $getTableRowIndexFromTableCellNode(node);
			const [gridMap] = $computeTableMapSkipCellCheck(tableNode, null, null);
			const rowCells = new Set<TableCellNode>();
			const nextHeaderState = node.getHeaderStyles() ^ TableCellHeaderStates.ROW;

			for (let columnIndex = 0; columnIndex < gridMap[rowIndex].length; columnIndex += 1) {
				const mappedCell = gridMap[rowIndex][columnIndex]?.cell;
				if (!mappedCell || rowCells.has(mappedCell)) continue;

				rowCells.add(mappedCell);
				mappedCell.setHeaderStyles(nextHeaderState, TableCellHeaderStates.ROW);
			}
		});
		setIsMenuOpen(false);
	}, [activeCellKey, editor]);

	const toggleColumnHeader = useCallback(() => {
		editor.update(() => {
			if (!activeCellKey) return;
			const node = $getNodeByKey(activeCellKey);
			if (!$isTableCellNode(node)) return;

			const tableNode = $getTableNodeFromLexicalNodeOrThrow(node);
			const columnIndex = $getTableColumnIndexFromTableCellNode(node);
			const [gridMap] = $computeTableMapSkipCellCheck(tableNode, null, null);
			const columnCells = new Set<TableCellNode>();
			const nextHeaderState = node.getHeaderStyles() ^ TableCellHeaderStates.COLUMN;

			for (let rowIndex = 0; rowIndex < gridMap.length; rowIndex += 1) {
				const mappedCell = gridMap[rowIndex][columnIndex]?.cell;
				if (!mappedCell || columnCells.has(mappedCell)) continue;

				columnCells.add(mappedCell);
				mappedCell.setHeaderStyles(nextHeaderState, TableCellHeaderStates.COLUMN);
			}
		});
		setIsMenuOpen(false);
	}, [activeCellKey, editor]);

	return (
		<>
			{createPortal(
				<div
					ref={actionButtonContainerRef}
					className={clsx(
						styles["smart-editor__table-action-button-container"],
						isButtonVisible
							? styles["smart-editor__table-action-button-container--active"]
							: styles["smart-editor__table-action-button-container--inactive"],
					)}
				>
					{activeCellKey
						? (
							<button
								ref={actionButtonRef}
								type="button"
								className={styles["smart-editor__table-action-button"]}
								onClick={(event) => {
									event.stopPropagation();
									setIsMenuOpen((currentValue) => !currentValue);
								}}
								aria-label="Open table actions"
								aria-haspopup="menu"
								aria-expanded={isMenuOpen}
							>
								<Icon name="chevron-down" size={14} className={styles["smart-editor__toolbar-icon"]} />
							</button>
						)
						: null}
				</div>,
				anchorElem,
			)}
			{isMenuOpen && menuPosition && typeof document !== "undefined"
				? createPortal(
					<div
						ref={menuRef}
						className={styles["smart-editor__table-action-menu"]}
						role="menu"
						aria-label="Table actions"
						style={{ top: menuPosition.top, left: menuPosition.left }}
					>
						<button
							type="button"
							className={styles["smart-editor__table-action-item"]}
							onClick={() => insertTableRow(false)}
						>
							Insert row above
						</button>
						<button
							type="button"
							className={styles["smart-editor__table-action-item"]}
							onClick={() => insertTableRow(true)}
						>
							Insert row below
						</button>
						<button
							type="button"
							className={styles["smart-editor__table-action-item"]}
							onClick={() => insertTableColumn(false)}
						>
							Insert column left
						</button>
						<button
							type="button"
							className={styles["smart-editor__table-action-item"]}
							onClick={() => insertTableColumn(true)}
						>
							Insert column right
						</button>
						<div className={styles["smart-editor__table-action-divider"]} />
						<div className={styles["smart-editor__table-action-meta"]}>
							{activeRowHeight ? `Row height: ${activeRowHeight}px` : "Row height: auto"}
						</div>
						<button
							type="button"
							className={styles["smart-editor__table-action-item"]}
							onClick={() => adjustTableRowHeight(-TABLE_ROW_HEIGHT_STEP)}
						>
							Decrease row height
						</button>
						<button
							type="button"
							className={styles["smart-editor__table-action-item"]}
							onClick={() => adjustTableRowHeight(TABLE_ROW_HEIGHT_STEP)}
						>
							Increase row height
						</button>
						<div className={styles["smart-editor__table-action-divider"]} />
						<button type="button" className={styles["smart-editor__table-action-item"]} onClick={toggleRowHeader}>
							{(activeCellHeaderState & TableCellHeaderStates.ROW) === TableCellHeaderStates.ROW
								? "Remove row header"
								: "Add row header"}
						</button>
						<button type="button" className={styles["smart-editor__table-action-item"]} onClick={toggleColumnHeader}>
							{(activeCellHeaderState & TableCellHeaderStates.COLUMN) === TableCellHeaderStates.COLUMN
								? "Remove column header"
								: "Add column header"}
						</button>
						<div className={styles["smart-editor__table-action-divider"]} />
						<button type="button" className={styles["smart-editor__table-action-item"]} onClick={deleteTableColumn}>
							Delete column
						</button>
						<button type="button" className={styles["smart-editor__table-action-item"]} onClick={deleteTableRow}>
							Delete row
						</button>
						<button
							type="button"
							className={clsx(
								styles["smart-editor__table-action-item"],
								styles["smart-editor__table-action-item--danger"],
							)}
							onClick={deleteTable}
						>
							Delete table
						</button>
					</div>,
					document.body,
				)
				: null}
		</>
	);
}
