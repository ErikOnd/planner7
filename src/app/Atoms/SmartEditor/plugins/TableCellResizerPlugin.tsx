"use client";

import styles from "../SmartEditor.module.scss";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useLexicalEditable } from "@lexical/react/useLexicalEditable";
import {
	$computeTableMapSkipCellCheck,
	$getTableNodeFromLexicalNodeOrThrow,
	$getTableRowIndexFromTableCellNode,
	$isTableCellNode,
	$isTableRowNode,
	getDOMCellFromTarget,
	getTableElement,
	getTableObserverFromTableElement,
	type TableCellNode,
	type TableDOMCell,
	type TableMapType,
	TableNode,
	type TableObserver,
} from "@lexical/table";
import { $getNearestNodeFromDOMNode, $getNodeByKey, type LexicalEditor, type NodeKey } from "lexical";
import {
	type CSSProperties,
	type JSX,
	type MouseEventHandler,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { createPortal } from "react-dom";

type MousePosition = {
	x: number;
	y: number;
};

type MouseDraggingDirection = "right" | "bottom";

const MIN_ROW_HEIGHT = 33;
const MIN_COLUMN_WIDTH = 92;
const RESIZER_ZONE_WIDTH = 16;
const SKIP_SCROLL_INTO_VIEW_TAG = "skip-scroll-into-view";

function calculateZoomLevel(element: Element | null) {
	let zoom = 1;
	let currentElement = element instanceof HTMLElement ? element : element?.parentElement ?? null;

	while (currentElement) {
		const zoomValue = window.getComputedStyle(currentElement).getPropertyValue("zoom");
		const parsedZoom = Number.parseFloat(zoomValue);

		if (!Number.isNaN(parsedZoom) && parsedZoom > 0) {
			zoom *= parsedZoom;
		}

		currentElement = currentElement.parentElement;
	}

	return zoom;
}

function resolveActiveCellFromPointer(
	cell: TableDOMCell,
	clientX: number,
	clientY: number,
	tableNode: TableNode,
	table: ReturnType<TableObserver["getTable"]>,
) {
	const rect = cell.elem.getBoundingClientRect();
	const hitRadius = RESIZER_ZONE_WIDTH / 2;
	const isNearTopEdge = clientY - rect.top <= hitRadius;
	const isNearLeftEdge = clientX - rect.left <= hitRadius;

	if (isNearTopEdge && cell.y > 0) {
		const cellAbove = tableNode.getDOMCellFromCords(cell.x, cell.y - 1, table);
		if (cellAbove) {
			return cellAbove;
		}
	}

	if (isNearLeftEdge && cell.x > 0) {
		const cellToLeft = tableNode.getDOMCellFromCords(cell.x - 1, cell.y, table);
		if (cellToLeft) {
			return cellToLeft;
		}
	}

	return cell;
}

function TableCellResizer({ editor }: { editor: LexicalEditor }): JSX.Element {
	const targetRef = useRef<HTMLElement | null>(null);
	const [tableRect, setTableRect] = useState<DOMRect | null>(null);
	const tableRectRef = useRef<DOMRect | null>(null);
	const activeCellNodeKeyRef = useRef<NodeKey | null>(null);
	const mouseStartPosRef = useRef<MousePosition | null>(null);
	const [mouseCurrentPos, setMouseCurrentPos] = useState<MousePosition | null>(null);
	const [activeCell, setActiveCell] = useState<TableDOMCell | null>(null);
	const [isMouseDown, setIsMouseDown] = useState(false);
	const [draggingDirection, setDraggingDirection] = useState<MouseDraggingDirection | null>(null);
	const resizerRef = useRef<HTMLDivElement | null>(null);

	const resetState = useCallback(() => {
		setActiveCell(null);
		targetRef.current = null;
		setDraggingDirection(null);
		mouseStartPosRef.current = null;
		setTableRect(null);
		tableRectRef.current = null;
		activeCellNodeKeyRef.current = null;
	}, []);

	useEffect(() => {
		return editor.registerNodeTransform(TableNode, (tableNode) => {
			if (tableNode.getColWidths()) {
				return tableNode;
			}

			tableNode.setColWidths(Array(tableNode.getColumnCount()).fill(MIN_COLUMN_WIDTH));
			return tableNode;
		});
	}, [editor]);

	useEffect(() => {
		const onMouseMove = (event: MouseEvent) => {
			const { target } = event;
			if (!(target instanceof HTMLElement)) {
				return;
			}

			if (draggingDirection) {
				setMouseCurrentPos({
					x: event.clientX,
					y: event.clientY,
				});
				return;
			}

			setIsMouseDown((event.buttons & 1) === 1);

			if (resizerRef.current?.contains(target)) {
				return;
			}

			const cell = getDOMCellFromTarget(target);
			if (cell == null) {
				resetState();
				return;
			}

			editor.getEditorState().read(() => {
				const tableCellNode = $getNearestNodeFromDOMNode(cell.elem);
				if (!$isTableCellNode(tableCellNode)) {
					throw new Error("TableCellResizer: Table cell node not found.");
				}

				const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);
				const tableElement = getTableElement(tableNode, editor.getElementByKey(tableNode.getKey()));
				if (!tableElement) {
					throw new Error("TableCellResizer: Table element not found.");
				}

				const tableObserver = getTableObserverFromTableElement(tableElement);
				const nextCell = tableObserver
					? resolveActiveCellFromPointer(cell, event.clientX, event.clientY, tableNode, tableObserver.getTable())
					: cell;
				const nextCellNode = $getNearestNodeFromDOMNode(nextCell.elem);
				if (!$isTableCellNode(nextCellNode)) {
					throw new Error("TableCellResizer: Table cell node not found.");
				}

				const nextRect = tableElement.getBoundingClientRect();
				const didTargetChange = targetRef.current !== target;
				const didCellChange = activeCell?.elem !== nextCell.elem;
				const didCellKeyChange = activeCellNodeKeyRef.current !== nextCellNode.getKey();
				const didRectChange = tableRectRef.current == null
					|| tableRectRef.current.left !== nextRect.left
					|| tableRectRef.current.top !== nextRect.top
					|| tableRectRef.current.width !== nextRect.width
					|| tableRectRef.current.height !== nextRect.height;

				if (!didTargetChange && !didCellChange && !didCellKeyChange && !didRectChange) {
					return;
				}

				targetRef.current = target;
				setTableRect(nextRect);
				tableRectRef.current = nextRect;
				setActiveCell(nextCell);
				activeCellNodeKeyRef.current = nextCellNode.getKey();
			}, { editor });
		};

		const onMouseDown = () => {
			setIsMouseDown(true);
		};

		const onMouseUp = () => {
			setIsMouseDown(false);
		};

		const removeRootListener = editor.registerRootListener((rootElement, prevRootElement) => {
			prevRootElement?.removeEventListener("mousemove", onMouseMove);
			prevRootElement?.removeEventListener("mousedown", onMouseDown);
			prevRootElement?.removeEventListener("mouseup", onMouseUp);
			rootElement?.addEventListener("mousemove", onMouseMove);
			rootElement?.addEventListener("mousedown", onMouseDown);
			rootElement?.addEventListener("mouseup", onMouseUp);
		});

		return () => {
			removeRootListener();
		};
	}, [activeCell, draggingDirection, editor, resetState]);

	const isHeightChanging = useCallback((direction: MouseDraggingDirection) => direction === "bottom", []);

	const getCellNodeHeight = useCallback((cell: TableCellNode, activeEditor: LexicalEditor) => {
		return activeEditor.getElementByKey(cell.getKey())?.clientHeight;
	}, []);

	const getCellColumnIndex = useCallback((tableCellNode: TableCellNode, tableMap: TableMapType) => {
		for (let rowIndex = 0; rowIndex < tableMap.length; rowIndex += 1) {
			for (let columnIndex = 0; columnIndex < tableMap[rowIndex].length; columnIndex += 1) {
				if (tableMap[rowIndex][columnIndex].cell === tableCellNode) {
					return columnIndex;
				}
			}
		}

		return undefined;
	}, []);

	const updateRowHeight = useCallback((heightChange: number) => {
		const activeCellNodeKey = activeCellNodeKeyRef.current;
		if (!activeCellNodeKey) {
			throw new Error("TableCellResizer: Expected active cell.");
		}

		editor.update(() => {
			const tableCellNode = $getNodeByKey(activeCellNodeKey);
			if (!$isTableCellNode(tableCellNode)) {
				return;
			}

			const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);
			const tableRowIndex = $getTableRowIndexFromTableCellNode(tableCellNode) + tableCellNode.getRowSpan() - 1;
			const tableRows = tableNode.getChildren();

			if (tableRowIndex >= tableRows.length || tableRowIndex < 0) {
				throw new Error("Expected table cell to be inside of table row.");
			}

			const tableRow = tableRows[tableRowIndex];
			if (!$isTableRowNode(tableRow)) {
				throw new Error("Expected table row");
			}

			let height = tableRow.getHeight();
			if (height === undefined) {
				const rowCells = tableRow.getChildren<TableCellNode>();
				height = Math.min(
					...rowCells.map((cell) => getCellNodeHeight(cell, editor) ?? Number.POSITIVE_INFINITY),
				);
			}

			tableRow.setHeight(Math.max(height + heightChange, MIN_ROW_HEIGHT));
		}, { tag: SKIP_SCROLL_INTO_VIEW_TAG });
	}, [editor, getCellNodeHeight]);

	const updateColumnWidth = useCallback((widthChange: number) => {
		const activeCellNodeKey = activeCellNodeKeyRef.current;
		if (!activeCellNodeKey) {
			throw new Error("TableCellResizer: Expected active cell.");
		}

		editor.update(() => {
			const tableCellNode = $getNodeByKey(activeCellNodeKey);
			if (!$isTableCellNode(tableCellNode)) {
				return;
			}

			const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);
			const [tableMap] = $computeTableMapSkipCellCheck(tableNode, null, null);
			const columnIndex = getCellColumnIndex(tableCellNode, tableMap);
			if (columnIndex === undefined) {
				throw new Error("TableCellResizer: Table column not found.");
			}

			const colWidths = tableNode.getColWidths();
			if (!colWidths) {
				return;
			}

			const width = colWidths[columnIndex];
			if (width === undefined) {
				return;
			}

			const newColWidths = [...colWidths];
			newColWidths[columnIndex] = Math.max(width + widthChange, MIN_COLUMN_WIDTH);
			tableNode.setColWidths(newColWidths);
		}, { tag: SKIP_SCROLL_INTO_VIEW_TAG });
	}, [editor, getCellColumnIndex]);

	const mouseUpHandler = useCallback((direction: MouseDraggingDirection) => {
		const handler = (event: MouseEvent) => {
			event.preventDefault();
			event.stopPropagation();

			if (!mouseStartPosRef.current) {
				return;
			}

			const { x, y } = mouseStartPosRef.current;
			const zoom = calculateZoomLevel(event.target instanceof Element ? event.target : null);

			if (isHeightChanging(direction)) {
				updateRowHeight((event.clientY - y) / zoom);
			} else {
				updateColumnWidth((event.clientX - x) / zoom);
			}

			resetState();
			document.removeEventListener("mouseup", handler);
		};

		return handler;
	}, [isHeightChanging, resetState, updateColumnWidth, updateRowHeight]);

	const toggleResize = useCallback((direction: MouseDraggingDirection): MouseEventHandler<HTMLDivElement> => {
		return (event) => {
			event.preventDefault();
			event.stopPropagation();

			if (!activeCell) {
				throw new Error("TableCellResizer: Expected active cell.");
			}

			mouseStartPosRef.current = {
				x: event.clientX,
				y: event.clientY,
			};
			setMouseCurrentPos(mouseStartPosRef.current);
			setDraggingDirection(direction);

			document.addEventListener("mouseup", mouseUpHandler(direction));
		};
	}, [activeCell, mouseUpHandler]);

	const resizerStyles = (() => {
		if (!activeCell) {
			return {
				bottom: null,
				right: null,
			};
		}

		const { height, width, top, left } = activeCell.elem.getBoundingClientRect();
		const zoom = calculateZoomLevel(activeCell.elem);
		const stylesByDirection: Record<MouseDraggingDirection, CSSProperties> = {
			bottom: {
				backgroundColor: "transparent",
				cursor: "row-resize",
				height: `${RESIZER_ZONE_WIDTH}px`,
				left: `${window.pageXOffset + left}px`,
				top: `${window.pageYOffset + top + height - (RESIZER_ZONE_WIDTH / 2)}px`,
				width: `${width}px`,
			},
			right: {
				backgroundColor: "transparent",
				cursor: "col-resize",
				height: `${height}px`,
				left: `${window.pageXOffset + left + width - (RESIZER_ZONE_WIDTH / 2)}px`,
				top: `${window.pageYOffset + top}px`,
				width: `${RESIZER_ZONE_WIDTH}px`,
			},
		};

		if (draggingDirection && mouseCurrentPos && tableRect) {
			if (isHeightChanging(draggingDirection)) {
				stylesByDirection[draggingDirection].left = `${window.pageXOffset + tableRect.left}px`;
				stylesByDirection[draggingDirection].top = `${window.pageYOffset + (mouseCurrentPos.y / zoom)}px`;
				stylesByDirection[draggingDirection].height = "3px";
				stylesByDirection[draggingDirection].width = `${tableRect.width}px`;
			} else {
				stylesByDirection[draggingDirection].top = `${window.pageYOffset + tableRect.top}px`;
				stylesByDirection[draggingDirection].left = `${window.pageXOffset + (mouseCurrentPos.x / zoom)}px`;
				stylesByDirection[draggingDirection].width = "3px";
				stylesByDirection[draggingDirection].height = `${tableRect.height}px`;
			}

			stylesByDirection[draggingDirection].backgroundColor = "#adf";
		}

		return stylesByDirection;
	})();

	return (
		<div ref={resizerRef}>
			{activeCell && !isMouseDown
				? (
					<>
						<div
							className={styles["smart-editor__table-resizer"]}
							style={resizerStyles.right ?? undefined}
							onMouseDown={toggleResize("right")}
						/>
						<div
							className={styles["smart-editor__table-resizer"]}
							style={resizerStyles.bottom ?? undefined}
							onMouseDown={toggleResize("bottom")}
						/>
					</>
				)
				: null}
		</div>
	);
}

export default function TableCellResizerPlugin() {
	const [editor] = useLexicalComposerContext();
	const isEditable = useLexicalEditable();

	return useMemo(() => {
		if (!isEditable || typeof document === "undefined") {
			return null;
		}

		return createPortal(<TableCellResizer editor={editor} />, document.body);
	}, [editor, isEditable]);
}
