"use client";

import { Spinner } from "@atoms/Spinner/Spinner";
import { Text } from "@atoms/Text/Text";
import { AddTaskModal } from "@components/AddTaskModal/AddTaskModal";
import { DraggableTaskItem } from "@components/DraggableTaskItem/DraggableTaskItem";
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
import { useEffect, useState } from "react";
import { reorderGeneralTodos } from "../../actions/generalTodos";
import styles from "./RememberContent.module.scss";

type RememberContentProps = {
	rememberItems?: string[];
};

export function RememberContent(props: RememberContentProps) {
	const {} = props;

	const [modalOpen, setModalOpen] = useState(false);
	const { todos, loading, deleteTodo, refresh } = useGeneralTodos();
	const { checkedTodos, handleTodoToggle } = useTodoToggle(deleteTodo);
	const [localTodos, setLocalTodos] = useState(todos);
	const [activeTodoId, setActiveTodoId] = useState<string | null>(null);

	useEffect(() => {
		if (!modalOpen) refresh();
	}, [modalOpen, refresh]);

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
		<div className={styles["remember-content"]}>
			<div className={styles["task-items"]}>
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
									<DraggableTaskItem
										key={todo.id}
										id={todo.id}
										taskName={todo.text}
										checked={checkedTodos.has(todo.id)}
										onToggleAction={checked => handleTodoToggle(todo.id, checked)}
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
			<AddTaskModal open={modalOpen} onOpenAction={setModalOpen} />
		</div>
	);
}
