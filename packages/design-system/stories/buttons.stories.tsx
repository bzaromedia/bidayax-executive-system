import type { Meta, StoryObj } from "@storybook/react";
import { Bell } from "lucide-react";
import { Button, IconButton, Stack } from "@bidayax/ui";

const meta = {
  title: "Primitives/Buttons",
  component: Button
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof Button>;

export const Variants: Story = {
  render: () => (
    <Stack gap={4} align="start">
      <Button variant="primary">Primary action</Button>
      <Button variant="secondary">Secondary action</Button>
      <Button variant="ghost">Ghost action</Button>
      <IconButton aria-label="Notifications" variant="secondary">
        <Bell aria-hidden="true" size={18} />
      </IconButton>
    </Stack>
  )
};
