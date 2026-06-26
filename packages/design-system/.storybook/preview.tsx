import type { CSSProperties } from "react";
import type { Decorator, Preview } from "@storybook/react";
import { cssVariableTokens } from "@bidayax/tokens";
import "../styles.css";

const withBidayaXTheme: Decorator = (Story) => (
  <div
    className="dark min-h-screen bg-surface-canvas p-6 font-body text-content-primary"
    style={cssVariableTokens as CSSProperties}
  >
    <Story />
  </div>
);

const preview: Preview = {
  decorators: [withBidayaXTheme],
  parameters: {
    a11y: {
      test: "todo"
    },
    backgrounds: {
      disable: true
    },
    controls: {
      expanded: true
    },
    layout: "fullscreen"
  }
};

export default preview;
