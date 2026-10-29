import { splitMentions } from "@grimo/core";
import { router } from "expo-router";
import { Text, type TextProps } from "./text";

/** Post or comment text with each @username opening that reader's page. */
export function MentionText({ text, ...props }: TextProps & { text: string }) {
  return (
    <Text {...props}>
      {splitMentions(text).map((segment, i) =>
        "username" in segment ? (
          <Text
            key={i}
            color="accent"
            accessibilityRole="link"
            onPress={() =>
              router.push({ pathname: "/u/[username]", params: { username: segment.username } })
            }
          >
            {segment.text}
          </Text>
        ) : (
          segment.text
        ),
      )}
    </Text>
  );
}
