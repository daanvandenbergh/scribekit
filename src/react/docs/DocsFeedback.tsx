"use client";

import { useState, type ReactElement } from "react";

/**
 * Props for {@link DocsFeedback}.
 */
export interface DocsFeedbackProps {
    /** The prompt shown before the buttons (e.g. `"Was this page helpful?"`). */
    question: string;
    /** Label for the affirmative button. Defaults to `"Yes"`. */
    yesLabel?: string;
    /** Label for the negative button. Defaults to `"No"`. */
    noLabel?: string;
    /** Confirmation shown after a vote. Defaults to `"Thanks for the feedback!"`. */
    thanksLabel?: string;
    /**
     * Optional callback invoked once, with the reader's vote, when they answer. Use it to record
     * the signal (analytics, an API call); the widget itself only toggles its own thank-you state.
     */
    onVote?: (vote: "yes" | "no") => void;
}

/** A small thumbs-up / thumbs-down glyph; `down` mirrors it vertically. */
function Thumb({ down }: { down?: boolean }): ReactElement {
    return (
        <svg
            width={15}
            height={15}
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.7}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            style={down ? { transform: "rotate(180deg)" } : undefined}
        >
            <path d="M5 7v7H2.5V7zM5 7l2.8-4.5c.9-.2 1.7.5 1.5 1.4L8.7 7h3.6a1.4 1.4 0 011.4 1.7l-1 4.3a1.4 1.4 0 01-1.4 1H5" />
        </svg>
    );
}

/**
 * The "Was this page helpful?" widget at the foot of a documentation page: a prompt and Yes/No
 * buttons that, once answered, highlight the chosen answer and reveal a thank-you note. A client
 * component (it holds the answered/voted state).
 *
 * Self-contained by design - it does not persist the vote anywhere. Pass `onVote` to record the
 * signal yourself (an analytics event, a `fetch` to your API); the widget calls it once, on the
 * first answer.
 *
 * @param props - see {@link DocsFeedbackProps}.
 * @returns the feedback row.
 */
export function DocsFeedback({
    question,
    yesLabel = "Yes",
    noLabel = "No",
    thanksLabel = "Thanks for the feedback!",
    onVote,
}: DocsFeedbackProps): ReactElement {
    const [voted, setVoted] = useState<"yes" | "no" | null>(null);

    /** Records the reader's first answer and fires `onVote` once. */
    const vote = (value: "yes" | "no"): void => {
        if (voted !== null) {
            return;
        }
        setVoted(value);
        onVote?.(value);
    };

    return (
        <div className="scribekit-docs-feedback" role="group" aria-label={question}>
            <span className="scribekit-docs-feedback-q">{question}</span>
            <button
                type="button"
                className={voted === "yes" ? "scribekit-docs-feedback-btn is-active" : "scribekit-docs-feedback-btn"}
                aria-pressed={voted === "yes"}
                onClick={() => vote("yes")}
            >
                <Thumb />
                {yesLabel}
            </button>
            <button
                type="button"
                className={voted === "no" ? "scribekit-docs-feedback-btn is-active" : "scribekit-docs-feedback-btn"}
                aria-pressed={voted === "no"}
                onClick={() => vote("no")}
            >
                <Thumb down />
                {noLabel}
            </button>
            {voted !== null ? (
                <span className="scribekit-docs-feedback-thanks" role="status">
                    {thanksLabel}
                </span>
            ) : null}
        </div>
    );
}
