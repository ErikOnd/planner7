"use client";

import { useEffect, useState } from "react";
import styles from "./LandingPage.module.scss";

const WORDS = [
	"intuitively",
	"effortlessly",
	"seamlessly",
	"simply",
	"easily",
	"naturally",
	"smoothly",
	"elegantly",
	"instinctively",
	"clearly",
];

export function TypingAnimation() {
	const [text, setText] = useState(WORDS[0]);
	const [wordIndex, setWordIndex] = useState(0);
	const [charIndex, setCharIndex] = useState(WORDS[0].length);
	const [isDeleting, setIsDeleting] = useState(false);

	useEffect(() => {
		const word = WORDS[wordIndex];

		let delay: number;
		if (!isDeleting && charIndex === word.length) {
			delay = 3500;
		} else if (isDeleting) {
			delay = 100;
		} else if (charIndex === 0) {
			delay = 1000;
		} else {
			delay = 120;
		}

		const timeout = setTimeout(() => {
			if (isDeleting) {
				if (charIndex > 0) {
					setCharIndex(charIndex - 1);
					setText(word.slice(0, charIndex - 1));
				} else {
					const next = (wordIndex + 1) % WORDS.length;
					setWordIndex(next);
					setCharIndex(0);
					setIsDeleting(false);
					setText("");
				}
			} else {
				if (charIndex < word.length) {
					setCharIndex(charIndex + 1);
					setText(word.slice(0, charIndex + 1));
				} else {
					setIsDeleting(true);
				}
			}
		}, delay);

		return () => clearTimeout(timeout);
	}, [charIndex, isDeleting, wordIndex]);

	return (
		<span className={styles["typing-word"]}>
			{text}
			<span className={styles["typing-cursor"]} />
		</span>
	);
}
