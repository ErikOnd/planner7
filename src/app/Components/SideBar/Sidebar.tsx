"use client";

import { Icon } from "@atoms/Icons/Icon";
import { Spinner } from "@atoms/Spinner/Spinner";
import { Text } from "@atoms/Text/Text";
import { AddTaskModal } from "@components/AddTaskModal/AddTaskModal";
import { DraggableTodoItem } from "@components/DraggableTodoItem/DraggableTodoItem";
import WeeklySlider from "@components/WeeklySlider/WeeklySlider";
import {
	closestCenter,
	DndContext,
	DragEndEvent,
	DragOverlay,
	DragStartEvent,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useGeneralTodos } from "@hooks/useGeneralTodos";
import { useTodoToggle } from "@hooks/useTodoToggle";
import { isCurrentWeek } from "@utils/usCurrentWeek";
import { useEffect, useState } from "react";
import { reorderGeneralTodos } from "../../actions/generalTodos";
import styles from "./Sidebar.module.scss";

type SidebarProps = {
	baseDate: Date;
	setBaseDateAction: (date: Date) => void;
	rangeLabel: string;
};

export function Sidebar({ baseDate, setBaseDateAction, rangeLabel }: SidebarProps) {
	const [isAddOpen, setIsAddOpen] = useState(false);
	const { todos, loading, deleteTodo, refresh } = useGeneralTodos();
	const { checkedTodos, handleTodoToggle } = useTodoToggle(deleteTodo);
	const [localTodos, setLocalTodos] = useState(todos);
	const [activeTodoId, setActiveTodoId] = useState<string | null>(null);

	useEffect(() => {
		if (!isAddOpen) refresh();
	}, [isAddOpen, refresh]);

	useEffect(() => {
		setLocalTodos(todos);
	}, [todos]);

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 8,
			},
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	const handleDragStart = (event: DragStartEvent) => {
		setActiveTodoId(event.active.id as string);
	};

	const handleDragEnd = async (event: DragEndEvent) => {
		const { active, over } = event;

		setActiveTodoId(null);

		if (!over || active.id === over.id) {
			return;
		}

		const oldIndex = localTodos.findIndex(todo => todo.id === active.id);
		const newIndex = localTodos.findIndex(todo => todo.id === over.id);

		const reorderedTodos = arrayMove(localTodos, oldIndex, newIndex);
		setLocalTodos(reorderedTodos);

		// Update the backend with the new order
		const todoIds = reorderedTodos.map(todo => todo.id);
		await reorderGeneralTodos(todoIds);
	};

	const handleDragCancel = () => {
		setActiveTodoId(null);
	};

	const activeTodo = localTodos.find(todo => todo.id === activeTodoId);

	return (
		<div className={styles["sidebar"]}>
			<div className={styles["sticky-section"]}>
				<div className={styles["week-slider-section"]}>
					<WeeklySlider baseDate={baseDate} rangeLabel={rangeLabel} setBaseDate={setBaseDateAction} />
					{isCurrentWeek(baseDate) && (
						<div className={styles["current-week-indicator"]}>
							<Text>Current Week</Text>
						</div>
					)}
				</div>
				<div className={styles["remember-section"]}>
					<div className={styles["remember-header-row"]}>
						<Text size="xl" className={styles["remember-header"]}>
							General Todos
						</Text>
						<button
							type="button"
							className={styles["add-header-button"]}
							onClick={() => setIsAddOpen(true)}
							aria-label="Add new todo"
							aria-haspopup="dialog"
							aria-expanded={isAddOpen}
						>
							<Icon name="plus" />
						</button>
					</div>
					<div className={styles["remember-items"]}>
						{loading
							? <Spinner size="lg" className={styles["remember-loading"]} />
							: localTodos.length === 0
							? <Text size="sm">No todos yet. Click + to add one!</Text>
							: (
								<DndContext
									sensors={sensors}
									collisionDetection={closestCenter}
									onDragStart={handleDragStart}
									onDragEnd={handleDragEnd}
									onDragCancel={handleDragCancel}
								>
									<SortableContext
										items={localTodos.map(todo => todo.id)}
										strategy={verticalListSortingStrategy}
									>
										{localTodos.map(todo => (
											<DraggableTodoItem
												key={todo.id}
												id={todo.id}
												text={todo.text}
												checked={checkedTodos.has(todo.id)}
												onToggle={checked => handleTodoToggle(todo.id, checked)}
											/>
										))}
									</SortableContext>
									<DragOverlay>
										{activeTodo
											? (
												<div className={styles["drag-overlay-item"]}>
													<Text>{activeTodo.text}</Text>
												</div>
											)
											: null}
									</DragOverlay>
								</DndContext>
							)}
					</div>
				</div>
			</div>
			<AddTaskModal open={isAddOpen} onOpenAction={setIsAddOpen} renderTrigger={false} />
		</div>
	);
}
