import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { stories } from "./stories";

const rootElement = document.querySelector<HTMLElement>("#root");
if (!rootElement) throw new Error("Story gallery root is missing");

const root = createRoot(rootElement);

declare global {
  interface Window {
    renderStory: (storyId: string) => Promise<void>;
    listStories: () => string[];
  }
}

window.listStories = () => Object.keys(stories).sort();
window.renderStory = async (storyId) => {
  const Story = stories[storyId];
  if (!Story) throw new Error(`Unknown story: ${storyId}`);
  root.render(
    <StrictMode>
      <div data-testid="story-root">
        <Story />
      </div>
    </StrictMode>,
  );
};

root.render(<p data-testid="story-gallery-ready">Story gallery ready</p>);
