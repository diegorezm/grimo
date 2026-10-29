import { splitMentions } from "@grimo/core";
import { Link } from "@tanstack/react-router";
import { cn } from "@/utils/cn";

/** Post or comment text with each @username linking to that reader's page. */
export function MentionText({ text, className }: { text: string; className?: string }) {
  return (
    <p className={cn("whitespace-pre-line", className)}>
      {splitMentions(text).map((segment, i) =>
        "username" in segment ? (
          <Link
            key={i}
            to="/u/$username"
            params={{ username: segment.username }}
            className="font-medium text-accent hover:underline"
          >
            {segment.text}
          </Link>
        ) : (
          segment.text
        ),
      )}
    </p>
  );
}
